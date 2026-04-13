"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"

import { ui } from "@/components/tokens/design"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import { MetricDefinitions, type MetricDefinition, type MetricFormula, type MetricId, type MetricTypeL1, type MetricTypeL2 } from "@/features/playbook/definitions/metrics"
import { SpendById, SpendIds, type SpendId } from "@/features/playbook/definitions/spend"
import { TabById, type TabId } from "@/features/playbook/definitions/tabs"
import { TermDefinitions, TermTokens, getTermByToken } from "@/features/playbook/definitions/terms"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type TermDefinition = (typeof TermDefinitions)[number]
type TermId = TermDefinition["id"]
type MetricDef = MetricDefinition<MetricId>

type InlineMetricTextProps = {
	text: string
	keyPrefix?: string
	onUnknownToken?: (token: string) => React.ReactNode
	renderText?: (part: string, key: string) => React.ReactNode
}

type InlineRenderOptions = {
	keyPrefix?: string
	onUnknownToken?: (token: string) => React.ReactNode
	renderText?: (part: string, key: string) => React.ReactNode
}

type InlineTabTextProps = {
	text: string
	keyPrefix?: string
	onUnknownToken?: (token: string) => React.ReactNode
	onTabClick?: (tabId: TabId) => void
}

type MetricPillProps = { id: MetricId; className?: string; fadeMs?: number; children?: React.ReactNode }
type SpendPillProps = { id: SpendId; className?: string; fadeMs?: number; children?: React.ReactNode }
type TabChipProps = { id: TabId; className?: string; keyPrefix?: string; onClick?: (tabId: TabId) => void; showIcon?: boolean }

type PillButtonProps = {
	alias: string
	description: string
	formula?: MetricFormula
	typeL1: MetricTypeL1
	typeL2?: MetricTypeL2
	className?: string
	fadeMs?: number
}

type LegendItemProps = { alias: string; pillClass: string; labelClass: string }

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const tooltip_body = cn("leading-snug", ui.typography.caption)
const tooltip_body_narrow = cn("max-w-[320px]", tooltip_body)
const tooltip_body_wide = cn("max-w-[340px]", tooltip_body)
const help_text_class = cn(ui.copy.helpUnderline, ui.surface.state.focus.ring)

const metric_ops = new Set(["(", ")", "×", "/", "+", "-", "-"])

const metric_alias_to_id = Object.entries(MetricDefinitions).reduce<Record<string, MetricId>>((acc, [id, d]) => {
	acc[d.alias.trim().toLowerCase()] = id as MetricId
	return acc
}, {})

const metric_match_candidates = Array.from(new Set(Object.entries(MetricDefinitions).flatMap(([id, d]) => [id, d.alias])))
	.map((s) => s.trim())
	.filter(Boolean)
	.sort((a, b) => b.length - a.length)

const is_metric_boundary = (ch?: string) => !ch || /\s/.test(ch) || metric_ops.has(ch)

function canonical_metric_alias(token: string) {
	const k = token.trim()
	if (!k) return ""
	const direct = MetricDefinitions[k as MetricId]
	if (direct) return direct.alias.trim()
	const id = metric_alias_to_id[k.toLowerCase()]
	return id ? MetricDefinitions[id].alias.trim() : k
}

type MetricSegment =
	| { kind: "space"; value: string }
	| { kind: "op"; value: string }
	| { kind: "metric"; value: string }
	| { kind: "text"; value: string }

