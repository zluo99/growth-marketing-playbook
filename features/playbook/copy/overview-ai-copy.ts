type OverviewAIStageId = `${number}`

type OverviewAIStage = {
	id: OverviewAIStageId
	title: string
	body: string
	bullets: readonly string[]
}

type AnalystModuleId =
	| "semantic_kpi_contract"
	| "table_contract"
	| "source_taxonomy"
	| "sql_reference"

type AnalystModule = {
	id: AnalystModuleId
	title: string
	description: string
	defaultEnabled: boolean
	recommendedWhen?: string
}

type OverviewAICard = {
	id: "ai-analyst"
	title: string
	body: string
	panels: readonly OverviewAIStage[]
	analystModules: readonly AnalystModule[]
	footer: string
	ui: {
		stepLabel: string
		openAnalystButtonLabel: string
		openAnalystButtonAria: string
		overlayTitle: string
		overlayCloseAria: string
		overlayCopyButtonLabel: string
		overlayCopyButtonLabelCopied: string
		overlayCopyButtonAria: string
		overlayCopyButtonAriaCopied: string
		overlayModulesLabel: string
		overlayModulesHelp: string
		overlayModuleToggleAria: string
	}
}

const overview_ai_analyst_modules = [
	{
		id: "semantic_kpi_contract",
		title: "Semantic and KPI contract",
		description: "Authoritative field semantics, KPI formulas, availability rules, and enforcement policy.",
		defaultEnabled: true,
	},
	{
		id: "table_contract",
		title: "Table contract",
		description: "Table grain and anchors plus CSV classification, validation checks, join rules, and stop conditions.",
		defaultEnabled: true,
	},
	{
		id: "source_taxonomy",
		title: "Source taxonomy",
		description: "Canonical source hierarchy and spend-type mapping for consistent channel rollups.",
		defaultEnabled: true,
		recommendedWhen: "Enable whenever uploaded CSVs include `source_l1`, `source_l2`, or `source_l3`.",
	},
	{
		id: "sql_reference",
		title: "SQL reference",
		description: "Optional SQL scaffolds for reproducible transformation and analysis structure.",
		defaultEnabled: false,
		recommendedWhen: "Enable only when the model must reason through transformation logic or produce SQL-like aggregation steps.",
	},
] as const satisfies readonly AnalystModule[]

const overview_ai_portable_bundle = overview_ai_analyst_modules
	.filter((module) => module.defaultEnabled)
	.map((module) => module.title)
	.join(", ")

const overview_ai_sql_module_title = overview_ai_analyst_modules.find((module) => module.id === "sql_reference")?.title ?? "SQL reference"
const overview_ai_modules_help = `Use the portable CSV bundle by default: ${overview_ai_portable_bundle}. Enable ${overview_ai_sql_module_title} only for transformation scaffolds.`

export const OverviewAICopy: OverviewAICard = {
	id: "ai-analyst",
	title: "AI analyst setup",
	body: "AI works after the operating system works: stable foundations, a governed `semantic_model`, and a self-contained `analyst.md` contract that can travel with modeled CSVs.",

	panels: [
		{
			id: "1",
			title: "Stabilize the foundation",
			body: "Do not use AI to paper over governance or reconciliation gaps.",
			bullets: [
				"Confirm `ssot` reconciliation, ownership, and `qa` before using AI outputs for decisions.",
				"If those checks fail, return a blocker list instead of directional analysis.",
			],
		},
		{
			id: "2",
			title: "Enforce the `semantic_model`",
			body: "AI needs governed business meaning, not ad hoc SQL columns.",
			bullets: [
				"Define canonical metrics, dimensions, `source` taxonomy, and `spend_type` in one `semantic_model`.",
				"Require AI outputs to reconcile to Finance and mark non-modeled results as directional.",
			],
		},
		{
			id: "3",
			title: "Run `analyst.md` as governance",
			body: "Treat `analyst.md` as a versioned operating contract.",
			bullets: [
				overview_ai_modules_help,
				"Update modules when definitions or models change, and keep ownership explicit.",
			],
		},
	],

	analystModules: overview_ai_analyst_modules,

	footer: "Strong AI analysis starts with a strong system: governance, a trusted `semantic_model`, and `ssot`-reconciled data.",
	ui: {
		stepLabel: "Step {n}",
		openAnalystButtonLabel: "Open analyst.md",
		openAnalystButtonAria: "Open analyst markdown panel",
		overlayTitle: "analyst.md",
		overlayCloseAria: "Close analyst markdown panel",
		overlayCopyButtonLabel: "Copy",
		overlayCopyButtonLabelCopied: "Copied",
		overlayCopyButtonAria: "Copy analyst markdown",
		overlayCopyButtonAriaCopied: "Copied analyst markdown",
		overlayModulesLabel: "Context modules",
		overlayModulesHelp: overview_ai_modules_help,
		overlayModuleToggleAria: "Toggle module: {title}",
	},
} as const
