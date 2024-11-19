import { UserError } from "./UserError.js";

export class CancelledError extends UserError {
	constructor(msg="Cancelled") {
		super(msg)
	}
}
