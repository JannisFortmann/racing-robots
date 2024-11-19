import { Requests, Responses } from "../pkg/ricochetrobots.js";
import { PromiseParts, err, promiseParts } from "./util.js";

interface WorkerResponse {
	id: number,
	error?: string,
	res: Record<string, unknown>,
}

export default class RRWorker {
	private worker = new Worker("/a/typescript/worker.js".toString("url"), {
		type: "module",
	});
	private workerError: unknown;

	private nextRequest = 0;
	private pendingResponses = new Map<number, PromiseParts<unknown>>

	constructor() {
		this.worker.onmessage = e => {
			let res: WorkerResponse = e.data;
			let pp = this.pendingResponses.get(res.id);
			if (!pp) {
				console.error("Response with no request:", res);
				return;
			}
			this.pendingResponses.delete(res.id);

			if (res.error) {
				pp.reject(res.error);
			} else {
				let value = Object.values(res.res);
				if (value.length != 1) {
					console.warn("Got multiple values in response", value);
				}
				pp.resolve(value[0]);
			}
		};
		this.worker.onerror = e => {
			this.workerError = err`Worker failed: ${e}`;
			for (const {reject} of this.pendingResponses.values()) {
				reject(this.workerError);
			}
			this.pendingResponses.clear();
		};
	}

	async send<K extends keyof Requests>(kind: K, req: Requests[K]): Promise<Responses[K]> {
		if (this.workerError) throw this.workerError;

		let id = this.nextRequest++;

		let pp = promiseParts<Responses[typeof kind]>();
		this.pendingResponses.set(id, pp);

		this.worker.postMessage({
			id,
			req: {[kind]: req},
		});

		return pp.promise;
	}
}
