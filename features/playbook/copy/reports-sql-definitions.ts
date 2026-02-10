import type { MetricId } from "@/features/playbook/definitions/metrics"

export type DefinitionsPanelId = `${number}`

export type DefinitionsPanel = {
	id: DefinitionsPanelId
	title: string
	body: string
	bullets?: readonly string[]
	columns?: { table: string; description: string; columns: string }
}

export type DefinitionsTable = { name: string; description: string; columns: string }

export type DefinitionsCard = {
	title: string
	body: string
	icon: "sparkles"
	panels: readonly DefinitionsPanel[]
	tables: readonly DefinitionsTable[]
	dimensions: readonly MetricId[]
	measures: readonly MetricId[]
}

export const DefinitionsCopy: DefinitionsCard = {
	title: "Core definitions",
	body: "Align on definitions with Finance, publish them to the `semantic_model`, and bake them into the `attribution_model`.",
	icon: "sparkles",
	panels: [
		{
			id: "1",
			title: "Attributes to standardize",
			body: "Treat attributes/dimensions as governance, not preference. If these drift, every metric turns into a reconciliation exercise.",
		},
		{
			id: "2",
			title: "Typical measures",
			body: "Measures capture what happened (i.e. outcomes, unit economics, efficiency).",
		},
		{
			id: "3",
			title: "Available tables",
			body: "If you're lucky, attributes and measures are already established in your data warehouse in clean tables. These are the typical ones to look for:",
			columns: {
				table: "Table",
				description: "Description",
				columns: "Columns",
			},
		},
	],
	tables: [
		{
			name: "funnel_cohorted",
			description: "Cohorted funnel outcomes anchored to lead creation (Lead -> Opportunity -> Deal) plus `arr` from those leads.",
			columns: "lead_id, lead_created_date, source_l1, source_l2, source_l3, vendor, vertical, opportunities_from_leads, deals_from_leads, arr_from_leads, ltv_from_leads",
		},
		{
			name: "funnel_uncohorted",
			description: "Object-level funnel events (Lead -> Opportunity -> Deal). `arr` lives on Deal records only.",
			columns: "object_id, object_type, object_created_date, source_l1, source_l2, source_l3, vendor, vertical, arr",
		},
		{
			name: "funnel_spend",
			description: "Marketing spend at the date level, classified by `spend_type`, `source`, and `vendor`.",
			columns: "spend_date, spend_type, source_l1, source_l2, source_l3, vendor, spend",
		},
	],
	dimensions: [
		"object_id",
		"object_type",
		"object_created_date",
		"lead_created_date",
		"source_l1",
		"source_l2",
		"source_l3",
		"vendor",
		"vertical",
	],
	measures: ["leads", "opportunities", "deals", "arr", "roas", "cost_per_lead", "cost_per_opportunity", "cost_per_deal"],
} as const

