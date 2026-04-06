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

type AnalystModule = (typeof OverviewAICopy.analystModules)[number]
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
const analyst_primary_metric_ids = ["leads", "opportunities", "deals", "arr"] as const satisfies readonly MetricId[]
const analyst_efficiency_metric_ids = ["cost_per_lead", "cost_per_opportunity", "cost_per_deal", "roas"] as const satisfies readonly MetricId[]
const analyst_directional_metric_ids = ["cac", "payback", "incremental_lift", "incremental_lift_arr", "incremental_lift_deals"] as const satisfies readonly MetricId[]
const analyst_module_title_by_id = Object.freeze(
	Object.fromEntries(OverviewAICopy.analystModules.map((module) => [module.id, module.title])) as Record<AnalystModuleId, string>
)
type LegacyAnalystModuleId = "semantic_contract" | "metric_dictionary" | "funnel_context" | "csv_contract" | "source_taxonomy" | "sql_reference"
const analyst_legacy_module_ids = new Set<LegacyAnalystModuleId>([
	"semantic_contract",
	"metric_dictionary",
	"funnel_context",
	"csv_contract",
	"source_taxonomy",
	"sql_reference",
])

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

function join_lines(lines: readonly string[]) {
	return lines.join("\n")
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

function module_ref(id: AnalystModuleId) {
	return `\`Module: ${analyst_module_title_by_id[id]}\``
}

function is_module_enabled(context: ModuleBuildContext, id: AnalystModuleId) {
	return context.enabled_module_set.has(id)
}

function build_mission_markdown() {
	return [
		"## Mission",
		"- Produce decision-ready analysis for Marketing, RevOps, and Finance.",
		"- Default to governed definitions, reconciled outcomes, and explicit blockers over speed.",
	].join("\n")
}

function build_operating_mode_markdown() {
	const table_specs = get_funnel_table_specs()
	const table_list = table_specs.map((table) => `\`${table.name}\``).join(", ")
	return [
		"## Operating mode",
		"- Read this file first.",
		"- Default to governed reporting surfaces before rebuilding logic.",
		`- Primary model surfaces in this project: ${table_list}.`,
		"- If a prompt is outside this contract, return the gap before analysis.",
	].join("\n")
}

function build_foundation_gate_markdown() {
	return [
		"## Foundation gate",
		"- `semantic_model` with governed metrics and dimensions.",
		"- Reconciled `ssot` boundary with Finance.",
		"- Stable funnel and spend model tables wired into the reporting surface.",
		'- If these are missing, return "foundation gap" and list blockers before analysis.',
	].join("\n")
}

function build_scope_markdown() {
	return [
		"## Scope",
		"### In scope",
		"- Funnel performance and efficiency.",
		"- Source-level and vendor-level performance cuts.",
		"- Cohort conversion and spend alignment readouts.",
		"### Out of scope",
		"- Open-ended warehouse discovery.",
		"- Ad hoc metric redefinition outside governed definitions.",
		"- Raw PII output and causal claims without `incrementality` evidence.",
	].join("\n")
}

function build_governance_markdown() {
	return [
		"## Governance",
		"- Use selected context modules as authoritative and non-overlapping.",
		"- Respect hierarchy levels: compare `source_l1` with `source_l1`, `source_l2` with `source_l2`, `source_l3` with `source_l3`.",
		"- State time lens explicitly: event-time (`object_created_date`/`spend_date`) vs cohort-time (`lead_created_date`).",
		"- Do not compare event-time and cohort-time metrics as peers.",
		"- Preserve delivered grain and never back-solve missing entity rows.",
		"- If surfaces disagree on definition or totals, mark output as `directional` and state reconciliation risk.",
	].join("\n")
}

function build_reference_map_markdown(context: ModuleBuildContext) {
	const table_specs = get_funnel_table_specs()
	const selected_presets = PgPresets.filter((preset) => analyst_sql_preset_ids.has(preset.id))
	return [
		"## Reference map",
		`- Governed model surfaces (from Operating mode): ${table_specs.map((table) => `\`${table.name}\``).join(", ")}.`,
		`- Field semantics, KPI formulas, and compute-ability rules: see ${module_ref("semantic_kpi_contract")}.`,
		`- Grain, anchor semantics, CSV classification, and stop conditions: see ${module_ref("table_contract")}.`,
		...(is_module_enabled(context, "source_taxonomy")
			? [`- Source hierarchy and spend mapping: see ${module_ref("source_taxonomy")}.`]
			: [`- Source hierarchy mapping is disabled; enable ${module_ref("source_taxonomy")} when source-level cuts matter.`]),
		...(is_module_enabled(context, "sql_reference")
			? [`- SQL scaffolds enabled: ${selected_presets.map((preset) => `\`${preset.id}\``).join(", ")}. See ${module_ref("sql_reference")}.`]
			: ["- SQL scaffolds disabled by default; enable SQL reference only for transformation reasoning."]),
	].join("\n")
}

function build_metric_policy_markdown() {
	return [
		"## Metric policy",
		`- Decision-grade defaults (when reconciled): ${[...analyst_primary_metric_ids, ...analyst_efficiency_metric_ids].map((id) => `\`${id}\``).join(", ")}.`,
		`- Directional defaults: ${analyst_directional_metric_ids.map((id) => `\`${id}\``).join(", ")}.`,
		"- Any metric that cannot reconcile to `ssot` totals is directional.",
		`- Formula definitions, required inputs, and field semantics: see ${module_ref("semantic_kpi_contract")}.`,
		"- If required inputs are missing, return `not computable from provided data`.",
	].join("\n")
}

function build_common_mistakes_markdown() {
	return [
		"## Common mistakes to avoid",
		"- Treating event-time and cohort-time metrics as interchangeable.",
		"- Evaluating `roas` or `cost_per_*` before spend and outcome windows are aligned.",
		"- Using derived metrics with missing required inputs instead of returning `not computable from provided data`.",
		"- Comparing `source_l1` categories directly against `source_l2` or `source_l3` categories.",
		"- Rebuilding metrics ad hoc when governed surfaces already answer the prompt.",
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
		"- If confidence is low, stop and return missing context, validation checks, and which decision should wait.",
	].join("\n")
}

function build_versioning_markdown() {
	return [
		"## Versioning",
		"- Owner: RevOps + Data.",
		"- Update when `semantic_model`, KPI definitions, source taxonomy, or table semantics change.",
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

function build_semantic_kpi_contract_markdown(context: ModuleBuildContext) {
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
		"## Module: Semantic and KPI contract",
		"Purpose: Canonical field semantics, derived KPI formulas, availability rules, and definition enforcement.",
		"- This module is the authoritative definition layer for analysis and CSV ingestion.",
		"### Dimensions",
		semantic_contract_ids.dimensions.map((id) => build_metric_definition_line(id)).join("\n"),
		"### Measures",
		semantic_contract_ids.measures.map((id) => build_metric_definition_line(id)).join("\n"),
		"### Derived KPI dictionary",
		"- Only compute a derived KPI when every required input exists in the provided CSVs or is explicitly supplied by the user.",
		"- If a formula references missing inputs, return `not computable from provided data` instead of estimating or substituting proxies.",
		"#### Efficiency metrics",
		list_non_overlapping_metrics(efficiency_metric_ids),
		"#### Funnel transition metrics",
		list_non_overlapping_metrics(funnel_transition_metric_ids),
		"#### Incrementality metrics",
		list_non_overlapping_metrics(incrementality_metric_ids),
		"### Enumerations and domain constraints",
		`- \`spend_type\` allowed values: ${SpendIds.map((id) => `\`${id}\``).join(", ")}.`,
		"- `object_type` allowed values: `Lead`, `Opportunity`, `Deal`.",
		"### Enforcement rules",
		"- Never mix semantic definitions with ad hoc warehouse aliases in a single answer.",
		"- If a metric appears in CSV but not in semantic definitions, label it `directional` and provide a definition gap list.",
		"- If two sources disagree on a metric definition, prefer `semantic_model` + `ssot` reconciliation and flag drift explicitly.",
	].join("\n")
}

function build_table_contract_markdown(context: ModuleBuildContext) {
	const table_specs = get_funnel_table_specs()
	const has_semantic_kpi_contract = is_module_enabled(context, "semantic_kpi_contract")
	const include_full_schema_lists = !has_semantic_kpi_contract
	const has_source_taxonomy = is_module_enabled(context, "source_taxonomy")
	const table_anchor_lines: Record<FunnelTableSpec["name"], string> = {
		funnel_cohorted: "- Anchor rule: interpret all outcomes against the lead cohort anchored on `lead_created_date`.",
		funnel_uncohorted: "- Anchor rule: interpret rows as event-time CRM object creation, not lead cohort performance.",
		funnel_spend: "- Anchor rule: interpret spend on posting date until it is deliberately aligned to an outcome anchor.",
	}

	const table_signatures = table_specs.map((table) => {
		const signature_columns = (table.signatureColumns ?? table.columns_list.slice(0, 5)).map((column) => `\`${column}\``).join(", ")
		return `- \`${table.name}\`: signature columns ${signature_columns}.`
	})
	const table_requirements = table_specs.map((table) => {
		if (!include_full_schema_lists) return `- \`${table.name}\`: ${table.columns_list.length} required columns.`
		return [`#### Expected schema: ${table.name}`, ...table.columns_list.map((column) => `- \`${column}\``)].join("\n")
	})

	return [
		"## Module: Table contract",
		"Purpose: Governed table semantics plus CSV intake classification, validation rules, and stop conditions.",
		"### Governed tables",
		...table_specs.map((table) => {
			const table_fields = table.columns_list.map((field) => `\`${field}\``).join(", ")
			const grain = table.grain ?? "Defined by source table grain."
			return join_lines([
				`#### ${table.name}`,
				`- Role: ${table.description}`,
				`- Grain: ${grain}`,
				table_anchor_lines[table.name],
				`- Table fields: ${table_fields}.`,
				...(has_semantic_kpi_contract
					? ["- Field definitions are inherited from `Semantic and KPI contract`."]
					: ["#### Field definitions", table.columns_list.map((field) => build_field_definition_line(field)).join("\n")]),
			])
		}),
		"### CSV intake",
		`- Classify each upload into one governed table: ${table_specs.map((table) => `\`${table.name}\``).join(", ")}.`,
		"- Accept modeled CSV exports only when their columns preserve the same governed semantics as the target table.",
		"- Preserve delivered grain; do not infer missing base rows from aggregated exports.",
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
		`- Enforce \`spend_type\` domain from ${module_ref("semantic_kpi_contract")}.`,
		...(has_source_taxonomy
			? ["- Enforce `source_l1/source_l2/source_l3` values against Source taxonomy module definitions."]
			: ["- Source taxonomy module is disabled; treat unmapped source values as `directional` and flag cleanup needed."]),
		"### Join and anchor policy",
		"- Join spend to outcomes only on explicit shared business keys such as aligned date bucket + source hierarchy + vendor, never on row order.",
		"- Never entity-join `funnel_cohorted` to `funnel_uncohorted`; they use different grains and anchors.",
		"- Do not compute blended ROI until spend and outcome windows are aligned to the same cohort/month logic.",
		"### Stop conditions",
		"- If classification is ambiguous, stop and request clarification.",
		"- If required fields or types are missing, stop and return blockers before inference-heavy analysis.",
		"- Never invent columns, silently remap business meaning, or backfill absent entity-level identifiers.",
	].join("\n")
}

