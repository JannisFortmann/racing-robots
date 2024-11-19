import { CancelledError } from "./CancelledError.js";

export default abstract class Dialog<Return> {
	private dialog = document.createElement("dialog");
	protected body = document.createElement("form");

	constructor() {
		this.dialog.addEventListener("close", () => {
			this.dialog.remove();
		});

		this.body.method = "dialog";
		this.dialog.append(this.body);

		queueMicrotask(() => {
			this.render();

			document.body.appendChild(this.dialog);
			this.dialog.showModal();
		});
	}

	abstract render(): void;
	abstract extract(button: string): Return;

	renderCancel(): void {
		this.body.insertAdjacentHTML("beforeend", `<button style="margin-top:1em">Cancel</button>`);
	}

	result(): Promise<Return> {
		return new Promise((resolve, reject) => {
			this.dialog.addEventListener("close", () => {
				if (!this.dialog.returnValue) {
					reject(new CancelledError("Dialog was cancelled"));
				} else {
					resolve(this.extract(this.dialog.returnValue));
				}
			});
		});
	}
}
