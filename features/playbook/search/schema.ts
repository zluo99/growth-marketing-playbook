/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import type { MetricFormula } from "@/features/playbook/definitions/metrics"
import type { TabId } from "@/features/playbook/definitions/tabs"

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

export const definition_search_categories = [
	"term",
	"metric",
] as const

export const search_categories = ["tab", "framework", ...definition_search_categories, "copy"] as const

const definition_search_category_set = new Set<string>(definition_search_categories)

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type SearchTextPart = string | null | undefined | false

export type DefinitionSearchCategory = (typeof definition_search_categories)[number]
export type SearchCategory = (typeof search_categories)[number]

export type SearchEntry = {
	id: string
	title: string
	description?: string
	displayDescription?: string
	category: SearchCategory
	tabId?: TabId
	badge: string
	meta?: string
	searchable: string
	scrollTarget?: string
	formula?: MetricFormula
	breadcrumbs?: readonly string[]
	keywords?: readonly string[]
	searchChunks?: readonly string[]
	priority?: number
}

export type SearchEntryInput = Omit<SearchEntry, "searchable"> & {
	searchableParts?: readonly SearchTextPart[]
}

export type CopyEntryInput = Omit<SearchEntryInput, "category" | "searchChunks" | "searchableParts"> & {
	category?: "copy"
	extra?: readonly string[]
	searchExtras?: readonly string[]
}

export type CatalogByCategory = Readonly<Record<SearchCategory, readonly SearchEntry[]>>

export type Catalog = {
	entries: readonly SearchEntry[]
	byCategory: CatalogByCategory
	tabs: readonly SearchEntry[]
	frameworks: readonly SearchEntry[]
	terms: readonly SearchEntry[]
	metrics: readonly SearchEntry[]
	definitions: readonly SearchEntry[]
	copy: readonly SearchEntry[]
}

/* -------------------------------------------------------------------------- */
/* Guards                                                                     */
/* -------------------------------------------------------------------------- */

export const is_definition_search_category = (value: SearchCategory): value is DefinitionSearchCategory =>
	definition_search_category_set.has(value)

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export const strip_inline_markdown = (value: string) => value.replace(/[`*]/g, "")
export const normalize_search_text = (value: string) => value.replace(/\s+/g, " ").trim()
export const sanitize_text = (value?: string) => (value ?? "").trim()

const compact_search_parts = (values: readonly SearchTextPart[]) =>
	values.filter((value): value is string => typeof value === "string" && value.trim().length > 0)

export const unique_search_strings = (values: readonly SearchTextPart[]) =>
	Array.from(new Set(compact_search_parts(values).map((value) => normalize_search_text(strip_inline_markdown(value)))))

export const build_searchable_text = (...parts: readonly SearchTextPart[]) =>
	normalize_search_text(strip_inline_markdown(compact_search_parts(parts).join(" ").toLowerCase()))

/* -------------------------------------------------------------------------- */
/* Builders                                                                   */
/* -------------------------------------------------------------------------- */

export const create_search_entry = ({ searchableParts = [], ...entry }: SearchEntryInput): SearchEntry => ({
	...entry,
	description: sanitize_text(entry.description) || undefined,
	displayDescription: sanitize_text(entry.displayDescription) || undefined,
	meta: sanitize_text(entry.meta) || undefined,
	keywords: unique_search_strings(entry.keywords ?? []),
	searchChunks: compact_search_parts(entry.searchChunks ?? []),
	searchable: build_searchable_text(entry.title, entry.description, entry.meta, ...searchableParts),
})

export const create_copy_search_entry = ({ category = "copy", extra = [], searchExtras = [], keywords = [], ...entry }: CopyEntryInput): SearchEntry =>
	create_search_entry({
		...entry,
		category,
		keywords: unique_search_strings([entry.title, entry.meta, ...keywords]),
		searchChunks: compact_search_parts([...searchExtras, ...extra]),
		searchableParts: [...extra, ...searchExtras],
	})

export const group_entries_by_category = (entries: readonly SearchEntry[]) => {
	const groups: Record<SearchCategory, SearchEntry[]> = {
		tab: [],
		framework: [],
		term: [],
		metric: [],
		copy: [],
	}

	for (const entry of entries) groups[entry.category].push(entry)

	return groups
}
