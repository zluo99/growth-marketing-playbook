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
	body: "Teams need a reliable way to connect spend to `arr` and `deals`, not debate attribution noise.",

	sections: [
		{
			id: "1",
			title: "Current state",
			icon: "alert",
			glow: "red",
			bullets: [
				"`sta` is simple, but it breaks across a real `sales_cycle` with many touches.",
				"Without governed `object_model` and `touch_model`, `source` and `utms` drift between reports.",
				"Without a `prospect_id`-anchored `identity_graph` linking `object_id` values, credit and budget decisions become opinion.",
			],
		},
		{
			id: "2",
			title: "Solution direction",
			icon: "rocket",
			glow: "green",
			bullets: [
				"Build unified `mta` in order: `object_model`, then `touch_model`, then `object_touch_model`.",
				"Standardize `source` and `utms` once so first-touch, last-touch, decay, and `markov_model` run on identical inputs.",
				"Use one journey base to rank leverage with `removal_effect` and reallocate toward `arr` and `deals`.",
			],
		},
	],
} as const
