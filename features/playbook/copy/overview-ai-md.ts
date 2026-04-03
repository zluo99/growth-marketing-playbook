/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import { OverviewAICopy } from "@/features/playbook/copy/overview-ai-copy"
import { TenetsCopy } from "@/features/playbook/copy/overview-tenets"
import { FunnelCopy } from "@/features/playbook/copy/reports-sql-funnel"
import { DefinitionsCopy } from "@/features/playbook/copy/reports-sql-definitions"
import { PgPresets } from "@/features/playbook/copy/reports-sql-pg"
import { MetricDefinitions, type MetricId } from "@/features/playbook/definitions/metrics"
import { Sources } from "@/features/playbook/definitions/sources"
import { SpendById, SpendIds } from "@/features/playbook/definitions/spend"
import { TermById, type TermId } from "@/features/playbook/definitions/terms"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type AnalystModule = (typeof OverviewAICopy.analystModules)[number]
export type AnalystModuleId = AnalystModule["id"]

type ModuleBuildContext = {
	enabled_module_set: ReadonlySet<AnalystModuleId>
}

type MetricFormulaLike = NonNullable<(typeof MetricDefinitions)[MetricId]["formula"]>
type FunnelTableSpec = ReturnType<typeof get_funnel_table_specs>[number]

/* -------------------------------------------------------------------------- */
/* Constants: Analyst                                                         */
/* -------------------------------------------------------------------------- */

export const AnalystModuleIds = Object.freeze(OverviewAICopy.analystModules.map((module) => module.id) as readonly AnalystModuleId[])

export const AnalystDefaultModuleIds = Object.freeze(
	OverviewAICopy.analystModules.filter((module) => module.defaultEnabled).map((module) => module.id) as readonly AnalystModuleId[]
)

const analyst_glossary_term_ids = ["semantic_model", "ssot", "cohort", "incrementality"] as const satisfies readonly TermId[]

const analyst_sql_preset_ids = new Set<string>(["funnel_monthly", "funnel_monthly_roi"])

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

function build_metric_definition_line(metric_id: MetricId) {
	const metric = MetricDefinitions[metric_id]
	const formula = metric_formula_to_text(metric.formula ?? undefined)
	return `- \`${metric_id}\` (${metric.alias}): ${metric.description}${formula ? ` Formula: \`${formula}\`.` : ""}`
}

function build_field_definition_line(field: string) {
	const metric_id = resolve_metric_id(field)
	if (!metric_id) return `- \`${field}\`: Missing governed definition in \`MetricDefinitions\`.`
	return build_metric_definition_line(metric_id)
}

function markdown_code_block(language: string, code: string) {
	return ["```" + language, code.trim(), "```"].join("\n")
}

function formula_input_ids(formula?: MetricFormulaLike) {
	if (!formula) return []
	if (formula.kind === "fraction" || formula.kind === "scaled_fraction") return [formula.numerator, formula.denominator]
	return [formula.left, formula.right]
}

function get_funnel_table_specs() {
	const table_by_name = new Map(DefinitionsCopy.tables.map((table) => [table.name, table]))
	const table_order = ["funnel_cohorted", "funnel_uncohorted", "funnel_spend"] as const
	return table_order
		.map((name) => table_by_name.get(name))
		.filter((table): table is NonNullable<(typeof DefinitionsCopy.tables)[number]> => !!table)
		.map((table) => ({ ...table, columns_list: parse_table_columns(table.columns) }))
}

function dedupe_metric_ids(ids: readonly MetricId[]) {
	const seen = new Set<MetricId>()
	const out: MetricId[] = []
	for (const id of ids) {
		if (seen.has(id)) continue
		seen.add(id)
		out.push(id)
	}
	return out
}

