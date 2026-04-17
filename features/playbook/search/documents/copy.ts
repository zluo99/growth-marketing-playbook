/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import { AnalysisCopy } from "@/features/playbook/copy/journeys-analysis"
import { ProblemCopy } from "@/features/playbook/copy/journeys-problem"
import { FrameworkDefinitions, FrameworkInfoCopy, type Framework } from "@/features/playbook/copy/frameworks"
import { GuideCopy } from "@/features/playbook/copy/overview-guide"
import { OverviewAICopy } from "@/features/playbook/copy/overview-ai-copy"
import { TenetsCopy } from "@/features/playbook/copy/overview-tenets"
import { SourcesCopy } from "@/features/playbook/copy/plays-sources"
import { SpendCopy } from "@/features/playbook/copy/plays-spend"
import { DefinitionsCopy } from "@/features/playbook/copy/reports-sql-definitions"
import { FunnelCopy } from "@/features/playbook/copy/reports-sql-funnel"
import { PgCopy, PgPresets } from "@/features/playbook/copy/reports-sql-pg"
import { ExampleCopy } from "@/features/playbook/copy/reports-workspace-example"
import { SheetsCopy, SlidesCopy } from "@/features/playbook/copy/reports-workspace-google"
import { DbtFileDefinitions, build_dbt_file_content } from "@/features/playbook/copy/overview-ai-md"
import { TabById } from "@/features/playbook/definitions/tabs"
import type { CopyEntryInput, SearchEntryInput } from "@/features/playbook/search/schema"
import { SearchTargets, search_target_for_framework } from "@/features/playbook/search/targets"

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const framework_info_words = (framework_id: string) =>
	Object.entries(FrameworkInfoCopy)
		.filter(([key]) => key.startsWith(`framework:${framework_id}:`))
		.map(([, value]) => value)

const compact_strings = (values: readonly (string | undefined)[]) => values.filter((value): value is string => Boolean(value))

const build_framework_document = (framework: Framework): SearchEntryInput => {
	const pillar_words = framework.pillars.flatMap((pillar) => [pillar.name, ...pillar.items])
	return {
		id: `framework:${framework.id}`,
		title: framework.alias,
		description: framework.description,
		displayDescription: framework.description,
		category: "framework",
		tabId: "frameworks",
		badge: framework.type,
		meta: framework.id,
		scrollTarget: search_target_for_framework(framework.id),
		searchableParts: [...pillar_words, ...framework_info_words(framework.id)],
		searchChunks: [...pillar_words, ...framework_info_words(framework.id)],
		keywords: [framework.id, framework.alias, framework.type, ...framework.pillars.map((pillar) => pillar.name)],
		priority: 30,
	}
}

/* -------------------------------------------------------------------------- */
/* Framework documents                                                        */
/* -------------------------------------------------------------------------- */

export const FrameworkSearchDocuments = Object.freeze(FrameworkDefinitions.map(build_framework_document))

/* -------------------------------------------------------------------------- */
/* Copy documents                                                             */
/* -------------------------------------------------------------------------- */

const copy_documents: CopyEntryInput[] = []
const dbt_file_samples = DbtFileDefinitions.map((file) => ({
	...file,
	content: build_dbt_file_content(file.id),
}))

const push = (entry: CopyEntryInput) => {
	copy_documents.push(entry)
}

push({
	id: "tenets-card",
	title: TenetsCopy.title,
	description: TenetsCopy.body,
	tabId: "overview",
	badge: "Tenets",
	meta: TabById.overview.alias,
	scrollTarget: SearchTargets.overview.tenetsCard,
	keywords: ["overview", "tenets", "governance"],
	priority: 20,
})

TenetsCopy.panels.forEach((panel) =>
	push({
		id: `tenets-panel-${panel.id}`,
		title: panel.title,
		description: panel.body,
		tabId: "overview",
		badge: "Tenet",
		meta: TenetsCopy.title,
		scrollTarget: SearchTargets.overview.tenetsCard,
		breadcrumbs: [TenetsCopy.title],
	})
)

