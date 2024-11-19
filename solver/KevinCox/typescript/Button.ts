import { CancelledError } from "./CancelledError.js";
import { UserError } from "./UserError.js";
import { NotificationLevel, showNotification } from "./toast.js";

export default class Button {
	readonly root = document.createElement("button");
	readonly contents = document.createElement("div");

	private status?: HTMLElement;

	constructor(
		onClick: (e: MouseEvent) => void | Promise<void>,
	) {
		this.root.className = "l";
		this.root.append(this.contents);

		let version = 0;
		this.root.addEventListener("click", async e => {
			let v = ++version;
			try {
				this.root.disabled = true;
				let r = onClick(e);
				if (r) {
					this.statusLoading();
					await r;
				}
				this.statusClear();
			} catch (e) {
				console.error("onClick failed", e, version == v);
				if (version != v) return;
				if (e instanceof CancelledError) {
					this.statusClear();
				} else {
					this.statusError(`${e}` || "An error has occurred.");
				}

				if (e instanceof UserError) {
					void showNotification(e.message, { level: NotificationLevel.ERROR });
				}
			} finally {
				this.root.disabled = false;
			}
		})
	}

	private statusClear() {
		if (this.status) {
			this.status.remove();
			this.status = undefined;
		}
	}
	
	private statusError(msg: string) {
		this.statusClear();
		this.status = document.createElement("div");
		this.status.textContent = "⚠️";
		this.status.title = msg;
		this.root.prepend(this.status);
	}
	
	private statusLoading() {
		this.statusClear();
		let img = document.createElement("img");
		img.src = "/a/loading.svg".toString("url");
		this.root.prepend(img);
		this.status = img;
	}
}
