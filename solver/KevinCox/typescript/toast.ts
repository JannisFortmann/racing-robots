import { delayMs, promiseParts } from "./util.js";

const container = document.createElement("div");
container.className = "notifications";
document.body.append(container);

export const enum NotificationLevel {
	ERROR,
	INFO,
}

const CLASS = {
	[NotificationLevel.ERROR]: "e",
	[NotificationLevel.INFO]: "i",
}

const DELAY_MS = {
	[NotificationLevel.ERROR]: 5_000,
	[NotificationLevel.INFO]: 2_000,
}

export async function showNotification(
	body: Node | string | (Node | string)[],
	{
		level = NotificationLevel.INFO,
	} = {},
): Promise<void> {
	let el = document.createElement("div");
	el.classList.add(CLASS[level]);
	if (body instanceof Array) {
		el.append(...body);
	} else {
		el.append(body);
	}
	container.append(el);

	let cancel = promiseParts();
	container.addEventListener("click", cancel.resolve);

	await Promise.race([
		delayMs(DELAY_MS[level]),
		cancel.promise,
	]);

	let keyframes = [{
		transform: `translateY(1em) scale(0.8)`,
		opacity: 0,
	}];
	await el.animate(keyframes, {
		duration: 400,
		fill: "both",
	}).finished;

	el.remove();
}
