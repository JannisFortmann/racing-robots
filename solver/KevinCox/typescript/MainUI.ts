import { Game, Position, Solution, quarters_for_color } from "../pkg/ricochetrobots.js";

import BoardTextDialog from "./BoardTextDialog.js";
import Button from "./Button.js";
import CellDialog from "./CellDialog.js";
import Dialog from "./Dialog.js";
import GameUI, { GameUIEventType } from "./GameUI.js";
import { KeyedSet } from "./KeyedSet.js";
import PlayUI, { PlayEventType } from "./PlayUI.js";
import RRWorker from "./RRWorker.js";
import SolutionUI, { SolutionEvent, SolutionEventType } from "./SolutionUI.js";
import { userErr } from "./UserError.js";
import { Param, getParam, setParam, subscribeParam } from "./params.js";
import { showNotification } from "./toast.js";
import { exhaustive, hasElem, randElem, randInt } from "./util.js";

const CORNERS = [ "Top Left", "Top Right", "Bottom Right", "Bottom Left" ];

export default class MainUI {
	private gameUI = new GameUI(async e => {
		switch (e.type) {
			case GameUIEventType.CELL_CLICK: {
				let result = await new CellDialog().result();
				switch (result[0]) {
					case "mirror": {
						let [, color, lean] = result;
						if (color == "none") {
							this.game.clear_mirror(e.pos);
						} else {
							this.game.set_mirror(e.pos, lean == "left", +color);
						}
						this.updateFromGame();
						this.switchToPlayMode();
						break;
					}
					case "target": {
						let [, c] = result;
						let color = c == "any" ? null : +c;
						this.game.target = {
							robot: color,
							position: e.pos,
						};
						this.updateFromGame();
						this.switchToPlayMode();
						break;
					}
					case "wall": {
						let [, t, r, b, l] = result;
						this.game.set_walls(e.pos, !!t, !!r, !!b, !!l);
						this.updateFromGame();
						this.switchToPlayMode();
						break;
					}
					default:
						exhaustive(result);
				}
				break;
			}
			case GameUIEventType.ROBOT_DRAG_START: {
				this.solutionUI?.stopAnimation();
				break;
			}
			case GameUIEventType.ROBOT_DROP: {
				this.game.set_robot(e.robot, e.pos);
				this.updateFromGame();
				this.switchToPlayMode();
				break;
			}
			default:
				exhaustive(e);
		}
	});

	private playUI = new PlayUI(e => {
		switch (e.type) {
			case PlayEventType.SAVE_GAME:
				this.playUI.pushSave(this.game);
				break;
			case PlayEventType.FAKE:
				break;
			default:
				exhaustive(e);
		}
	});

	private handeSolutionEvent = async (e: SolutionEvent) => {
		switch (e.type) {
			case SolutionEventType.GOTO:
				return this.gotoStep(e.step);
			case SolutionEventType.TRACE:
				return this.traceStep(e.step, e.sequential);
			default:
				exhaustive(e);
		}
	};
	private solutionUI?: SolutionUI;

	private game = getParam(Param.GAME);
	private worker = new RRWorker;

	constructor() {
		this.updateFromGame();

		let solve = new Button(() => this.solve());
		solve.contents.textContent = "Solve";

		let group = document.createElement("div");
		group.className = "vbar";

		let randomTarget = new Button(() => this.randomizeTarget());
		randomTarget.contents.textContent = "🎲︎";
		randomTarget.contents.title = "Select a random target."
		group.append(randomTarget.root);

		let stock = new Button(() => this.selectStockTiles());
		stock.contents.textContent = "❖";
		stock.contents.title = "Bulid a board from stock tiles."
		group.append(stock.root);

		let share = new Button(async () => {
			this.solutionUI?.stopAnimation();
			let d = new BoardTextDialog(
				this.game.to_text(),
				this.game.to_driftingdroids());
			this.setGame(await d.result());
		});
		share.contents.textContent = "⇅";
		share.contents.title = "Import + Export this Puzzle";
		group.append(share.root);

		const loading = document.getElementById("loading");
		document.body.insertBefore(solve.root, loading);
		document.body.insertBefore(group, loading);
		document.body.insertBefore(this.gameUI.root, loading)
		document.body.insertBefore(this.playUI!.root, loading)
		loading?.remove();

		subscribeParam(Param.GAME, (g) => {
			this.solutionUI?.stopAnimation();
			this.setGame(g.clone());
		});
	}

	private setGame(newGame: Game, commit=true) {
		this.game.free();
		this.game = newGame;
		this.updateFromGame(commit);
	}

	private updateFromGame(commit=true) {
		this.gameUI.update(this.game);
		if (commit) {
			setParam(Param.GAME, this.game);
		}
	}

	private switchToPlayMode() {
		this.solutionUI?.root.remove();
		this.solutionUI?.free();
		this.solutionUI = undefined;
		this.playUI.root.style.display = null as any as string;
	}

	private async gotoStep(i: number): Promise<void> {
		let game = this.solutionUI!.game(i);
		if (game) {
			this.setGame(game);
		}
	}

