export type AnalysisPanelId = `${number}`

export type AnalysisPanel = {
	id: AnalysisPanelId
	title: string
	body: string
	bullets: readonly string[]
}

export type AnalysisDiagram = {
	title: string
	body: string
	prospect_id: string
	objects: readonly {
		object_id: string
		object_type: string
	}[]
	touches: readonly {
		touch_id: string
		object_id: string
		touch_type: string
	}[]
}

export type AnalysisCard = {
	title: string
	body: string
	panels: readonly AnalysisPanel[]
	diagram: AnalysisDiagram
	footer: string
	ui: {
		analysisItemLabel: string
	}
}

export const AnalysisCopy: AnalysisCard = {
	title: "Journey analysis",
	body: "Build `mta` in sequence: stabilize `object_model`, stabilize `touch_model`, then analyze one `object_touch_model` base.",

	panels: [
		{
			id: "1",
			title: "Unify objects",
			body: "Set one identity layer first.",
			bullets: [
				"Anchor the `identity_graph` on `prospect_id`, then map one-to-many `object_id` records (lead, opportunity, deal).",
				"Standardize `source` and `utms` once in `object_model` so downstream cuts stay consistent.",
			],
		},
		{
			id: "2",
			title: "Unify touches",
			body: "Build one ordered touch stream.",
			bullets: [
				"Normalize tasks, meetings, emails, and pageviews into one `touch_model` keyed by `touch_id`.",
				"Map each `touch_id` to one `object_id`, then inherit `prospect_id` through the object relationship.",
			],
		},
		{
			id: "3",
			title: "Analyze from one model",
			body: "Compare models without drift.",
			bullets: [
				"Run first-touch, last-touch, decay, and `markov_model` from the same `object_touch_model` base.",
				"Rank leverage with `removal_effect`, path frequency, and conversion by `touch_count`.",
			],
		},
	],

	diagram: {
		title: "Object-touch diagram",
		body: "One `prospect_id` maps to many `object_id` values, and each `touch_id` maps to one `object_id`.",
		prospect_id: "deal-044",
		objects: [
			{ object_id: "L-991", object_type: "lead" },
			{ object_id: "O-203", object_type: "opportunity" },
			{ object_id: "D-044", object_type: "deal" },
		],
		touches: [
			{ touch_id: "touch-formsubmit-100", object_id: "L-991", touch_type: "form_submit" },
			{ touch_id: "touch-meeting-245", object_id: "L-991", touch_type: "meeting" },
			{ touch_id: "touch-emailreply-389", object_id: "O-203", touch_type: "email_reply" },
		],
	},

	footer: "If `object_model` or `touch_model` is unstable, pause. Stable inputs are required before `mta` comparisons.",
	ui: {
		analysisItemLabel: "Step {n}",
	},
} as const
