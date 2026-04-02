"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"
import { Check, Copy as CopyIcon, FlaskConical, Scale, Target } from "lucide-react"

import { ui } from "@/components/tokens/design"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { Renderer } from "@/features/playbook/components/ui/renderer"
import { CodeBlock } from "@/features/playbook/components/ui/code"
import { PbOverlay } from "@/features/playbook/components/ui/overlay"
import { useCopyToClipboard } from "@/features/playbook/components/ui/clipboard"
import {
	PbBulletList,
	PbCardContent,
	PbCardGlow,
	PbCardHeader,
	PbCardLayer,
	PbNumberBadge,
	PbReveal,
	PbSubtleText,
	PbTabCard,
	PbTabPanel,
	PbTabShell,
} from "@/features/playbook/components/ui/ui"
import { OverviewOverlayLetters } from "@/features/playbook/tabs/overview-intro"
import { usePbTabsNav } from "@/features/playbook/components/context/context"
import { GuideCopy } from "@/features/playbook/copy/overview-guide"
import { TabById } from "@/features/playbook/definitions/tabs"
import { SpendIds, type SpendId } from "@/features/playbook/definitions/spend"
import { TenetsCopy } from "@/features/playbook/copy/overview-tenets"
import { OverviewAICopy } from "@/features/playbook/copy/overview-ai"
import { DefinitionsCopy } from "@/features/playbook/copy/reports-sql-definitions"
import { PgPresets } from "@/features/playbook/copy/reports-sql-pg"
import { MetricDefinitions, type MetricId } from "@/features/playbook/definitions/metrics"
import { Sources } from "@/features/playbook/definitions/sources"

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function tenet_icon(k: (typeof TenetsCopy.panels)[number]["icon"]) {
	if (k === "scale") return <Scale className={ui.iconNude.lg} />
	if (k === "target") return <Target className={ui.iconNude.lg} />
	return <FlaskConical className={ui.iconNude.lg} />
}

const overview_key_prefix = "overview"

function render_inline_text(txt: string, key_prefix: string) {
	return Renderer.Copy.renderInlineText(txt, { keyPrefix: key_prefix })
}

function OverviewCard({
	id,
	title,
	description,
	children,
	glowClassName,
}: {
	id: string
	title: string
	description: React.ReactNode
	children: React.ReactNode
	glowClassName?: string
}) {
	const rendered_title = <Renderer.Copy.InlineText text={title} keyPrefix={`${overview_key_prefix}-card-${id}-title`} />
	const rendered_description =
		typeof description === "string" ? <Renderer.Copy.InlineText text={description} keyPrefix={`${overview_key_prefix}-card-${id}-desc`} /> : description

	return (
		<PbTabCard hover shadow className="w-full">
			{glowClassName ? <PbCardGlow className={glowClassName} /> : null}
			<PbCardLayer>
				<PbCardHeader
					title={<span className={ui.typography.title.lg}>{rendered_title}</span>}
					description={<PbSubtleText size="body">{rendered_description}</PbSubtleText>}
				/>
				<PbCardContent className="relative">{children}</PbCardContent>
			</PbCardLayer>
		</PbTabCard>
	)
}

type KickerProps = { id: string; icon: React.ReactNode; title: string; description: string; spendIds?: readonly SpendId[] }

function Kicker({ id, icon, title, description, spendIds }: KickerProps) {
	return (
		<PbTabPanel>
			<div className={cn("flex items-center", ui.gap.sm)}>
				<span className={cn(ui.iconFrame.sm, "text-muted-foreground")}>{icon}</span>
				<span className={cn("text-foreground", ui.typography.title.md)}>
					<Renderer.Copy.InlineText text={title} keyPrefix={`${overview_key_prefix}-tenet-${id}-title`} />
				</span>
			</div>

			<p className={cn(ui.margin.topXs, "leading-relaxed text-muted-foreground", ui.typography.body)}>
				{render_inline_text(description, `${overview_key_prefix}-tenet-${id}-body`)}
			</p>

			{spendIds?.length ? (
				<div className={cn(ui.margin.topSm, "flex flex-wrap items-center", ui.gap.sm)}>
					{spendIds.map((id) => (
						<Renderer.Spend.Pill key={id} id={id} />
					))}
				</div>
			) : null}
		</PbTabPanel>
	)
}