function tokenize_metric_expr(expr: string): MetricSegment[] {
	const s = expr ?? ""
	const out: MetricSegment[] = []
	let i = 0

	while (i < s.length) {
		const ch = s[i]

		if (/\s/.test(ch)) {
			let j = i + 1
			while (j < s.length && /\s/.test(s[j])) j++
			out.push({ kind: "space", value: s.slice(i, j) })
			i = j
			continue
		}

		if (metric_ops.has(ch)) {
			out.push({ kind: "op", value: ch })
			i += 1
			continue
		}

		let matched: string | null = null
		for (const cand of metric_match_candidates) {
			const slice = s.slice(i, i + cand.length)
			if (slice.length !== cand.length) continue
			if (slice.toLowerCase() !== cand.toLowerCase()) continue
			if (!is_metric_boundary(s[i - 1]) || !is_metric_boundary(s[i + cand.length])) continue
			matched = slice
			break
		}

		if (matched) {
			out.push({ kind: "metric", value: canonical_metric_alias(matched) })
			i += matched.length
			continue
		}

		let j = i + 1
		while (j < s.length && !/\s/.test(s[j]) && !metric_ops.has(s[j])) j++
		out.push({ kind: "text", value: s.slice(i, j) })
		i = j
	}

	return out
}

function render_metric_expr(expr: string) {
	const raw = (expr ?? "").trim()
	if (!raw) return null

	return tokenize_metric_expr(raw).map((p, idx) => {
		if (p.kind === "space") return <span key={idx}>{p.value}</span>
		if (p.kind === "op")
			return (
				<span key={idx} className={cn("font-mono text-muted-foreground", ui.typography.caption)} aria-hidden="true">
					{p.value}
				</span>
			)
		if (p.kind === "metric")
			return (
				<span
					key={idx}
					className={cn("inline-flex items-center rounded-sm px-1", "bg-muted/10", "font-mono leading-none text-muted-foreground", ui.typography.caption, "border border-border/50")}
				>
					{p.value}
				</span>
			)
		return (
			<span key={idx} className={cn("font-mono text-muted-foreground", ui.typography.caption)}>
				{p.value}
			</span>
		)
	})
}

const metric_tone: Record<MetricTypeL1, string | Record<MetricTypeL2, string>> = {
	attribute: ui.metrics.pillAttribute,
	measure: { primary: ui.metrics.pillPrimary, secondary: ui.metrics.pillSecondary },
}

const metric_legend_items = [
	{ alias: "Attributes", pillClass: ui.metrics.pillAttribute, labelClass: ui.metrics.labelAttribute },
	{ alias: "Primary", pillClass: ui.metrics.pillPrimary, labelClass: ui.metrics.labelPrimary },
	{ alias: "Secondary", pillClass: ui.metrics.pillSecondary, labelClass: ui.metrics.labelSecondary },
] as const

const spend_style: Record<SpendId, { pill: string }> = {
	brand: { pill: ui.spend.pillBrand },
	performance: { pill: ui.spend.pillPerformance },
	commission: { pill: ui.spend.pillOverhead },
	overhead: { pill: ui.spend.pillOverhead },
} as const

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const term_by_id = Object.fromEntries(TermDefinitions.map((t) => [t.id, t])) as Record<TermId, TermDefinition>
const escape_regex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const term_regex = TermTokens.length ? new RegExp(`(${TermTokens.map(escape_regex).join("|")})`, "gi") : null
const is_term_boundary = (ch?: string) => !ch || /[^A-Za-z0-9]/.test(ch)

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function TooltipProviderAutoClose({ children, ...props }: React.ComponentProps<typeof TooltipProvider> & { children: React.ReactNode }) {
	React.useEffect(() => {
		const close = () => {
			const ae = document.activeElement
			if (ae && ae instanceof HTMLElement) ae.blur()
		}

		const on_visibility = () => {
			if (document.hidden) close()
		}

		window.addEventListener("blur", close)
		document.addEventListener("visibilitychange", on_visibility)

		return () => {
			window.removeEventListener("blur", close)
			document.removeEventListener("visibilitychange", on_visibility)
		}
	}, [])

	return <TooltipProvider {...props}>{children}</TooltipProvider>
}

