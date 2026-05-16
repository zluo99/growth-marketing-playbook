"use strict"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import { seedSpoofData } from "./sql-seed"
import type { SqlWorkerInboundMessage, SqlWorkerOutboundMessage } from "./sql-types"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type SqlJsDb = {
	run: (sql: string, params?: unknown[]) => unknown
	exec: (sql: string) => Array<{ columns: string[]; values: unknown[][] }>
	close: () => void
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

let db: SqlJsDb | null = null
let init_promise: Promise<void> | null = null

const worker_scope = self as unknown as Worker
const post = (msg: SqlWorkerOutboundMessage) => worker_scope.postMessage(msg)

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function resolve_wasm_url(filename: string) {
	return new URL(`/${filename}`, self.location.href).toString()
}

function is_csp_wasm_compile_error(err: unknown) {
	const message = err instanceof Error ? err.message : String(err)
	return /content security policy|csp/i.test(message) && /webassembly|instantiate|compileerror/i.test(message)
}

async function init_sql_module() {
	try {
		// @ts-expect-error sql.js module has no types
		const sql_js_module = await import("sql.js/dist/sql-wasm.js")
		const init_sql_js = sql_js_module.default || sql_js_module
		return await init_sql_js({
			locateFile: (file: string) => {
				// sql.js asks for "sql-wasm.wasm" (or similar) here
				return resolve_wasm_url(file)
			},
		})
	} catch (err) {
		if (is_csp_wasm_compile_error(err)) {
			throw new Error("WebAssembly is blocked by Content Security Policy. Add 'wasm-unsafe-eval' to script-src.")
		}
		throw err
	}
}

async function ensure_db(): Promise<SqlJsDb> {
	if (db) return db

	if (init_promise) {
		await init_promise
		if (!db) throw new Error("SQL engine not initialized")
		return db
	}

	init_promise = (async () => {
		try {
			const sql_module = await init_sql_module()

			const database = new sql_module.Database() as unknown as SqlJsDb
			seedSpoofData(database, { clearExisting: true })
			db = database
		} catch (err) {
			throw new Error(`Failed to initialize SQL.js: ${err instanceof Error ? err.message : String(err)}`)
		}
	})()

	try {
		await init_promise
	} finally {
		init_promise = null
	}

	if (!db) throw new Error("SQL engine not initialized")
	return db
}

/* -------------------------------------------------------------------------- */
/* Export                                                                     */
/* -------------------------------------------------------------------------- */

self.onmessage = async (e: MessageEvent<SqlWorkerInboundMessage>) => {
	const msg = e.data

	try {
		if (msg.type === "init") {
			await ensure_db()
			post({ type: "ready" })
			return
		}

		if (msg.type === "exec") {
			const database = await ensure_db()

			const q = msg.sql.trim()
			if (!q) {
				post({ type: "result", id: msg.id, columns: [], values: [] })
				return
			}

			const res = database.exec(q)
			const first = res?.[0]
			post({
				type: "result",
				id: msg.id,
				columns: first?.columns ?? [],
				values: first?.values ?? [],
			})
			return
		}

		if (msg.type === "close") {
			db?.close()
			db = null
			init_promise = null
			return
		}
	} catch (err) {
		const message = err instanceof Error ? err.message : "Worker error"
		const id = msg.type === "exec" ? msg.id : undefined
		post({ type: "error", id, message })
	}
}