type OverviewAiPanel = (typeof OverviewAICopy.panels)[number]
type AnalystModule = (typeof OverviewAICopy.analystModules)[number]
type AnalystModuleId = AnalystModule["id"]
type ModuleBuildContext = { enabledModuleSet: ReadonlySet<AnalystModuleId> }

const overview_ai_modules = OverviewAICopy.analystModules
const overview_ai_all_module_ids = overview_ai_modules.map((m) => m.id) as readonly AnalystModuleId[]
const overview_ai_core_module_ids = overview_ai_modules.filter((m) => m.defaultEnabled).map((m) => m.id) as readonly AnalystModuleId[]

function AnalystCopyButton({ markdown }: { markdown: string }) {
	const { copied, copy } = useCopyToClipboard()
	return (
		<Button
			type="button"
			className={cn("min-w-[92px]", ui.surface.state.hover.shadowMd)}
			variant="success"
			size="sm"
			onClick={() => void copy(markdown)}
			aria-label={copied ? OverviewAICopy.ui.overlayCopyButtonAriaCopied : OverviewAICopy.ui.overlayCopyButtonAria}
		>
			{copied ? <Check className={ui.iconNude.lg} /> : <CopyIcon className={ui.iconNude.lg} />}
			<span>
				<Renderer.Copy.InlineText
					text={copied ? OverviewAICopy.ui.overlayCopyButtonLabelCopied : OverviewAICopy.ui.overlayCopyButtonLabel}
					keyPrefix={`${overview_key_prefix}-analyst-md-copy-button`}
				/>
			</span>
		</Button>
	)
}

function AiStep({ panel }: { panel: OverviewAiPanel }) {
	return (
		<PbTabPanel className="flex h-full flex-col">
			<div className={cn("flex items-start justify-between", ui.gap.sm)}>
				<div className="min-w-0">
					<div className={cn("text-foreground", ui.typography.title.md)}>
						<Renderer.Copy.InlineText text={panel.title} keyPrefix={`${overview_key_prefix}-ai-step-${panel.id}-title`} />
					</div>
					<p className={cn(ui.margin.topXs, "text-muted-foreground", ui.typography.body)}>
						{render_inline_text(panel.body, `${overview_key_prefix}-ai-step-${panel.id}-body`)}
					</p>
				</div>

				<PbNumberBadge
					number={`Step ${panel.id}`}
					className="min-w-[72px] px-2.5"
					ariaLabel={OverviewAICopy.ui.stepLabel.replace("{n}", panel.id)}
				/>
			</div>

			{panel.bullets.length ? (
				<PbBulletList
					className={ui.margin.topSm}
					items={panel.bullets}
					size="caption"
					tone="muted"
					keyPrefix={(_, idx) => `${overview_key_prefix}-ai-step-${panel.id}-bullet-${idx}`}
					getKey={(_, idx) => `overview-ai-step-${panel.id}-bullet-${idx}`}
				/>
			) : null}
		</PbTabPanel>
	)
}

type MetricFormulaLike = NonNullable<(typeof MetricDefinitions)[MetricId]["formula"]>

function metric_formula_to_text(formula?: MetricFormulaLike) {
	if (!formula) return null
	if (formula.kind === "fraction") return `${formula.numerator} / ${formula.denominator}`
	if (formula.kind === "scaled_fraction") return `${formula.factor} * (${formula.numerator} / ${formula.denominator})`
	if (formula.kind === "product") return `${formula.left} x ${formula.right}`
	return `${formula.left} - ${formula.right}`
}

function markdown_code_block(language: string, code: string) {
	return ["```" + language, code.trim(), "```"].join("\n")
}

function parse_table_columns(columns: string) {
	return columns
		.split(",")
		.map((column) => column.trim())
		.filter(Boolean)
}

function resolve_metric_id(value: string): MetricId | null {
	return Object.prototype.hasOwnProperty.call(MetricDefinitions, value) ? (value as MetricId) : null
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
	return context.enabledModuleSet.has(id)
}

