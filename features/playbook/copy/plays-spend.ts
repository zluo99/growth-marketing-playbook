import type { SpendId } from "@/features/playbook/definitions/spend"

export type SpendBullet = { text: string }

export type SpendPillar = {
	id: SpendId
	title: string
	body: string
	bullets: readonly SpendBullet[]
}

export type SpendSection = {
	id: SpendId
	title: string
	body?: string
	bullets: readonly SpendBullet[]
}

export type SpendPanelId = `${number}`

export type SpendPanel = {
	id: SpendPanelId
	title: string
	body: string
	sections?: readonly SpendSection[]
}

export type SpendCard = {
	title: string
	pillars: readonly SpendPillar[]
	panels: readonly SpendPanel[]
	footer: string
	ui: {
		spendBarLabel: string
	}
}

const spend_overview_body =
	"`brand` creates demand. `performance` captures demand. Run both on one `arr` scoreboard."

export const SpendCopy: SpendCard = {
	title: "Spend Framework",
	pillars: [
		{
			id: "brand",
			title: "Demand creation",
			body: "Invest to shape demand and improve unit economics over time. Prove it with `incrementality`, not attribution credit.",
			bullets: [
				{ text: "Primary signals: `reach`, branded search, `cvr` trend" },
				{ text: "Proof: `geo_test`, `holdout`, `matchback`, `matched_markets`" },
				{ text: "Impact profile: delayed, then compounding" },
			],
		},
		{
			id: "performance",
			title: "Demand capture",
			body: "Capture in-market demand while protecting `cac` and `payback`.",
			bullets: [
				{ text: "Primary signals: `cac`, `roas`, `payback`" },
				{ text: "Proof: on/off tests, audience holdouts, mix shifts" },
				{ text: "Impact profile: fast, then saturating" },
			],
		},
	],
	panels: [
		{
			id: "1",
			title: "Overview",
			body: spend_overview_body,
		},
		{
			id: "2",
			title: "Strategy",
			body: "Allocate across `brand` and `performance`, then adjust to outcomes, constraints, and proof.",
			sections: [
				{
					id: "brand",
					title: "Brand",
					body: "Build durable demand that lowers future `cac` and lifts conversion.",
					bullets: [
						{ text: "Buy learning early: efficient signal (`cpm`, `cpc`) while testing concepts" },
						{ text: "Build memory: consistent positioning and proof across touchpoints" },
						{ text: "Make it decision-grade: ship `incremental_lift` in the readout" },
					],
				},
				{
					id: "performance",
					title: "Performance",
					body: "Scale capture without degrading conversion or Finance outcomes.",
					bullets: [
						{ text: "Keep `cac` and `payback` within Finance bounds. `roas` must clear threshold" },
						{ text: "`arr` and stage rates hold as spend scales (`lead_to_opp_cvr`, `opp_to_deal_cvr`)" },
						{ text: "Capacity keeps pace: routing, speed to lead, sales coverage" },
					],
				},
			],
		},
		{
			id: "3",
			title: "Measurement",
			body: "`brand` proves lift. `performance` runs on guardrails and needs time to stabilize.",
			sections: [
				{
					id: "brand",
					title: "Brand measurement",
					body: "Attribution is context, not proof.",
					bullets: [
						{ text: "Decision metric: `incremental_lift` tied to outcomes" },
						{ text: "Context: pathing and `mta` to explain demand movement" },
						{ text: "Learning loop: iterate on creative and audience, not just bids" },
					],
				},
				{
					id: "performance",
					title: "Performance measurement",
					bullets: [
						{ text: "Guardrails: `roas` clears threshold and `cac` reconciles to Finance" },
						{ text: "Avoid snap calls: require stable cohorts before declaring a winner" },
						{ text: "Reconcile first: spend, `arr`, and cohorts match the `ssot` before reallocating" },
					],
				},
			],
		},
		{
			id: "4",
			title: "Sources",
			body: "Use the `source` taxonomy to sanity check channel roles and map them to `spend_type`. If a cut cannot reconcile to the `semantic_model`, treat it as directional.",
		},
	],
	footer: "Rule: plan with `brand` and `performance`, prove with `incrementality`, and reconcile every decision to Finance on one `semantic_model` with shared `source` and `spend_type`.",
	ui: {
		spendBarLabel: "Choose spend section",
	},
} as const
