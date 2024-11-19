import { Game } from "../pkg/ricochetrobots.js";
import { DefaultMap, NonEmptyArray, arrayEquals, hasElem } from "./util.js";

export const enum Param {
	GAME = "s",
}

const PARSERS = {
	s: {
		default: Game.default,
		parse([g]: NonEmptyArray<string>) { return Game.from_compact(g) },
		format(g: Game) { return [g.to_compact()] },
		free(g: Game) { return g.free(); },
	},
};

type ParamValues = { [k in Param]: ReturnType<typeof PARSERS[k]["default"]> };

const subscribers = new DefaultMap(() => new Set<((v: unknown) => void)>);

let params = new URLSearchParams(location.hash.slice(1));

window.onhashchange = () => {
	let before = params;
	params = new URLSearchParams(location.hash.slice(1));
	for (const k of Object.keys(PARSERS) as Param[]) {
		let strs = params.getAll(k);
		if (arrayEquals(strs, before.getAll(k))) continue;
		let v = getParam(k);
		try {
			for (const s of subscribers.get(k)) {
				try {
					s(v);
				} catch (e) {
					console.error("Failed to handle URL change", k, strs, v, s);
				}
			}
		} finally {
			PARSERS[k].free(v);
		}
	}
}

export function setParam(k: Param, v: ParamValues[typeof k]) {
	let strs = PARSERS[k].format(v);
	params.delete(k);
	for (const str of strs) {
		params.append(k, str);
	}
	params.sort();
	history.replaceState(
		null,
		document.title,
		`#${params}`);
}

export function getParam(k: Param): ParamValues[typeof k] {
	let parser = PARSERS[k];

	let strs = params.getAll(k);
	if (hasElem(strs)) {
		try {
			return parser.parse(strs);
		} catch (e) {
			console.error("Failed to parse URL param", k, strs, e);
		}
	}

	return parser.default();
}

export function subscribeParam(k: Param, f: (v: ParamValues[typeof k]) => void) {
	subscribers.get(k).add(f as (v: unknown) => void);
}

export function makeUrl(params: Partial<ParamValues>): string {
	const url = new URLSearchParams;
	for (const [k, v] of Object.entries(params)) {
		const parser = PARSERS[k as Param];
		for (const str of parser.format(v)) {
			url.append(k, str);
		}
	}
	url.sort();
	return `#${url}`;
}
