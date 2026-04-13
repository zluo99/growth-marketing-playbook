// plays.tsx
"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"
import { motion, type Transition } from "framer-motion"
import { Download } from "lucide-react"

import { ui } from "@/components/tokens/design"
import { uiMotion, useReducedMotionBool } from "@/components/tokens/motion"
import { Button } from "@/components/ui/button"
import { Hierarchy } from "@/components/ui/hierarchy"
import { Dropdown, type DropdownItem } from "@/components/nav/dropdown"
import { Bar, BarRail, BarScroller, BarScrollButton } from "@/components/nav/bar"
import { MotionPillIndicator, PillList, PillRoot, PillTrigger, useMotionPillRail } from "@/components/nav/pill"
import { cn, scrollIntoHorizontalView, stableKeyFromText } from "@/lib/utils"

import { Renderer } from "@/features/playbook/components/ui/renderer"
import { PbBulletList, PbCardContent, PbCardHeader, PbCardLayer, PbReveal, PbSubtleText, PbTabCard, PbTabPanel, PbTabShell } from "@/features/playbook/components/ui/ui"
import { SourcesCopy } from "@/features/playbook/copy/plays-sources"
import { SpendCopy, type SpendBullet, type SpendPanel, type SpendPillar } from "@/features/playbook/copy/plays-spend"
import { MetricDefinitions } from "@/features/playbook/definitions/metrics"
import { TabById } from "@/features/playbook/definitions/tabs"
import { BenchmarksBySourceL3, listSources, SourceFieldDefinitions, type Range, type Source, type SourceFieldId, type UtmField, type UtmValues } from "@/features/playbook/definitions/sources"
import { type SpendId } from "@/features/playbook/definitions/spend"
import { UtmMediumByValue } from "@/features/playbook/definitions/utm-medium-to-sources"
import { getTermByToken } from "@/features/playbook/definitions/terms"
import { VendorDescriptionByName } from "@/features/playbook/definitions/utm-source-to-vendors"
import { PlaybookEvents, PlaybookStorage, read_preference, write_preference } from "@/features/playbook/components/context/preferences"
import { SearchTargets, search_target_for_source } from "@/features/playbook/search/targets"
import { downloadCsv } from "@/lib/csv"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type Segment = "b2b" | "b2c"
type SegmentSelectableFieldId = "description" | "vendor" | "utm" | "spend_ids" | "roas" | "lead_to_deal_cvr"
type SegmentVariantFieldId = Extract<SegmentSelectableFieldId, "roas" | "lead_to_deal_cvr">
type FieldDropdownValue = SegmentSelectableFieldId | `${SegmentVariantFieldId}__${Segment}`

const selectable_field_ids = ["description", "vendor", "utm", "spend_ids", "roas", "lead_to_deal_cvr"] as const satisfies readonly SegmentSelectableFieldId[]
const static_export_headers = ["source_l1", "source_l2", "source_l3"] as const
const plays_key_prefix = "plays"
const NaText = ({ className }: { className?: string }) => (
	<span className={cn(ui.copy.na, ui.typography.caption, className)}>
		<Renderer.Copy.InlineText text={SourcesCopy.naLabel} keyPrefix={`${plays_key_prefix}-na-label`} />
	</span>
)

function field_label(id: SegmentSelectableFieldId) {
	if (id === "description") return SourceFieldDefinitions.description.alias
	if (id === "vendor") return MetricDefinitions.vendor.alias
	if (id === "utm") return SourceFieldDefinitions.utm.alias
	if (id === "spend_ids") return MetricDefinitions.spend_type.alias
	if (id === "roas") return MetricDefinitions.roas.alias
	if (id === "lead_to_deal_cvr") return MetricDefinitions.lead_to_deal_cvr.alias
	return id
}

function requires_segment_variant(id: SegmentSelectableFieldId): id is SegmentVariantFieldId {
	return id === "roas" || id === "lead_to_deal_cvr"
}

function segment_variant_label(segment: Segment) {
	return segment.toUpperCase()
}

function field_header_label(id: SegmentSelectableFieldId, segment: Segment) {
	if (!requires_segment_variant(id)) return field_label(id)
	return `${field_label(id)} (${segment_variant_label(segment)})`
}

function make_variant_value(field: SegmentVariantFieldId, segment: Segment): FieldDropdownValue {
	return `${field}__${segment}`
}

function parse_variant_value(value: FieldDropdownValue): { field: SegmentVariantFieldId; segment: Segment } | null {
	if (value === "roas__b2b") return { field: "roas", segment: "b2b" }
	if (value === "roas__b2c") return { field: "roas", segment: "b2c" }
	if (value === "lead_to_deal_cvr__b2b") return { field: "lead_to_deal_cvr", segment: "b2b" }
	if (value === "lead_to_deal_cvr__b2c") return { field: "lead_to_deal_cvr", segment: "b2c" }
	return null
}

function is_selectable_field_value(value: FieldDropdownValue): value is SegmentSelectableFieldId {
	return parse_variant_value(value) == null
}

const dropdown_items: readonly DropdownItem<SegmentSelectableFieldId>[] = selectable_field_ids.map((id) => ({ value: id, label: field_label(id) }))

/* -------------------------------------------------------------------------- */
/* Custom: Local styling overrides                                           */
/* -------------------------------------------------------------------------- */

const help_underline_class = ui.copy.helpUnderline
const help_underline_hover_class = cn(help_underline_class, "hover:decoration-foreground/60")

/* -------------------------------------------------------------------------- */
/* Utils                                                                      */
/* -------------------------------------------------------------------------- */

function format_roas_range(v: Range | null) {
	return v ? `${String(v.min)}-${String(v.max)}×` : SourcesCopy.naLabel
}

function format_cvr_range(v: Range | null) {
	return v ? `${String(v.min)}-${String(v.max)}%` : SourcesCopy.naLabel
}

type UtmValuePart = { text: string; tooltip?: string | null }

type UtmPart = {
	key: UtmField
	label: string
	values: UtmValuePart[]
	labelTooltip?: string | null
}

