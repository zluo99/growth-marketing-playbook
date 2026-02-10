import type { MetricId } from "@/features/playbook/definitions/metrics"

export type FunnelPanelId = `${number}`

export type FunnelPanel = {
	id: FunnelPanelId
	stage_n: 1 | 2 | 3 | 4 | 5
	title: string
	body: string
	common_metrics?: readonly MetricId[]
	note?: { title: string; items: readonly string[] }
}

export type FunnelCard = {
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
	body: "How marketing becomes `arr`.",
	icon: "route",
	labels: {
		commonMetrics: "Common metrics",
		stageLabel: "Stage {n}",
	},
	notes: {
		title: "Implementation notes",
		bullets: [
			"For every `object_id`, lock/stamp the `source` and `vendor` based on `utms` within the `attribution_model`.",
			"Align `spend_date` to cohorts (most commonly, `lead_created_date`) before computing unit economics (e.g. `roas`, `cac`).",
			"Support backfills and out-of-order events, and document backfill windows and overwrite rules in the `attribution_model`.",
		],
	},
	panels: [
		{
			id: "1",
			stage_n: 1,
			title: "Touchpoint",
			body: "Capture exposure and intent with an identity key that can join forward to `lead_id` and later `object_id`.\n\nUse this stage to explain engagement.",
			common_metrics: ["impressions", "reach", "clicks", "landing_pageviews", "pageviews", "unsubscribes"] as const,
		},
		{
			id: "2",
			stage_n: 2,
			title: "Lead",
			body: "First durable `object_type`. Stamp `source`, `vendor`, and `vertical` at creation so attribution stays stable downstream.\n\nTrack volume by cohort and watch mix shifts by `source`.",
			common_metrics: ["leads", "lead_created_date", "source", "vendor", "vertical"] as const,
		},
		{
			id: "3",
			stage_n: 3,
			title: "Opportunity",
			body: "Qualified pipeline anchored to some `object_id` (typically `lead_id`).\n\nOpportunity stage examples: qualify, discovery, evaluation, negotiation, closed won, closedlost.",
			common_metrics: ["opportunities", "opportunities_from_leads", "lead_to_opp_cvr", "cost_per_opportunity"] as const,
		},
		{
			id: "4",
			stage_n: 4,
			title: "Deal",
			body: "Closed Won/Lost deal tied to some `object_id` (typically `lead_id`). Keep financial metrics on the deal.",
			common_metrics: ["deals", "deals_from_leads", "opp_to_deal_cvr", "cost_per_deal", "sales_cycle_time"] as const,
		},
		{
			id: "5",
			stage_n: 5,
			title: "Revenue",
			body: "Finance-reconciled dollars tied back to the originating `object_id` and cohort so spend can be judged against results. \n\nWhen decisions are material or channels overlap, require `incrementality` proof.",
			common_metrics: ["arr", "arr_from_leads", "roas", "cac", "payback", "ltv", "incremental_lift"] as const,
		},
	],
} as const
