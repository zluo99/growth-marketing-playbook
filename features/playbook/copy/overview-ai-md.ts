/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import { TenetsCopy } from "@/features/playbook/copy/overview-tenets"
import { DefinitionsCopy } from "@/features/playbook/copy/reports-sql-definitions"
import { FunnelCopy } from "@/features/playbook/copy/reports-sql-funnel"
import { PgPresets } from "@/features/playbook/copy/reports-sql-pg"
import { MetricDefinitions, type MetricId } from "@/features/playbook/definitions/metrics"
import { Sources } from "@/features/playbook/definitions/sources"
import { SpendById, SpendIds } from "@/features/playbook/definitions/spend"
import { TermById, type TermId } from "@/features/playbook/definitions/terms"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type MetricFormulaLike = NonNullable<(typeof MetricDefinitions)[MetricId]["formula"]>
type DbtLanguage = "markdown" | "text"

type DbtFileDefinition = {
	id: DbtFileId
	fileName: string
	description: string
	language: DbtLanguage
}

type ColumnTestSpec = { kind: "not_null" } | { kind: "accepted_values"; values: readonly string[] }

type ModelSpec = {
	name: string
	description: string
	grain: string
	anchor: string
	role: "base" | "mart"
	columns: readonly string[]
	dependsOn?: readonly string[]
	testsByColumn?: Partial<Record<string, readonly ColumnTestSpec[]>>
}

type MetricSpec = {
	name: string
	label: string
	description: string
	model: string
	anchor: string
	timeDimension: string
	calculationMethod: "count_distinct" | "sum" | "derived"
	expression: string
	dimensions: readonly string[]
	filters?: readonly string[]
	dependsOn?: readonly string[]
	guardrail?: string
}

export type DbtFileId = "skill_md" | "metrics_yml" | "models_yml"

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const skill_glossary_term_ids = ["semantic_model", "ssot", "cohort", "incrementality"] as const satisfies readonly TermId[]
const decision_metric_ids = ["leads", "opportunities", "deals", "arr", "cost_per_lead", "cost_per_opportunity", "cost_per_deal", "roas"] as const satisfies readonly MetricId[]
const directional_metric_ids = ["cac", "payback", "incremental_lift", "incremental_lift_arr", "incremental_lift_deals"] as const satisfies readonly MetricId[]
const source_l1_values = Object.freeze(Array.from(new Set(Sources.map((source) => source.source_l1))).sort())
const metric_owner = "RevOps + Data"
const roi_dimensions = ["source_l1", "source_l2", "source_l3", "vendor"] as const
const roi_spend_dimensions = ["spend_type", ...roi_dimensions] as const
const source_anchor_by_table = Object.freeze({
	funnel_cohorted: "`lead_created_date`",
	funnel_uncohorted: "`object_created_date`",
	funnel_spend: "`spend_date`",
} as const)

export const DbtFileDefinitions = Object.freeze([
	{
		id: "skill_md",
		fileName: "skill.md",
		description: TermById["skill.md"].description,
		language: "markdown",
	},
	{
		id: "metrics_yml",
		fileName: "metrics.yml",
		description: TermById["metrics.yml"].description,
		language: "text",
	},
	{
		id: "models_yml",
		fileName: "models.yml",
		description: TermById["models.yml"].description,
		language: "text",
	},
] as const satisfies readonly DbtFileDefinition[])

function create_metric_spec(
	config: Omit<MetricSpec, "dimensions"> & {
		dimensions?: readonly string[]
		includeSpendType?: boolean
	}
): MetricSpec {
	return {
		...config,
		dimensions: config.dimensions ?? (config.includeSpendType ? roi_spend_dimensions : roi_dimensions),
	}
}

function metric_surface_description(metric_id: MetricId, surface_note: string) {
	return `${MetricDefinitions[metric_id].description}. ${surface_note}`
}

function canonical_metric_spec(
	metric_id: MetricId,
	config: Omit<MetricSpec, "name" | "label" | "description" | "dimensions"> & {
		description?: string
		dimensions?: readonly string[]
		includeSpendType?: boolean
	}
) {
	return create_metric_spec({
		...config,
		name: metric_id,
		label: MetricDefinitions[metric_id].alias,
		description: config.description ?? MetricDefinitions[metric_id].description,
	})
}