function HelpText({
	label,
	description,
	className,
	side = "top",
	align = "start",
	fadeMs,
}: {
	label: React.ReactNode
	description: React.ReactNode
	className?: string
	side?: React.ComponentProps<typeof TooltipContent>["side"]
	align?: React.ComponentProps<typeof TooltipContent>["align"]
	fadeMs?: number
}) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span className={cn(help_text_class, "select-text", className)} role="button" tabIndex={0}>
					{label}
				</span>
			</TooltipTrigger>
			<TooltipContent side={side} align={align} fadeMs={fadeMs} className={tooltip_body_narrow}>
				{description}
			</TooltipContent>
		</Tooltip>
	)
}

/* -------------------------------------------------------------------------- */
/* Custom: Terms                                                              */
/* -------------------------------------------------------------------------- */

function TermInline({ label, children }: { label: string; children?: React.ReactNode }) {
	const def = getTermByToken(label)
	const content = children ?? (def ? def.alias : label)
	return def ? <HelpText label={content} description={def.description} /> : <>{content}</>
}

function render_inline_terms(text: string, key_prefix = "term") {
	if (!term_regex || !text) return text

	const parts: React.ReactNode[] = []
	let cursor = 0
	term_regex.lastIndex = 0

	let match: RegExpExecArray | null
	while ((match = term_regex.exec(text))) {
		const start = match.index
		const end = term_regex.lastIndex
		const raw = match[0]

		if (start > cursor) parts.push(text.slice(cursor, start))

		const prev = text[start - 1]
		const next = text[end]
		const def = is_term_boundary(prev) && is_term_boundary(next) ? getTermByToken(raw) : null

		parts.push(def ? <TermInline key={`${key_prefix}-${start}-${raw}`} label={raw} /> : raw)
		cursor = end
	}

	if (cursor < text.length) parts.push(text.slice(cursor))
	return parts
}

function InlineTermText({ text, keyPrefix }: { text: string; keyPrefix?: string }) {
	return <>{render_inline_terms(text, keyPrefix)}</>
}

function TermPill({ id, className, fadeMs }: { id: TermId; className?: string; fadeMs?: number }) {
	const def = term_by_id[id]
	if (!def) return null

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span
					tabIndex={0}
					className={cn(
						"cursor-help inline-flex items-center whitespace-nowrap select-text",
						ui.control.base,
						"bg-muted/40 text-muted-foreground",
						ui.motion.duration,
						ui.surface.state.focus.ring,
						className
					)}
				>
					{def.alias}
				</span>
			</TooltipTrigger>
			<TooltipContent side="top" align="start" fadeMs={fadeMs} className={tooltip_body_narrow}>
				{def.description}
			</TooltipContent>
		</Tooltip>
	)
}

function TermStrip({ ids, title, className }: { ids: readonly TermId[]; title?: string; className?: string }) {
	if (!ids.length) return null
	return (
		<div className={cn("flex flex-wrap items-center justify-between", ui.surface.structure.border, "bg-muted/20", ui.spacing.controlX, ui.spacing.pillY, ui.radius.base, className)}>
			{title ? <span className={cn(ui.typography.caption, "text-muted-foreground")}>{title}</span> : null}
			<div className={cn("flex flex-wrap items-center", ui.gap.sm)}>{ids.map((id) => <TermPill key={id} id={id} />)}</div>
		</div>
	)
}

const Terms = { Pill: TermPill, Strip: TermStrip, InlineText: InlineTermText, renderInlineText: render_inline_terms } as const

/* -------------------------------------------------------------------------- */
/* Custom: Tabs                                                               */
/* -------------------------------------------------------------------------- */

const normalize_tab_token = (token: string) => token.trim().toLowerCase().replace(/\s+/g, " ")
const tab_token_re = /(\{[^{}]+\})/g

const tab_token_to_id = Object.values(TabById).reduce<Record<string, TabId>>((acc, tab) => {
	const id = tab.id
	const alias = normalize_tab_token(tab.alias)
	acc[normalize_tab_token(id)] = id
	acc[normalize_tab_token(id.replace(/-/g, " "))] = id
	acc[alias] = id
	acc[`${alias} tab`] = id
	return acc
}, {})