function utm_parts(v: UtmValues | null): readonly UtmPart[] {
	if (!v) return []

	const term_desc = (token: string) => getTermByToken(token)?.description ?? null
	const is_empty_source = (s?: string | null) => (s ?? "").trim() === "(empty)"
	const parts: UtmPart[] = []

	const variants = v.utm_source_variants ?? []
	const campaign_desc = v?.utm_campaign_description?.trim() ?? null
	const content_desc = v?.utm_content_description?.trim() ?? null
	const term_desc_text = v?.utm_term_description?.trim() ?? null
	const placement_alias = v?.utm_placement_alias?.trim() ?? null

	if (variants.length) {
		const format_list = (s: Set<string>) => Array.from(s).sort().join(", ")
		const plural = (label: string, count: number) => (count > 1 ? `${label}s` : label)

		type SourceMeta = { vendors: Set<string>; placements: Set<string>; placementAliases: Set<string> }
		type PlacementMeta = { vendors: Set<string>; placementAliases: Set<string> }
		const bySource = new Map<string, SourceMeta>()
		const byPlacement = new Map<string, PlacementMeta>()

		for (const variant of variants) {
			const src = variant.utm_source
			const placement = variant.utm_placement
			const placementAlias = variant.placement ?? placement
			const vendor = variant.vendor

			if (src && !is_empty_source(src)) {
				const meta = bySource.get(src) ?? { vendors: new Set<string>(), placements: new Set<string>(), placementAliases: new Set<string>() }
				if (vendor) meta.vendors.add(vendor)
				if (placement) meta.placements.add(placement)
				if (placementAlias) meta.placementAliases.add(placementAlias)
				bySource.set(src, meta)
			}

			if (placement) {
				const meta = byPlacement.get(placement) ?? { vendors: new Set<string>(), placementAliases: new Set<string>() }
				if (vendor) meta.vendors.add(vendor)
				if (placementAlias) meta.placementAliases.add(placementAlias)
				byPlacement.set(placement, meta)
			}
		}

		if (bySource.size) {
			const values: UtmValuePart[] = Array.from(bySource.entries())
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([src, meta]) => {
					const placementAliases = format_list(meta.placementAliases)
					const vendors = format_list(meta.vendors)
					const tooltipParts = [
						vendors ? `${plural("Vendor", meta.vendors.size)}: ${vendors}` : null,
						placementAliases ? `${plural("Placement", meta.placementAliases.size)}: ${placementAliases}` : null,
					].filter(Boolean)
					return { text: src, tooltip: tooltipParts.length ? tooltipParts.join("\n") : null }
				})
			if (values.length) parts.push({ key: "utm_source", label: "utm_source", values, labelTooltip: term_desc("utm_source") })
		}

		if (byPlacement.size) {
			const values: UtmValuePart[] = Array.from(byPlacement.entries())
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([placement, meta]) => {
					const vendors = format_list(meta.vendors)
					const placementAliases = format_list(meta.placementAliases)
					const tooltipParts = [
						vendors ? `${plural("Vendor", meta.vendors.size)}: ${vendors}` : null,
						placementAliases ? `${plural("Placement", meta.placementAliases.size)}: ${placementAliases}` : null,
					].filter(Boolean)
					return { text: placement, tooltip: tooltipParts.length ? tooltipParts.join("\n") : null }
				})
			if (values.length) parts.push({ key: "utm_placement", label: "utm_placement", values, labelTooltip: term_desc("utm_placement") })
		}
	} else {
		if (v.utm_source && !is_empty_source(v.utm_source)) parts.push({ key: "utm_source", label: "utm_source", values: [{ text: v.utm_source }], labelTooltip: term_desc("utm_source") })
		if (v.utm_placement) {
			const tooltip = placement_alias && placement_alias !== v.utm_placement ? placement_alias : null
			parts.push({ key: "utm_placement", label: "utm_placement", values: [{ text: v.utm_placement, tooltip }], labelTooltip: term_desc("utm_placement") })
		}
	}

	if (v.utm_medium) {
		const medium_key = v.utm_medium
		const medium_meta = medium_key in UtmMediumByValue ? UtmMediumByValue[medium_key as keyof typeof UtmMediumByValue] : null
		const medium_reason = v.utm_medium_description ?? medium_meta?.description ?? null
		parts.push({ key: "utm_medium", label: "utm_medium", values: [{ text: medium_key, tooltip: medium_reason }], labelTooltip: term_desc("utm_medium") })
	}

	if (v.utm_campaign) parts.push({ key: "utm_campaign", label: "utm_campaign", values: [{ text: v.utm_campaign, tooltip: campaign_desc }], labelTooltip: term_desc("utm_campaign") })
	if (v.utm_content) parts.push({ key: "utm_content", label: "utm_content", values: [{ text: v.utm_content, tooltip: content_desc }], labelTooltip: term_desc("utm_content") })
	if (v.utm_term) parts.push({ key: "utm_term", label: "utm_term", values: [{ text: v.utm_term, tooltip: term_desc_text }], labelTooltip: term_desc("utm_term") })

	const order: readonly UtmField[] = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_placement"]
	const idx = (k: UtmField) => order.indexOf(k)

	return parts.sort((a, b) => idx(a.key) - idx(b.key))
}

function format_utm_export(v: UtmValues | null) {
	const parts = utm_parts(v)
	return parts.length ? parts.map((p) => `${p.label}=${p.values.map((x) => x.text).join(",")}`).join(" | ") : ""
}

function resolve_field_id(segment: Segment, id: SegmentSelectableFieldId): SourceFieldId {
	if (id === "roas") return segment === "b2b" ? "b2b_roas_range" : "b2c_roas_range"
	if (id === "lead_to_deal_cvr") return segment === "b2b" ? "b2b_lead_to_deal_cvr_range" : "b2c_lead_to_deal_cvr_range"
	return id
}

function field_info(segment: Segment, id: SegmentSelectableFieldId) {
	const source_field_id = resolve_field_id(segment, id)
	return SourceFieldDefinitions[source_field_id]?.description?.trim() ?? ""
}

