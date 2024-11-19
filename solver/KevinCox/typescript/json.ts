type JsonPrimative = boolean | null | number | string | undefined;
type Json = JsonPrimative | Json[] | { [k: string]: Json };

export function jsonEq(a: Json, b: Json): boolean {
	if (a === b) return true;
	if (typeof a !== "object" || typeof b !== "object") return false;
	if (!a || !b) return false;

	// Note: Do both ways to allow `undefined` explicitly and not present.

	for (const k of Object.keys(a)) {
		if (!jsonEq((a as any)[k]!, (b as any)[k]!)) return false;
	}
	for (const k of Object.keys(b)) {
		if (!jsonEq((a as any)[k]!, (b as any)[k]!)) return false;
	}

	return true;
}