push({
	id: "guide-card",
	title: GuideCopy.title,
	description: GuideCopy.body,
	tabId: "overview",
	badge: "Guide",
	meta: TabById.overview.alias,
	scrollTarget: SearchTargets.overview.guideCard,
	extra: GuideCopy.panels.flatMap((panel) => [panel.title, panel.body]),
	searchExtras: GuideCopy.panels.flatMap((panel) => panel.sequence?.flatMap((tab_id) => [tab_id, TabById[tab_id].alias]) ?? []),
	keywords: ["overview", "flow", "sequence"],
	priority: 20,
})

GuideCopy.panels.forEach((panel) =>
	push({
		id: `guide-panel-${panel.id}`,
		title: panel.title,
		description: panel.body,
		tabId: "overview",
		badge: "Guide",
		meta: GuideCopy.title,
		scrollTarget: SearchTargets.overview.guideCard,
		searchExtras: panel.sequence?.flatMap((tab_id) => [tab_id, TabById[tab_id].alias]) ?? [],
		breadcrumbs: [GuideCopy.title],
	})
)

push({
	id: "ai-analyst-card",
	title: OverviewAICopy.title,
	description: OverviewAICopy.body,
	tabId: "overview",
	badge: "AI Analyst",
	meta: "AI setup",
	scrollTarget: SearchTargets.overview.aiAnalystCard,
	keywords: ["overview", "ai", "analyst", "dbt", "skill.md", "docs.md", "models.yml", "metrics", "semantic layer"],
	priority: 20,
})

OverviewAICopy.panels.forEach((panel) =>
	push({
		id: `ai-analyst-panel-${panel.id}`,
		title: panel.title,
		description: panel.body,
		tabId: "overview",
		badge: "AI Analyst panel",
		meta: OverviewAICopy.title,
		scrollTarget: SearchTargets.overview.aiAnalystCard,
		extra: panel.bullets,
		breadcrumbs: [OverviewAICopy.title],
	})
)

dbt_file_samples.forEach((file) =>
	push({
		id: `ai-dbt-file-${file.id}`,
		title: file.fileName,
		description: file.description,
		tabId: "overview",
		badge: "dbt file",
		meta: OverviewAICopy.title,
		scrollTarget: SearchTargets.overview.aiAnalystCard,
		extra: [file.content],
		breadcrumbs: [OverviewAICopy.title],
	})
)

push({
	id: "problem-card",
	title: ProblemCopy.title,
	description: ProblemCopy.body,
	tabId: "journeys",
	badge: "Problem",
	meta: TabById.journeys.alias,
	scrollTarget: SearchTargets.journeys.problemCard,
})

