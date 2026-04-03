/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

export type SearchTargetId = string

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

export const SearchTargets = {
	overview: {
		tenetsCard: "tenets-card",
		guideCard: "guide-card",
		aiAnalystCard: "ai-analyst-card",
	},
	journeys: {
		problemCard: "problem-card",
		analysisCard: "analysis-card",
		analysisStep1: "analysis-step-1",
		analysisStep2: "analysis-step-2",
		analysisStep3: "analysis-step-3",
	},
	plays: {
		spendCard: "spend-card",
		sourcesCard: "sources-card",
	},
	reportsSql: {
		funnelCard: "funnel-card",
		definitionsCard: "definitions-card",
		pgCard: "pg-card",
	},
	reportsWorkspace: {
		exampleCard: "workspace-example",
	},
} as const

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export const search_target_for_framework = (framework_id: string): SearchTargetId => `framework:${framework_id}`

export const search_target_for_source = (source_l3: string): SearchTargetId => `source:${source_l3}`
