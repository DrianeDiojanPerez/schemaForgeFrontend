import type { Result, RpcError } from "../types/schema";

/** A failed call, with the backend's status kept so the page can say why. */
export class RpcFailure extends Error {
	readonly status: string;
	readonly appCode: number;
	readonly violations?: Record<string, string[]>;

	constructor(rpc: RpcError) {
		super(rpc.message);
		this.name = "RpcFailure";
		this.status = rpc.status;
		this.appCode = rpc.appCode;
		this.violations = rpc.violations;
	}
}

/** The value of a result, or the failure thrown so a mutation rejects. */
export function unwrap<T>(result: Result<T>): T {
	if (result.ok) return result.value;

	throw new RpcFailure(result);
}

export const failedWith = (error: unknown, status: string) =>
	error instanceof RpcFailure && error.status === status;

export const isConflict = (error: unknown) => failedWith(error, "ALREADY_EXISTS");
export const isForbidden = (error: unknown) => failedWith(error, "PERMISSION_DENIED");
export const isMissing = (error: unknown) => failedWith(error, "NOT_FOUND");
export const isInvalid = (error: unknown) => failedWith(error, "INVALID_ARGUMENT");
