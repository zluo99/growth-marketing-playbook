import type { TabId } from "../definitions/tabs"

export type GuideSequenceId = Extract<TabId, "reports-sql" | "reports-workspace" | "journeys" | "plays">

export type GuidePanelId = `${number}`

export type GuideSequenceStep = { id: GuideSequenceId; title: string }

export type GuidePanel = {
	id: GuidePanelId
	title: string
	body: string
	sequence?: readonly GuideSequenceStep[]
}

export type GuideCard = {
	id: "guide"
	title: string
	body: string
	panels: readonly GuidePanel[]
}

export const GuideCopy: GuideCard = {
	id: "guide",
	title: "Execution guide",
	body: "Now that we've established the tenets, it's time to go over this playbook.",

	panels: [
		{
			id: "1",
			title: "Recommended sequence",
			body: "Building the growth marketing function requires a strong measurement foundation, and this sequence ensures that.",
			sequence: [
				{ id: "reports-sql", title: "Staging Models" },
				{ id: "reports-workspace", title: "Automating Reports" },
				{ id: "journeys", title: "Building Journeys" },
				{ id: "plays", title: "Running Plays" },
			],
		},
		{
			id: "2",
			title: "Decision cadence",
			body: "Reporting is definitions, trends, and reconciliation. Decisions are explicit moves with thresholds, windows, and owners. If a move cannot be stated in one sentence with `arr`, `roas`, and `cac`, it is not decision-ready.",
		},
	],

} as const
