"use client"

export const PlaybookStorage = {
	frameworks: {
		filter: "frameworks:filter",
		cols: "frameworks:cols",
		reveal: "frameworks:reveal",
	},
	plays: {
		segment: "plays:segment",
		field: "plays:field",
		spendView: "plays:spend_view",
	},
	reportsSql: {
		paneHeight: "reports_sql:pane_height",
		editorWidthPct: "reports_sql:editor_width_pct",
	},
	overview: {
		aiAnalystModules: "overview:ai_analyst_modules",
	},
} as const

export const PlaybookEvents = {
	frameworksFilter: "playbook:frameworks-filter-change",
	frameworksReveal: "playbook:frameworks-reveal",
	spendView: "playbook:spend-view-change",
} as const

const memory_store = new Map<string, string>()
let storage_ok: boolean | null = null

const can_use_storage = () => {
	try {
		const key = "__pb_pref__"
		window.localStorage.setItem(key, key)
		window.localStorage.removeItem(key)
		return true
	} catch {
		return false
	}
}

const has_storage = () => {
	if (typeof window === "undefined") return false
	if (storage_ok == null) storage_ok = can_use_storage()
	return storage_ok
}

export const read_preference = (key: string) => {
	if (typeof window !== "undefined" && has_storage()) {
		try {
			const value = window.localStorage.getItem(key)
			if (value != null) return value
		} catch {
			storage_ok = false
		}
	}
	return memory_store.get(key) ?? null
}

export const write_preference = (key: string, value: string) => {
	memory_store.set(key, value)
	if (typeof window === "undefined" || !has_storage()) return
	try {
		window.localStorage.setItem(key, value)
	} catch {
		storage_ok = false
	}
}

export const remove_preference = (key: string) => {
	memory_store.delete(key)
	if (typeof window === "undefined" || !has_storage()) return
	try {
		window.localStorage.removeItem(key)
	} catch {
		storage_ok = false
	}
}
