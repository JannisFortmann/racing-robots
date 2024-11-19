import loader from "../pkg/ricochetrobots.js";
import MainUI from "./MainUI.js";

let loading = document.getElementById("loading")!;

window.onerror = e => {
	console.error(e);
	loading.textContent = `${e}`;
}
window.onunhandledrejection = (e: PromiseRejectionEvent) => {
	console.error("Unhanded rejection:", e.reason);
	loading.textContent = e.reason;
}

if (navigator.serviceWorker && location.hostname != "localhost") {
	navigator.serviceWorker.register('/service-worker.js')
		.catch(console.error);
}

loader(("/a/wasm/ricochetrobots_bg.wasm").toString("url"))
	.then(() => {
		(window as any).rr = new MainUI;
	});