ProblemCopy.sections.forEach((section) =>
	push({
		id: `problem-section-${section.id}`,
		title: section.title,
		description: section.bullets.join(" "),
		tabId: "journeys",
		badge: "Problem section",
		meta: ProblemCopy.title,
		scrollTarget: SearchTargets.journeys.problemCard,
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
	scrollTarget: SearchTargets.journeys.analysisCard,
	searchExtras: AnalysisCopy.panels.map((panel) => panel.title),
	keywords: ["journeys", "analysis", "mta"],
})

AnalysisCopy.panels.forEach((panel) =>
	push({
		id: `analysis-panel-${panel.id}`,
		title: panel.title,
		description: panel.body,
		tabId: "journeys",
		badge: "Analysis panel",
		meta: AnalysisCopy.title,
		scrollTarget: SearchTargets.journeys.analysisCard,
		extra: panel.bullets,
		breadcrumbs: [AnalysisCopy.title],
	})
)

SpendCopy.pillars.forEach((pillar) =>
	push({
		id: `spend-pillar-${pillar.id}`,
		title: pillar.title,
		description: pillar.body,
		tabId: "plays",
		badge: "Spend pillar",
		meta: SpendCopy.title,
		scrollTarget: SearchTargets.plays.spendCard,
		extra: pillar.bullets.map((bullet) => bullet.text),
		breadcrumbs: [SpendCopy.title],
		keywords: [pillar.id, pillar.title],
		priority: 35,
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
		scrollTarget: SearchTargets.plays.spendCard,
		extra: compact_strings([
			...(panel.sections?.flatMap((section) => [section.title, section.body, ...section.bullets.map((bullet) => bullet.text)]) ?? []),
			...(panel.id === "1" ? SpendCopy.pillars.flatMap((pillar) => [pillar.title, pillar.body, ...pillar.bullets.map((bullet) => bullet.text)]) : []),
		]),
		breadcrumbs: [SpendCopy.title],
		keywords: [panel.title, "spend"],
		priority: 35,
	})
)

push({
	id: "sources-card",
	title: SourcesCopy.title,
	description: SourcesCopy.body,
	tabId: "plays",
	badge: "Sources",
	meta: TabById.plays.alias,
	scrollTarget: SearchTargets.plays.sourcesCard,
	extra: [SourcesCopy.downloadLabel],
	keywords: ["plays", "sources", "taxonomy", "utm"],
})

push({
	id: "definitions-card",
	title: DefinitionsCopy.title,
	description: DefinitionsCopy.body,
	tabId: "reports-sql",
	badge: "Definition",
	meta: "Core definitions",
	scrollTarget: SearchTargets.reportsSql.definitionsCard,
	keywords: ["sql", "definitions", "semantic model"],
})

DefinitionsCopy.panels.forEach((panel) =>
	push({
		id: `definitions-panel-${panel.id}`,
		title: panel.title,
		description: panel.body,
		tabId: "reports-sql",
		badge: "Definition panel",
		scrollTarget: SearchTargets.reportsSql.definitionsCard,
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
		meta: DefinitionsCopy.title,
		scrollTarget: SearchTargets.reportsSql.definitionsCard,
		extra: compact_strings([table.grain, ...(table.signatureColumns ?? [])]),
		breadcrumbs: [DefinitionsCopy.title],
		keywords: [table.name],
	})
)

push({
	id: "funnel-card",
	title: FunnelCopy.title,
	description: FunnelCopy.body,
	tabId: "reports-sql",
	badge: "Funnel",
	meta: FunnelCopy.notes.title,
	scrollTarget: SearchTargets.reportsSql.funnelCard,
	keywords: ["sql", "funnel", "staging models"],
})

FunnelCopy.panels.forEach((panel) =>
	push({
		id: `funnel-panel-${panel.id}`,
		title: panel.title,
		description: panel.body,
		tabId: "reports-sql",
		badge: "Funnel stage",
		scrollTarget: SearchTargets.reportsSql.funnelCard,
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
		scrollTarget: SearchTargets.reportsSql.funnelCard,
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
	scrollTarget: SearchTargets.reportsSql.pgCard,
	extra: [PgCopy.labels.editor_title, PgCopy.labels.editor_help, PgCopy.labels.viewer_title, PgCopy.labels.viewer_help],
	keywords: ["sql", "playground", "query"],
})

PgPresets.forEach((preset) =>
	push({
		id: `pg-preset-${preset.id}`,
		title: preset.id,
		description: preset.description,
		tabId: "reports-sql",
		badge: "SQL preset",
		meta: PgCopy.title,
		scrollTarget: SearchTargets.reportsSql.pgCard,
		searchExtras: [preset.code],
		breadcrumbs: [PgCopy.title],
		keywords: [preset.id, "sql preset"],
		priority: 45,
	})
)

push({
	id: "workspace-sheets",
	title: SheetsCopy.title,
	description: SheetsCopy.body,
	tabId: "reports-workspace",
	badge: "Workspace",
	keywords: ["sheets", "reporting", "workspace"],
})

push({
	id: "workspace-slides",
	title: SlidesCopy.title,
	description: SlidesCopy.body,
	tabId: "reports-workspace",
	badge: "Workspace",
	keywords: ["slides", "deck", "presentation", "workspace"],
})

push({
	id: "workspace-example",
	title: ExampleCopy.title,
	description: ExampleCopy.body,
	tabId: "reports-workspace",
	badge: "Workspace",
	scrollTarget: SearchTargets.reportsWorkspace.exampleCard,
	keywords: ["workspace", "example", "direct mail"],
})

ExampleCopy.panels.forEach((panel) =>
	push({
		id: `workspace-panel-${panel.id}`,
		title: panel.title,
		description: `${panel.subtitle} ${panel.bullets.join(" ")}`,
		tabId: "reports-workspace",
		badge: "Workspace panel",
		scrollTarget: SearchTargets.reportsWorkspace.exampleCard,
		extra: panel.bullets,
		breadcrumbs: [ExampleCopy.title],
	})
)

export const CopySearchDocuments = Object.freeze(copy_documents)