function build_semantic_contract_markdown(context: ModuleBuildContext) {
	void context
	const semantic_contract_ids = get_semantic_contract_ids()
	return [
		"## Module: Semantic model contract",
		"Purpose: Authoritative business meaning for fields used in analysis and CSV ingestion.",
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
			.map((id) => build_metric_definition_line(id))
			.join("\n")

	return [
		"## Module: Metric dictionary",
		"Purpose: Derived KPI formulas that complement semantic contract fields without duplicating them.",
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
		`- Enforce \`spend_type\` domain: ${SpendIds.map((id) => `\`${id}\``).join(", ")}.`,
		...(has_source_taxonomy
			? ["- Enforce `source_l1/source_l2/source_l3` values against Source taxonomy module definitions."]
			: ["- Source taxonomy module is disabled; treat unmapped source values as `directional` and flag cleanup needed."]),
		"### Cross-table reconciliation checks",
		"- Build monthly keys from date + source hierarchy + vendor; report keys present in spend but missing in funnel outcomes, and vice versa.",
		"- Compare `arr` trends from `funnel_uncohorted` against `arr_from_leads` trends from `funnel_cohorted`; explain anchor differences before conclusions.",
		"- Do not compute blended ROI until spend and outcome windows are aligned to the same cohort/month logic.",
		"### Stop conditions",
		"- If classification is ambiguous, stop and request clarification.",
		"- If required fields or types are missing, stop and return blockers before inference-heavy analysis.",
		"- Never invent columns or silently remap business meaning.",
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
			const spend_aliases = source.spend_aliases.length ? source.spend_aliases.join(", ") : "Unassigned"
			return `- ${source.source_l1} > ${source.source_l2} > ${source.source_l3} | spend_type: ${spend_aliases} | ${source.description_short}`
		})

	return [
		"## Module: Source taxonomy",
		"Purpose: Canonical channel hierarchy and spend-type mapping for rollups and cuts.",
		...source_lines,
	].join("\n")
}

function build_sql_reference_markdown(context: ModuleBuildContext) {
	void context
	const selected_presets = PgPresets.filter((preset) => preset.id === "funnel_monthly" || preset.id === "funnel_monthly_roi")
	const preset_blocks = selected_presets.map((preset) =>
		[`### ${preset.id}`, `- ${preset.description}`, markdown_code_block("sql", preset.code)].join("\n")
	)

	return ["## Module: SQL reference", "Purpose: Approved query scaffolds for reproducible analysis.", ...preset_blocks].join("\n\n")
}

const analyst_module_markdown_builders: Record<AnalystModuleId, (context: ModuleBuildContext) => string> = {
	semantic_contract: build_semantic_contract_markdown,
	metric_dictionary: build_metric_dictionary_markdown,
	funnel_context: build_funnel_context_markdown,
	csv_contract: build_csv_contract_markdown,
	source_taxonomy: build_source_taxonomy_markdown,
	sql_reference: build_sql_reference_markdown,
}

function build_analyst_markdown(enabled_module_ids: readonly AnalystModuleId[]) {
	const enabled = new Set(enabled_module_ids)
	const context: ModuleBuildContext = { enabledModuleSet: enabled }
	const selected_modules = overview_ai_modules.filter((module) => enabled.has(module.id))
	const module_blocks = selected_modules.map((module) => analyst_module_markdown_builders[module.id](context))

	if (!module_blocks.length) return OverviewAICopy.analystMdSample

	return [
		OverviewAICopy.analystMdSample,
		"## Activated context modules",
		"Modules are MECE: each adds a distinct governed context block for this analyst instance.",
		"### Included modules",
		selected_modules.map((module) => `- ${module.title}`).join("\n"),
		"### Module responsibilities",
		selected_modules.map((module) => `- ${module.title}: ${module.description}`).join("\n"),
		...module_blocks,
	].join("\n\n")
}

/* -------------------------------------------------------------------------- */
/* Default export                                                             */
/* -------------------------------------------------------------------------- */