function value_for_export(segment: Segment, r: Source, k: SegmentSelectableFieldId) {
	const resolved = resolve_field_id(segment, k)
	if (resolved === "spend_ids") return r.spend_ids.join(", ")
	if (resolved === "b2b_roas_range") return r.b2b_roas_range ? format_roas_range(r.b2b_roas_range) : ""
	if (resolved === "b2c_roas_range") return r.b2c_roas_range ? format_roas_range(r.b2c_roas_range) : ""
	if (resolved === "b2b_lead_to_deal_cvr_range") return r.b2b_lead_to_deal_cvr_range ? format_cvr_range(r.b2b_lead_to_deal_cvr_range) : ""
	if (resolved === "b2c_lead_to_deal_cvr_range") return r.b2c_lead_to_deal_cvr_range ? format_cvr_range(r.b2c_lead_to_deal_cvr_range) : ""
	if (resolved === "utm") return format_utm_export(r.utm)
	if (resolved === "vendor") return r.vendor.join(", ")
	if (resolved === "description") return r.description_long ?? ""
	return ""
}

function clamp_01(v: number) {
	return Math.max(0, Math.min(1, v))
}

const is_spend_panel_id = (value: string): value is SpendPanel["id"] => SpendCopy.panels.some((panel) => panel.id === value)

const spend_pillar_by_id = SpendCopy.pillars.reduce(
	(acc, pillar) => {
		acc[pillar.id] = pillar
		return acc
	},
	{} as Record<SpendPillar["id"], SpendPillar>
)

function compute_scale(rows: readonly Source[], segment: Segment, id: SegmentSelectableFieldId) {
	const resolved = resolve_field_id(segment, id)
	const pick = (r: Source): Range | null => {
		if (resolved === "b2b_roas_range") return r.b2b_roas_range ?? null
		if (resolved === "b2c_roas_range") return r.b2c_roas_range ?? null
		if (resolved === "b2b_lead_to_deal_cvr_range") return r.b2b_lead_to_deal_cvr_range ?? null
		if (resolved === "b2c_lead_to_deal_cvr_range") return r.b2c_lead_to_deal_cvr_range ?? null
		return null
	}

	let min_all = Number.POSITIVE_INFINITY
	let max_all = Number.NEGATIVE_INFINITY
	for (const r of rows) {
		const v = pick(r)
		if (!v) continue
		if (Number.isFinite(v.min)) min_all = Math.min(min_all, v.min)
		if (Number.isFinite(v.max)) max_all = Math.max(max_all, v.max)
	}
	return !Number.isFinite(min_all) || !Number.isFinite(max_all) || max_all <= min_all ? null : { min: min_all, max: max_all }
}

function normalize_range(v: Range, scale: { min: number; max: number }) {
	const span = Math.max(1e-9, scale.max - scale.min)
	const left = clamp_01((v.min - scale.min) / span)
	const right = clamp_01((v.max - scale.min) / span)
	return { left, width: Math.max(0, right - left) }
}