const derived_model_specs = [
	{
		name: "funnel_monthly",
		description: "Monthly event-time funnel mart by source and vertical from `funnel_uncohorted`.",
		grain: "One row per month x source hierarchy x vertical.",
		anchor: "`object_created_date` rolled to month.",
		role: "mart",
		columns: ["month", "source_l1", "source_l2", "source_l3", "vertical", "leads", "opportunities", "deals", "arr"] as const,
		dependsOn: ["funnel_uncohorted"] as const,
		testsByColumn: {
			month: [{ kind: "not_null" }],
			source_l1: [{ kind: "not_null" }, { kind: "accepted_values", values: source_l1_values }],
			source_l2: [{ kind: "not_null" }],
			source_l3: [{ kind: "not_null" }],
		},
	},
	{
		name: "funnel_monthly_roi",
		description: "Monthly aligned spend and cohort-outcome mart by source and vendor from `funnel_spend` and `funnel_cohorted`.",
		grain: "One row per month x data slice x source hierarchy x vendor.",
		anchor: "`spend_date` or `lead_created_date` rolled to month, then unioned into one aligned reporting surface.",
		role: "mart",
		columns: [
			"data",
			"month",
			"spend_type",
			"source_l1",
			"source_l2",
			"source_l3",
			"vendor",
			"spend",
			"leads",
			"lead_to_opp_cvr",
			"opportunities_from_leads",
			"opp_to_deal_cvr",
			"deals_from_leads",
			"arr_from_leads",
			"ltv_from_leads",
		] as const,
		dependsOn: ["funnel_spend", "funnel_cohorted"] as const,
		testsByColumn: {
			data: [{ kind: "not_null" }, { kind: "accepted_values", values: ["funnel_spend", "funnel_cohorted"] }],
			month: [{ kind: "not_null" }],
			source_l1: [{ kind: "not_null" }, { kind: "accepted_values", values: source_l1_values }],
			source_l2: [{ kind: "not_null" }],
			source_l3: [{ kind: "not_null" }],
		},
	},
] as const satisfies readonly ModelSpec[]

