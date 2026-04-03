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
	title: "Execution flow",
	body: "Move in order so each step inherits governed inputs.",

	panels: [
		{
			id: "1",
			title: "Recommended sequence",
			body: "Build the pipeline in order so reporting, journeys, and plays all reuse the same governed model.",
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
			body: "Reporting explains definitions, trends, and reconciliation. Decisions name the move, threshold, window, and owner. If you cannot state the move in one sentence with `arr`, `roas`, and `cac`, it is not decision-ready.",
		},
	],

} as const