function resolve_tab_token(token: string): TabId | null {
	const normalized = normalize_tab_token(token)
	return normalized ? tab_token_to_id[normalized] ?? null : null
}

function TabChip({ id, className, keyPrefix = "tab-chip", onClick, showIcon = true }: TabChipProps) {
	const tab = TabById[id]
	const TabIcon = tab.icon
	const base_class = cn("inline-flex items-center", ui.gap.sm, ui.typography.label)

	if (onClick) {
		return (
			<Button
				size="sm"
				variant="outline"
				onClick={() => onClick(id)}
				className={cn(base_class, "h-auto", ui.spacing.chipSm, ui.surface.structure.border, "bg-background", ui.motion.duration, ui.surface.state.focus.ring, className)}
			>
				{showIcon ? <TabIcon className={cn(ui.iconNude.xs, "opacity-70")} aria-hidden="true" /> : null}
				<span className="text-current">
					{render_inline_copy(tab.alias, { keyPrefix: `${keyPrefix}-alias` })}
				</span>
			</Button>
		)
	}

	return (
		<span className={cn(base_class, ui.surface.structure.border, "bg-muted/30", ui.spacing.chipSm, "text-muted-foreground", ui.radius.control, ui.motion.duration, className)}>
			{showIcon ? <TabIcon className={cn(ui.iconNude.xs, "opacity-70")} aria-hidden="true" /> : null}
			<span className="text-muted-foreground">
				{render_inline_copy(tab.alias, { keyPrefix: `${keyPrefix}-alias` })}
			</span>
		</span>
	)
}

function render_inline_tab_text({ text, keyPrefix = "tab", onUnknownToken, onTabClick }: InlineTabTextProps) {
	return (text ?? "")
		.split(tab_token_re)
		.filter(Boolean)
		.map((part, idx) => {
			const key = `${keyPrefix}-${idx}-${part}`
			if (!part.startsWith("{") || !part.endsWith("}")) {
				return <React.Fragment key={key}>{render_inline_copy(part, { keyPrefix: `${key}-copy`, onUnknownToken })}</React.Fragment>
			}

			const token = part.slice(1, -1).trim()
			const tab_id = resolve_tab_token(token)
			if (tab_id) return <TabChip key={key} id={tab_id} onClick={onTabClick} keyPrefix={`${key}-tab`} />

			return <React.Fragment key={key}>{onUnknownToken ? onUnknownToken(token) : part}</React.Fragment>
		})
}

function InlineTabText({ text, keyPrefix, onUnknownToken, onTabClick }: InlineTabTextProps) {
	return <>{render_inline_tab_text({ text, keyPrefix, onUnknownToken, onTabClick })}</>
}

/* -------------------------------------------------------------------------- */
/* Custom: Metrics                                                            */
/* -------------------------------------------------------------------------- */

const spend_alias_to_id = (() => {
	const acc: Record<string, SpendId> = {}
	for (const id of SpendIds) {
		const d = SpendById[id]
		acc[String(d.alias).trim().toLowerCase()] = id
		acc[String(id).trim().toLowerCase()] = id
	}
	return acc
})()

const canonical_spend_id = (token: string): SpendId | null => {
	const k = token.trim()
	return k ? spend_alias_to_id[k.toLowerCase()] ?? null : null
}

