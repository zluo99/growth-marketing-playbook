type OverviewAIStageId = `${number}`

type OverviewAIStage = {
	id: OverviewAIStageId
	title: string
	body: string
	bullets: readonly string[]
}

type OverviewAICard = {
	id: "ai-analyst"
	title: string
	body: string
	panels: readonly OverviewAIStage[]
	footer: string
	ui: {
		stepLabel: string
		openDbtFilesButtonLabel: string
		openDbtFilesButtonAria: string
		overlayTitle: string
		overlayCloseAria: string
		overlayCopyButtonLabel: string
		overlayCopyButtonLabelCopied: string
		overlayCopyButtonAria: string
		overlayCopyButtonAriaCopied: string
		overlayFilesLabel: string
		overlayFilesHelp: string
		overlayFileDropdownAria: string
	}
}

const overview_ai_bundle_files = "`skill.md`, `metrics.yml`, and `models.yml`"

export const OverviewAICopy: OverviewAICard = {
	id: "ai-analyst",
	title: "AI analyst setup",
	body: `Start with stable foundations, a governed \`semantic_model\`, and ${overview_ai_bundle_files}.`,

	panels: [
		{
			id: "1",
			title: "Stabilize the foundation",
			body: "Do not use AI to paper over governance or reconciliation gaps.",
			bullets: [
				"Confirm `ssot` reconciliation, ownership, and `qa` before using AI outputs for decisions.",
				"If those checks fail, return a blocker list instead of directional analysis.",
			],
		},
		{
			id: "2",
			title: "Enforce the `semantic_model`",
			body: "AI needs governed business meaning, not ad hoc SQL columns.",
			bullets: [
				"Define canonical metrics, dimensions, `source` taxonomy, and `spend_type` in one `semantic_model`.",
				"Mark non-modeled results as directional.",
			],
		},
		{
			id: "3",
			title: "Run `skill.md` plus dbt files as governance",
			body: `Treat ${overview_ai_bundle_files} as one versioned modeling bundle.`,
			bullets: [
				"Update the bundle when metrics, marts, taxonomy, or model contracts change.",
			],
		},
	],

	footer: `Keep ${overview_ai_bundle_files} aligned to \`ssot\`.`,
	ui: {
		stepLabel: "Step {n}",
		openDbtFilesButtonLabel: "Open dbt files",
		openDbtFilesButtonAria: "Open dbt starter files panel",
		overlayTitle: "dbt starter files",
		overlayCloseAria: "Close dbt starter files panel",
		overlayCopyButtonLabel: "Copy",
		overlayCopyButtonLabelCopied: "Copied",
		overlayCopyButtonAria: "Copy active dbt file",
		overlayCopyButtonAriaCopied: "Copied active dbt file",
		overlayFilesLabel: "Select dbt file",
		overlayFilesHelp: "",
		overlayFileDropdownAria: "Select dbt file to preview",
	},
} as const