function build_source_taxonomy_markdown(context: ModuleBuildContext) {
	void context
	const rows = [...Sources]
		.sort((a, b) => {
			const left = `${a.source_l1}|${a.source_l2}|${a.source_l3}`
			const right = `${b.source_l1}|${b.source_l2}|${b.source_l3}`
			return left.localeCompare(right)
		})
		.map((source) => {
			const spend_types = source.spend_ids.length
				? source.spend_ids.map((id) => `\`${id}\` (${SpendById[id].alias})`).join(", ")
				: "`unassigned`"
			return `| ${source.source_l1} | ${source.source_l2} | ${source.source_l3} | ${spend_types} | ${source.description_short} |`
		})

	return [
		"## Module: Source taxonomy",
		"Purpose: Canonical channel hierarchy and spend-type mapping for rollups and cuts.",
		"| Source L1 | Source L2 | Source L3 | Allowed spend_type | Description |",
		"|---|---|---|---|---|",
		...rows,
	].join("\n")
}

function build_sql_reference_markdown(context: ModuleBuildContext) {
	void context
	const selected_presets = PgPresets.filter((preset) => analyst_sql_preset_ids.has(preset.id))
	const preset_blocks = selected_presets.map((preset) => `### ${preset.id}\n- ${preset.description}\n${markdown_code_block("sql", preset.code)}`).join("\n\n")

	return [
		"## Module: SQL reference",
		"Purpose: Approved query scaffolds for reproducible analysis.",
		"- Use these queries as logic scaffolds for aggregation and reconciliation when only CSVs are available.",
		"- Do not treat SQL snippets as additional business definitions; the semantic contract remains authoritative.",
		preset_blocks,
	].join("\n")
}