function get_semantic_contract_ids() {
	const table_metric_ids = get_funnel_table_specs()
		.flatMap((table) => table.columns_list)
		.map((field) => resolve_metric_id(field))
		.filter((id): id is MetricId => !!id)

	const table_attribute_ids = table_metric_ids.filter((id) => MetricDefinitions[id].type_l1 === "attribute")
	const table_measure_ids = table_metric_ids.filter((id) => MetricDefinitions[id].type_l1 === "measure")

	const dimensions = dedupe_metric_ids([...DefinitionsCopy.dimensions, ...table_attribute_ids])
	const measures = dedupe_metric_ids([...DefinitionsCopy.measures, ...table_measure_ids])

	return { dimensions, measures }
}

function is_module_enabled(context: ModuleBuildContext, id: AnalystModuleId) {
	return context.enabled_module_set.has(id)
}

function build_standalone_execution_markdown() {
	const table_list = get_funnel_table_specs().map((table) => `\`${table.name}\``).join(", ")

	return [
		"## Standalone execution mode",
		"Use this section when the model has only `analyst.md` plus uploaded CSVs and no warehouse access.",
		"- Use only this contract and the uploaded CSVs as evidence unless the user explicitly supplies more governed context.",
		"- Expect modeled inputs that map to governed tables, not open-ended warehouse discovery.",
		`- Supported governed tables for CSV intake: ${table_list}.`,
		"- Extra columns are allowed as supplemental fields only when they do not conflict with governed definitions in this contract.",
		"- Do not assume hidden joins, unstated business logic, or unlisted source systems.",
		"- If a needed metric, dimension, or table is missing from this contract or the CSVs, stop and return the gap before analysis.",
	].join("\n")
}

function build_working_vocabulary_markdown() {
	return [
		"## Working vocabulary",
		...analyst_glossary_term_ids.map((id) => `- \`${id}\` (${TermById[id].alias}): ${TermById[id].description}`),
	].join("\n")
}

function build_decision_standard_markdown() {
	return [
		"## Decision standard",
		`- ${TenetsCopy.footer}`,
		...FunnelCopy.notes.bullets.map((bullet) => `- ${bullet}`),
		"- For CSV-only analysis, preserve the delivered table grain and never back-solve missing entity rows from aggregated exports.",
	].join("\n")
}