const metric_specs = [
	canonical_metric_spec("arr_from_leads", {
		model: "funnel_monthly_roi",
		anchor: "cohort_time",
		timeDimension: "month",
		calculationMethod: "sum",
		expression: "arr_from_leads",
	}),
	canonical_metric_spec("cost_per_deal", {
		model: "funnel_monthly_roi",
		anchor: "aligned_month",
		timeDimension: "month",
		calculationMethod: "derived",
		expression: "total_spend / nullif(deals_from_leads, 0)",
		includeSpendType: true,
		dependsOn: ["total_spend", "deals_from_leads"],
	}),
	canonical_metric_spec("cost_per_lead", {
		model: "funnel_monthly_roi",
		anchor: "aligned_month",
		timeDimension: "month",
		calculationMethod: "derived",
		expression: "total_spend / nullif(leads, 0)",
		includeSpendType: true,
		dependsOn: ["total_spend", "leads"],
	}),
	canonical_metric_spec("cost_per_opportunity", {
		model: "funnel_monthly_roi",
		anchor: "aligned_month",
		timeDimension: "month",
		calculationMethod: "derived",
		expression: "total_spend / nullif(opportunities_from_leads, 0)",
		includeSpendType: true,
		dependsOn: ["total_spend", "opportunities_from_leads"],
	}),
	canonical_metric_spec("deals_from_leads", {
		model: "funnel_monthly_roi",
		anchor: "cohort_time",
		timeDimension: "month",
		calculationMethod: "sum",
		expression: "deals_from_leads",
	}),
	canonical_metric_spec("lead_to_opp_cvr", {
		model: "funnel_monthly_roi",
		anchor: "cohort_time",
		timeDimension: "month",
		calculationMethod: "sum",
		expression: "lead_to_opp_cvr",
		guardrail: "Use as published on the aligned cohort mart; do not recompute from partial exports with missing lead counts.",
	}),
	canonical_metric_spec("leads", {
		description: metric_surface_description("leads", "Cohort-time monthly view from `funnel_monthly_roi`."),
		model: "funnel_monthly_roi",
		anchor: "cohort_time",
		timeDimension: "month",
		calculationMethod: "sum",
		expression: "leads",
	}),
	canonical_metric_spec("opportunities_from_leads", {
		model: "funnel_monthly_roi",
		anchor: "cohort_time",
		timeDimension: "month",
		calculationMethod: "sum",
		expression: "opportunities_from_leads",
	}),
	canonical_metric_spec("opp_to_deal_cvr", {
		model: "funnel_monthly_roi",
		anchor: "cohort_time",
		timeDimension: "month",
		calculationMethod: "sum",
		expression: "opp_to_deal_cvr",
		guardrail: "Use as published on the aligned cohort mart; do not compare directly to event-time conversion reads.",
	}),
	canonical_metric_spec("roas", {
		description: metric_surface_description("roas", "Aligned monthly view from `funnel_monthly_roi`."),
		model: "funnel_monthly_roi",
		anchor: "aligned_month",
		timeDimension: "month",
		calculationMethod: "derived",
		expression: "arr_from_leads / nullif(total_spend, 0)",
		includeSpendType: true,
		dependsOn: ["arr_from_leads", "total_spend"],
		guardrail: "Never compute from raw `funnel_uncohorted` plus raw `funnel_spend` without an explicit shared month logic.",
	}),
	canonical_metric_spec("total_spend", {
		description: metric_surface_description("total_spend", "Aligned monthly view from `funnel_monthly_roi`."),
		model: "funnel_monthly_roi",
		anchor: "aligned_month",
		timeDimension: "month",
		calculationMethod: "sum",
		expression: "spend",
		includeSpendType: true,
	}),
] as const satisfies readonly MetricSpec[]

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function parse_table_columns(columns: string) {
	return columns
		.split(",")
		.map((column) => column.trim())
		.filter(Boolean)
}

function resolve_metric_id(value: string): MetricId | null {
	return Object.prototype.hasOwnProperty.call(MetricDefinitions, value) ? (value as MetricId) : null
}

function metric_formula_to_text(formula?: MetricFormulaLike) {
	if (!formula) return null
	if (formula.kind === "fraction") return `${formula.numerator} / ${formula.denominator}`
	if (formula.kind === "scaled_fraction") return `${formula.factor} * (${formula.numerator} / ${formula.denominator})`
	if (formula.kind === "product") return `${formula.left} x ${formula.right}`
	return `${formula.left} - ${formula.right}`
}

function yaml_string(value: string) {
	return `'${value.replace(/'/g, "''")}'`
}

function yaml_inline_list(values: readonly string[]) {
	return `[${values.map((value) => yaml_string(value)).join(", ")}]`
}

function join_lines(lines: readonly string[]) {
	return lines.join("\n")
}

