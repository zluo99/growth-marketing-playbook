/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

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
	calculationMethod: "sum" | "derived"
	expression: string
	dimensions: readonly string[]
	dependsOn?: readonly string[]
	guardrail?: string
}

export type DbtFileId = "skill_md" | "docs_md" | "models_yml"

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const skill_glossary_term_ids = ["semantic_model", "ssot", "cohort", "incrementality"] as const satisfies readonly TermId[]
const source_l1_values = Object.freeze(Array.from(new Set(Sources.map((source) => source.source_l1))).sort())
const metric_owner = "RevOps + Data"
const roi_dimensions = ["source_l1", "source_l2", "source_l3", "vendor"] as const
const roi_spend_dimensions = ["spend_type", ...roi_dimensions] as const
const source_anchor_by_table = Object.freeze({
	int_lead_cohort: "`lead_created_date`",
	fct_funnel_events: "`object_created_date`",
	fct_marketing_spend: "`spend_date`",
} as const)

export const DbtFileDefinitions = Object.freeze([
	{
		id: "skill_md",
		fileName: "skill.md",
		description: TermById["skill.md"].description,
		language: "markdown",
	},
	{
		id: "docs_md",
		fileName: "docs.md",
		description: TermById["docs.md"].description,
		language: "markdown",
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
		name: "agg_funnel_monthly",
		description: "Monthly event-time funnel mart by source and vertical from `fct_funnel_events`.",
		grain: "One row per month x source hierarchy x vertical.",
		anchor: "`object_created_date` rolled to month.",
		role: "mart",
		columns: ["month", "source_l1", "source_l2", "source_l3", "vertical", "leads", "opportunities", "deals", "arr"] as const,
		dependsOn: ["fct_funnel_events"] as const,
		testsByColumn: {
			month: [{ kind: "not_null" }],
			source_l1: [{ kind: "not_null" }, { kind: "accepted_values", values: source_l1_values }],
			source_l2: [{ kind: "not_null" }],
			source_l3: [{ kind: "not_null" }],
		},
	},
	{
		name: "agg_funnel_monthly_roi",
		description: "Monthly aligned spend and cohort-outcome mart by source and vendor from `fct_marketing_spend` and `int_lead_cohort`.",
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
		dependsOn: ["fct_marketing_spend", "int_lead_cohort"] as const,
		testsByColumn: {
			data: [{ kind: "not_null" }, { kind: "accepted_values", values: ["fct_marketing_spend", "int_lead_cohort"] }],
			month: [{ kind: "not_null" }],
			source_l1: [{ kind: "not_null" }, { kind: "accepted_values", values: source_l1_values }],
			source_l2: [{ kind: "not_null" }],
			source_l3: [{ kind: "not_null" }],
		},
	},
] as const satisfies readonly ModelSpec[]

const metric_specs = [
	canonical_metric_spec("arr_from_leads", {
		model: "agg_funnel_monthly_roi",
		anchor: "cohort_time",
		timeDimension: "month",
		calculationMethod: "sum",
		expression: "arr_from_leads",
	}),
	canonical_metric_spec("cost_per_deal", {
		model: "agg_funnel_monthly_roi",
		anchor: "aligned_month",
		timeDimension: "month",
		calculationMethod: "derived",
		expression: "total_spend / nullif(deals_from_leads, 0)",
		includeSpendType: true,
		dependsOn: ["total_spend", "deals_from_leads"],
	}),
	canonical_metric_spec("cost_per_lead", {
		model: "agg_funnel_monthly_roi",
		anchor: "aligned_month",
		timeDimension: "month",
		calculationMethod: "derived",
		expression: "total_spend / nullif(leads, 0)",
		includeSpendType: true,
		dependsOn: ["total_spend", "leads"],
	}),
	canonical_metric_spec("cost_per_opportunity", {
		model: "agg_funnel_monthly_roi",
		anchor: "aligned_month",
		timeDimension: "month",
		calculationMethod: "derived",
		expression: "total_spend / nullif(opportunities_from_leads, 0)",
		includeSpendType: true,
		dependsOn: ["total_spend", "opportunities_from_leads"],
	}),
	canonical_metric_spec("deals_from_leads", {
		model: "agg_funnel_monthly_roi",
		anchor: "cohort_time",
		timeDimension: "month",
		calculationMethod: "sum",
		expression: "deals_from_leads",
	}),
	canonical_metric_spec("lead_to_opp_cvr", {
		model: "agg_funnel_monthly_roi",
		anchor: "cohort_time",
		timeDimension: "month",
		calculationMethod: "sum",
		expression: "lead_to_opp_cvr",
		guardrail: "Use as published on the aligned cohort mart; do not recompute from partial exports with missing lead counts.",
	}),
	canonical_metric_spec("leads", {
		description: metric_surface_description("leads", "Cohort-time monthly view from `agg_funnel_monthly_roi`."),
		model: "agg_funnel_monthly_roi",
		anchor: "cohort_time",
		timeDimension: "month",
		calculationMethod: "sum",
		expression: "leads",
	}),
	canonical_metric_spec("opportunities_from_leads", {
		model: "agg_funnel_monthly_roi",
		anchor: "cohort_time",
		timeDimension: "month",
		calculationMethod: "sum",
		expression: "opportunities_from_leads",
	}),
	canonical_metric_spec("opp_to_deal_cvr", {
		model: "agg_funnel_monthly_roi",
		anchor: "cohort_time",
		timeDimension: "month",
		calculationMethod: "sum",
		expression: "opp_to_deal_cvr",
		guardrail: "Use as published on the aligned cohort mart; do not compare directly to event-time conversion reads.",
	}),
	canonical_metric_spec("roas", {
		description: metric_surface_description("roas", "Aligned monthly view from `agg_funnel_monthly_roi`."),
		model: "agg_funnel_monthly_roi",
		anchor: "aligned_month",
		timeDimension: "month",
		calculationMethod: "derived",
		expression: "arr_from_leads / nullif(total_spend, 0)",
		includeSpendType: true,
		dependsOn: ["arr_from_leads", "total_spend"],
		guardrail: "Never compute from raw `fct_funnel_events` plus raw `fct_marketing_spend` without an explicit shared month logic.",
	}),
	canonical_metric_spec("total_spend", {
		description: metric_surface_description("total_spend", "Aligned monthly view from `agg_funnel_monthly_roi`."),
		model: "agg_funnel_monthly_roi",
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

function yaml_string(value: string) {
	return `'${value.replace(/'/g, "''")}'`
}

function yaml_inline_list(values: readonly string[]) {
	return `[${values.map((value) => yaml_string(value)).join(", ")}]`
}

function join_lines(lines: readonly string[]) {
	return lines.join("\n")
}

function interleave_blocks(blocks: readonly string[]) {
	return blocks.flatMap((block, index) => (index === 0 ? [block] : ["", block]))
}

function trim_terminal_period(value: string) {
	return value.replace(/[.]+$/u, "")
}

function build_metric_policy_line(metric: MetricSpec) {
	return `- \`${metric.name}\` (${metric.label}): ${metric.description} Expression: \`${metric.expression}\`.`
}

function build_base_model_tests(table_name: (typeof DefinitionsCopy.tables)[number]["name"]) {
	if (table_name === "int_lead_cohort") {
		return {
			lead_id: [{ kind: "not_null" }],
			lead_created_date: [{ kind: "not_null" }],
			source_l1: [{ kind: "not_null" }, { kind: "accepted_values", values: source_l1_values }],
			source_l2: [{ kind: "not_null" }],
			source_l3: [{ kind: "not_null" }],
		} satisfies Partial<Record<string, readonly ColumnTestSpec[]>>
	}

	if (table_name === "fct_funnel_events") {
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
const model_field_names = Object.freeze(Array.from(new Set(model_specs.flatMap((model) => model.columns))))

function describe_field(field: string) {
	const metric_id = resolve_metric_id(field)
	if (metric_id) return MetricDefinitions[metric_id].description
	const term = Object.prototype.hasOwnProperty.call(TermById, field) ? TermById[field as TermId] : null
	if (term) return term.description
	throw new Error(`Missing canonical definition for surfaced field: ${field}`)
}

function build_doc_name(kind: "model" | "metric" | "field", name: string) {
	return `playbook_${kind}_${name}`
}

function build_doc_ref(kind: "model" | "metric" | "field", name: string) {
	return `"{{ doc('${build_doc_name(kind, name)}') }}"`
}

function build_doc_block(doc_name: string, lines: readonly string[]) {
	return [`{% docs ${doc_name} %}`, ...lines, "{% enddocs %}"].join("\n")
}

function build_model_doc_markdown(model: ModelSpec) {
	const lines = [
		model.description,
		"",
		`- Grain: ${model.grain}`,
		`- Anchor: ${model.anchor}`,
	]
	if (model.dependsOn?.length) lines.push(`- Upstream models: ${model.dependsOn.map((name) => `\`${name}\``).join(", ")}.`)
	return build_doc_block(build_doc_name("model", model.name), lines)
}

function build_metric_doc_markdown(metric: MetricSpec) {
	const lines = [
		metric.description,
		"",
		`- Label: ${metric.label}`,
		`- Model: \`${metric.model}\``,
		`- Anchor: \`${metric.anchor}\``,
		`- Time dimension: \`${metric.timeDimension}\``,
		`- Calculation method: \`${metric.calculationMethod}\``,
		`- Expression: \`${metric.expression}\``,
		`- Dimensions: ${metric.dimensions.map((dimension) => `\`${dimension}\``).join(", ")}.`,
	]
	if (metric.dependsOn?.length) lines.push(`- Depends on: ${metric.dependsOn.map((name) => `\`${name}\``).join(", ")}.`)
	if (metric.guardrail) lines.push(`- Guardrail: ${metric.guardrail}`)
	return build_doc_block(build_doc_name("metric", metric.name), lines)
}

function build_field_doc_markdown(field: string) {
	return build_doc_block(build_doc_name("field", field), [describe_field(field)])
}

function build_test_yaml(test: ColumnTestSpec) {
	if (test.kind === "not_null") return ["          - not_null"]
	return ["          - accepted_values:", `              values: ${yaml_inline_list(test.values)}`]
}

function build_column_yaml(column: string, tests: readonly ColumnTestSpec[] | undefined) {
	const lines = [`      - name: ${column}`, `        description: ${build_doc_ref("field", column)}`]
	if (tests?.length) {
		lines.push("        tests:")
		for (const test of tests) lines.push(...build_test_yaml(test))
	}
	return join_lines(lines)
}

function build_model_yaml(model: ModelSpec) {
	const dependency_lines = model.dependsOn?.length ? [`      upstream_models: ${yaml_inline_list(model.dependsOn)}`] : []
	return [
		`  - name: ${model.name}`,
		`    description: ${build_doc_ref("model", model.name)}`,
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
		`    description: ${build_doc_ref("metric", metric.name)}`,
		`    model: ref(${yaml_string(metric.model)})`,
		`    timestamp: ${metric.timeDimension}`,
		`    calculation_method: ${metric.calculationMethod}`,
		`    expression: ${yaml_string(metric.expression)}`,
		`    dimensions: ${yaml_inline_list(metric.dimensions)}`,
		"    meta:",
		`      playbook_anchor: ${yaml_string(metric.anchor)}`,
		`      owner: ${yaml_string(metric_owner)}`,
	]
	if (metric.dependsOn?.length) lines.push(`      depends_on: ${yaml_inline_list(metric.dependsOn)}`)
	if (metric.guardrail) lines.push(`      guardrail: ${yaml_string(metric.guardrail)}`)
	return lines.join("\n")
}

function build_skill_markdown() {
	const monthly_roi_preset = PgPresets.find((preset) => preset.id === "agg_funnel_monthly_roi")
	const source_family_count = new Set(Sources.map((source) => source.source_l2)).size
	const source_leaf_count = new Set(Sources.map((source) => source.source_l3)).size

	return [
		"# skill.md",
		"## Objective",
		`- ${DefinitionsCopy.body}`,
		"",
		"## Bundle order",
		"- Read this file first.",
		"- Keep long-form descriptions in `docs.md`.",
		"- Publish models and governed metrics in `models.yml` using `doc()` references back to `docs.md`.",
		"",
		"## Primary surfaces",
		...model_specs.map((model) => `- \`${model.name}\`: ${model.description} Grain: ${trim_terminal_period(model.grain)}. Anchor: ${trim_terminal_period(model.anchor)}.`),
		"",
		"## Guardrails",
		"- Never compare event-time and cohort-time metrics as peers without naming the anchor explicitly.",
		`- ` + "`spend_type`" + ` must stay inside the governed domain: ${SpendIds.map((id) => `\`${id}\` (${SpendById[id].alias})`).join(", ")}.`,
		`- ${FunnelCopy.notes.bullets[1]}`,
		"- If Finance totals, semantic definitions, and model outputs disagree, stop and return the reconciliation gap.",
		"",
		"## Metric policy",
		"- `models.yml` should publish canonical metric ids from `MetricDefinitions`, while `docs.md` carries the shared long-form descriptions.",
		"- Publish only the starter metrics that are fully modeled in this bundle:",
		...alphabetized_metric_specs.map((metric) => build_metric_policy_line(metric)),
		"- Leave CAC, payback, and incrementality outputs out of the starter bundle until their required inputs are modeled and reconciled.",
		"",
		"## Source taxonomy contract",
		`- Allowed ` + "`source_l1`" + ` values: ${source_l1_values.map((value) => `\`${value}\``).join(", ")}.`,
		`- Governed taxonomy coverage: ${String(source_family_count)} source families and ${String(source_leaf_count)} leaf channels.`,
		"",
		"## Recommended marts",
		"- `agg_funnel_monthly` is the clean event-time view for monthly funnel trend reporting.",
		"- `agg_funnel_monthly_roi` is the aligned monthly surface for spend plus cohort outcomes.",
		"- Keep `docs.md` as the reusable documentation layer and use marts plus `models.yml` metadata to carry time-anchor context.",
		...(monthly_roi_preset ? [`- Use the ` + "`agg_funnel_monthly_roi`" + ` SQL scaffold as the transformation baseline: ${monthly_roi_preset.description}`] : []),
		"",
		"## Working vocabulary",
		...skill_glossary_term_ids.map((term_id) => `- \`${term_id}\` (${TermById[term_id].alias}): ${TermById[term_id].description}`),
		"",
		"## Publish rule",
		"- Add the doc block before the model or metric definition that references it.",
	].join("\n")
}

