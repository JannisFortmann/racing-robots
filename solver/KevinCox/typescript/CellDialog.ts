import Dialog from "./Dialog.js";

type Wall = "w" | "";

type Walls = readonly [boolean, boolean, boolean, boolean];

type CellResult =
	| ["target", "any" | number]
	| ["mirror", "none"]
	| ["mirror", number, "left" | "right"]
	| ["wall", Wall, Wall, Wall, Wall]
;

export default class CellDialog extends Dialog<CellResult> {
	render() {
		this.body.innerHTML = `
			<h1>Place a target:</h1>
			<button value=target-any class=color>Any Colour</button>
			<button value=target-1 class="color c-1"></button>
			<button value=target-2 class="color c-2"></button>
			<button value=target-3 class="color c-3"></button>
			<button value=target-4 class="color c-4"></button>

			<h1>Place a mirror:</h1>
			<button value=mirror-none class=color>No Mirror</button>
			<div class=m>
				<button value=mirror-1-left class="mirror c-1">⟍</button>
				<button value=mirror-1-right class="mirror c-1">⟋</button>
				<button value=mirror-2-left class="mirror c-2">⟍</button>
				<button value=mirror-2-right class="mirror c-2">⟋</button>
				<button value=mirror-3-left class="mirror c-3">⟍</button>
				<button value=mirror-3-right class="mirror c-3">⟋</button>
				<button value=mirror-4-left class="mirror c-4">⟍</button>
				<button value=mirror-4-right class="mirror c-4">⟋</button>
			</div>

			<h1>Update walls:</h1>
			<div class=m>
				${[
					[true, false, false, true] as const,
					[true, false, false, false] as const,
					[true, true, false, false] as const,
					[true, true, true, true] as const,

					[false, false, false, true] as const,
					[false, false, false, false] as const,
					[false, true, false, false] as const,
					[false, true, false, true] as const,

					[false, false, true, true] as const,
					[false, false, true, false] as const,
					[false, true, true, false] as const,
					[true, false, true, false] as const,

					[true, true, true, false] as const,
					[false, true, true, true] as const,
					[true, false, true, true] as const,
					[true, true, false, true] as const,
				].map(renderButton).join("")}
		`;
		this.renderCancel();
	}

	extract(button: string): CellResult {
		return button.split("-") as CellResult;
	}
}

function maybeDraw(draw: boolean, path: string): string {
	return `${draw ? "l" : "m"}${path}`;
}

function renderCell([t, r, b, l]: Walls): string {
	let out = [`<svg viewbox="0 0 1.2 1.2">`];

	out.push(`<path class=grid d="M0.1,0.1h1v1h-1v-1"/>`);

	out.push(`<path class=wall d="M0.1,0.1`);
	out.push(maybeDraw(t, "1,0"));
	out.push(maybeDraw(r, "0,1"));
	out.push(maybeDraw(b, "-1,0"));
	out.push(maybeDraw(l, "0,-1"));
	out.push(`"/></svg>`);

	return out.join("");
}

function wallValue(w: boolean): string {
	return w ? "w" : "";
}

function renderButton(walls: Walls): string {
	return `<button value=wall-${walls.map(wallValue).join("-")}>`
		+ renderCell(walls)
		+ `</button>`;
}