	private async traceStep(i: number, sequential: boolean): Promise<void> {
		let step = this.solutionUI!.step(i)!;
		try {
			if (!sequential) {
				this.setGame(step.after_game(), false);
				return;
			}

			this.setGame(step.before_game(), false);

			let robot = document.getElementById("robot-" + step.moved_robot())!;
			robot.setAttribute("cx", `${0.5}`);
			robot.setAttribute("cy", `${0.5}`);

			let trace = step.trace();
			trace.unshift(this.game.robot(step.moved_robot()));
			let keyframes = trace.map(pos => ({
				transform: `translate(${pos.x}px, ${pos.y}px)`,
			}));
			let cssAnimation = robot.animate(keyframes, {
				duration: (trace.length - 1) * 400,
				// endDelay: 2, // milliseconds on Firefox, seconds on chrome.
				easing: "cubic-bezier(0.2, 0, 0.8, 1)",
				fill: "both",
			});

			await cssAnimation.finished;
		} finally {
			step.free();
		}

	}

	private async randomizeTarget(): Promise<void> {
		this.solutionUI?.stopAnimation();

		let bannedPositions = new KeyedSet((p: Position) => `${p.x},${p.y}`);
		for (let i = 0; i < 5; i++) {
			bannedPositions.add(this.game.robot(i));
		}
		bannedPositions.add(this.game.target.position);

		let positions = this.game.target_candidates()
			.filter(pos => !bannedPositions.has(pos));

		if (!hasElem(positions)) {
			throw userErr`No available target locations`;
		}

		let position = randElem(positions);
		let robot;
		if (Math.random() < 1/(1 + 4*4)) {
			robot = null;
		} else {
			robot = 1 + randInt(4);
		}
		this.game.target = { robot, position };

		this.updateFromGame();
		this.switchToPlayMode();
	}

	private async selectStockTiles(): Promise<void> {
		this.solutionUI?.stopAnimation();
		let colors = [1, 2, 3, 4];

		for (let quadrant = 0; quadrant < 4; quadrant++) {
			class ColorDialog extends Dialog<number | "e" | "r"> {
				render() {
					this.body.innerHTML = `<h1>Select the colour of the ${CORNERS[quadrant]} tile.</h1>`
					colors.forEach((c, i) => {
						let el = document.createElement("button");
						el.className = `color c-${c}`;
						el.value = `${i}`;
						this.body.appendChild(el);
					});

					if (quadrant === 0) {
						this.body.insertAdjacentHTML(
							"beforeend",
							`<button value=r style=margin-top:1em>Random Board</button>
							<button value=e>Empty Board</button>`);
					}

					this.renderCancel();
				}

				extract(button: string): number | "e" | "r" {
					if (button === "e" || button === "r") {
						return button;
					}
					return +button;
				}
			}
			let colorIndex = await new ColorDialog().result();
			if (colorIndex === "e") {
				return this.emptyBoard();
			}
			if (colorIndex === "r") {
				return this.randomizeTiles();
			}
			let color = colors.splice(colorIndex, 1)[0]!;

			class QuarterDialog extends Dialog<number> {
				render() {
					this.body.innerHTML = `<h1>Select ${CORNERS[quadrant]} tile.</h1>`;
					let quarters = quarters_for_color(color);
					for (let i = 0; i < quarters.len(); i++) {
						let el = document.createElement("button");
						el.className = "quarter";
						el.innerHTML = quarters.to_html(quadrant, i);
						el.value = `${i}`;
						this.body.appendChild(el);
					}
				}

				extract(button: string): number {
					return +button;
				}
			}
			let quarterIndex = await new QuarterDialog().result();
			this.game.set_quadrant(quadrant, color, quarterIndex);
		}

		this.updateFromGame();
		this.switchToPlayMode();
	}

	private async emptyBoard(): Promise<void> {
		this.game.free();
		this.game = Game.empty();
		this.updateFromGame();
		this.switchToPlayMode();
	}

	private async randomizeTiles(): Promise<void> {
		let colors = [1, 2, 3, 4];

		for (let quadrant = 0; quadrant < 4; quadrant++) {
			let colorIndex = randInt(colors.length);
			let color = colors.splice(colorIndex, 1)[0]!;

			let quarterIndex = randInt(4);
			this.game.set_quadrant(quadrant, color, quarterIndex);
		}

		this.updateFromGame();
		this.switchToPlayMode();
	}

	private async solve() {
		this.solutionUI?.free();
		this.solutionUI?.root.remove();
		this.solutionUI = undefined;

		let start = performance.mark("solve-start");
		let res = await this.worker.send("Solve", this.game.to_compact());

		let timing = performance.measure("solve", start.name);
		let solution = Solution.deserialize(res);
		this.solutionUI = new SolutionUI(
			{
				timing,
				solution,
			},
			this.handeSolutionEvent);
		this.playUI.root.after(this.solutionUI.root);
		this.playUI.root.style.display = "none";
		this.solutionUI.startAnimation();

		void showNotification(`Solved in ${solution.len()} moves`)
	}
}
