export default class TimerButton {
	readonly root = document.createElement("button");

	private time = document.createTextNode("");
	private timer?: number;

	constructor() {
		this.root.textContent = "⏱️";
		this.root.style.fontVariantNumeric = "tabular-nums";
		this.root.append(this.time);
		this.root.onclick = () => {
			if (this.timer) {
				clearInterval(this.timer);
				this.timer = undefined;
				this.time.textContent = "";
				return;
			}

			let endTime = +new Date + 60*1000;
			let callback = () => {
				let now = +new Date;
				let remainingS = (endTime - now) / 1000;
				if (remainingS <= 0) {
					this.timer = undefined;
					this.time.textContent = "";
					return;
				}
				let s = Math.ceil(remainingS);
				this.time.textContent = ` ${s.toFixed().padStart(2, " ")}`;
				this.timer = setTimeout(callback, (s - remainingS) || 1000);
			};
			callback();
		};
	}
}