function benchmark_tooltip_for(row: Source, resolved: ReturnType<typeof resolve_field_id>) {
	const b = BenchmarksBySourceL3[row.source_l3]
	if (!b) return null
	if (resolved === "b2b_roas_range") return b.b2b_roas_description ?? null
	if (resolved === "b2c_roas_range") return b.b2c_roas_description ?? null
	if (resolved === "b2b_lead_to_deal_cvr_range") return b.b2b_lead_to_deal_cvr_description ?? null
	if (resolved === "b2c_lead_to_deal_cvr_range") return b.b2c_lead_to_deal_cvr_description ?? null
	return null
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function MetricHeaderInline({ metric_id }: { metric_id: "source_l1" | "source_l2" | "source_l3" }) {
	const def = MetricDefinitions[metric_id]
	const label = def?.alias ?? metric_id
	const info = def?.description?.trim()
	if (!info) return <span>{label}</span>

	return <Renderer.Help.Text label={label} description={info} className={help_underline_hover_class} />
}

function HierarchyLevelActionButton({ label, symbol, onClick }: { label: string; symbol: "+" | "-"; onClick: () => void }) {
	return (
		<Button
			variant="ghost"
			size="iconXs"
			type="button"
			onClick={onClick}
			aria-label={label}
			title={label}
			className={ui.hierarchy.sectionActionButton}
		>
			<span className={ui.hierarchy.symbol} aria-hidden="true">
				{symbol}
			</span>
		</Button>
	)
}

function SpendChip({ id }: { id: SpendId }) {
	return <Renderer.Spend.Pill id={id} />
}

function UTMCell({ v }: { v: UtmValues | null }) {
	const parts = utm_parts(v)
	if (!parts.length) return <NaText />

	const render_with_tooltip = (node: React.ReactNode, tooltip?: string | null) => {
		const tip = tooltip?.trim()
		if (!tip) return node
		const render_tip = () =>
			tip.includes("\n") ? (
				<div className={ui.hierarchy.detailStack}>
					{tip.split("\n").map((line, idx) => (
						<div key={idx}>{line}</div>
					))}
				</div>
			) : (
				tip
			)
		return <Renderer.Help.Text label={node} description={render_tip()} className={help_underline_hover_class} />
	}

	return (
		<div className={ui.hierarchy.detailStack}>
			{parts.map((p) => (
				<div key={`${p.key}-${p.values.map((v) => v.text).join(",")}`} className={ui.hierarchy.detailInlineList}>
					{render_with_tooltip(<span>{p.label}</span>, p.labelTooltip)}
					<span aria-hidden="true">=</span>
					{p.values.map((val, idx) => (
						<React.Fragment key={`${p.key}-${val.text}-${idx}`}>
							{render_with_tooltip(<span>{val.text}</span>, val.tooltip)}
							{idx < p.values.length - 1 ? <span aria-hidden="true">,</span> : null}
						</React.Fragment>
					))}
				</div>
			))}
		</div>
	)
}

function RangeBar({ value, scale, className }: { value: Range; scale: { min: number; max: number } | null; className?: string }) {
	const pos = scale ? normalize_range(value, scale) : { left: 0, width: 0 }
	return (
		<div className={cn(ui.hierarchy.rangeWrap, className)}>
			<div className={ui.hierarchy.rangeTrack}>
				<div className={ui.hierarchy.rangeFill} style={{ left: `${(pos.left * 100).toFixed(3)}%`, width: `${(pos.width * 100).toFixed(3)}%` }} />
			</div>
		</div>
	)
}

function RangeCell({ label, value, scale, tooltip }: { label: string; value: Range | null; scale: { min: number; max: number } | null; tooltip?: string | null }) {
	if (!value)
		return (
			<div className={ui.hierarchy.rangeCell}>
				<div style={{ width: ui.hierarchy.rangeLabelWidth }} className={ui.hierarchy.rangeLabel}>
					<NaText />
				</div>
				<div className={ui.hierarchy.rangeRailWrap}>
					<div className={ui.hierarchy.rangeEmptyTrack} />
				</div>
			</div>
		)

	const tip = tooltip?.trim()
	return (
		<div className={ui.hierarchy.rangeCell}>
			<div style={{ width: ui.hierarchy.rangeLabelWidth }} className={ui.hierarchy.rangeLabel}>
				{tip ? (
					<Renderer.Help.Text label={label} description={tip} className={help_underline_hover_class} />
				) : (
					<span className="break-words">{label}</span>
				)}
			</div>
			<div className={ui.hierarchy.rangeRailWrap}>
				<RangeBar value={value} scale={scale} />
			</div>
		</div>
	)
}

function FourthCell({ segment, row, id, scale }: { segment: Segment; row: Source; id: SegmentSelectableFieldId; scale: { min: number; max: number } | null }) {
	const resolved = resolve_field_id(segment, id)

	if (resolved === "spend_ids")
		return row.spend_ids.length ? (
			<div className={ui.hierarchy.detailInlineListComfortable}>
				{row.spend_ids.map((sid) => (
					<SpendChip key={sid} id={sid} />
				))}
			</div>
		) : (
			<NaText />
		)
	if (resolved === "b2b_roas_range") return <RangeCell value={row.b2b_roas_range ?? null} scale={scale} label={row.b2b_roas_range ? format_roas_range(row.b2b_roas_range) : SourcesCopy.naLabel} tooltip={benchmark_tooltip_for(row, resolved)} />
	if (resolved === "b2c_roas_range") return <RangeCell value={row.b2c_roas_range ?? null} scale={scale} label={row.b2c_roas_range ? format_roas_range(row.b2c_roas_range) : SourcesCopy.naLabel} tooltip={benchmark_tooltip_for(row, resolved)} />
	if (resolved === "b2b_lead_to_deal_cvr_range")
		return <RangeCell value={row.b2b_lead_to_deal_cvr_range ?? null} scale={scale} label={row.b2b_lead_to_deal_cvr_range ? format_cvr_range(row.b2b_lead_to_deal_cvr_range) : SourcesCopy.naLabel} tooltip={benchmark_tooltip_for(row, resolved)} />
	if (resolved === "b2c_lead_to_deal_cvr_range")
		return <RangeCell value={row.b2c_lead_to_deal_cvr_range ?? null} scale={scale} label={row.b2c_lead_to_deal_cvr_range ? format_cvr_range(row.b2c_lead_to_deal_cvr_range) : SourcesCopy.naLabel} tooltip={benchmark_tooltip_for(row, resolved)} />
	if (resolved === "utm") return <UTMCell v={row.utm} />
	if (resolved === "vendor")
		return row.vendor.length ? (
			<div className={ui.hierarchy.detailInlineList}>
				{row.vendor.map((name, idx) => {
					const desc = VendorDescriptionByName[name]?.trim()
					const text = <Renderer.Copy.InlineText text={name} keyPrefix={`${plays_key_prefix}-vendor-${row.source_l3}-${name}`} />
					const rendered = desc ? (
						<Renderer.Help.Text label={text} description={desc} className={help_underline_hover_class} />
					) : (
						text
					)
					return (
						<React.Fragment key={`${row.source_l3}-vendor-${name}-${idx}`}>
							{rendered}
							{idx < row.vendor.length - 1 ? <span aria-hidden="true">,</span> : null}
						</React.Fragment>
					)
				})}
			</div>
		) : (
			<NaText />
		)
	if (resolved === "description") return row.description_long ? <Renderer.Copy.InlineText text={row.description_long} keyPrefix={`${plays_key_prefix}-desc-${row.source_l3}`} /> : <NaText />
	return <NaText />
}

function FieldDropdown({
	value,
	pendingVariantFor,
	onSelectField,
	onStartVariantSelection,
	onSelectVariant,
	onMenuOpenChange,
	segment,
}: {
	value: SegmentSelectableFieldId
	pendingVariantFor: SegmentVariantFieldId | null
	onSelectField: (v: SegmentSelectableFieldId) => void
	onStartVariantSelection: (field: SegmentVariantFieldId) => void
	onSelectVariant: (field: SegmentVariantFieldId, segment: Segment) => void
	onMenuOpenChange: (open: boolean) => void
	segment: Segment
}) {
	const label_text = field_header_label(value, segment)
	const label_info = field_info(segment, value)
	const items_with_tooltips: readonly DropdownItem<FieldDropdownValue>[] = React.useMemo(() => {
		const out: DropdownItem<FieldDropdownValue>[] = []
		for (const item of dropdown_items) {
			const info = field_info(segment, item.value)
			const text = typeof item.label === "string" ? item.label : String(item.label)
			const base_label = info ? <Renderer.Help.Text label={text} description={info} className={help_underline_hover_class} /> : text
			const show_inline_choices = pendingVariantFor != null && item.value === pendingVariantFor && requires_segment_variant(item.value)
			const variant_field: SegmentVariantFieldId | null = show_inline_choices ? pendingVariantFor : null
			out.push({
				...item,
				value: item.value,
				label: base_label,
				inlineChoicesOnly: !!variant_field,
				inlineChoices: variant_field
					? [
							{ label: "B2B", value: make_variant_value(variant_field, "b2b") },
							{ label: "B2C", value: make_variant_value(variant_field, "b2c") },
						]
					: undefined,
			})
		}
		return out
	}, [pendingVariantFor, segment])

	const on_dropdown_change = React.useCallback(
		(next: FieldDropdownValue) => {
			const parsed = parse_variant_value(next)
			if (parsed) {
				onSelectVariant(parsed.field, parsed.segment)
				return
			}
			if (!is_selectable_field_value(next)) return
			if (requires_segment_variant(next)) {
				onStartVariantSelection(next)
				return
			}
			onSelectField(next)
		},
		[onSelectField, onSelectVariant, onStartVariantSelection]
	)

	const on_dropdown_item_select = React.useCallback((next: FieldDropdownValue) => {
		if (parse_variant_value(next)) return "close" as const
		if (!is_selectable_field_value(next)) return "close" as const
		if (requires_segment_variant(next)) return "keep-open" as const
		return "close" as const
	}, [])

	const trigger_label = (
		<span className={cn("flex w-full min-w-0 items-center", ui.typography.body)}>
			{label_info ? (
				<Renderer.Help.Text
					label={label_text}
					description={label_info}
					className={cn(help_underline_hover_class, "min-w-0 flex-1 truncate text-left")}
				/>
			) : (
				<span className={cn("min-w-0 flex-1 truncate text-left", ui.typography.body)}>
					{label_text}
				</span>
			)}
		</span>
	)
	return (
		<Dropdown
			value={value}
			onChange={on_dropdown_change}
			onItemSelect={on_dropdown_item_select}
			onOpenChange={onMenuOpenChange}
			items={items_with_tooltips}
			align="stretch"
			ariaLabel={SourcesCopy.fieldDropdownLabel}
			triggerLabel={trigger_label}
			widthClassName="w-full"
			menuOffsetPx={0}
			triggerClassName={ui.nav.control.height}
			itemLabelClassName={ui.typography.body}
			suspendTooltipsWhenOpen={false}
		/>
	)
}

function uniq_sorted(xs: readonly string[]) {
	return Array.from(new Set(xs)).sort((a, b) => a.localeCompare(b))
}

function parse_open_group_keys(value: string | null) {
	if (!value) return null
	try {
		const parsed = JSON.parse(value)
		return Array.isArray(parsed) && parsed.every((item) => typeof item === "string") ? parsed : null
	} catch {
		return null
	}
}

function set_group_key_state(current_keys: readonly string[], level_keys: readonly string[], should_open: boolean) {
	const next = new Set(current_keys)
	for (const key of level_keys) {
		if (should_open) next.add(key)
		else next.delete(key)
	}
	return Array.from(next)
}

function render_spend_text(txt?: string, key_prefix = `${plays_key_prefix}-spend-desc`) {
	return txt ? <Renderer.Copy.InlineText text={txt} keyPrefix={key_prefix} /> : null
}

function SourceL3Tooltip({ label, description }: { label: string; description: string }) {
	return <Renderer.Help.Text label={label} description={description} side="bottom" align="start" className={help_underline_class} />
}

/* -------------------------------------------------------------------------- */
/* Custom: Spend bar                                                         */
/* -------------------------------------------------------------------------- */

type SpendBarItem = { id: SpendPanel["id"]; title: string; body: string }

const spend_bar_tabs = SpendCopy.panels.map((p) => ({ id: p.id, title: p.title, body: p.body })) as readonly SpendBarItem[]
const spend_scroller_id = "plays-spend-scroller"

function SpendBar({ value, onChange }: { value: SpendPanel["id"]; onChange: (v: SpendPanel["id"]) => void }) {
	const rail = useMotionPillRail<SpendPanel["id"]>({ activeKey: value, spring: uiMotion.nav.pillSpring })
	const spend_tab_order = React.useMemo(() => spend_bar_tabs.map((tab) => tab.id), [])

	const on_change = React.useCallback(
		(next: string) => {
			if (is_spend_panel_id(next)) onChange(next)
		},
		[onChange]
	)

	const ensure_visible = React.useCallback(
		(id: SpendPanel["id"], behavior: ScrollBehavior = "smooth") => {
			const btn = rail.triggerRefs.current[id]
			if (!btn) return
			scrollIntoHorizontalView(btn, { behavior, align: "center" })
			rail.pill.measureRaf()
		},
		[rail.pill, rail.triggerRefs]
	)

	React.useEffect(() => {
		ensure_visible(value, "smooth")
	}, [ensure_visible, value])

	const on_key_down = React.useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return
			e.preventDefault()

			const idx = spend_tab_order.indexOf(value)
			if (idx < 0) return

			const next =
				e.key === "Home"
					? spend_tab_order[0]
					: e.key === "End"
						? spend_tab_order[spend_tab_order.length - 1]
						: e.key === "ArrowLeft"
							? spend_tab_order[Math.max(0, idx - 1)]
							: spend_tab_order[Math.min(spend_tab_order.length - 1, idx + 1)]

			if (!next || next === value) return
			onChange(next)

			requestAnimationFrame(() => {
				rail.triggerRefs.current[next]?.focus?.()
				ensure_visible(next, "auto")
			})
		},
		[ensure_visible, onChange, rail.triggerRefs, spend_tab_order, value]
	)

	return (
		<PillRoot value={value} onValueChange={on_change} className="w-full">
			<Bar variant="shell" ariaLabel={SpendCopy.ui.spendBarLabel} className="w-full">
				{({ scrollerRef, canScrollLeft, canScrollRight, scrollByPage }) => (
					<>
						{canScrollLeft ? (
							<div className="absolute top-1/2 z-30 -translate-y-1/2" style={{ left: ui.nav.arrow.insetRem }}>
								<BarScrollButton
									dir="left"
									onClick={() => scrollByPage("left")}
									ariaLabel={`${SpendCopy.ui.spendBarLabel}: scroll left`}
									controlsId={spend_scroller_id}
								/>
							</div>
						) : null}

						{canScrollRight ? (
							<div className="absolute top-1/2 z-30 -translate-y-1/2" style={{ right: ui.nav.arrow.insetRem }}>
								<BarScrollButton
									dir="right"
									onClick={() => scrollByPage("right")}
									ariaLabel={`${SpendCopy.ui.spendBarLabel}: scroll right`}
									controlsId={spend_scroller_id}
								/>
							</div>
						) : null}

						<BarScroller id={spend_scroller_id} scrollerRef={scrollerRef} canScrollLeft={canScrollLeft} canScrollRight={canScrollRight}>
							<BarRail className={ui.nav.pad}>
								<PillList ref={rail.listRef} onKeyDown={on_key_down} chrome={false} className={cn(ui.nav.rail.listChrome, ui.nav.control.height, "items-center")}>
									<MotionPillIndicator className={cn(ui.nav.rail.indicatorChrome, ui.nav.control.height, ui.radius.control)} pill={rail.pill} transition={uiMotion.nav.pillTween} />

									{spend_bar_tabs.map((t) => {
										const is_active = value === t.id
										const text_tone = is_active ? ui.text.default.fg : ui.text.interactive.all

										return (
											<PillTrigger
												key={t.id}
												value={t.id}
												ref={rail.getTriggerRef(t.id)}
												className={cn(ui.nav.rail.triggerChrome, "shrink-0")}
												title={t.body}
												aria-label={t.body ? `${t.title}. ${t.body}` : t.title}
												onPressPreview={() => {
													ensure_visible(t.id, "auto")
													rail.pill.measureRaf()
												}}
											>
												<span className={cn("relative z-10", ui.typography.label, ui.motion.duration, text_tone)}>
													<Renderer.Copy.InlineText text={t.title} keyPrefix={`${plays_key_prefix}-spend-tab-${t.id}`} />
												</span>
											</PillTrigger>
										)
									})}
								</PillList>
							</BarRail>
						</BarScroller>
					</>
				)}
			</Bar>
		</PillRoot>
	)
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function TabPlays() {
	const sources = React.useMemo(
		() =>
			[...listSources()].sort(
				(a, b) => a.source_l1.localeCompare(b.source_l1) || a.source_l2.localeCompare(b.source_l2) || a.source_l3.localeCompare(b.source_l3)
			),
		[]
	)

	const [segment, set_segment] = React.useState<Segment>("b2b")
	const [field_id, set_field_id] = React.useState<SegmentSelectableFieldId>("description")
	const [pending_variant_for, set_pending_variant_for] = React.useState<SegmentVariantFieldId | null>(null)
	const [spend_view, set_spend_view] = React.useState<SpendPanel["id"]>("1")
	const tab = TabById["plays"]

	React.useEffect(() => {
		const stored_segment = read_preference(PlaybookStorage.plays.segment) as Segment | null
		if (stored_segment === "b2b" || stored_segment === "b2c") set_segment(stored_segment)

		const stored_field = read_preference(PlaybookStorage.plays.field) as SegmentSelectableFieldId | null
		if (stored_field && selectable_field_ids.includes(stored_field)) set_field_id(stored_field)

		const stored_view = read_preference(PlaybookStorage.plays.spendView) as SpendPanel["id"] | null
		if (stored_view && SpendCopy.panels.some((p) => p.id === stored_view)) set_spend_view(stored_view)
	}, [])

	const on_field_change = React.useCallback((next: SegmentSelectableFieldId) => {
		set_pending_variant_for(null)
		set_field_id(next)
		write_preference(PlaybookStorage.plays.field, next)
	}, [])

	const on_variant_selection_start = React.useCallback((field: SegmentVariantFieldId) => {
		set_pending_variant_for(field)
	}, [])

	const on_variant_select = React.useCallback((field: SegmentVariantFieldId, next_segment: Segment) => {
		set_segment(next_segment)
		write_preference(PlaybookStorage.plays.segment, next_segment)
		set_field_id(field)
		write_preference(PlaybookStorage.plays.field, field)
		set_pending_variant_for(null)
	}, [])

	const on_field_dropdown_open_change = React.useCallback((open: boolean) => {
		if (!open) set_pending_variant_for(null)
	}, [])

	const scale = React.useMemo(() => compute_scale(sources, segment, field_id), [field_id, segment, sources])
	const source_level_definitions = React.useMemo(
		() =>
			[
				{
					id: "source_l1",
					header: <MetricHeaderInline metric_id="source_l1" />,
					getValue: (row: Source) => row.source_l1,
					getLabel: (row: Source) => <Renderer.Copy.InlineText text={row.source_l1} keyPrefix={`${plays_key_prefix}-source-l1-${stableKeyFromText(row.source_l1, "source-l1")}`} />,
					defaultExpanded: true,
				},
				{
					id: "source_l2",
					header: <MetricHeaderInline metric_id="source_l2" />,
					getValue: (row: Source) => row.source_l2,
					getLabel: (row: Source) => <Renderer.Copy.InlineText text={row.source_l2} keyPrefix={`${plays_key_prefix}-source-l2-${stableKeyFromText(`${row.source_l1}-${row.source_l2}`, "source-l2")}`} />,
					defaultExpanded: false,
				},
				{
					id: "source_l3",
					header: <MetricHeaderInline metric_id="source_l3" />,
					getValue: (row: Source) => row.source_l3,
					getLabel: (row: Source) => <Renderer.Copy.InlineText text={row.source_l3} keyPrefix={`${plays_key_prefix}-source-l3-${stableKeyFromText(`${row.source_l2}-${row.source_l3}`, "source-l3")}`} />,
				},
			] as const,
		[]
	)
	const default_hierarchy_open_keys = React.useMemo(
		() =>
			source_level_definitions.flatMap((level, depth) => {
				if (!("defaultExpanded" in level) || !level.defaultExpanded) return []
				const ancestor_levels = source_level_definitions.slice(0, depth + 1)
				const keys = new Set<string>()
				for (const row of sources) {
					const key = ancestor_levels.map((ancestor) => `${ancestor.id}:${ancestor.getValue(row)}`).join("__")
					keys.add(key)
				}
				return Array.from(keys)
			}),
		[source_level_definitions, sources]
	)
	const hierarchy_group_keys_by_depth = React.useMemo(() => {
		return source_level_definitions.map((_, depth) => {
			const levels_to_depth = source_level_definitions.slice(0, depth + 1)
			const keys = new Set<string>()
			for (const row of sources) keys.add(levels_to_depth.map((level) => `${level.id}:${level.getValue(row)}`).join("__"))
			return Array.from(keys)
		})
	}, [source_level_definitions, sources])
	const [open_group_keys, set_open_group_keys] = React.useState<readonly string[]>(default_hierarchy_open_keys)

	React.useEffect(() => {
		const stored = parse_open_group_keys(read_preference(PlaybookStorage.plays.sourcesHierarchyOpen))
		if (stored) {
			set_open_group_keys(stored)
			return
		}
		set_open_group_keys(default_hierarchy_open_keys)
	}, [default_hierarchy_open_keys])

	const on_open_group_keys_change = React.useCallback((next: readonly string[]) => {
		set_open_group_keys(next)
		write_preference(PlaybookStorage.plays.sourcesHierarchyOpen, JSON.stringify(next))
	}, [])

	const source_l1_group_keys = React.useMemo(() => hierarchy_group_keys_by_depth[0] ?? [], [hierarchy_group_keys_by_depth])
	const source_l2_group_keys = React.useMemo(() => hierarchy_group_keys_by_depth[1] ?? [], [hierarchy_group_keys_by_depth])
	const l1_all_open = source_l1_group_keys.every((key) => open_group_keys.includes(key))
	const l2_all_open = source_l2_group_keys.every((key) => open_group_keys.includes(key))

	const on_source_l1_action = React.useCallback(() => {
		on_open_group_keys_change(set_group_key_state(open_group_keys, source_l1_group_keys, !l1_all_open))
	}, [l1_all_open, on_open_group_keys_change, open_group_keys, source_l1_group_keys])

	const on_source_l2_action = React.useCallback(() => {
		on_open_group_keys_change(set_group_key_state(open_group_keys, source_l2_group_keys, !l2_all_open))
	}, [l2_all_open, on_open_group_keys_change, open_group_keys, source_l2_group_keys])

	const source_levels = React.useMemo(
		() =>
			[
				{
					...source_level_definitions[0],
					sectionAction: <HierarchyLevelActionButton label={l1_all_open ? SourcesCopy.collapseL1Label : SourcesCopy.expandL1Label} symbol={l1_all_open ? "-" : "+"} onClick={on_source_l1_action} />,
				},
				{
					...source_level_definitions[1],
					sectionAction: <HierarchyLevelActionButton label={l2_all_open ? SourcesCopy.collapseL2Label : SourcesCopy.expandL2Label} symbol={l2_all_open ? "-" : "+"} onClick={on_source_l2_action} />,
				},
				source_level_definitions[2],
			] as const,
		[l1_all_open, l2_all_open, on_source_l1_action, on_source_l2_action, source_level_definitions]
	)

	const header_field_id = resolve_field_id(segment, field_id)
	const export_headers = React.useMemo(() => [...static_export_headers, header_field_id], [header_field_id])
	const export_rows = React.useMemo(() => sources.map((s) => [s.source_l1, s.source_l2, s.source_l3, value_for_export(segment, s, field_id)]), [field_id, segment, sources])
	const on_export = React.useCallback(() => downloadCsv(`sources_${segment}_${field_id}.csv`, export_headers, export_rows), [export_headers, export_rows, field_id, segment])

	const reduce_motion = useReducedMotionBool()
	const enter_transition: Transition = reduce_motion ? uiMotion.frameworks.enter.reduced : uiMotion.frameworks.enter.spring

	const brand_pillar = spend_pillar_by_id.brand
	const perf_pillar = spend_pillar_by_id.performance
	const inbound_rows = React.useMemo(() => sources.filter((r) => r.source_l1 === "Inbound" && r.spend_ids.length), [sources])

	const l3_desc_by_name = React.useMemo(() => {
		const map = new Map<string, string>()
		for (const r of inbound_rows) {
			const d = r.description_short?.trim()
			if (d) map.set(r.source_l3, d)
		}
		return map
	}, [inbound_rows])

	const source_l3_by_spend = React.useMemo<Record<SpendId, string[]>>(
		() => ({
			brand: uniq_sorted(inbound_rows.filter((r) => r.spend_ids.includes("brand")).map((r) => r.source_l3)),
			performance: uniq_sorted(inbound_rows.filter((r) => r.spend_ids.includes("performance")).map((r) => r.source_l3)),
			commission: uniq_sorted(inbound_rows.filter((r) => r.spend_ids.includes("commission")).map((r) => r.source_l3)),
			overhead: uniq_sorted(inbound_rows.filter((r) => r.spend_ids.includes("overhead")).map((r) => r.source_l3)),
		}),
		[inbound_rows]
	)

	const spend_card_ref = React.useRef<HTMLDivElement | null>(null)
	const spend_scroll_anchor = React.useRef<number | null>(null)
	const on_spend_view_change = React.useCallback(
		(value: SpendPanel["id"]) => {
			spend_scroll_anchor.current = spend_card_ref.current?.getBoundingClientRect().top ?? null
			write_preference(PlaybookStorage.plays.spendView, value)
			set_spend_view(value)
		},
		[]
	)

	React.useEffect(() => {
		if (typeof window === "undefined") return
		const on_spend_event = (event: Event) => {
			const detail = (event as CustomEvent<{ view?: string }>).detail
			const next = detail?.view
			if (!next || !is_spend_panel_id(next)) return
			on_spend_view_change(next)
		}
		window.addEventListener(PlaybookEvents.spendView, on_spend_event as EventListener)
		return () => window.removeEventListener(PlaybookEvents.spendView, on_spend_event as EventListener)
	}, [on_spend_view_change])

	type CardContent = { body?: string; bullets: readonly SpendBullet[] }
	const panel = React.useMemo(() => SpendCopy.panels.find((p) => p.id === spend_view), [spend_view])

	const get_card_content = React.useCallback(
		(pillar_id: "brand" | "performance", fallback: SpendPillar | undefined): CardContent => {
			if (spend_view === "4") return { bullets: source_l3_by_spend[pillar_id].map((t) => ({ text: t })) }
			const section = panel?.sections?.find((s) => s.id === pillar_id)
			return {
				body: (section as { body?: string } | undefined)?.body ?? fallback?.body,
				bullets: (section as { bullets?: readonly SpendBullet[] } | undefined)?.bullets ?? fallback?.bullets ?? [],
			}
		},
		[panel, source_l3_by_spend, spend_view]
	)

	const brand_content = React.useMemo(() => get_card_content("brand", brand_pillar), [brand_pillar, get_card_content])
	const perf_content = React.useMemo(() => get_card_content("performance", perf_pillar), [get_card_content, perf_pillar])

	const render_spend_bullet = React.useCallback(
		(txt: string) => {
			if (spend_view !== "4") {
				const key = stableKeyFromText(txt, `${plays_key_prefix}-spend-${spend_view}-bullet`)
				return <Renderer.Copy.InlineText text={txt} keyPrefix={key} />
			}
			const desc = l3_desc_by_name.get(txt)
			return desc ? <SourceL3Tooltip label={txt} description={desc} /> : txt
		},
		[l3_desc_by_name, spend_view]
	)

	React.useLayoutEffect(() => {
		const anchor = spend_scroll_anchor.current
		if (anchor == null) return
		if (typeof window === "undefined") {
			spend_scroll_anchor.current = null
			return
		}

		const card = spend_card_ref.current
		if (!card) {
			spend_scroll_anchor.current = null
			return
		}

		const current = card.getBoundingClientRect().top
		const delta = current - anchor
		if (Math.abs(delta) > 0.5) window.scrollBy({ top: delta })
		spend_scroll_anchor.current = null
	}, [spend_view])

	return (
		<Renderer.Provider>
			<PbTabShell tabId="plays" alias={tab.alias} description={tab.description} keyPrefix={`${plays_key_prefix}-intro`}>
				<PbReveal className="w-full" ref={spend_card_ref} data-search-target={SearchTargets.plays.spendCard}>
					<PbTabCard hover shadow className="w-full">
						<PbCardLayer>
							<PbCardHeader
								title={
									<span className={ui.typography.title.lg}>
										<Renderer.Copy.InlineText text={SpendCopy.title} keyPrefix={`${plays_key_prefix}-spend-title`} />
									</span>
								}
								description={null}
							/>
							<PbCardContent className="relative">
								<div className={cn("flex flex-col", ui.gap.sm)}>
									<SpendBar value={spend_view} onChange={on_spend_view_change} />
									{panel?.body ? (
										<motion.div key={`spend-desc-${spend_view}`} initial={!reduce_motion ? { opacity: 0, y: 8 } : false} animate={{ opacity: 1, y: 0 }} transition={enter_transition}>
											<div
												className={cn(
													ui.radius.base,
													ui.surface.structure.border,
													ui.surface.structure.shadowNone,
													ui.motion.duration,
													ui.component.outline.hover,
													"bg-background px-4 py-3"
												)}
											>
												<PbSubtleText size="body">
													<Renderer.Copy.InlineText text={panel.body} keyPrefix={`${plays_key_prefix}-spend-panel-${panel.id}`} />
												</PbSubtleText>
											</div>
										</motion.div>
									) : null}

									<motion.div key={spend_view} initial={!reduce_motion ? { opacity: 0, y: 8 } : false} animate={{ opacity: 1, y: 0 }} transition={enter_transition}>
										<div className={cn("grid grid-cols-2 items-stretch", ui.gap.sm)}>
											{brand_pillar ? (
												<PbTabPanel glow="red" className="flex h-full flex-col">
													<PbCardLayer>
														<div className={cn("flex items-start", ui.gap.sm)}>
															<Renderer.Spend.Pill id="brand" className={cn("px-4 py-2", ui.typography.title.md)} />
														</div>

														{brand_content.body ? (
															<p className={cn(ui.margin.topSm, "leading-relaxed text-muted-foreground", ui.typography.body)}>
																{render_spend_text(brand_content.body, `${plays_key_prefix}-spend-brand-${spend_view}`)}
															</p>
														) : null}

														<PbBulletList className={ui.margin.topSm} items={brand_content.bullets.map((b) => b.text)} renderItem={(text) => render_spend_bullet(text)} />
													</PbCardLayer>
												</PbTabPanel>
											) : null}

											{perf_pillar ? (
												<PbTabPanel glow="purple" className="flex h-full flex-col">
													<PbCardLayer>
														<div className={cn("flex items-start", ui.gap.sm)}>
															<Renderer.Spend.Pill id="performance" className={cn("px-4 py-2", ui.typography.title.md)} />
														</div>

														{perf_content.body ? (
															<p className={cn(ui.margin.topSm, "leading-relaxed text-muted-foreground", ui.typography.body)}>
																{render_spend_text(perf_content.body, `${plays_key_prefix}-spend-performance-${spend_view}`)}
															</p>
														) : null}

														<PbBulletList className={ui.margin.topSm} items={perf_content.bullets.map((b) => b.text)} renderItem={(text) => render_spend_bullet(text)} />
													</PbCardLayer>
												</PbTabPanel>
											) : null}
										</div>
									</motion.div>

								</div>
							</PbCardContent>
						</PbCardLayer>
					</PbTabCard>
				</PbReveal>

				<PbReveal className="w-full" data-search-target={SearchTargets.plays.sourcesCard}>
					<PbTabCard hover glow="blue">
						<PbCardLayer>
							<PbCardHeader
								className="flex-col items-stretch sm:flex-row sm:items-center"
								title={
									<span className={ui.typography.title.lg}>
										<Renderer.Copy.InlineText text={SourcesCopy.title} keyPrefix={`${plays_key_prefix}-sources-title`} />
									</span>
								}
								description={
									<PbSubtleText size="body">
										<Renderer.Copy.InlineText text={SourcesCopy.body} keyPrefix={`${plays_key_prefix}-sources-desc`} />
									</PbSubtleText>
								}
								action={
									<div className={cn("flex flex-wrap items-center justify-start", ui.gap.sm)}>
										<Button variant="success" size="sm" onClick={on_export} type="button">
											<Download className={ui.iconNude.lg} />
											<span>
												<Renderer.Copy.InlineText text={SourcesCopy.downloadLabel} keyPrefix={`${plays_key_prefix}-sources-download`} />
											</span>
										</Button>
									</div>
								}
							/>

							<PbCardContent>
								<div className={cn("flex flex-col", ui.gap.sm)}>
									<div className={ui.hierarchy.fieldRow}>
										<FieldDropdown
											value={field_id}
											pendingVariantFor={pending_variant_for}
											onSelectField={on_field_change}
											onStartVariantSelection={on_variant_selection_start}
											onSelectVariant={on_variant_select}
											onMenuOpenChange={on_field_dropdown_open_change}
											segment={segment}
										/>
									</div>

									<Hierarchy
										rows={sources}
										levels={source_levels}
										getRowKey={(row) => `${row.source_l1}__${row.source_l2}__${row.source_l3}`}
										getLeafLayout={() => (field_id === "description" ? "text" : "compact")}
										openGroupKeys={open_group_keys}
										onOpenGroupKeysChange={on_open_group_keys_change}
										getLeafProps={(row) => ({
											"data-search-target": search_target_for_source(row.source_l3),
										})}
										renderDetail={(row) => <FourthCell segment={segment} row={row} id={field_id} scale={scale} />}
										showTrail={false}
										className="w-full"
									/>
								</div>
							</PbCardContent>
						</PbCardLayer>
					</PbTabCard>
				</PbReveal>
			</PbTabShell>
		</Renderer.Provider>
	)
}

