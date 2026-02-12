import type { TabId } from "../definitions/tabs"

export type GuideSequenceId = Extract<TabId, "reports-sql" | "reports-workspace" | "journeys" | "plays">

export type GuidePanelId = `${number}`

export type GuidePanel = {
	id: GuidePanelId
	title: string
	body: string
	sequence?: readonly GuideSequenceId[]
}

export type GuideCard = {
	title: string
	body: string
	panels: readonly GuidePanel[]
}

export const GuideCopy: GuideCard = {
	title: "Execution guide",
	body: "Start with measurement, then scale plays.",

	panels: [
		{
			id: "1",
			title: "Recommended sequence",
			body: "Build in order so each step has clean inputs.",
			sequence: [
				"reports-sql",
				"reports-workspace",
				"journeys",
				"plays",
			],
		},
		{
			id: "2",
			title: "Decision cadence",
			body: "Reporting is definitions, trends, and reconciliation. Decisions are explicit moves with thresholds, windows, and owners. If you cannot state the move in one sentence with `arr`, `roas`, and `cac`, it is not decision-ready.",
		},
	],

} as const
