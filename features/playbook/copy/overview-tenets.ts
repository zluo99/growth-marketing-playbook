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
	body: "Marketing and Finance use one scoreboard. Govern `source`, `spend_type`, and core outcomes in the `semantic_model`, then reconcile to the `ssot`.",

	panels: [
		{
			id: "1",
			title: "Shared governance",
			body: "Every `source` and `spend_type` is governed in the `semantic_model`. Planning, reporting, and Finance all read from the same spine.",
			icon: "scale",
		},
		{
			id: "2",
			title: "Two spend types, one strategy",
			body: "`brand` creates demand and `performance` captures it. Classify every play by `spend_type` so budget follows strategy.",
			icon: "flask",
		},
		{
			id: "3",
			title: "Optimize what pays back",
			body:
				"Lead with your `north_star_metric` (`arr`, `deals`), then pressure-test unit economics (`roas`, `cac`, `payback`, `ltv`). Watch bottlenecks. When attribution is fuzzy, require `incrementality`.",
			icon: "target",
		},

	] as const,

	footer:
		"Rule: if a number cannot reconcile to the `ssot`, treat it as directional. Decision-grade calls require reconciliation and, when needed, `incrementality` proof.",
} as const
