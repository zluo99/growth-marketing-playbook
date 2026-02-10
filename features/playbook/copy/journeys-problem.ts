export type ProblemPanelId = `${number}`

export type ProblemSectionIcon = "alert" | "rocket"
export type ProblemSectionGlow = "red" | "green"

export type ProblemSection = {
	id: ProblemPanelId
	title: string
	icon: ProblemSectionIcon
	glow?: ProblemSectionGlow
	bullets: readonly string[]
}

export type ProblemCard = {
	title: string
	body: string
	sections: readonly ProblemSection[]
}

export const ProblemCopy: ProblemCard = {
	title: "Problem statement",
	body: "Teams need a reliable way to move spend toward outcomes like `arr` and `deals`, not debate attribution noise.",

	sections: [
		{
			id: "1",
			title: "Current state",
			icon: "alert",
			glow: "red",
			bullets: [
				"`sta` is simple, but it breaks across a real `sales_cycle` with many interactions.",
				"Without a governed `object_model` and `touch_model`, `source` and `utms` drift between reports.",
				"Without one `prospect_id`-anchored `identity_graph` that links many `object_id` values, channel credit and budget decisions become opinion instead of evidence.",
			],
		},
		{
			id: "2",
			title: "Solution direction",
			icon: "rocket",
			glow: "green",
			bullets: [
				"Build a unified `mta` model: establish `object_model`, then `touch_model`, then join to `object_touch_model`.",
				"Standardize `source` and `utms` once so first-touch, last-touch, decay, and `markov_model` run on identical prospect-level inputs.",
				"Use the same journey base to rank leverage with `removal_effect` and reallocate spend toward `arr` and `deals`.",
			],
		},
	],
} as const
