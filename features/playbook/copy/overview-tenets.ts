import type { SpendId } from "@/features/playbook/definitions/spend"

export type TenetsIcon = "scale" | "target" | "flask"

export type TenetsPanelId = `${number}`

export type TenetsPanel = {
	id: TenetsPanelId
	title: string
	body: string
	icon: TenetsIcon
	spend_ids?: readonly SpendId[]
}

export type TenetsCard = {
	id: "tenets"
	title: string
	body: string
	footer: string
	panels: readonly TenetsPanel[]
}

export const TenetsCopy: TenetsCard = {
	id: "tenets",
	title: "Tenets",
	body: "Marketing must partner closely with Finance to drive sustainable and measureable growth. These tenets ensure every decision is anchored in a shared `semantic_model` and a `ssot`.",

	panels: [
		{
			id: "1",
			title: "Shared governance",
			body: "Ensure that every `source` and `spend_type` is a contract that is encoded in the `semantic_model`. This ensures planning, reporting, and Finance share the same spine.",
			icon: "scale",
		},
		{
			id: "2",
			title: "Two spend types, one strategy",
			body: "`brand` builds future demand and `performance` harvests it, and plays can fit into both. Always classify the `spend_type` of plays to keep planning rooted in strategy and impact instead of definitions.",
			icon: "flask",
		},
		{
			id: "3",
			title: "Optimize what pays back",
			body:
				"Lead with your `north_star_metric` (`arr`, `deals`), then unit economics (`roas`,`cac`, `payback`, `ltv`). Keep potential bottlenecks in mind when optimizing spend. When directly attributable impact is fuzzy, require `incrementality`.",
			icon: "target",
		},

	] as const,

	footer:
		"Rule: if a number cannot reconcile with the `ssot`, treat it as directional. Decision-grade calls require reconciliation and, when needed, `incrementality` proof.",
} as const
