/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type SqlWorkerInboundMessage =
	| { type: "init" }
	| { type: "exec"; id: string; sql: string }
	| { type: "close" }

export type SqlWorkerReadyMessage = { type: "ready" }
export type SqlWorkerResultMessage = { type: "result"; id: string; columns: string[]; values: unknown[][] }
export type SqlWorkerErrorMessage = { type: "error"; id?: string; message: string }

export type SqlWorkerOutboundMessage = SqlWorkerReadyMessage | SqlWorkerResultMessage | SqlWorkerErrorMessage

export type SqlWorkerResultPayload = { columns: string[]; values: unknown[][] }
export type SqlQueryResult = { columns: string[]; values: (string | number | null)[][] }

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export function normalizeWorkerResult(result: SqlWorkerResultPayload): SqlQueryResult {
	const columns = result.columns ?? []
	const values = (result.values ?? []).map((row) =>
		row.map((v) => {
			if (v === null) return null
			if (typeof v === "string" || typeof v === "number") return v
			return String(v)
		})
	) as (string | number | null)[][]

	return { columns, values }
}
