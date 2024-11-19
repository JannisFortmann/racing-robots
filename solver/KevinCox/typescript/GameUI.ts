import { Game, Position } from "../pkg/ricochetrobots.js";
import { clamp } from "./util.js";

export const enum GameUIEventType {
	CELL_CLICK,
	ROBOT_DRAG_START,
	ROBOT_DROP,
}

export type GameUIEvent =
	| { type: GameUIEventType.CELL_CLICK, pos: Position }
	| { type: GameUIEventType.ROBOT_DRAG_START }
	| { type: GameUIEventType.ROBOT_DROP, robot: number, pos: Position }
;

export default class GameUI {
	readonly root = document.createElement("div");

	constructor(
		emit: (e: GameUIEvent) => void,
	) {
		this.root.className = "gameui";

		this.root.addEventListener("click", async e => {
			let svg: SVGSVGElement = (e.currentTarget as any).children[0];

			let t = svg.getScreenCTM()!;
			let x = clamp(0, (e.clientX - t.e)/t.a, 15.99);
			let y = clamp(0, (e.clientY - t.f)/t.d, 15.99);
			let xCell = Math.round(x - 0.5);
			let yCell = Math.round(y - 0.5);

			emit({
				type: GameUIEventType.CELL_CLICK,
				pos: {x: xCell, y: yCell},
			});
		});

		let down = (downEvent: MouseEvent | TouchEvent) => {
			let robot = downEvent.target as SVGGraphicsElement;
			if (!robot.matches(".robot")) return;
			downEvent.preventDefault();

			emit({ type: GameUIEventType.ROBOT_DRAG_START });

			let e = ("touches" in downEvent) ? downEvent.touches[0]! : downEvent;

			let transform = robot.getScreenCTM()!;
			let xscale = transform.a;
			let yscale = transform.d;

			let origx = +robot.getAttribute("cx")!;
			let origy = +robot.getAttribute("cy")!;

			function move(moveEvent: MouseEvent | TouchEvent) {
				moveEvent.preventDefault();
				let e2 = ("touches" in moveEvent)
					? moveEvent.touches[0]!
					: moveEvent;
				robot.setAttribute("cx", `${origx + (e2.clientX - e.clientX)/xscale}`);
				robot.setAttribute("cy", `${origy + (e2.clientY - e.clientY)/yscale}`);
			}

			let up = () => {
				this.root.removeEventListener("mousemove", move);
				this.root.removeEventListener("mouseup", up);
				this.root.removeEventListener("mouseleave", up);
				this.root.removeEventListener("touchmove", move);
				this.root.removeEventListener("touchend", up);
				this.root.removeEventListener("touchleave", up);
				this.root.removeEventListener("touchcancel", up);

				let x = Math.round(+robot.getAttribute("cx")! - 0.5);
				let y = Math.round(+robot.getAttribute("cy")! - 0.5);

				emit({
					type: GameUIEventType.ROBOT_DROP,
					robot: +robot.id.slice(6),
					pos: { x, y },
				})
			}

			this.root.addEventListener("mousemove", move);
			this.root.addEventListener("mouseup", up);
			this.root.addEventListener("mouseleave", up);
			this.root.addEventListener("touchmove", move);
			this.root.addEventListener("touchend", up);
			this.root.addEventListener("touchleave", up);
			this.root.addEventListener("touchcancel", up);
		}
		this.root.addEventListener("mousedown", down);
		this.root.addEventListener("touchstart", down);

	}

	update(game: Game) {
		this.root.innerHTML = game.to_html();
	}
}
