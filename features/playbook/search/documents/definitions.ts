/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import { PlaybookTabs } from "@/features/playbook/definitions/tabs"
import { MetricDefinitionList } from "@/features/playbook/definitions/metrics"
import { TermDefinitions } from "@/features/playbook/definitions/terms"
import type { SearchEntryInput } from "@/features/playbook/search/schema"

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const formula_tokens = (formula?: SearchEntryInput["formula"]) => {
	if (!formula) return []
	if (formula.kind === "fraction" || formula.kind === "scaled_fraction") return [formula.numerator, formula.denominator]
	return [formula.left, formula.right]
}

const compact = (values: readonly (string | undefined)[]) => values.filter((value): value is string => Boolean(value))

/* -------------------------------------------------------------------------- */
/* Tab documents                                                              */
/* -------------------------------------------------------------------------- */

export const TabSearchDocuments = Object.freeze(
	PlaybookTabs.map<SearchEntryInput>((tab) => ({
		id: `tab:${tab.id}`,
		title: tab.alias,
		description: tab.description,
		category: "tab",
		tabId: tab.id,
		badge: "Tab",
		meta: tab.id,
		searchableParts: [tab.alias, tab.description],
	}))
)

/* -------------------------------------------------------------------------- */
/* Definition documents                                                       */
/* -------------------------------------------------------------------------- */

export const DefinitionSearchDocuments = Object.freeze([
	...TermDefinitions.map<SearchEntryInput>((term) => ({
		id: `term:${term.id}`,
		title: term.alias,
		description: term.description,
		displayDescription: term.description,
		category: "term",
		badge: "Term",
		meta: term.id,
		keywords: [term.id, term.alias],
	})),
	...MetricDefinitionList.map<SearchEntryInput>((metric) => {
		const formula = "formula" in metric ? metric.formula : undefined
		const type_l2 = "type_l2" in metric ? metric.type_l2 : undefined
		return {
			id: `metric:${metric.id}`,
			title: metric.alias,
			description: metric.description,
			displayDescription: metric.description,
			category: "metric",
			badge: metric.type_l1 === "attribute" ? "Attribute" : "Measure",
			meta: metric.id,
			formula,
			keywords: compact([metric.id, metric.alias, metric.type_l1, type_l2]),
			searchableParts: formula_tokens(formula),
			searchChunks: formula_tokens(formula),
		}
	}),
])