function MetricFormulaView({ formula }: { formula?: MetricFormula }) {
	if (!formula) return null

	const op = (symbol: string) => (
		<span className={cn("mx-1 font-mono leading-none text-muted-foreground", ui.typography.caption)} aria-hidden="true">
			{symbol}
		</span>
	)

	const frac = (num: string, den: string) => (
		<span className="inline-flex flex-col items-center leading-none">
			<span className="px-1">{render_metric_expr(num)}</span>
			<span className="w-full border-t border-border/60" />
			<span className="px-1">{render_metric_expr(den)}</span>
		</span>
	)

	if (formula.kind === "fraction")
		return <div className={cn(ui.margin.topSm, "inline-flex items-center justify-start")}>{frac(formula.numerator, formula.denominator)}</div>

	if (formula.kind === "scaled_fraction")
		return (
			<div className={cn(ui.margin.topSm, "inline-flex items-center justify-start")}>
				<span className="inline-flex items-center">
					{frac(formula.numerator, formula.denominator)}
					{op("×")}
					<span className={cn("font-mono text-muted-foreground", ui.typography.caption)}>{formula.factor}</span>
				</span>
			</div>
		)

	if (formula.kind === "product" || formula.kind === "difference")
		return (
			<div className={cn(ui.margin.topSm, "inline-flex items-center justify-start")}>
				<span className="inline-flex flex-wrap items-center gap-y-1">
					{render_metric_expr(formula.left)}
					{op(formula.kind === "product" ? "×" : "-")}
					{render_metric_expr(formula.right)}
				</span>
			</div>
		)

	return null
}

const MetricTooltipBody = React.memo(function MetricTooltipBody({ id, description, suffix }: { id: MetricId; description?: string | null; suffix?: string }) {
	const d = MetricDefinitions[id] as MetricDefinition<MetricId>
	const text = (description ?? d.description).trim()
	const extra = suffix?.trim()
	return (
		<div>
			<div>
				{text}
				{extra ? ` ${extra}` : ""}
			</div>
			<MetricFormulaView formula={d.formula} />
		</div>
	)
})

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

const metric_pill_class = (type_l1: MetricTypeL1, type_l2?: MetricTypeL2) => {
	const tone = metric_tone[type_l1]
	const tone_classname = typeof tone === "string" ? tone : tone[type_l2 ?? "secondary"]
	return cn(
		"inline-flex items-center justify-center whitespace-nowrap cursor-help select-text",
		"min-h-5 leading-none font-medium",
		ui.surface.structure.border,
		ui.spacing.chipSm,
		ui.typography.caption,
		ui.radius.control,
		ui.motion.duration,
		ui.surface.state.focus.ring,
		ui.surface.structure.shadowNone,
		ui.surface.state.hover.shadowSm,
		tone_classname
	)
}

const MetricPillButton = React.memo(function MetricPillButton({
	alias,
	description,
	formula,
	typeL1,
	typeL2,
	className,
	fadeMs,
	children,
}: React.PropsWithChildren<PillButtonProps>) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span tabIndex={0} aria-label={`${alias}. ${description}`} className={cn(metric_pill_class(typeL1, typeL2), className)}>
					{children ?? alias}
				</span>
			</TooltipTrigger>
			<TooltipContent side="top" align="start" fadeMs={fadeMs} className={tooltip_body_wide}>
				<div>{description}</div>
				<MetricFormulaView formula={formula} />
			</TooltipContent>
		</Tooltip>
	)
})

function MetricPillBase({
	id,
	className,
	fadeMs,
	guard,
	children,
}: React.PropsWithChildren<MetricPillProps & { guard?: (d: MetricDef) => boolean }>) {
	const d = MetricDefinitions[id] as MetricDefinition<MetricId>
	if (guard && !guard(d)) return null
	return (
		<MetricPillButton
			alias={d.alias}
			description={d.description}
			formula={d.formula}
			typeL1={d.type_l1}
			typeL2={d.type_l1 === "measure" ? d.type_l2 : undefined}
			className={className}
			fadeMs={fadeMs}
		>
			{children}
		</MetricPillButton>
	)
}

const MetricPill = React.memo(function MetricPill(p: MetricPillProps) {
	return <MetricPillBase {...p} />
})
const MetricAttributePill = React.memo(function MetricAttributePill(p: MetricPillProps) {
	return <MetricPillBase {...p} guard={(d) => d.type_l1 === "attribute"} />
})
const MetricMeasurePill = React.memo(function MetricMeasurePill(p: MetricPillProps) {
	return <MetricPillBase {...p} guard={(d) => d.type_l1 === "measure"} />
})

