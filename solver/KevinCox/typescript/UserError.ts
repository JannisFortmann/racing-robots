import { fmt } from "./util.js";

export class UserError extends Error {
}

export function userErr(lits: TemplateStringsArray, ...values: unknown[]): Error {
	return new UserError(fmt(lits, ...values));
}
