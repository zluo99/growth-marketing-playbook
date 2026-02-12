/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import { AnalysisCopy } from "@/features/playbook/copy/journeys-analysis"
import { ProblemCopy } from "@/features/playbook/copy/journeys-problem"
import { GuideCopy } from "@/features/playbook/copy/overview-guide"
import { TenetsCopy } from "@/features/playbook/copy/overview-tenets"
import { SourcesCopy } from "@/features/playbook/copy/plays-sources"
import { SpendCopy } from "@/features/playbook/copy/plays-spend"
import { DefinitionsCopy } from "@/features/playbook/copy/reports-sql-definitions"
import { FunnelCopy } from "@/features/playbook/copy/reports-sql-funnel"
import { PgCopy } from "@/features/playbook/copy/reports-sql-pg"
import { ExampleCopy } from "@/features/playbook/copy/reports-workspace-example"
import { SheetsCopy, SlidesCopy } from "@/features/playbook/copy/reports-workspace-google"

import { MetricDefinitionList } from "@/features/playbook/definitions/metrics"
import { FrameworkDefinitions, type Framework } from "@/features/playbook/definitions/frameworks"
import { SpendDefinitions } from "@/features/playbook/definitions/spend"
import { Sources } from "@/features/playbook/definitions/sources"
import { PlaybookTabs, TabById } from "@/features/playbook/definitions/tabs"
import { TermDefinitions } from "@/features/playbook/definitions/terms"
import { UtmMediumDefinitions } from "@/features/playbook/definitions/utm-medium-to-sources"
import { UtmPlacementDefinitions } from "@/features/playbook/definitions/utm-placement-to-placements"
import { UtmSourceVendorDefinitions } from "@/features/playbook/definitions/utm-source-to-vendors"
import { VerticalDefinitions } from "@/features/playbook/definitions/verticals"