function build_metric_definition_line(metric_id: MetricId) {
	const metric = MetricDefinitions[metric_id]
	const formula = metric_formula_to_text(metric.formula ?? undefined)
	return `- \`${metric_id}\` (${metric.alias}): ${metric.description}${formula ? ` Formula: \`${formula}\`.` : ""}`
}

function build_base_model_tests(table_name: (typeof DefinitionsCopy.tables)[number]["name"]) {
	if (table_name === "funnel_cohorted") {
		return {
			lead_id: [{ kind: "not_null" }],
			lead_created_date: [{ kind: "not_null" }],
			source_l1: [{ kind: "not_null" }, { kind: "accepted_values", values: source_l1_values }],
			source_l2: [{ kind: "not_null" }],
			source_l3: [{ kind: "not_null" }],
		} satisfies Partial<Record<string, readonly ColumnTestSpec[]>>
	}

	if (table_name === "funnel_uncohorted") {
		return {
			object_id: [{ kind: "not_null" }],
			object_type: [{ kind: "not_null" }, { kind: "accepted_values", values: ["Lead", "Opportunity", "Deal"] }],
			object_created_date: [{ kind: "not_null" }],
			source_l1: [{ kind: "not_null" }, { kind: "accepted_values", values: source_l1_values }],
			source_l2: [{ kind: "not_null" }],
			source_l3: [{ kind: "not_null" }],
		} satisfies Partial<Record<string, readonly ColumnTestSpec[]>>
	}

	return {
		spend_date: [{ kind: "not_null" }],
		spend_type: [{ kind: "not_null" }, { kind: "accepted_values", values: SpendIds }],
		source_l1: [{ kind: "not_null" }, { kind: "accepted_values", values: source_l1_values }],
		source_l2: [{ kind: "not_null" }],
		source_l3: [{ kind: "not_null" }],
		spend: [{ kind: "not_null" }],
	} satisfies Partial<Record<string, readonly ColumnTestSpec[]>>
}

function build_model_specs() {
	const base_specs = DefinitionsCopy.tables.map((table) => ({
		name: table.name,
		description: table.description,
		grain: table.grain ?? "Defined by source model grain.",
		anchor: source_anchor_by_table[table.name as keyof typeof source_anchor_by_table],
		role: "base" as const,
		columns: parse_table_columns(table.columns),
		testsByColumn: build_base_model_tests(table.name),
	}))

	return [...base_specs, ...derived_model_specs] as const
}

const model_specs = build_model_specs()
const alphabetized_metric_specs = Object.freeze([...metric_specs].sort((left, right) => left.name.localeCompare(right.name)))

function describe_field(field: string) {
	const metric_id = resolve_metric_id(field)
	if (metric_id) return MetricDefinitions[metric_id].description
	if (field === "month") return TermById.month.description
	if (field === "data") return TermById.data.description
	if (field === "lead_id") return "Stable lead identifier for the cohort-anchored record."
	if (field === "spend") return "Booked marketing spend amount for the posting date and classification dimensions."
	if (field === "spend_date") return "Posting date for booked marketing spend."
	return `Governed field used in the ${field.includes("funnel_") ? "reporting" : "playbook"} contract.`
}

function build_test_yaml(test: ColumnTestSpec) {
	if (test.kind === "not_null") return ["      - not_null"]
	return ["      - accepted_values:", `          values: ${yaml_inline_list(test.values)}`]
}

function build_column_yaml(column: string, tests: readonly ColumnTestSpec[] | undefined) {
	const lines = [`    - name: ${column}`, `      description: ${yaml_string(describe_field(column))}`]
	if (tests?.length) {
		lines.push("      tests:")
		for (const test of tests) lines.push(...build_test_yaml(test))
	}
	return join_lines(lines)
}

function build_model_yaml(model: ModelSpec) {
	const dependency_lines = model.dependsOn?.length ? [`      upstream_models: ${yaml_inline_list(model.dependsOn)}`] : []
	return [
		`  - name: ${model.name}`,
		`    description: ${yaml_string(model.description)}`,
		"    meta:",
		`      playbook_role: ${yaml_string(model.role)}`,
		`      owner: ${yaml_string(metric_owner)}`,
		`      grain: ${yaml_string(model.grain)}`,
		`      anchor: ${yaml_string(model.anchor)}`,
		...dependency_lines,
		"    columns:",
		...model.columns.map((column) => build_column_yaml(column, model.testsByColumn?.[column]).split("\n")).flat(),
	].join("\n")
}

function build_metric_yaml(metric: MetricSpec) {
	const lines = [
		`  - name: ${metric.name}`,
		`    label: ${yaml_string(metric.label)}`,
		`    description: ${yaml_string(metric.description)}`,
		`    model: ref(${yaml_string(metric.model)})`,
		`    timestamp: ${metric.timeDimension}`,
		`    calculation_method: ${metric.calculationMethod}`,
		`    expression: ${yaml_string(metric.expression)}`,
		`    dimensions: ${yaml_inline_list(metric.dimensions)}`,
		"    meta:",
		`      playbook_anchor: ${yaml_string(metric.anchor)}`,
		`      owner: ${yaml_string(metric_owner)}`,
	]
	if (metric.filters?.length) lines.push(`      filters: ${yaml_inline_list(metric.filters)}`)
	if (metric.dependsOn?.length) lines.push(`      depends_on: ${yaml_inline_list(metric.dependsOn)}`)
	if (metric.guardrail) lines.push(`      guardrail: ${yaml_string(metric.guardrail)}`)
	return lines.join("\n")
}

function build_skill_markdown() {
	const monthly_roi_preset = PgPresets.find((preset) => preset.id === "funnel_monthly_roi")
	const source_family_count = new Set(Sources.map((source) => source.source_l2)).size
	const source_leaf_count = new Set(Sources.map((source) => source.source_l3)).size

	return [
		"# skill.md",
		"## Objective",
		`- ${DefinitionsCopy.body}`,
		`- ${TenetsCopy.footer}`,
		"",
		"## Bundle order",
		"- Read this file first.",
		"- Define model contracts in `models.yml`, then publish governed KPIs in `metrics.yml`.",
		"",
		"## Primary surfaces",
		...model_specs.map((model) => `- \`${model.name}\`: ${model.description} Grain: ${model.grain} Anchor: ${model.anchor}.`),
		"",
		"## Guardrails",
		"- Never compare event-time and cohort-time metrics as peers without naming the anchor explicitly.",
		`- ` + "`spend_type`" + ` must stay inside the governed domain: ${SpendIds.map((id) => `\`${id}\` (${SpendById[id].alias})`).join(", ")}.`,
		`- ${FunnelCopy.notes.bullets[1]}`,
		"- If Finance totals, semantic definitions, and model outputs disagree, stop and return the reconciliation gap.",
		"",
		"## Metric policy",
		"- `metrics.yml` should publish canonical metric ids from `MetricDefinitions`, not new aliases for event-time views.",
		"- Decision-grade defaults:",
		...decision_metric_ids.map((metric_id) => build_metric_definition_line(metric_id)),
		"- Directional metrics until the required inputs and reconciliation are explicit:",
		...directional_metric_ids.map((metric_id) => build_metric_definition_line(metric_id)),
		"",
		"## Source taxonomy contract",
		`- Allowed ` + "`source_l1`" + ` values: ${source_l1_values.map((value) => `\`${value}\``).join(", ")}.`,
		`- Governed taxonomy coverage: ${String(source_family_count)} source families and ${String(source_leaf_count)} leaf channels.`,
		"",
		"## Recommended marts",
		"- `funnel_monthly` is the clean event-time view for monthly funnel trend reporting.",
		"- `funnel_monthly_roi` is the aligned monthly surface for spend plus cohort outcomes.",
		"- Keep `metrics.yml` on the canonical KPI contract and use marts plus model metadata to carry time-anchor context.",
		...(monthly_roi_preset ? [`- Use the ` + "`funnel_monthly_roi`" + ` SQL scaffold as the transformation baseline: ${monthly_roi_preset.description}`] : []),
		"",
		"## Working vocabulary",
		...skill_glossary_term_ids.map((term_id) => `- \`${term_id}\` (${TermById[term_id].alias}): ${TermById[term_id].description}`),
		"",
		"## Publish rule",
		"- Add the mart contract before the metric definition.",
	].join("\n")
}

function build_metrics_yml() {
	return [
		"version: 2",
		"",
		"metrics:",
		...alphabetized_metric_specs.map((metric) => build_metric_yaml(metric)),
	].join("\n")
}

function build_models_yml() {
	return [
		"version: 2",
		"",
		"models:",
		...model_specs.map((model) => build_model_yaml(model)),
	].join("\n")
}

/* -------------------------------------------------------------------------- */
/* Exports                                                                    */
/* -------------------------------------------------------------------------- */

export const DbtFileIds = Object.freeze(DbtFileDefinitions.map((file) => file.id) as readonly DbtFileId[])
export const DefaultDbtFileId: DbtFileId = "skill_md"

export function parse_ai_dbt_file_preference(value: string | null): DbtFileId {
	return typeof value === "string" && DbtFileIds.includes(value as DbtFileId) ? (value as DbtFileId) : DefaultDbtFileId
}

export function build_dbt_file_content(file_id: DbtFileId) {
	if (file_id === "metrics_yml") return build_metrics_yml()
	if (file_id === "models_yml") return build_models_yml()
	return build_skill_markdown()
}