/**
 * Spend pills looked weird because we dropped the <Badge> base styles.
 * Keep <Badge> (copyable) and remove button semantics; add select-text + tabIndex for tooltip focus.
 */
const SpendPill = React.memo(function SpendPill({ id, className, fadeMs, children }: React.PropsWithChildren<SpendPillProps>) {
	const d = SpendById[id]
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Badge
					tabIndex={0}
					aria-label={`${d.alias}. ${d.description}`}
					className={cn(
						"cursor-help select-text",
						ui.spacing.chipSm,
						ui.motion.duration,
						ui.surface.state.focus.ring,
						ui.surface.structure.shadowNone,
						ui.surface.state.hover.shadowSm,
						spend_style[id].pill,
						className
					)}
				>
					{children ?? d.alias}
				</Badge>
			</TooltipTrigger>
			<TooltipContent side="top" align="start" fadeMs={fadeMs} className={tooltip_body_narrow}>
				{d.description}
			</TooltipContent>
		</Tooltip>
	)
})

const LegendItem = React.memo(function LegendItem({ alias, pillClass, labelClass }: LegendItemProps) {
	return (
		<div className={cn("flex items-center", ui.gap.sm)}>
			<span
				className={cn(
					"inline-flex h-3 w-3 shrink-0 rounded-full",
					ui.surface.structure.border,
					ui.surface.structure.shadowNone,
					pillClass
				)}
				aria-hidden="true"
			/>
			<span className={cn(ui.typography.caption, labelClass)}>{alias}</span>
		</div>
	)
})

function MetricLegend({ className }: { className?: string }) {
	return (
		<div className={cn("flex flex-col sm:flex-row sm:items-center", "gap-2 sm:gap-3", ui.radius.control, ui.surface.structure.border, "bg-muted/30", ui.spacing.controlX, ui.spacing.pillY, className)}>
			{metric_legend_items.map((item) => (
				<LegendItem key={item.alias} {...item} />
			))}
		</div>
	)
}

/* -------------------------------------------------------------------------- */
/* Custom: Copy & metrics                                                     */
/* -------------------------------------------------------------------------- */

