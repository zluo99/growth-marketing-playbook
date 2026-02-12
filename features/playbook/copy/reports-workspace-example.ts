export type ExamplePanelId = `${number}`

export type ExamplePanel = {
	id: ExamplePanelId
	title: string
	subtitle: string
	bullets: readonly string[]
}

export type ExampleCopy = {
	title: string
	body: string
	panels: readonly ExamplePanel[]
	ui: {
		exampleItemLabel: string
	}
}

export const ExampleCopy: ExampleCopy = {
	title: "Example Report: Direct Mail",
	body: "Connect sends to `arr`, then validate lift with `incremental_lift_arr`. Example layout for decision-ready reporting:",
	ui: {
		exampleItemLabel: "Workspace example item {n}",
	},
	panels: [
		{
			id: "1",
			title: "Funnel impact",
			subtitle: "Show the funnel as number tiles.",
			bullets: [
				"Trend `mail_sends`.",
				"Overlay cohort outcomes: `leads`, `deals_from_leads`, `arr_from_leads`.",
				"Layer conversion rates: `lead_to_opp_cvr`, `opp_to_deal_cvr`, `cvr`.",
			],
		},
		{
			id: "2",
			title: "Financial impact",
			subtitle: "Drill down for context.",
			bullets: [
				"Efficiency: `total_spend`, `roas`, `cost_per_deal`, `cac`, `payback`.",
				"Health: `opportunities`, `sales_cycle_time`.",
			],
		},
		{
			id: "3",
			title: "Lift analysis",
			subtitle: "Counterfactual matters.",
			bullets: [
				"Use a `control_group`.",
				"Report `incrementality`, not attribution.",
				"Expect lag from `mail_sends` to `arr`.",
			],
		},
	],
} as const

