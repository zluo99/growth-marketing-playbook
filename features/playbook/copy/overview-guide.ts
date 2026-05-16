import type { TabId } from "../definitions/tabs"

type GuideSequenceId = Extract<TabId, "reports-sql" | "reports-workspace" | "journeys" | "plays">

type GuidePanelId = `${number}`

type GuidePanel = {
	id: GuidePanelId
	title: string
	body: string
	sequence?: readonly GuideSequenceId[]
}

type GuideCard = {
	title: string
	body: string
	panels: readonly GuidePanel[]
}

export const GuideCopy: GuideCard = {
	title: "Execution flow",
	body: "Move in order so each layer inherits governed inputs.",

	panels: [
		{
			id: "1",
			title: "Recommended sequence",
			body: "Build the pipeline in order so reporting, journeys, and plays all reuse the same governed inputs.",
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
			body: "Reporting explains definitions, trends, and reconciliation. Decisions name the move, size, and owner. If you cannot say the move in one sentence with `arr`, `roas`, and `cac`, it is not decision-ready.",
		},
	],

} as const
