"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"

import {
	normalizeWorkerResult,
	type SqlQueryResult,
	type SqlWorkerInboundMessage,
	type SqlWorkerOutboundMessage,
} from "./sql-types"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type PendingQuery = {
	resolve: (value: SqlQueryResult) => void
	reject: (error: Error) => void
}

type WorkerStatus = "idle" | "initializing" | "ready" | "error"
type WorkerState = { status: WorkerStatus; errorMsg: string }
type WorkerAction =
	| { type: "init" }
	| { type: "ready" }
	| { type: "error"; message: string }
	| { type: "reset" }

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function worker_reducer(state: WorkerState, action: WorkerAction): WorkerState {
	switch (action.type) {
		case "init":
			return state.status === "ready" ? state : { status: "initializing", errorMsg: "" }
		case "ready":
			return { status: "ready", errorMsg: "" }
		case "error":
			return { status: "error", errorMsg: action.message || "Worker error" }
		case "reset":
			return { status: "idle", errorMsg: "" }
		default:
			return state
	}
}

const generate_request_id = () =>
	typeof crypto !== "undefined" && "randomUUID" in crypto
		? crypto.randomUUID()
		: `${Date.now()}-${Math.random().toString(16).slice(2)}`

/* -------------------------------------------------------------------------- */
/* Hooks                                                                      */
/* -------------------------------------------------------------------------- */

export function useSqlWorker() {
	const worker_ref = React.useRef<Worker | null>(null)
	const init_promise_ref = React.useRef<Promise<void> | null>(null)
	const pending_ref = React.useRef<Map<string, PendingQuery>>(new Map())

	const [state, dispatch] = React.useReducer(worker_reducer, { status: "idle", errorMsg: "" })
	const ready = state.status === "ready"
	const error = state.errorMsg

	const create_worker = React.useCallback(() => {
		if (worker_ref.current) return worker_ref.current
		if (typeof window === "undefined") return null

		const worker = new Worker(new URL("./sql-worker.ts", import.meta.url), { type: "module" })
		worker_ref.current = worker

		const resolve_pending = (id: string, apply: (pending: PendingQuery) => void) => {
			const pending = pending_ref.current.get(id)
			if (!pending) return
			pending_ref.current.delete(id)
			apply(pending)
		}

		worker.onerror = (event) => {
			dispatch({ type: "error", message: event.message ?? "Worker error" })
		}

		worker.onmessage = (e: MessageEvent<SqlWorkerOutboundMessage>) => {
			const msg = e.data

			if (msg.type === "ready") {
				dispatch({ type: "ready" })
				return
			}

			if (msg.type === "error") {
				if (!msg.id) {
					dispatch({ type: "error", message: msg.message })
					return
				}

				resolve_pending(msg.id, (pending) => pending.reject(new Error(msg.message)))
				return
			}

			if (msg.type === "result") {
				resolve_pending(msg.id, (pending) => pending.resolve(normalizeWorkerResult(msg)))
			}
		}

		return worker
	}, [])

	const ensure_ready = React.useCallback(async () => {
		if (state.status === "ready") return
		if (state.status === "initializing" && init_promise_ref.current) {
			return await init_promise_ref.current
		}

		const worker = create_worker()
		if (!worker) throw new Error("Worker unavailable in this environment")

		if (!init_promise_ref.current) {
			dispatch({ type: "init" })
			init_promise_ref.current = new Promise<void>((resolve, reject) => {
				let timeout_id: number | null = null

				const cleanup = () => {
					worker.removeEventListener("message", on_message)
					if (timeout_id != null) window.clearTimeout(timeout_id)
				}

				const on_message = (e: MessageEvent) => {
					const msg = e.data as SqlWorkerOutboundMessage

					if (msg.type === "ready") {
						cleanup()
						resolve()
						return
					}

					if (msg.type === "error" && !msg.id) {
						cleanup()
						reject(new Error(msg.message))
					}
				}

				worker.addEventListener("message", on_message)

				timeout_id = window.setTimeout(() => {
					cleanup()
					reject(new Error("Worker initialization timed out after 5s"))
				}, 5000)

				worker.postMessage({ type: "init" } satisfies SqlWorkerInboundMessage)
			})
		}

		try {
			await init_promise_ref.current
		} catch (err) {
			init_promise_ref.current = null
			dispatch({ type: "error", message: err instanceof Error ? err.message : "Worker unavailable" })
			throw err
		}
	}, [create_worker, state.status])

	const warmup = React.useCallback(async () => {
		try {
			await ensure_ready()
		} catch (err) {
			dispatch({ type: "error", message: err instanceof Error ? err.message : "Worker unavailable" })
		}
	}, [ensure_ready])

	const terminate = React.useCallback((reason = "Worker terminated") => {
		for (const [, pending] of pending_ref.current) pending.reject(new Error(reason))
		pending_ref.current.clear()

		const worker = worker_ref.current
		worker_ref.current = null
		init_promise_ref.current = null
		dispatch({ type: "reset" })

		if (!worker) return

		try {
			worker.postMessage({ type: "close" } satisfies SqlWorkerInboundMessage)
			worker.terminate()
		} catch {}
	}, [])

	const exec = React.useCallback(
		async (sql: string, opts?: { timeoutMs?: number }) => {
			await ensure_ready()

			const worker = worker_ref.current
			if (!worker) throw new Error("Worker not available")

			const id = generate_request_id()

			return await new Promise<SqlQueryResult>((resolve, reject) => {
				const timeout_ms = opts?.timeoutMs ?? 0
				const timeout_id =
					timeout_ms > 0
						? window.setTimeout(() => {
								pending_ref.current.delete(id)
								reject(new Error("Query timed out"))
							}, timeout_ms)
						: null

				const finalize =
					<T,>(fn: (value: T) => void) =>
					(value: T) => {
						if (timeout_id) window.clearTimeout(timeout_id)
						fn(value)
					}

				pending_ref.current.set(id, {
					resolve: finalize(resolve),
					reject: finalize(reject),
				})

				worker.postMessage({ type: "exec", id, sql } satisfies SqlWorkerInboundMessage)
			})
		},
		[ensure_ready]
	)

	React.useEffect(() => {
		return () => {
			terminate()
		}
	}, [terminate])

	return { ready, error, exec, warmup, terminate }
}

