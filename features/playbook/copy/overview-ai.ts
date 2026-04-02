export type OverviewAIStageId = `${number}`

export type OverviewAIStage = {
	id: OverviewAIStageId
	title: string
	body: string
	bullets: readonly string[]
}

export type AnalystModuleId =
	| "semantic_contract"
	| "metric_dictionary"
	| "funnel_context"
	| "csv_contract"
	| "source_taxonomy"
	| "sql_reference"

export type AnalystModule = {
	id: AnalystModuleId
	title: string
	description: string
	defaultEnabled: boolean
}

export type OverviewAICard = {
	id: "ai-analyst"
	title: string
	body: string
	panels: readonly OverviewAIStage[]
	analystModules: readonly AnalystModule[]
	analystMdSample: string
	footer: string
	ui: {
		stepLabel: string
		openAnalystButtonLabel: string
		openAnalystButtonAria: string
		overlayTitle: string
		overlayCloseAria: string
		overlayCopyButtonLabel: string
		overlayCopyButtonLabelCopied: string
		overlayCopyButtonAria: string
		overlayCopyButtonAriaCopied: string
		overlayModulesLabel: string
		overlayModulesHelp: string
		overlayModulesEnableAllLabel: string
		overlayModulesClearLabel: string
		overlayModuleToggleAria: string
	}
}

export const OverviewAICopy: OverviewAICard = {
	id: "ai-analyst",
	title: "AI analyst setup",
	body: "A successful AI analyst requires three things: a stable operating foundation, a governed `semantic_model`, and a modular `analyst.md` contract.",

	panels: [
		{
			id: "1",
			title: "Stabilize the operating foundation",
			body: "Do not ask AI to compensate for unresolved governance or reconciliation gaps.",
			bullets: [
				"Confirm `ssot` reconciliation, ownership, and `qa` before using AI outputs for decisions.",
				"If foundation checks fail, require a blocker list instead of directional analysis.",
			],
		},
		{
			id: "2",
			title: "Enforce `semantic_model` contract",
			body: "AI needs governed business meaning, not ad hoc SQL columns.",
			bullets: [
				"Define canonical metrics, dimensions, `source` taxonomy, and `spend_type` in one `semantic_model`.",
				"Require AI outputs to reconcile to Finance and to mark non-modeled results as directional.",
			],
		},
		{
			id: "3",
			title: "Run `analyst.md` as modular governance",
			body: "Treat `analyst.md` as a versioned operating contract, not a one-time prompt.",
			bullets: [
				"Use MECE context modules so each block contributes unique governed context.",
				"Enable semantic, funnel, CSV, taxonomy, and SQL modules together for governed ingestion and analysis.",
				"Update modules when definitions or models change, and keep ownership explicit.",
			],
		},
	],

	analystModules: [
		{
			id: "semantic_contract",
			title: "Semantic model contract",
			description: "Authoritative dimensions, measures, and enforcement rules for governed answers.",
			defaultEnabled: true,
		},
		{
			id: "metric_dictionary",
			title: "Metric dictionary",
			description: "Derived KPI formula dictionary that complements, not duplicates, semantic contract fields.",
			defaultEnabled: true,
		},
		{
			id: "funnel_context",
			title: "Funnel model context",
			description: "Table grain, anchors, and unique field definitions for funnel tables.",
			defaultEnabled: true,
		},
		{
			id: "csv_contract",
			title: "CSV intake contract",
			description: "Upload classification and schema validation behavior, including stop conditions.",
			defaultEnabled: true,
		},
		{
			id: "source_taxonomy",
			title: "Source taxonomy",
			description: "Canonical source hierarchy and spend-type mapping for consistent channel rollups.",
			defaultEnabled: false,
		},
		{
			id: "sql_reference",
			title: "SQL reference",
			description: "Approved SQL scaffolds for consistent transformation and analysis structure.",
			defaultEnabled: false,
		},
	],

	analystMdSample: `
# analyst.md

## Mission
- Produce decision-ready analysis for Marketing, RevOps, and Finance.
- Default to governed definitions and reconciled outcomes over speed.

## Foundation Gate
- This analyst assumes the playbook foundation exists:
  - \`semantic_model\` with governed metrics and dimensions
  - reconciled \`ssot\` boundary with Finance
  - stable staging models for funnel and spend
- If these are missing, return "foundation gap" and list blockers before analysis.

## Scope
- In scope: budget allocation, funnel performance, source-level efficiency, and incrementality readouts.
- Out of scope: legal interpretation, HR-sensitive decisions, unrestricted PII outputs.

## Context Governance
- Use selected context modules as authoritative and non-overlapping.
- If a required module is not enabled for the task, pause and request it before final analysis.
- Never override module definitions with ad hoc assumptions.

## Data Sources and Boundaries
- Systems: CRM, ad platforms, product analytics, billing, and spend ledgers.
- \`ssot\` boundary: Finance-approved revenue and ARR tables.
- Privacy:
  - Never output raw emails, phone numbers, or direct identifiers.
  - Aggregate cohorts with fewer than 10 records.

## Working Instructions
- Always state:
  - question
  - semantic metric definitions used
  - time window and cohort anchor
  - assumptions and known data risks
- Reconcile first:
  - verify spend and ARR alignment to \`ssot\`
  - flag drift between attribution readout and Finance totals
- If confidence is low, stop and return:
  - missing context
  - proposed checks
  - what decision should wait

## Response Format
1. Executive answer (1-3 lines)
2. Evidence table
3. Risks and assumptions
4. Recommended next action

## Versioning
- Owner: RevOps + Data
- Update trigger: \`semantic_model\` change, KPI definition change, source taxonomy change
- Last updated: YYYY-MM-DD
`.trim(),

	footer: "Strong AI analysis starts with a strong system: governance, a trusted `semantic_model`, and `ssot`-reconciled data.",
	ui: {
		stepLabel: "Step {n}",
		openAnalystButtonLabel: "Open analyst.md",
		openAnalystButtonAria: "Open analyst markdown panel",
		overlayTitle: "analyst.md",
		overlayCloseAria: "Close analyst markdown panel",
		overlayCopyButtonLabel: "Copy",
		overlayCopyButtonLabelCopied: "Copied",
		overlayCopyButtonAria: "Copy analyst markdown",
		overlayCopyButtonAriaCopied: "Copied analyst markdown",
		overlayModulesLabel: "Context modules",
		overlayModulesHelp: "Click modules to include or remove MECE governed context blocks in analyst.md.",
		overlayModulesEnableAllLabel: "Select all",
		overlayModulesClearLabel: "Clear all",
		overlayModuleToggleAria: "Toggle module: {title}",
	},
} as const
