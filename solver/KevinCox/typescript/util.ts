export function arrayEquals(a: unknown[], b: unknown[]): boolean {
	return a.length == b.length && a.every((e, i) => e == b[i]);
}

export function arrayInsert<T>(a: T[], i: number, v: T) {
	a.splice(i, 0, v);
}

export function clamp(min: number, v: number, max: number): number {
	return Math.min(Math.max(min, v), max);
}

export class DefaultMap<K, V extends {}> extends Map<K, V> {
	constructor(
		private default_: (key: K) => V,
		values?: Iterable<readonly [K, V]>
	) {
		super(values);
	}

	get(key: K): V {
		let value = super.get(key);
		if (value === undefined) {
			value = this.default_(key);
			this.set(key, value);
		}
		return value;
	}
}

export function delayMs(ms: number): Promise<void> {
	return new Promise(resolve => { setTimeout(resolve, ms) });
}

export function exhaustive(unexpected: never): never {
	throw err`Unexpected value ${unexpected}`;
}

export function fmt(lits: TemplateStringsArray, ...values: unknown[]): string {
	let out: unknown[] = [];
	for (let i = 0; ; i++) {
		out.push(lits[i]);

		if (i >= values.length) break;
		let v = values[i];

		let type = typeof v;
		switch (type) {
		case "bigint":
		case "boolean":
		case "number":
		case "symbol":
		case "undefined":
			out.push(v);
			break;
		case "object":
		case "string":
			out.push(JSON.stringify(v));
			break;
		case "function":
			out.push(`[function ${(v as Function).name}]`);
			break;
		default:
			let _: never = type;
			out.push(JSON.stringify(v));
		}
	}

	return out.join("");
}

class InterpolatedError extends Error {
	constructor(
		message: string,
		readonly values: unknown[],
	) {
		super(message);
	}
}

export function err(lits: TemplateStringsArray, ...values: unknown[]): Error {
	return new InterpolatedError(fmt(lits, ...values), values);
}

export function hasElem<T>(a: T[]): a is NonEmptyArray<T> {
	return a.length > 0;
}

const SI_1 = 10;
const SI_PREFIXES = "QRYZEPTGMkmμnpfazyrq".split("");
arrayInsert(SI_PREFIXES, SI_1, undefined);

export function isoFormat(v: number): string {
	let i = SI_1;
	while (v > 500 && i > 0) {
		v /= 1000;
		i -= 1;
	}
	while (v < 0.1 && i < SI_PREFIXES.length - 1) {
		v *= 1000;
		i += 1;
	}
	return `${v.toLocaleString()} ${SI_PREFIXES[i] ?? ""}`;
}

export type NonEmptyArray<T> = [T, ...T[]];

export function padNumber(n: number, width: number): string {
	return `${n}`.padStart(width, "\u2007")
}

export interface PromiseParts<T> {
	resolve(v: T | PromiseLike<T>): void;
	reject(err: unknown): void;
	promise: Promise<T>;
}

export function promiseParts<T>(): PromiseParts<T> {
	let resolve!: (v: T) => void;
	let reject!: (err: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { resolve, reject, promise };
}

export function randInt(limit: number): number {
	return Math.floor(Math.random() * limit);
}

export function randElem<T>(a: NonEmptyArray<T>): T;
export function randElem<T>(a: T[]): T | undefined;
export function randElem<T>(a: T[]): T | undefined {
	return a[randInt(a.length)]!;
}