function build_semantic_contract_markdown(context: ModuleBuildContext) {
	void context
	const semantic_contract_ids = get_semantic_contract_ids()
	return [
		"## Module: Semantic model contract",
		"Purpose: Authoritative business meaning for fields used in analysis and CSV ingestion.",
		"- Derived measures may still require cross-table alignment or supplemental inputs; use Metric dictionary availability notes before computing them.",
		"### Dimensions",
		semantic_contract_ids.dimensions.map((id) => build_metric_definition_line(id)).join("\n"),
		"### Measures",
		semantic_contract_ids.measures.map((id) => build_metric_definition_line(id)).join("\n"),
		"### Enumerations and domain constraints",
		`- \`spend_type\` allowed values: ${SpendIds.map((id) => `\`${id}\``).join(", ")}.`,
		"- `object_type` allowed values: `Lead`, `Opportunity`, `Deal`.",
		"### Contract enforcement rules",
		"- Never mix semantic definitions with ad hoc warehouse aliases in a single answer.",
		"- If a metric appears in CSV but not in semantic definitions, label it `directional` and provide a definition gap list.",
		"- If two sources disagree on a metric definition, prefer `semantic_model` + `ssot` reconciliation and flag drift explicitly.",
	].join("\n")
}

function build_metric_dictionary_line(metric_id: MetricId, contract_field_ids: ReadonlySet<MetricId>) {
	const metric = MetricDefinitions[metric_id]
	const base_line = build_metric_definition_line(metric_id)
	if (metric_id === "total_spend") {
		return `${base_line} Availability: derive as \`SUM(spend)\` from \`funnel_spend\` at the selected analysis grain.`
	}

	const formula_inputs = formula_input_ids(metric.formula ?? undefined)
	if (!formula_inputs.length) return base_line

	const missing_inputs = formula_inputs.filter((input) => {
		if (input === "total_spend") return false
		return !contract_field_ids.has(input as MetricId)
	})

	if (!missing_inputs.length) {
		return `${base_line} Availability: computable from governed fields when the required inputs are present at the selected grain.`
	}

	return `${base_line} Availability: requires additional inputs not guaranteed by the standard funnel tables: ${missing_inputs
		.map((input) => `\`${input}\``)
		.join(", ")}.`
}

function build_metric_dictionary_markdown(context: ModuleBuildContext) {
	void context
	const semantic_contract_ids = get_semantic_contract_ids()
	const semantic_contract_fields = new Set<MetricId>([...semantic_contract_ids.dimensions, ...semantic_contract_ids.measures])
	const efficiency_metric_ids: readonly MetricId[] = ["total_spend", "cac", "payback"]
	const funnel_transition_metric_ids: readonly MetricId[] = ["lead_to_opp_cvr", "lead_to_deal_cvr", "opp_to_deal_cvr"]
	const incrementality_metric_ids: readonly MetricId[] = ["incremental_lift", "incremental_lift_arr", "incremental_lift_deals"]

	const list_non_overlapping_metrics = (ids: readonly MetricId[]) =>
		ids
			.filter((id) => !semantic_contract_fields.has(id))
			.map((id) => build_metric_dictionary_line(id, semantic_contract_fields))
			.join("\n")

	return [
		"## Module: Metric dictionary",
		"Purpose: Derived KPI formulas that complement semantic contract fields without duplicating them.",
		"- Only compute a derived KPI when every required input exists in the provided CSVs or is explicitly supplied by the user.",
		"- If a formula references missing inputs, return `not computable from provided data` instead of estimating or substituting proxies.",
		"### Efficiency metrics",
		list_non_overlapping_metrics(efficiency_metric_ids),
		"### Funnel transition metrics",
		list_non_overlapping_metrics(funnel_transition_metric_ids),
		"### Incrementality metrics",
		list_non_overlapping_metrics(incrementality_metric_ids),
	].join("\n\n")
}

function build_funnel_context_markdown(context: ModuleBuildContext) {
	const table_specs = get_funnel_table_specs()
	const has_semantic_contract = is_module_enabled(context, "semantic_contract")
	const table_anchor_lines: Record<FunnelTableSpec["name"], string> = {
		funnel_cohorted: "- Anchor rule: interpret all outcomes against the lead cohort anchored on `lead_created_date`.",
		funnel_uncohorted: "- Anchor rule: interpret rows as event-time CRM object creation, not lead cohort performance.",
		funnel_spend: "- Anchor rule: interpret spend on posting date until it is deliberately aligned to an outcome anchor.",
	}

	return [
		"## Module: Funnel model context",
		"Purpose: Table grain, analysis role, and table-level modeling context.",
		...table_specs.map((table) => {
			const table_fields = table.columns_list.map((field) => `\`${field}\``).join(", ")
			const grain = table.grain ?? "Defined by source table grain."
			return [
				`### ${table.name}`,
				`- Role: ${table.description}`,
				`- Grain: ${grain}`,
				table_anchor_lines[table.name],
				`- Table fields: ${table_fields}.`,
				...(has_semantic_contract
					? ["- Field definitions are inherited from `Semantic model contract`."]
					: ["#### Field definitions", table.columns_list.map((field) => build_field_definition_line(field)).join("\n")]),
			].join("\n")
		}),
	].join("\n\n")
}