import type { CopyEntryInput } from "@/features/playbook/search/search-entry"
import type { Catalog, SearchEntry } from "@/features/playbook/search/search-types"

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const normalize_text = (value: string) => value.replace(/\s+/g, " ").trim()
const sanitize = (value?: string) => (value ?? "").trim()
const strip_inline_markdown = (value: string) => value.replace(/[`*]/g, "")
const to_searchable = (...parts: (string | undefined)[]) =>
	normalize_text(strip_inline_markdown(parts.filter(Boolean).join(" ").toLowerCase()))
const compact_strings = (values: readonly (string | undefined)[]) => values.filter((value): value is string => Boolean(value))

const formula_tokens = (formula: SearchEntry["formula"]) => {
	if (!formula) return []
	if (formula.kind === "fraction" || formula.kind === "scaled_fraction") return [formula.numerator, formula.denominator]
	if (formula.kind === "product" || formula.kind === "difference") return [formula.left, formula.right]
	return []
}

/* -------------------------------------------------------------------------- */
/* Tab entries                                                                */
/* -------------------------------------------------------------------------- */

const build_tab_entries = (): SearchEntry[] =>
	PlaybookTabs.map((tab) => ({
		id: `tab:${tab.id}`,
		title: tab.alias,
		description: sanitize(tab.description),
		category: "tab",
		tabId: tab.id,
		badge: "Tab",
		meta: tab.id,
		searchable: to_searchable(tab.alias, tab.description, tab.alias),
		scrollTarget: `tab:${tab.id}`,
	}))

/* -------------------------------------------------------------------------- */
/* Framework entries                                                          */
/* -------------------------------------------------------------------------- */

const build_framework_entry = (framework: Framework): SearchEntry => {
	const pillar_words = framework.pillars.flatMap((pillar) => [pillar.name, ...pillar.items])
	return {
		id: `framework:${framework.id}`,
		title: framework.alias,
		description: sanitize(framework.description),
		displayDescription: framework.description,
		category: "framework",
		tabId: "frameworks",
		badge: framework.type,
		meta: framework.id,
		searchable: to_searchable(framework.alias, framework.description, framework.type, ...pillar_words),
		searchChunks: pillar_words,
		scrollTarget: `framework:${framework.id}`,
	}
}

const build_framework_entries = (): SearchEntry[] => FrameworkDefinitions.map(build_framework_entry)

/* -------------------------------------------------------------------------- */
/* Definition entries                                                         */
/* -------------------------------------------------------------------------- */

const build_term_entries = (): SearchEntry[] =>
	TermDefinitions.map((term) => ({
		id: `term:${term.id}`,
		title: term.alias,
		description: sanitize(term.description),
		displayDescription: term.description,
		category: "term",
		badge: "Term",
		meta: term.id,
		searchable: to_searchable(term.alias, term.description, term.id),
	}))

const build_metric_entries = (): SearchEntry[] =>
	MetricDefinitionList.map((metric) => {
		const formula = "formula" in metric ? metric.formula : undefined
		return {
			id: `metric:${metric.id}`,
			title: metric.alias,
			description: sanitize(metric.description),
			displayDescription: metric.description,
			category: "metric",
			badge: metric.type_l1 === "attribute" ? "Attribute" : "Measure",
			meta: metric.id,
			formula,
			searchable: to_searchable(metric.alias, metric.description, metric.id, ...formula_tokens(formula)),
			searchChunks: formula_tokens(formula),
		}
	})

const build_source_entries = (): SearchEntry[] =>
	Sources.map((source) => {
		const title = source.source_l3
		const description = source.description_long || source.description_short
		const meta = `${source.source_l1} / ${source.source_l2}`

		return {
			id: `source:${source.source_l3}`,
			title,
			description: sanitize(description),
			displayDescription: source.description_long,
			category: "source",
			tabId: "plays",
			badge: source.source_l3,
			meta,
			searchable: to_searchable(
				source.source_l1,
				source.source_l2,
				source.source_l3,
				source.description_short,
				source.description_long,
				...source.spend_aliases
			),
			scrollTarget: `source:${source.source_l3}`,
			breadcrumbs: [source.source_l1, source.source_l2, source.source_l3],
		}
	})

const build_spend_entries = (): SearchEntry[] =>
	SpendDefinitions.map((spend) => ({
		id: `spend:${spend.id}`,
		title: spend.alias,
		description: sanitize(spend.description),
		displayDescription: spend.description,
		category: "spend",
		badge: "Spend",
		meta: spend.id,
		searchable: to_searchable(spend.alias, spend.description, spend.id, ...spend.source_l3),
		searchChunks: spend.source_l3,
	}))

const build_vertical_entries = (): SearchEntry[] =>
	VerticalDefinitions.map((vertical) => ({
		id: `vertical:${vertical.id}`,
		title: vertical.alias,
		description: sanitize(vertical.description),
		displayDescription: vertical.description,
		category: "vertical",
		badge: "Vertical",
		meta: vertical.id,
		searchable: to_searchable(vertical.alias, vertical.description, vertical.id),
	}))

const build_utm_medium_entries = (): SearchEntry[] =>
	UtmMediumDefinitions.map((row) => ({
		id: `utm-medium:${row.utm_medium}`,
		title: row.utm_medium,
		description: sanitize(row.description ?? ""),
		displayDescription: row.description ?? undefined,
		category: "utm_medium",
		badge: "UTM Medium",
		meta: row.source_l3,
		searchable: to_searchable(row.utm_medium, row.description ?? "", row.source_l3),
	}))

const build_utm_source_entries = (): SearchEntry[] =>
	UtmSourceVendorDefinitions.map((row) => ({
		id: `utm-source:${row.utm_source}`,
		title: row.utm_source,
		description: sanitize(row.description),
		displayDescription: row.description,
		category: "utm_source",
		badge: "UTM Source",
		meta: row.vendor,
		searchable: to_searchable(row.utm_source, row.vendor, row.description, ...row.source_l3),
		searchChunks: row.source_l3,
	}))

const build_utm_placement_entries = (): SearchEntry[] =>
	UtmPlacementDefinitions.map((row) => ({
		id: `utm-placement:${row.utm_source}:${row.utm_placement}`,
		title: `${row.utm_source} / ${row.utm_placement}`,
		description: sanitize(row.placement),
		displayDescription: row.placement,
		category: "utm_placement",
		badge: "UTM Placement",
		meta: row.utm_source,
		searchable: to_searchable(row.utm_source, row.utm_placement, row.placement),
	}))

/* -------------------------------------------------------------------------- */
/* Copy entries                                                               */
/* -------------------------------------------------------------------------- */

const resolve_copy_scroll_target = (id: string) => {
	if (id.startsWith("tenets-panel-")) return "tenets-card"
	if (id.startsWith("guide-panel-")) return "guide-card"
	if (id.startsWith("problem-section-")) return "problem-card"
	if (id.startsWith("analysis-panel-")) return "analysis-card"
	if (id.startsWith("spend-pillar-") || id.startsWith("spend-panel-")) return "spend-card"
	if (id.startsWith("definitions-panel-") || id.startsWith("definitions-table-")) return "definitions-card"
	if (id.startsWith("funnel-panel-") || id.startsWith("funnel-note-")) return "funnel-card"
	if (id.startsWith("pg-preset-")) return "pg-card"
	if (id.startsWith("workspace-panel-")) return "workspace-example"
	return id
}

const build_copy_entry = (entry: CopyEntryInput): SearchEntry => {
	const search_chunks = compact_strings([...(entry.searchExtras ?? []), ...(entry.extra ?? [])])
	const searchable = to_searchable(entry.title, entry.description, entry.meta, ...(entry.extra ?? []), ...(entry.searchExtras ?? []))
	const scroll_target = entry.scrollTarget ?? resolve_copy_scroll_target(entry.id)
	return {
		id: `copy:${entry.id}`,
		title: entry.title,
		description: sanitize(entry.description),
		displayDescription: entry.displayDescription ?? entry.description,
		category: "copy",
		tabId: entry.tabId,
		badge: entry.badge ?? "Copy",
		meta: entry.meta,
		searchable,
		searchChunks: search_chunks.length ? search_chunks : undefined,
		scrollTarget: scroll_target,
		breadcrumbs: entry.breadcrumbs,
	}
}

const add_bullets = (bullets: readonly { text: string }[]) => bullets.map((bullet) => bullet.text)

const build_copy_entries = (): SearchEntry[] => {
	const entries: SearchEntry[] = []

	const push = (entry: CopyEntryInput) => {
		entries.push(build_copy_entry(entry))
	}

	push({
		id: "tenets-card",
		title: TenetsCopy.title,
		description: TenetsCopy.body,
		tabId: "overview",
		badge: "Tenets",
		meta: TabById["overview"].alias,
		extra: [TenetsCopy.footer],
	})

	TenetsCopy.panels.forEach((panel) =>
		push({
			id: `tenets-panel-${panel.id}`,
			title: panel.title,
			description: panel.body,
			tabId: "overview",
			badge: "Tenet",
			meta: panel.title,
			breadcrumbs: [TenetsCopy.title],
		})
	)

	GuideCopy.panels.forEach((panel) =>
		push({
			id: `guide-panel-${panel.id}`,
			title: panel.title,
			description: panel.body,
			tabId: "overview",
			badge: "Guide",
			meta: "Execution guide",
			searchExtras: panel.sequence?.flatMap((tabId) => [tabId, TabById[tabId].alias]) ?? [],
			breadcrumbs: [GuideCopy.title],
		})
	)

	push({
		id: "problem-card",
		title: ProblemCopy.title,
		description: ProblemCopy.body,
		tabId: "journeys",
		badge: "Problem",
		meta: "Journeys",
	})

	ProblemCopy.sections.forEach((section) =>
		push({
			id: `problem-section-${section.id}`,
			title: section.title,
			description: section.bullets.join(" "),
			tabId: "journeys",
			badge: "Problem section",
			meta: ProblemCopy.title,
			breadcrumbs: [ProblemCopy.title],
		})
	)

	push({
		id: "analysis-card",
		title: AnalysisCopy.title,
		description: AnalysisCopy.body,
		tabId: "journeys",
		badge: "Analysis",
		meta: "Journey analysis",
		extra: [AnalysisCopy.footer],
		searchExtras: AnalysisCopy.panels.map((panel) => panel.title),
	})

	AnalysisCopy.panels.forEach((panel) =>
		push({
			id: `analysis-panel-${panel.id}`,
			title: panel.title,
			description: panel.body,
			tabId: "journeys",
			badge: "Analysis panel",
			meta: `${AnalysisCopy.title}`,
			extra: add_bullets(panel.bullets.map((bullet) => ({ text: bullet }))),
			breadcrumbs: [AnalysisCopy.title],
		})
	)

	SpendCopy.panels.forEach((panel) =>
		push({
			id: `spend-panel-${panel.id}`,
			title: panel.title,
			description: panel.body,
			tabId: "plays",
			badge: "Spend panel",
			meta: SpendCopy.title,
			extra: compact_strings([
				...(panel.sections?.flatMap((section) => [section.title, section.body, ...section.bullets.map((bullet) => bullet.text)]) ?? []),
				...(panel.id === "1"
					? SpendCopy.pillars.flatMap((pillar) => [pillar.title, pillar.body, ...pillar.bullets.map((bullet) => bullet.text)])
					: []),
			]),
			breadcrumbs: [SpendCopy.title],
		})
	)

	push({
		id: "sources-card",
		title: SourcesCopy.title,
		description: SourcesCopy.body,
		tabId: "plays",
		badge: "Sources",
		meta: SourcesCopy.footer,
		extra: [SourcesCopy.downloadLabel, SourcesCopy.segmentToggle.labelB2B, SourcesCopy.segmentToggle.labelB2C],
	})

	push({
		id: "definitions-card",
		title: DefinitionsCopy.title,
		description: DefinitionsCopy.body,
		tabId: "reports-sql",
		badge: "Definition",
		meta: "Core definitions",
	})

	DefinitionsCopy.panels.forEach((panel) =>
		push({
			id: `definitions-panel-${panel.id}`,
			title: panel.title,
			description: panel.body,
			tabId: "reports-sql",
			badge: "Definition panel",
			extra: panel.columns ? [panel.columns.table, panel.columns.description, panel.columns.columns] : [],
			breadcrumbs: [DefinitionsCopy.title],
		})
	)

	DefinitionsCopy.tables.forEach((table) =>
		push({
			id: `definitions-table-${table.name}`,
			title: table.name,
			description: `${table.description} ${table.columns}`,
			tabId: "reports-sql",
			badge: "Table",
			meta: "Definitions",
			breadcrumbs: [DefinitionsCopy.title],
		})
	)

	push({
		id: "funnel-card",
		title: FunnelCopy.title,
		description: FunnelCopy.body,
		tabId: "reports-sql",
		badge: "Funnel",
		meta: FunnelCopy.notes.title,
	})

	FunnelCopy.panels.forEach((panel) =>
		push({
			id: `funnel-panel-${panel.id}`,
			title: panel.title,
			description: panel.body,
			tabId: "reports-sql",
			badge: "Funnel stage",
			extra: panel.note ? panel.note.items : [],
			breadcrumbs: [FunnelCopy.title],
		})
	)

	FunnelCopy.notes.bullets.forEach((note, idx) =>
		push({
			id: `funnel-note-${idx}`,
			title: FunnelCopy.notes.title,
			description: note,
			tabId: "reports-sql",
			badge: "Note",
			breadcrumbs: [FunnelCopy.title],
		})
	)

	push({
		id: "pg-card",
		title: PgCopy.title,
		description: PgCopy.body,
		tabId: "reports-sql",
		badge: "SQL",
		meta: PgCopy.labels.run_btn_ready,
	})

	push({
		id: "workspace-sheets",
		title: SheetsCopy.title,
		description: SheetsCopy.body,
		tabId: "reports-workspace",
		badge: "Workspace",
	})

	push({
		id: "workspace-slides",
		title: SlidesCopy.title,
		description: SlidesCopy.body,
		tabId: "reports-workspace",
		badge: "Workspace",
	})

	push({
		id: "workspace-example",
		title: ExampleCopy.title,
		description: ExampleCopy.body,
		tabId: "reports-workspace",
		badge: "Workspace",
	})

	ExampleCopy.panels.forEach((panel) =>
		push({
			id: `workspace-panel-${panel.id}`,
			title: panel.title,
			description: `${panel.subtitle} ${panel.bullets.join(" ")}`,
			tabId: "reports-workspace",
			badge: "Workspace panel",
			extra: panel.bullets,
		})
	)

	return entries
}

/* -------------------------------------------------------------------------- */
/* Export                                                                     */
/* -------------------------------------------------------------------------- */

let cached_catalog: Catalog | null = null
let cached_tabs: SearchEntry[] | null = null
let cached_frameworks: SearchEntry[] | null = null
let cached_terms: SearchEntry[] | null = null
let cached_metrics: SearchEntry[] | null = null
let cached_sources: SearchEntry[] | null = null
let cached_spend: SearchEntry[] | null = null
let cached_verticals: SearchEntry[] | null = null
let cached_utm_mediums: SearchEntry[] | null = null
let cached_utm_sources: SearchEntry[] | null = null
let cached_utm_placements: SearchEntry[] | null = null
let cached_copy: SearchEntry[] | null = null

export const buildCatalog = (): Catalog => {
	if (cached_catalog) return cached_catalog
	const tab_entries = cached_tabs ?? (cached_tabs = build_tab_entries())
	const framework_entries = cached_frameworks ?? (cached_frameworks = build_framework_entries())
	const term_entries = cached_terms ?? (cached_terms = build_term_entries())
	const metric_entries = cached_metrics ?? (cached_metrics = build_metric_entries())
	const source_entries = cached_sources ?? (cached_sources = build_source_entries())
	const spend_entries = cached_spend ?? (cached_spend = build_spend_entries())
	const vertical_entries = cached_verticals ?? (cached_verticals = build_vertical_entries())
	const utm_medium_entries = cached_utm_mediums ?? (cached_utm_mediums = build_utm_medium_entries())
	const utm_source_entries = cached_utm_sources ?? (cached_utm_sources = build_utm_source_entries())
	const utm_placement_entries = cached_utm_placements ?? (cached_utm_placements = build_utm_placement_entries())
	const copy_entries = cached_copy ?? (cached_copy = build_copy_entries())

	const entries = [
		...tab_entries,
		...framework_entries,
		...term_entries,
		...metric_entries,
		...source_entries,
		...spend_entries,
		...vertical_entries,
		...utm_medium_entries,
		...utm_source_entries,
		...utm_placement_entries,
		...copy_entries,
	]

	cached_catalog = {
		entries,
		tabs: tab_entries,
		frameworks: framework_entries,
		terms: term_entries,
		sources: source_entries,
		metrics: metric_entries,
		spend: spend_entries,
		verticals: vertical_entries,
		utmMediums: utm_medium_entries,
		utmSources: utm_source_entries,
		utmPlacements: utm_placement_entries,
		copy: copy_entries,
	}

	return cached_catalog
}





