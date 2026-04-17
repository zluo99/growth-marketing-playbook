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
		overlayFileDropdownAria: string
	}
}

const overview_ai_bundle_files = "`skill.md`, `docs.md`, and `models.yml`"

export const OverviewAICopy: OverviewAICard = {
	id: "ai-analyst",
	title: "AI analyst setup",
	body: `Start with stable data, a governed \`semantic_model\`, and a versioned bundle of ${overview_ai_bundle_files}.`,

	panels: [
		{
			id: "1",
			title: "Stabilize the foundation",
			body: "Do not ask AI to compensate for broken governance or unreconciled data.",
			bullets: [
				"Confirm `ssot` reconciliation, ownership, and `qa` before using AI output in decisions.",
				"If those checks fail, return blockers instead of directional analysis.",
			],
		},
		{
			id: "2",
			title: "Enforce the `semantic_model`",
			body: "AI needs governed business meaning, not ad hoc SQL columns.",
			bullets: [
				"Define canonical metrics, dimensions, `source`, and `spend_type` in one `semantic_model`.",
				"Mark non-modeled results as directional.",
			],
		},
		{
			id: "3",
			title: "Version the modeling bundle",
			body: `Treat ${overview_ai_bundle_files} as one versioned modeling bundle.`,
			bullets: [
				"Update the bundle when metrics, marts, taxonomy, or model contracts change.",
			],
		},
	],
	ui: {
		stepLabel: "Step {n}",
		openDbtFilesButtonLabel: "Open dbt starter files",
		openDbtFilesButtonAria: "Open dbt starter files panel",
		overlayTitle: "dbt starter files",
		overlayCloseAria: "Close dbt starter files panel",
		overlayCopyButtonLabel: "Copy",
		overlayCopyButtonLabelCopied: "Copied",
		overlayCopyButtonAria: "Copy active dbt file",
		overlayCopyButtonAriaCopied: "Copied active dbt file",
		overlayFilesLabel: "Select dbt file",
		overlayFileDropdownAria: "Select dbt file to preview",
	},
} as const