function build_csv_contract_markdown(context: ModuleBuildContext) {
	const table_specs = get_funnel_table_specs()
	const include_full_schema_lists = !is_module_enabled(context, "funnel_context")
	const has_source_taxonomy = is_module_enabled(context, "source_taxonomy")
	const has_funnel_context = is_module_enabled(context, "funnel_context")
	const has_semantic_contract = is_module_enabled(context, "semantic_contract")
	const table_signatures = table_specs.map((table) => {
		const signature_columns = (table.signatureColumns ?? table.columns_list.slice(0, 5)).map((column) => `\`${column}\``).join(", ")
		return `- \`${table.name}\`: signature columns ${signature_columns}.`
	})
	const table_requirements = table_specs.map((table) => {
		if (!include_full_schema_lists) {
			const semantic_anchor = has_funnel_context ? "`Funnel model context`" : has_semantic_contract ? "`Semantic model contract`" : "enabled semantic modules"
			return `- \`${table.name}\`: ${table.columns_list.length} required columns (full field semantics in ${semantic_anchor}).`
		}
		return [`### Expected schema: ${table.name}`, "- Required columns:", ...table.columns_list.map((column) => `- \`${column}\``)].join("\n")
	})

	return [
		"## Module: CSV intake contract",
		"Purpose: Strict upload classification and validation behavior before analysis.",
		"### Operating mode",
		`- Classify each upload into one governed table: ${table_specs.map((table) => `\`${table.name}\``).join(", ")}.`,
		"- Accept modeled CSV exports only when their columns preserve the same governed semantics as the target table.",
		"- Treat the listed schemas as minimum required columns; extra columns are allowed when they do not conflict with governed definitions.",
		"- If a CSV is already aggregated above entity grain, preserve the delivered grain and do not infer missing base rows.",
		"- If multiple uploads map to the same table, stop and request merge/precedence instructions.",
		"- Normalize all dates to ISO (`YYYY-MM-DD`) before monthly rollups.",
		"### Classification signatures",
		...table_signatures,
		"### Required schemas",
		...table_requirements,
		"### Validation checks",
		"- Check required columns with exact-match names; return a rename map for every mismatch.",
		"- Validate non-null keys by table grain (`lead_id`, `object_id`, `spend_date`).",
		"- Validate type compatibility for dates and numeric spend/revenue fields before KPI computation.",
		"- If a file uses governed column names with different business meaning, stop and return a definition drift warning.",
		"- Use extra columns only when they match a governed definition or the user explicitly defines them; otherwise label them `directional`.",
		`- Enforce \`spend_type\` domain: ${SpendIds.map((id) => `\`${id}\``).join(", ")}.`,
		...(has_source_taxonomy
			? ["- Enforce `source_l1/source_l2/source_l3` values against Source taxonomy module definitions."]
			: ["- Source taxonomy module is disabled; treat unmapped source values as `directional` and flag cleanup needed."]),
		"### Join and anchor policy",
		"- Join spend to outcomes only on explicit shared business keys such as aligned date bucket + source hierarchy + vendor, never on row order.",
		"- Never entity-join `funnel_cohorted` to `funnel_uncohorted`; they use different grains and anchors.",
		"- When a table is already aggregated, keep the delivered aggregation and explain the limits it creates for downstream KPIs.",
		"### Cross-table reconciliation checks",
		"- Build monthly keys from date + source hierarchy + vendor; report keys present in spend but missing in funnel outcomes, and vice versa.",
		"- Compare `arr` trends from `funnel_uncohorted` against `arr_from_leads` trends from `funnel_cohorted`; explain anchor differences before conclusions.",
		"- Do not compute blended ROI until spend and outcome windows are aligned to the same cohort/month logic.",
		"### Stop conditions",
		"- If classification is ambiguous, stop and request clarification.",
		"- If required fields or types are missing, stop and return blockers before inference-heavy analysis.",
		"- Never invent columns, silently remap business meaning, or backfill absent entity-level identifiers.",
	].join("\n\n")
}

function build_source_taxonomy_markdown(context: ModuleBuildContext) {
	void context
	const source_lines = [...Sources]
		.sort((a, b) => {
			const left = `${a.source_l1}|${a.source_l2}|${a.source_l3}`
			const right = `${b.source_l1}|${b.source_l2}|${b.source_l3}`
			return left.localeCompare(right)
		})
		.map((source) => {
			const spend_types = source.spend_ids.length
				? source.spend_ids.map((id) => `\`${id}\` (${SpendById[id].alias})`).join(", ")
				: "`unassigned`"
			return `- ${source.source_l1} > ${source.source_l2} > ${source.source_l3} | spend_type: ${spend_types} | ${source.description_short}`
		})

	return [
		"## Module: Source taxonomy",
		"Purpose: Canonical channel hierarchy and spend-type mapping for rollups and cuts.",
		...source_lines,
	].join("\n")
}

