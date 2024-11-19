import { Game } from "../pkg/ricochetrobots.js";
import TimerButton from "./TimerButton.js";
import { Param, makeUrl } from "./params.js";

export const enum PlayEventType {
	FAKE,
	SAVE_GAME,
}

export type PlayEvent =
	| { type: PlayEventType.FAKE } // This is required for exhaustive to work.
	| { type: PlayEventType.SAVE_GAME }
	;

export default class PlayUI {
	readonly root = document.createElement("div");

	private buttons = document.createElement("div");
	private timerButton = new TimerButton;
	private saveButton = document.createElement("button");
	private savedGames = document.createElement("ul");

	constructor(
		emit: (e: PlayEvent) => void,
	) {
		this.root.className = "play";

		this.buttons.className = "vbar";
		this.buttons.append(this.timerButton.root);

		this.saveButton.textContent = "💾";
		this.saveButton.onclick = () => {
			emit({ type: PlayEventType.SAVE_GAME });
		};
		this.buttons.append(this.saveButton);
		this.root.append(this.buttons);

		this.root.append(this.savedGames);
	}

	pushSave(game: Game) {
		while (this.savedGames.children.length > 20) {
			this.savedGames.lastChild!.remove();
		}

		let li = document.createElement("li");
		let a = document.createElement("a");
		a.href = makeUrl({
			[Param.GAME]: game,
		});
		a.innerHTML = game.to_html();
		li.append(a);
		this.savedGames.prepend(li);
	}
}