function build_activated_modules_markdown(selected_modules: readonly AnalystModule[]) {
	const included_module_lines = selected_modules.length
		? selected_modules.map((module) => `- ${module.title}`)
		: ["- None enabled."]

	return [
		"## Activated context modules",
		"Modules are MECE: each adds a distinct governed context block for this analyst instance.",
		"### Recommended selection",
		`- ${OverviewAICopy.ui.overlayModulesHelp}`,
		"### Included modules",
		...included_module_lines,
		"### Usage rule",
		"- Treat module sections below as the single source of truth for definitions and operational rules.",
	].join("\n")
}

const analyst_module_markdown_builders: Record<AnalystModuleId, (context: ModuleBuildContext) => string> = {
	semantic_kpi_contract: build_semantic_kpi_contract_markdown,
	table_contract: build_table_contract_markdown,
	source_taxonomy: build_source_taxonomy_markdown,
	sql_reference: build_sql_reference_markdown,
}

function is_analyst_module_id(value: unknown): value is AnalystModuleId {
	return typeof value === "string" && AnalystModuleIds.includes(value as AnalystModuleId)
}

function is_legacy_analyst_module_id(value: unknown): value is LegacyAnalystModuleId {
	return typeof value === "string" && analyst_legacy_module_ids.has(value as LegacyAnalystModuleId)
}

