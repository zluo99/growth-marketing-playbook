import type { MetricId } from "@/features/playbook/definitions/metrics"

export type DefinitionsPanelId = `${number}`

export type DefinitionsPanel = {
	id: DefinitionsPanelId
	title: string
	body: string
	bullets?: readonly string[]
	columns?: { table: string; description: string; columns: string }
}

export type DefinitionsTable = {
	name: string
	description: string
	columns: string
	grain?: string
	signatureColumns?: readonly string[]
}

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
	body: "Align with Finance, publish to the `semantic_model`, and wire into the `attribution_model`.",
	icon: "sparkles",
	panels: [
		{
			id: "1",
			title: "Attributes to standardize",
			body: "Treat attributes as governance, not preference. Drift turns every metric into reconciliation.",
		},
		{
			id: "2",
			title: "Typical measures",
			body: "Measures capture outcomes, unit economics, and efficiency.",
		},
		{
			id: "3",
			title: "Available tables",
			body: "If you are lucky, these tables already exist. Start here:",
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
			description: "Cohorted outcomes anchored to lead creation (Lead -> Opportunity -> Deal) plus `arr` from those leads.",
			columns: "lead_id, lead_created_date, source_l1, source_l2, source_l3, vendor, vertical, opportunities_from_leads, deals_from_leads, arr_from_leads, ltv_from_leads",
			grain: "One row per lead cohort entity anchored at `lead_created_date`.",
			signatureColumns: ["lead_id", "lead_created_date", "opportunities_from_leads", "deals_from_leads", "arr_from_leads"] as const,
		},
		{
			name: "funnel_uncohorted",
			description: "Object-level funnel events (Lead -> Opportunity -> Deal). `arr` lives on Deal records.",
			columns: "object_id, object_type, object_created_date, source_l1, source_l2, source_l3, vendor, vertical, arr",
			grain: "One row per CRM object event (`object_id`, `object_type`) by creation date.",
			signatureColumns: ["object_id", "object_type", "object_created_date", "source_l1", "source_l2"] as const,
		},
		{
			name: "funnel_spend",
			description: "Marketing spend by date, classified by `spend_type`, `source`, and `vendor`.",
			columns: "spend_date, spend_type, source_l1, source_l2, source_l3, vendor, spend",
			grain: "One row per spend posting event by `spend_date` and classification dimensions.",
			signatureColumns: ["spend_date", "spend_type", "source_l1", "source_l2", "source_l3"] as const,
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

