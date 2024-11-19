import { Game } from "../pkg/ricochetrobots.js";
import Dialog from "./Dialog.js";
import { exhaustive } from "./util.js";

const enum Source {
	DRIFTINGDRODIS = "d",
	NATIVE = "n",
}

export default class BoardTextDialog extends Dialog<Game> {
	private nativeInput = document.createElement("textarea");
	private driftingdroidsInput = document.createElement("input");

	constructor(
		private native: string,
		private driftingdroids: string | undefined,
	) {
		super()
	}

	render() {
		this.body.noValidate = true;
		this.body.addEventListener("submit", e => {
			let button = e.submitter as HTMLButtonElement | null;
			if (!button?.value) return;
			let type = button.value as Source;
			switch (type) {
				case Source.DRIFTINGDRODIS:
					if (!this.driftingdroidsInput.reportValidity()) {
						e.preventDefault();
					}
					break;
				case Source.NATIVE:
					if (!this.nativeInput.reportValidity()) {
						e.preventDefault();
					}
					break;
				default:
					exhaustive(type);
			}
		});

		this.body.innerHTML = `<h2>Board Description</h2>`;
		this.nativeInput.rows = this.native.split("\n").length;
		this.nativeInput.value = this.native;
		this.nativeInput.required = true;
		this.nativeInput.addEventListener("input", () => {
			try {
				this.nativeGame();
				this.nativeInput.setCustomValidity("");
			} catch (e) {
				console.error(e);
				this.nativeInput.setCustomValidity(`${e}`);
			}
		});
		this.body.append(this.nativeInput);
		this.body.insertAdjacentHTML("beforeend", `<button value=${Source.NATIVE}>Load Game</button>`);

		this.body.insertAdjacentHTML("beforeend", `<h2>DriftingDroids Game ID</h2>`);
		if (this.driftingdroids) {
			this.driftingdroidsInput.value = this.driftingdroids;
		}
		this.driftingdroidsInput.placeholder = "Freestyle";
		this.driftingdroidsInput.required = true;
		this.driftingdroidsInput.addEventListener("input", () => {
			try {
				this.driftingdroidsGame();
				this.driftingdroidsInput.setCustomValidity("");
			} catch (e) {
				console.error(e);
				this.driftingdroidsInput.setCustomValidity(`${e}`);
			}
		});

		this.body.append(this.driftingdroidsInput);
		this.body.insertAdjacentHTML("beforeend", `<button value=${Source.DRIFTINGDRODIS}>Load Game</button>`);

		this.renderCancel();
	}

	private driftingdroidsGame(): Game {
		return Game.from_driftingdroids(this.driftingdroidsInput.value);
	}

	private nativeGame(): Game {
		return Game.from_text(this.nativeInput.value);
	}

	extract(button: string): Game {
		let type = button as Source;
		switch (type) {
			case Source.DRIFTINGDRODIS:
				return this.driftingdroidsGame();
			case Source.NATIVE:
				return this.nativeGame();
			default:
				exhaustive(type);
		}
	}
}
