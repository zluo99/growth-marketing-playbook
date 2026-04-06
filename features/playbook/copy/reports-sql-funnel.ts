import type { MetricId } from "@/features/playbook/definitions/metrics"

type FunnelPanelId = `${number}`

type FunnelPanel = {
	id: FunnelPanelId
	title: string
	body: string
	common_metrics?: readonly MetricId[]
	note?: { title: string; items: readonly string[] }
}

type FunnelCard = {
	title: string
	body: string
	icon: "route"
	panels: readonly FunnelPanel[]
	notes: { title: string; bullets: readonly string[] }
	labels: {
		commonMetrics: string
		stageLabel: string
	}
}

export const FunnelCopy: FunnelCard = {
	title: "Typical funnel",
	body: "How demand turns into `arr`.",
	icon: "route",
	labels: {
		commonMetrics: "Common metrics",
		stageLabel: "Stage {n}",
	},
	notes: {
		title: "Implementation notes",
		bullets: [
			"For each `object_id`, stamp `source` and `vendor` from `utms` inside the `attribution_model`.",
			"Align `spend_date` to the cohort anchor, usually `lead_created_date`, before judging `roas` or `cac`.",
			"Support backfills and out-of-order events. Document windows and overwrite rules in the `attribution_model`.",
		],
	},
	panels: [
		{
			id: "1",
			title: "Touchpoint",
			body: "Capture exposure and intent with an identity key that can later join to `lead_id` and `object_id`.\n\nUse this stage to explain engagement before conversion.",
			common_metrics: ["impressions", "reach", "clicks", "landing_pageviews", "pageviews", "unsubscribes"] as const,
		},
		{
			id: "2",
			title: "Lead",
			body: "First durable `object_type`. Stamp `source`, `vendor`, and `vertical` at creation so attribution stays stable.\n\nTrack cohort volume and watch mix shift by `source`.",
			common_metrics: ["leads", "lead_created_date", "source", "vendor", "vertical"] as const,
		},
		{
			id: "3",
			title: "Opportunity",
			body: "Qualified pipeline anchored to an `object_id`, usually `lead_id`.\n\nTypical stages: qualify, discovery, evaluation, negotiation, closed won, closed lost.",
			common_metrics: ["opportunities", "opportunities_from_leads", "lead_to_opp_cvr", "cost_per_opportunity"] as const,
		},
		{
			id: "4",
			title: "Deal",
			body: "Closed-won or lost outcome tied to an `object_id`, usually `lead_id`. Keep financial metrics on the deal.",
			common_metrics: ["deals", "deals_from_leads", "opp_to_deal_cvr", "cost_per_deal", "sales_cycle_time"] as const,
		},
		{
			id: "5",
			title: "Revenue",
			body: "Finance-reconciled dollars tied to the originating `object_id` and cohort so spend can be judged against results.\n\nFor material decisions or overlapping channels, require `incrementality` proof.",
			common_metrics: ["arr", "arr_from_leads", "roas", "cac", "payback", "ltv", "incremental_lift_arr"] as const,
		},
	],
} as const
