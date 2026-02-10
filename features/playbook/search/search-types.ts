/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import type { MetricFormula } from "@/features/playbook/definitions/metrics"
import type { TabId } from "@/features/playbook/definitions/tabs"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type SearchCategory =
	| "tab"
	| "framework"
	| "term"
	| "source"
	| "metric"
	| "spend"
	| "vertical"
	| "utm_medium"
	| "utm_source"
	| "utm_placement"
	| "copy"

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
	searchChunks?: readonly string[]
}

export type Catalog = {
	entries: readonly SearchEntry[]
	tabs: readonly SearchEntry[]
	frameworks: readonly SearchEntry[]
	terms: readonly SearchEntry[]
	sources: readonly SearchEntry[]
	metrics: readonly SearchEntry[]
	spend: readonly SearchEntry[]
	verticals: readonly SearchEntry[]
	utmMediums: readonly SearchEntry[]
	utmSources: readonly SearchEntry[]
	utmPlacements: readonly SearchEntry[]
	copy: readonly SearchEntry[]
}
