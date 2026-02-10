export type AnalysisPanelId = `${number}`

export type AnalysisPanel = {
	id: AnalysisPanelId
	title: string
	body: string
	bullets: readonly string[]
}

export type AnalysisCard = {
	title: string
	body: string
	panels: readonly AnalysisPanel[]
	footer: string
	ui: {
		analysisItemLabel: string
	}
}

export const AnalysisCopy: AnalysisCard = {
	title: "Journey analysis",
	body: "How we build `mta`: `object_model`, `touch_model`, then `object_touch_model` for analysis:",

	panels: [
		{
			id: "1",
			title: "Unify objects",
			body: "Build `object_model` first so identity and sourcing are stable.",
			bullets: [
				"Unify users, leads, accounts, opportunities, and rooftops into one journey-ready identity layer keyed by `prospect_id`.",
				"Map many `object_id` records to each `prospect_id` so `identity_graph` is stable before attribution.",
				"Standardize `source` from `utms`, lead source, and sales signals so channel definitions stay consistent.",
				"Create consistent first-touch and last-touch baselines with clear lineage for `qa`.",
			],
		},
		{
			id: "2",
			title: "Unify touches",
			body: "Build `touch_model` with one ordered touch schema across systems.",
			bullets: [
				"Normalize tasks, meetings, email events, and pageviews into one ordered stream of touches.",
				"Link each touch to the right entity, use one shared interaction taxonomy, and keep campaign/page context.",
				"Define `attribution_window` rules before scoring so each `attribution_model` uses the same eligible touches.",
			],
		},
		{
			id: "3",
			title: "Analyze from one model",
			body: "Use `object_touch_model` to compare methods without data drift.",
			bullets: [
				"Run first-touch, last-touch, decay, and `markov_model` on the same prospect-level `journey_path` values.",
				"Measure leverage with `markov_model` `removal_effect`, path frequency, and `touch_count` patterns at the `prospect_id` level.",
				"Slice by inbound/outbound mix, owner role, and `source_l2` to guide spend toward `arr` and `deals`.",
			],
		},
	],

	footer: "If `object_model` or `touch_model` is unstable, pause. Stable inputs are required before `mta` comparisons.",
	ui: {
		analysisItemLabel: "Analysis item {n}",
	},
} as const