export default function TabOverview() {
	const { goToTab, suppressReveal } = usePbTabsNav()
	const [reveal_locked, set_reveal_locked] = React.useState(false)
	const [is_analyst_modal_open, set_is_analyst_modal_open] = React.useState(false)
	const [enabled_module_ids, set_enabled_module_ids] = React.useState<readonly AnalystModuleId[]>(overview_ai_core_module_ids)

	React.useEffect(() => {
		if (suppressReveal) set_reveal_locked(true)
	}, [suppressReveal])

	const reveal_cards = !suppressReveal && !reveal_locked
	const tab = TabById["overview"]
	const enabled_module_set = React.useMemo(() => new Set(enabled_module_ids), [enabled_module_ids])
	const analyst_markdown = React.useMemo(() => build_analyst_markdown(enabled_module_ids), [enabled_module_ids])

	const toggle_analyst_module = React.useCallback((module_id: AnalystModuleId) => {
		set_enabled_module_ids((prev) => {
			const next = new Set(prev)
			if (next.has(module_id)) next.delete(module_id)
			else next.add(module_id)
			return overview_ai_all_module_ids.filter((id) => next.has(id))
		})
	}, [])

	const set_all_modules = React.useCallback(() => set_enabled_module_ids(overview_ai_all_module_ids), [])
	const clear_modules = React.useCallback(() => set_enabled_module_ids([]), [])

	const description = (
		<span className={cn("relative inline-block", ui.typography.title.lg)}>
			<span className="sr-only">
				<Renderer.Copy.InlineText text={tab.description ?? ""} keyPrefix={`${overview_key_prefix}-intro-description`} />
			</span>
			<span aria-hidden="true">
				<OverviewOverlayLetters
					role="target"
					layout="inline"
					includeSeparator
					keyPrefix={`${overview_key_prefix}-intro`}
					className={cn("whitespace-normal break-words")}
					titleClassName={cn("text-foreground")}
					separatorClassName={cn("text-foreground")}
					subtitleClassName={cn("text-foreground")}
				/>
			</span>
		</span>
	)
	const guide_sequence_text = (GuideCopy.panels[0]?.sequence ?? []).map((id) => `{${id}}`).join(" -> ")

	return (
		<PbTabShell tabId="overview" alias={tab.alias} description={description} keyPrefix={`${overview_key_prefix}-intro`}>
			<PbReveal enabled={reveal_cards} className="w-full" data-search-target="tenets-card">
				<OverviewCard id={TenetsCopy.id} title={TenetsCopy.title} description={TenetsCopy.body} glowClassName={ui.glow.orange}>
					<div className={cn("flex flex-col", ui.gap.sm)}>
						<div className={cn("grid items-stretch md:grid-cols-3", ui.gap.sm)}>
							{TenetsCopy.panels.map((t) => (
								<Kicker key={t.id} id={t.id} icon={tenet_icon(t.icon)} title={t.title} description={t.body} spendIds={t.spend_ids} />
							))}
						</div>

						<p className={cn("text-muted-foreground", ui.typography.caption)}>
							{render_inline_text(TenetsCopy.footer, `${overview_key_prefix}-tenets-footer`)}
						</p>
					</div>
				</OverviewCard>
			</PbReveal>

			<PbReveal enabled={reveal_cards} className="w-full" data-search-target="guide-card">
				<OverviewCard id="guide" title={GuideCopy.title} description={GuideCopy.body}>
					<div className={cn("flex flex-col", ui.gap.sm)}>
						<div className={cn("grid items-stretch md:grid-cols-2", ui.gap.sm)}>
							<PbTabPanel>
								<div className={cn("text-foreground", ui.typography.title.md)}>
									<Renderer.Copy.InlineText text={GuideCopy.panels[0]?.title ?? ""} keyPrefix={`${overview_key_prefix}-guide-panel-1-title`} />
								</div>

								{guide_sequence_text ? (
									<div className={cn(ui.margin.topSm, "flex flex-wrap items-center text-muted-foreground", ui.gap.sm)}>
										<Renderer.Tabs.InlineText text={guide_sequence_text} keyPrefix={`${overview_key_prefix}-guide-flow`} onTabClick={goToTab} />
									</div>
								) : null}

								<p className={cn(ui.margin.topSm, "leading-snug text-muted-foreground", ui.typography.body)}>
									{render_inline_text(GuideCopy.panels[0]?.body ?? "", "overview-guide-sequence")}
								</p>
							</PbTabPanel>

							<PbTabPanel>
								<div className={cn("text-foreground", ui.typography.title.md)}>
									<Renderer.Copy.InlineText text={GuideCopy.panels[1]?.title ?? ""} keyPrefix={`${overview_key_prefix}-guide-panel-2-title`} />
								</div>
								<p className={cn(ui.margin.topSm, "leading-snug text-muted-foreground", ui.typography.body)}>
									{render_inline_text(GuideCopy.panels[1]?.body ?? "", "overview-guide-journey")}
								</p>
							</PbTabPanel>
						</div>
					</div>
				</OverviewCard>
			</PbReveal>

			<PbReveal enabled={reveal_cards} className="w-full" data-search-target="ai-card">
				<OverviewCard id={OverviewAICopy.id} title={OverviewAICopy.title} description={OverviewAICopy.body} glowClassName={ui.glow.rainbow}>
					<div className={cn("flex flex-col", ui.gap.sm)}>
						<div className={cn("grid items-stretch md:grid-cols-3", ui.gap.sm)}>
							{OverviewAICopy.panels.map((panel) => (
								<AiStep key={panel.id} panel={panel} />
							))}
						</div>

						<Button
							type="button"
							variant="blueOutline"
							size="lg"
							className="w-full"
							aria-label={OverviewAICopy.ui.openAnalystButtonAria}
							onClick={() => set_is_analyst_modal_open(true)}
						>
							<Renderer.Copy.InlineText
								text={OverviewAICopy.ui.openAnalystButtonLabel}
								keyPrefix={`${overview_key_prefix}-ai-open-analyst-md-button`}
							/>
						</Button>

						<p className={cn("text-muted-foreground", ui.typography.caption)}>
							{render_inline_text(OverviewAICopy.footer, `${overview_key_prefix}-ai-footer`)}
						</p>
					</div>
				</OverviewCard>
			</PbReveal>

			<PbOverlay
				open={is_analyst_modal_open}
				onClose={() => set_is_analyst_modal_open(false)}
				title={<Renderer.Copy.InlineText text={OverviewAICopy.ui.overlayTitle} keyPrefix={`${overview_key_prefix}-analyst-md-modal-title`} />}
				ariaLabel={OverviewAICopy.ui.overlayTitle}
				closeAriaLabel={OverviewAICopy.ui.overlayCloseAria}
				headerActions={<AnalystCopyButton markdown={analyst_markdown} />}
			>
				<div className={cn("flex flex-col", ui.gap.sm)}>
					<PbTabPanel size="sm" className={cn(ui.surface.structure.opaque)}>
						<div className={cn("flex flex-wrap items-start justify-between", ui.gap.sm)}>
							<div className="min-w-0">
								<div className={cn("text-foreground", ui.typography.title.md)}>
									<Renderer.Copy.InlineText text={OverviewAICopy.ui.overlayModulesLabel} keyPrefix={`${overview_key_prefix}-analyst-modules-title`} />
								</div>
								<p className={cn(ui.margin.topXs, "text-muted-foreground", ui.typography.caption)}>
									{render_inline_text(OverviewAICopy.ui.overlayModulesHelp, `${overview_key_prefix}-analyst-modules-help`)}
								</p>
							</div>
							<div className={cn("flex flex-wrap", ui.gap.sm)}>
								<Button type="button" size="sm" variant="outline" className="h-8 px-2.5" onClick={set_all_modules}>
									<Renderer.Copy.InlineText
										text={OverviewAICopy.ui.overlayModulesEnableAllLabel}
										keyPrefix={`${overview_key_prefix}-analyst-modules-enable-all`}
									/>
								</Button>
								<Button type="button" size="sm" variant="outline" className="h-8 px-2.5" onClick={clear_modules}>
									<Renderer.Copy.InlineText
										text={OverviewAICopy.ui.overlayModulesClearLabel}
										keyPrefix={`${overview_key_prefix}-analyst-modules-clear`}
									/>
								</Button>
							</div>
						</div>

						<div className={cn(ui.margin.topSm, "flex flex-wrap", ui.gap.sm)}>
							{overview_ai_modules.map((module) => {
								const active = enabled_module_set.has(module.id)
								return (
									<button
										key={module.id}
										type="button"
										className={cn(ui.overlay.moduleChip.base, active ? ui.overlay.moduleChip.active : ui.overlay.moduleChip.inactive)}
										title={module.description}
										aria-pressed={active}
										aria-label={OverviewAICopy.ui.overlayModuleToggleAria.replace("{title}", module.title)}
										onClick={() => toggle_analyst_module(module.id)}
									>
										{module.title}
									</button>
								)
							})}
						</div>
					</PbTabPanel>

					<PbTabPanel size="sm" className={cn("overflow-hidden p-0", ui.surface.structure.opaque)}>
						<CodeBlock code={analyst_markdown} language="markdown" className="text-foreground" style={{ maxHeight: `${ui.size.layout.lg}px` }} />
					</PbTabPanel>
				</div>
			</PbOverlay>
		</PbTabShell>
	)
}