function build_sql_reference_markdown(context: ModuleBuildContext) {
	void context
	const selected_presets = PgPresets.filter((preset) => analyst_sql_preset_ids.has(preset.id))
	const preset_blocks = selected_presets.map((preset) =>
		[`### ${preset.id}`, `- ${preset.description}`, markdown_code_block("sql", preset.code)].join("\n")
	)

	return [
		"## Module: SQL reference",
		"Purpose: Approved query scaffolds for reproducible analysis.",
		"- Use these queries as logic scaffolds for aggregation and reconciliation when only CSVs are available.",
		"- Do not treat SQL snippets as additional business definitions; the semantic contract remains authoritative.",
		...preset_blocks,
	].join("\n\n")
}

const analyst_module_markdown_builders: Record<AnalystModuleId, (context: ModuleBuildContext) => string> = {
	semantic_contract: build_semantic_contract_markdown,
	metric_dictionary: build_metric_dictionary_markdown,
	funnel_context: build_funnel_context_markdown,
	csv_contract: build_csv_contract_markdown,
	source_taxonomy: build_source_taxonomy_markdown,
	sql_reference: build_sql_reference_markdown,
}

/* -------------------------------------------------------------------------- */
/* Export                                                                     */
/* -------------------------------------------------------------------------- */

export function parse_ai_analyst_modules_preference(value: string | null): readonly AnalystModuleId[] {
	if (!value) return AnalystDefaultModuleIds
	try {
		const parsed = JSON.parse(value) as unknown
		if (Array.isArray(parsed) && parsed.every((id): id is AnalystModuleId => AnalystModuleIds.includes(id as AnalystModuleId))) {
			return parsed as readonly AnalystModuleId[]
		}
	} catch {
		// ignore invalid preference payloads
	}
	return AnalystDefaultModuleIds
}

export function build_analyst_markdown(enabled_module_ids: readonly AnalystModuleId[]) {
	const enabled = new Set(enabled_module_ids)
	const context: ModuleBuildContext = { enabled_module_set: enabled }
	const selected_modules = OverviewAICopy.analystModules.filter((module) => enabled.has(module.id))
	const module_blocks = selected_modules.map((module) => analyst_module_markdown_builders[module.id](context))

	return [
		OverviewAICopy.analystMdSample,
		build_standalone_execution_markdown(),
		build_working_vocabulary_markdown(),
		build_decision_standard_markdown(),
		"## Activated context modules",
		"Modules are MECE: each adds a distinct governed context block for this analyst instance.",
		"### Recommended selection",
		"- Portable CSV bundle: Semantic model contract, Metric dictionary, Funnel model context, CSV intake contract, Source taxonomy.",
		"- Add SQL reference only when the model must reason through transformation logic or produce SQL-like scaffolds.",
		selected_modules.length ? "### Included modules" : "### Included modules\n- None enabled.",
		...(selected_modules.length ? [selected_modules.map((module) => `- ${module.title}`).join("\n")] : []),
		selected_modules.length ? "### Module responsibilities" : "### Module responsibilities\n- Enable the portable CSV bundle for decision-grade CSV analysis.",
		...(selected_modules.length
			? [
					selected_modules
						.map((module) => `- ${module.title}: ${module.description}${module.recommendedWhen ? ` Recommended when: ${module.recommendedWhen}` : ""}`)
						.join("\n"),
				]
			: []),
		...module_blocks,
	].join("\n\n")
}
