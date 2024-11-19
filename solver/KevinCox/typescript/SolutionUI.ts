import { Game, Solution, Step } from "../pkg/ricochetrobots.js";
import { DIRECTION_NAMES, ROBOT_NAMES } from "./consts.js";
import { delayMs, exhaustive, isoFormat, padNumber } from "./util.js";

export interface SolutionInfo {
	solution: Solution,
	timing: PerformanceMeasure,
}

export const enum SolutionEventType {
	GOTO,
	TRACE,
}

export type SolutionEvent =
	| { type: SolutionEventType.GOTO, step: number }
	| { type: SolutionEventType.TRACE, step: number, sequential: boolean }
	;

export const enum GeneralButton {
	PREV,
	PLAY_PAUSE,
	NEXT,
}

export default class SolutionUI {
	readonly root = document.createElement("div");

	private general = document.createElement("form");
	private steps = document.createElement("form");
	private stats = document.createElement("p");

	private currentStep = 0;

	private animation: unknown;

	constructor(
		private readonly solution: SolutionInfo,
		private readonly emit: (e: SolutionEvent) => Promise<void>,
	) {
		this.root.className = "solution";

		this.general.className = "g vbar";
		this.general.innerHTML = `
			<button value=${GeneralButton.PREV}>⏮</button>
			<button value=${GeneralButton.PLAY_PAUSE}>▶</button>
			<button value=${GeneralButton.NEXT}>⏭</button>
		`;
		this.general.onsubmit = (e) => {
			e.preventDefault();
			let button = +(e.submitter as HTMLButtonElement).value as GeneralButton;
			switch (button) {
				case GeneralButton.PREV:
					this.showStep(this.currentStep - 1);
					break;
				case GeneralButton.PLAY_PAUSE:
					if (this.animation) {
						this.stopAnimation();
					} else {
						this.startAnimation();
					}
					break;
				case GeneralButton.NEXT:
					this.showStep(this.currentStep + 1);
					break;
				default:
					exhaustive(button);
			}
		};
		this.root.append(this.general);

		this.steps.className = "s";
		this.steps.innerHTML = "<button value=0 class=disabled>0</button><span class=p>Starting position";
		let steps = solution.solution.len();
		for (let i = 1; i <= steps; i++) {
			let step = solution.solution.step(i - 1);
			try {
				let robot = step.moved_robot();
				let dir = step.direction();
				let {x: x1, y: y1} = step.starting_position();
				let trace = step.trace();
				let {x: x2, y: y2} = trace[trace.length - 1]!;

				let button = document.createElement("button");
				button.value = `${i}`;
				button.textContent = `${i}`;
				this.steps.append(button);

				let span = document.createElement("span");
				span.className = `r c-${robot} c-chip`;
				span.textContent = ROBOT_NAMES[robot]!;
				this.steps.append(span);

				span = document.createElement("span");
				span.className = "d";
				span.textContent = DIRECTION_NAMES[dir]!;
				this.steps.append(span);

				span = document.createElement("span");
				span.className = "p1";
				span.textContent = `${padNumber(x1+1, 2)}, ${padNumber(y1+2, 2)}`;
				this.steps.append(span);

				span = document.createElement("span");
				span.className = "a";
				span.textContent = "→";
				this.steps.append(span);

				span = document.createElement("span");
				span.className = "p2";
				span.textContent = `${padNumber(x2+1, 2)}, ${padNumber(y2+1, 2)}`;
				this.steps.append(span);

				this.stats.innerText = `Solved in ${isoFormat(solution.timing.duration/1000)}s, Explored ${isoFormat(solution.solution.visited_state_count())} moves`;
			} finally {
				step.free();
			}
		}
		this.steps.onsubmit = (e) => {
			e.preventDefault();
			this.stopAnimation();
			let step = +(e.submitter as HTMLButtonElement).value;
			this.showStep(step);
		};
		this.root.append(this.steps);

		this.root.append(this.stats);
	}

	free() {
		this.stopAnimation();
		this.solution.solution.free();
	}

	startAnimation() {
		this.generalButton(GeneralButton.PLAY_PAUSE).textContent = "⏸" ;
		this.animation = {};
		this.showStep(0);
	}

	stopAnimation() {
		this.generalButton(GeneralButton.PLAY_PAUSE).textContent = "▶" ;
		this.animation = undefined;
	}

	private generalButton(
		name: GeneralButton,
	): HTMLButtonElement {
		return this.general.elements[name] as HTMLButtonElement;
	}

	private stepButton(
		name: number,
	): HTMLButtonElement | undefined {
		return this.steps.elements[name] as HTMLButtonElement | undefined;
	}

	private async showStep(step: number) {
		let animation = this.animation;
		let sequential = step == this.currentStep + 1;

		this.stepButton(this.currentStep)!.classList.remove("disabled");
		this.stepButton(step)!.classList.add("disabled");
		this.generalButton(GeneralButton.PREV).disabled = step === 0;
		this.generalButton(GeneralButton.NEXT).disabled = step === this.solution?.solution.len();
		this.currentStep = step;

		if (sequential) {
			await this.emit({
				type: SolutionEventType.TRACE,
				step,
				sequential,
			});
		} else {
			await this.emit({
				type: SolutionEventType.GOTO,
				step,
			});
		}

		if (!animation || this.animation !== animation) return;

		if (step < this.solution.solution.len()) {
			void this.showStep(step + 1);
		} else {
			await delayMs(1000);
			if (this.animation !== animation) return;
			void this.showStep(0);
		}
	}

	game(i: number): Game | undefined {
		if (!this.solution) {
			return undefined;
		} else if (i === 0) {
			return this.solution.solution.start_game();
		} else {
			return this.solution.solution.step(i - 1).after_game();
		}
	}

	step(i: number): Step | undefined {
		return this.solution?.solution.step(i - 1);
	}
}
