import type { SpendId } from "@/features/playbook/definitions/spend"

type TenetsIcon = "scale" | "target" | "flask"

type TenetsPanelId = `${number}`

type TenetsPanel = {
	id: TenetsPanelId
	title: string
	body: string
	icon: TenetsIcon
	spend_ids?: readonly SpendId[]
}

type TenetsCard = {
	id: "tenets"
	title: string
	body: string
	panels: readonly TenetsPanel[]
}

export const TenetsCopy: TenetsCard = {
	id: "tenets",
	title: "Tenets",
	body: "Run Marketing and Finance on one scoreboard: governed `source`, `spend_type`, and core outcomes documented in the `ssot`.",

	panels: [
		{
			id: "1",
			title: "Shared governance",
			body: "Govern `source` and `spend_type` once so planning, reporting, and Finance read the same numbers.",
			icon: "scale",
		},
		{
			id: "2",
			title: "Two spend types, one strategy",
			body: "Treat `brand` as demand creation and `performance` as demand capture. Tag every play by `spend_type` so budget matches strategy.",
			icon: "flask",
		},
		{
			id: "3",
			title: "Optimize what pays back",
			body: "Lead with `north_star_metric` (`arr`, `deals`), then pressure-test `roas`, `cac`, `payback`, and `ltv`. If attribution is fuzzy, require `incrementality`.",
			icon: "target",
		},
	] as const,
} as const