function render_inline_metric_text({ text, keyPrefix = "metric", onUnknownToken, renderText }: InlineMetricTextProps) {
	const warn_unknown = !onUnknownToken && process.env.NODE_ENV !== "production"

	const render_part = (part: string, key: string) => {
		if (!part.startsWith("`") || !part.endsWith("`")) return renderText?.(part, key) ?? <React.Fragment key={key}>{part}</React.Fragment>

		const token = part.slice(1, -1).trim()
		const def = MetricDefinitions[token as MetricId]

		if (def?.type_l1 === "measure") return <MetricMeasurePill key={key} id={token as MetricId} />
		if (def?.type_l1 === "attribute") return <MetricAttributePill key={key} id={token as MetricId} />

		const spend_id = canonical_spend_id(token)
		if (spend_id) return <SpendPill key={key} id={spend_id} />

		const term_def = getTermByToken(token)
		if (term_def) return <TermInline key={key} label={token} />

		if (warn_unknown) console.warn(`[Metrics] Unknown metric token: "${token}"`)
		return <React.Fragment key={key}>{onUnknownToken ? onUnknownToken(token) : token}</React.Fragment>
	}

	return (text ?? "")
		.split(/(`[^`]+`)/g)
		.filter(Boolean)
		.map((part, i) => render_part(part, `${keyPrefix}-${i}-${part}`))
}

const InlineMetricText = (props: InlineMetricTextProps) => <>{render_inline_metric_text(props)}</>

function render_inline_copy(text: string, opts: InlineRenderOptions = {}) {
	const { keyPrefix = "copy", onUnknownToken, renderText } = opts
	return render_inline_metric_text({
		text,
		keyPrefix,
		onUnknownToken,
		renderText: renderText ?? ((part, key) => <React.Fragment key={key}>{part}</React.Fragment>),
	})
}

function InlineCopy({ text, keyPrefix, onUnknownToken }: { text: string; keyPrefix?: string; onUnknownToken?: (token: string) => React.ReactNode }) {
	return <>{render_inline_copy(text, { keyPrefix, onUnknownToken })}</>
}

const inline_markdown_re = /(\*\*[^*]+\*\*|`[^`]+`|https?:\/\/[^\s]+)/gi
const inline_link_re = /^(https?:\/\/[^\s]+?)([),.;:!?"]+)?$/i

function render_inline_markdown(text: string, keyPrefix = "copy", opts: InlineRenderOptions = {}) {
	if (!text) return null
	return (
		<>
			{text
				.split(inline_markdown_re)
				.filter(Boolean)
				.map((part, idx) => render_inline_markdown_part(part, `${keyPrefix}-${idx}`, opts))}
		</>
	)
}

function render_inline_markdown_part(part: string, key: string, opts: InlineRenderOptions) {
	if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
		return (
			<strong key={key} className="font-semibold">
				{render_inline_markdown(part.slice(2, -2), `${key}-bold`, opts)}
			</strong>
		)
	}

	if (/^https?:\/\//i.test(part)) {
		const match = inline_link_re.exec(part)
		const href = match?.[1] ?? part
		const trailing = match?.[2] ?? ""
		const label = href.replace(/^https?:\/\//i, "").replace(/\/$/, "")
		return (
			<React.Fragment key={key}>
				<a
					className={cn("underline decoration-dotted underline-offset-4 text-foreground", ui.surface.state.focus.ring)}
					href={href}
					target="_blank"
					rel="noreferrer"
				>
					{label}
				</a>
				{trailing}
			</React.Fragment>
		)
	}

	return (
		<React.Fragment key={key}>
			{Copy.renderInlineText(part, { keyPrefix: `${key}-text`, onUnknownToken: opts.onUnknownToken })}
		</React.Fragment>
	)
}

function InlineMarkdown({ text, keyPrefix, onUnknownToken }: { text: string; keyPrefix?: string; onUnknownToken?: (token: string) => React.ReactNode }) {
	return <>{render_inline_markdown(text, keyPrefix, { onUnknownToken })}</>
}

/* -------------------------------------------------------------------------- */
/* Export                                                                     */
/* -------------------------------------------------------------------------- */

const Formula = { View: MetricFormulaView }

const Metrics = {
	Pill: MetricPill,
	AttributePill: MetricAttributePill,
	MeasurePill: MetricMeasurePill,
	InlineText: InlineMetricText,
	renderInlineText: (text: string, opts?: Omit<InlineMetricTextProps, "text">) => render_inline_metric_text({ text, ...opts }),
	Legend: MetricLegend,
	TooltipBody: MetricTooltipBody,
	defs: { metrics: MetricDefinitions },
} as const

const Spend = { Pill: SpendPill, defs: SpendById } as const
const Copy = {
	InlineText: InlineCopy,
	InlineMarkdown,
	renderInlineText: render_inline_copy,
	renderInlineMarkdown: render_inline_markdown,
} as const
const Tabs = {
	Chip: TabChip,
	InlineText: InlineTabText,
	renderInlineText: (text: string, opts?: Omit<InlineTabTextProps, "text">) => render_inline_tab_text({ text, ...opts }),
	resolveToken: resolve_tab_token,
	defs: { tabs: TabById },
} as const
const Help = { Text: HelpText } as const

export const Renderer = { Provider: TooltipProviderAutoClose, Terms, Copy, Tabs, Metrics, Spend, Help, Formula } as const
export { Terms, MetricFormulaView }