function build_docs_markdown() {
	const model_doc_blocks = model_specs.map((model) => build_model_doc_markdown(model))
	const metric_doc_blocks = alphabetized_metric_specs.map((metric) => build_metric_doc_markdown(metric))
	const field_doc_blocks = model_field_names.map((field) => build_field_doc_markdown(field))

	return [
		"# docs.md",
		"## Usage",
		"- Keep reusable long-form descriptions here.",
		"- Reference these blocks from `models.yml` with dbt `doc()` calls.",
		"",
		"## Model docs",
		...interleave_blocks(model_doc_blocks),
		"",
		"## Metric docs",
		...interleave_blocks(metric_doc_blocks),
		"",
		"## Field docs",
		...interleave_blocks(field_doc_blocks),
	].join("\n")
}

function build_models_yml() {
	return [
		"version: 2",
		"",
		"models:",
		...model_specs.map((model) => build_model_yaml(model)),
		"",
		"metrics:",
		...alphabetized_metric_specs.map((metric) => build_metric_yaml(metric)),
	].join("\n")
}

/* -------------------------------------------------------------------------- */
/* Exports                                                                    */
/* -------------------------------------------------------------------------- */

export const DbtFileIds = Object.freeze(DbtFileDefinitions.map((file) => file.id) as readonly DbtFileId[])
export const DefaultDbtFileId: DbtFileId = "skill_md"

export function parse_ai_dbt_file_preference(value: string | null): DbtFileId {
	if (typeof value !== "string") return DefaultDbtFileId
	const normalized_value = value === "metrics_yml" ? "docs_md" : value
	return DbtFileIds.includes(normalized_value as DbtFileId) ? (normalized_value as DbtFileId) : DefaultDbtFileId
}

export function build_dbt_file_content(file_id: DbtFileId) {
	if (file_id === "docs_md") return build_docs_markdown()
	if (file_id === "models_yml") return build_models_yml()
	return build_skill_markdown()
}