function map_legacy_module_id(id: LegacyAnalystModuleId): AnalystModuleId[] {
	if (id === "semantic_contract" || id === "metric_dictionary") return ["semantic_kpi_contract"]
	if (id === "funnel_context" || id === "csv_contract") return ["table_contract"]
	return [id]
}

function normalize_module_ids(value: readonly unknown[]): readonly AnalystModuleId[] {
	const normalized = new Set<AnalystModuleId>()
	for (const id of value) {
		if (is_analyst_module_id(id)) {
			normalized.add(id)
			continue
		}

		if (is_legacy_analyst_module_id(id)) {
			for (const mapped_id of map_legacy_module_id(id)) normalized.add(mapped_id)
		}
	}

	return AnalystModuleIds.filter((id) => normalized.has(id))
}

/* -------------------------------------------------------------------------- */
/* Export                                                                     */
/* -------------------------------------------------------------------------- */

export function parse_ai_analyst_modules_preference(value: string | null): readonly AnalystModuleId[] {
	if (!value) return AnalystDefaultModuleIds
	try {
		const parsed = JSON.parse(value) as unknown
		if (Array.isArray(parsed)) {
			const normalized = normalize_module_ids(parsed)
			return normalized.length ? normalized : AnalystDefaultModuleIds
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
		"# analyst.md",
		build_mission_markdown(),
		build_operating_mode_markdown(),
		build_foundation_gate_markdown(),
		build_scope_markdown(),
		build_governance_markdown(),
		build_reference_map_markdown(context),
		build_metric_policy_markdown(),
		build_working_vocabulary_markdown(),
		build_decision_standard_markdown(),
		build_common_mistakes_markdown(),
		build_versioning_markdown(),
		build_activated_modules_markdown(selected_modules),
		...module_blocks,
	].join("\n\n")
}
