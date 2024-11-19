import loader, { Request, Requests, execute } from "../wasm/ricochetrobots.js";

let rustPromise = loader(("/a/wasm/ricochetrobots_bg.wasm" as any).toString("url"));

onmessage = async (e: MessageEvent<{id: number, req: Request}>) => {
	try {
		await rustPromise;
		let res = execute(e.data.req as Requests);
		postMessage({
			id: e.data.id,
			res,
		});
	} catch (error) {
		console.error("Rust error", error);
		postMessage({
			id: e.data.id,
			error: `${error}`,
		})
	}
};
