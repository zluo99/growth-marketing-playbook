// frameworks.tsx
"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"
import { motion, type Transition } from "framer-motion"
import { BarChart3, Coins, EyeOff, FlaskConical, Handshake, Layers, LogIn, Megaphone, Search, Sparkles, Stethoscope, TrendingUp } from "lucide-react"

import { ui, type TypographyKey } from "@/components/tokens/design"
import { uiMotion, useReducedMotionBool } from "@/components/tokens/motion"
import { Badge } from "@/components/ui/badge"
import { Bar, BarRail, BarScroller, BarScrollButton } from "@/components/nav/bar"
import { MotionPillIndicator, PillList, PillRoot, PillTrigger, useMotionPillRail } from "@/components/nav/pill"
import { cn, runWithViewportAnchor, scrollIntoHorizontalView, stableKeyFromText } from "@/lib/utils"
import { useMediaQuery } from "@/lib/hooks/use-media-query"

import { Renderer } from "@/features/playbook/components/ui/renderer"
import { PbBulletList, PbCardContent, PbCardHeader, PbCardLayer, PbReveal, PbSubtleText, PbTabCard, PbTabPanel, PbTabShell, PbText } from "@/features/playbook/components/ui/ui"
import {
	FrameworkDefinitions,
	FrameworkFilterOptions,
	FrameworkInfoCopy,
	FrameworkPillarKey,
	FrameworksUiCopy,
	type Framework,
	type FrameworkFilterValue,
	type FrameworkIcon,
	type FrameworkPillar,
	type FrameworkThemeKey,
} from "@/features/playbook/copy/frameworks"
import { TabById } from "@/features/playbook/definitions/tabs"
import { PlaybookEvents, PlaybookStorage, read_preference, remove_preference, write_preference } from "@/features/playbook/components/context/preferences"
import { search_target_for_framework } from "@/features/playbook/search/targets"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type ColumnCount = 1 | 2 | 3

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const framework_glow: Record<FrameworkThemeKey, React.ComponentProps<typeof PbTabCard>["glow"]> = {
	consulting: "orange",
	data: "green",
	marketing: "indigo",
}

const framework_icon_map: Record<FrameworkIcon, React.ComponentType<{ className?: string }>> = {
	"handshake": Handshake,
	"layers": Layers,
	"sparkles": Sparkles,
	"search": Search,
	"stethoscope": Stethoscope,
	"megaphone": Megaphone,
	"log-in": LogIn,
	"trending-up": TrendingUp,
	"eye-off": EyeOff,
	"bar-chart-3": BarChart3,
	"coins": Coins,
	"flask": FlaskConical,
} as const

const frameworks_filter_items = FrameworkFilterOptions.map((o) => ({
	value: o.v,
	label: o.label,
})) as readonly { value: FrameworkFilterValue; label: string }[]

const frameworks_key_prefix = "frameworks"
const frameworks_filter_scroller_id = "frameworks-filter-scroller"
const by_alias = (a: Framework, b: Framework) => a.alias.localeCompare(b.alias)

/* -------------------------------------------------------------------------- */
/* Utils                                                                      */
/* -------------------------------------------------------------------------- */

const chunk = <T,>(xs: readonly T[], n: number) => {
	const out: T[][] = []
	for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n))
	return out as readonly (readonly T[])[]
}

function parse_framework_filter_value(v: string): FrameworkFilterValue | null {
	for (const o of FrameworkFilterOptions) if (o.v === v) return o.v
	return null
}

function InfoLabel({ text, infoKey }: { text: string; infoKey: string }) {
	const info = infoKey ? (FrameworkInfoCopy[infoKey] ?? "") : ""
	return info ? (
		<Renderer.Help.Text
			label={Renderer.Copy.renderInlineMarkdown(text, `${frameworks_key_prefix}-${infoKey}-label`)}
			description={Renderer.Copy.renderInlineMarkdown(info, `${frameworks_key_prefix}-${infoKey}-desc`)}
			className={cn(ui.copy.helpUnderline, ui.surface.state.focus.ring)}
		/>
	) : (
		<span>{Renderer.Copy.renderInlineMarkdown(text, `${frameworks_key_prefix}-${infoKey || "framework-info"}-label`)}</span>
	)
}

function Collapse({ open, children, transition, id, ariaLabel }: { open: boolean; children: React.ReactNode; transition: Transition; id: string; ariaLabel: string }) {
	const inner_ref = React.useRef<HTMLDivElement | null>(null)
	const [h, set_h] = React.useState(0)

	React.useLayoutEffect(() => {
		const el = inner_ref.current
		if (!el) return
		const measure = () => set_h(Math.ceil(el.scrollHeight))
		measure()
		const ro = new ResizeObserver(measure)
		ro.observe(el)
		return () => ro.disconnect()
	}, [children])

	return (
		<motion.div id={id} role="region" aria-label={ariaLabel} aria-hidden={!open} animate={{ height: open ? h : 0 }} transition={transition} style={{ overflow: "hidden" }}>
			<div ref={inner_ref}>{open ? children : null}</div>
		</motion.div>
	)
}

function PillarChevron({ open, transition }: { open: boolean; transition: Transition }) {
	return (
		<span aria-hidden="true" className="grid h-6 w-6 place-items-center text-foreground/70">
			<motion.span animate={{ rotate: open ? 90 : 0 }} transition={transition}>
				<svg className={ui.iconNude.sm} viewBox="0 0 20 20" fill="none" aria-hidden="true">
					<path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
				</svg>
			</motion.span>
		</span>
	)
}

function ColumnIcon({ n }: { n: ColumnCount }) {
	const cols = n
	const rows = 2
	const w = 18
	const h = 18
	const gap = 2
	const pad = 2
	const cw = (w - pad * 2 - gap * (cols - 1)) / cols
	const ch = (h - pad * 2 - gap * (rows - 1)) / rows
	return (
		<svg aria-hidden="true" viewBox={`0 0 ${w} ${h}`} className="h-4 w-4">
			{Array.from({ length: rows }).flatMap((_, r) =>
				Array.from({ length: cols }).map((__, c) => (
					<rect key={`${r}-${c}`} x={pad + c * (cw + gap)} y={pad + r * (ch + gap)} width={cw} height={ch} rx="1.5" fill="currentColor" opacity="0.85" />
				))
			)}
		</svg>
	)
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function FrameworksBar({
	value,
	onChange,
	cols,
	onChangeCols,
	col_options,
}: {
	value: FrameworkFilterValue
	onChange: (v: FrameworkFilterValue) => void
	cols: ColumnCount
	onChangeCols: (v: ColumnCount) => void
	col_options: readonly ColumnCount[]
}) {
	const left = useMotionPillRail<FrameworkFilterValue>({ activeKey: value, spring: uiMotion.nav.pillSpring })
	const right_key = String(cols) as "1" | "2" | "3"
	const right = useMotionPillRail<"1" | "2" | "3">({ activeKey: right_key, spring: uiMotion.nav.pillSpring })

	const on_change_filter = React.useCallback(
		(next: string) => {
			const parsed = parse_framework_filter_value(next)
			if (parsed) onChange(parsed)
		},
		[onChange]
	)

	const on_change_cols = React.useCallback(
		(next: string) => {
			if (next === "1" || next === "2" || next === "3") onChangeCols(Number(next) as ColumnCount)
		},
		[onChangeCols]
	)

	const filter_order = React.useMemo(() => frameworks_filter_items.map((item) => item.value), [])

	const ensure_filter_visible = React.useCallback(
		(id: FrameworkFilterValue, behavior: ScrollBehavior = "smooth") => {
			const btn = left.triggerRefs.current[id]
			if (!btn) return
			scrollIntoHorizontalView(btn, { behavior, align: "center" })
			left.pill.measureRaf()
		},
		[left.pill, left.triggerRefs]
	)

	React.useEffect(() => {
		ensure_filter_visible(value, "smooth")
	}, [ensure_filter_visible, value])

	const on_filter_key_down = React.useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return
			e.preventDefault()

			const idx = filter_order.indexOf(value)
			if (idx < 0) return

			const next =
				e.key === "Home"
					? filter_order[0]
					: e.key === "End"
						? filter_order[filter_order.length - 1]
						: e.key === "ArrowLeft"
							? filter_order[Math.max(0, idx - 1)]
							: filter_order[Math.min(filter_order.length - 1, idx + 1)]

			if (!next || next === value) return
			onChange(next)

			requestAnimationFrame(() => {
				left.triggerRefs.current[next]?.focus?.()
				ensure_filter_visible(next, "auto")
			})
		},
		[ensure_filter_visible, filter_order, left.triggerRefs, onChange, value]
	)

	return (
		<div className={cn("flex items-stretch", ui.gap.xs)} role="group" aria-label={FrameworksUiCopy.filtersGroupLabel}>
			<PillRoot value={value} onValueChange={on_change_filter} className="min-w-0 flex-1">
				<Bar variant="shell" ariaLabel={FrameworksUiCopy.filterBarLabel} className="min-w-0">
					{({ scrollerRef, canScrollLeft, canScrollRight, scrollByPage }) => (
						<>
							{canScrollLeft ? (
								<div className="absolute top-1/2 z-30 -translate-y-1/2" style={{ left: ui.nav.arrow.insetRem }}>
									<BarScrollButton
										dir="left"
										onClick={() => scrollByPage("left")}
										ariaLabel={`${FrameworksUiCopy.filterBarLabel}: scroll left`}
										controlsId={frameworks_filter_scroller_id}
									/>
								</div>
							) : null}

							{canScrollRight ? (
								<div className="absolute top-1/2 z-30 -translate-y-1/2" style={{ right: ui.nav.arrow.insetRem }}>
									<BarScrollButton
										dir="right"
										onClick={() => scrollByPage("right")}
										ariaLabel={`${FrameworksUiCopy.filterBarLabel}: scroll right`}
										controlsId={frameworks_filter_scroller_id}
									/>
								</div>
							) : null}

							<BarScroller id={frameworks_filter_scroller_id} scrollerRef={scrollerRef} canScrollLeft={canScrollLeft} canScrollRight={canScrollRight}>
								<BarRail className={ui.nav.pad}>
									<PillList
										ref={left.listRef}
										onKeyDown={on_filter_key_down}
										chrome={false}
										className={cn(ui.nav.rail.listChrome, ui.nav.control.height, "items-center")}
									>
										<MotionPillIndicator
											className={cn(ui.nav.rail.indicatorChrome, ui.nav.control.height, ui.radius.control)}
											pill={left.pill}
											transition={uiMotion.nav.pillTween}
										/>

										{frameworks_filter_items.map((item) => {
											const is_active = value === item.value
											// match header.tsx: inactive uses interactive tokens (hover -> fg)
											const label_tone = is_active ? ui.text.default.fg : ui.text.interactive.all

											return (
												<PillTrigger
													key={item.value}
													value={item.value}
													ref={left.getTriggerRef(item.value)}
													className={cn(ui.nav.rail.triggerChrome, "shrink-0")}
													onPressPreview={() => {
														ensure_filter_visible(item.value, "auto")
														left.pill.measureRaf()
													}}
												>
													<span className={cn("relative z-10", ui.typography.label, ui.motion.duration, label_tone)}>
														{Renderer.Copy.renderInlineText(item.label, { keyPrefix: `${frameworks_key_prefix}-filter-${item.value}` })}
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

			{col_options.length ? (
				<PillRoot value={right_key} onValueChange={on_change_cols} className="shrink-0">
					<Bar variant="shell" ariaLabel={FrameworksUiCopy.columnsBarLabel} className="w-max">
						{() => (
							<div className={cn("flex items-stretch", ui.nav.pad)}>
								<PillList ref={right.listRef} chrome={false} className={cn(ui.nav.rail.listChrome, ui.nav.control.height, "items-center")}>
									<MotionPillIndicator
										className={cn(ui.nav.rail.indicatorChrome, ui.nav.control.height, ui.radius.control)}
										pill={right.pill}
										transition={uiMotion.nav.pillTween}
									/>

									{col_options.map((n) => {
										const v = String(n) as "1" | "2" | "3"
										const is_active = right_key === v
										// same idea for the icon: inactive uses interactive tokens
										const tone = is_active ? ui.text.default.fg : ui.text.interactive.all

										return (
											<PillTrigger
												key={v}
												value={v}
												ref={right.getTriggerRef(v)}
												className={cn(ui.nav.rail.triggerChrome, ui.nav.control.size, "p-0 grid place-items-center")}
												onPressPreview={() => right.pill.measureRaf()}
											>
												<span className={cn("relative z-10 grid h-full w-full place-items-center", ui.motion.duration, tone)}>
													<ColumnIcon n={n} />
												</span>
											</PillTrigger>
										)
									})}
								</PillList>
							</div>
						)}
					</Bar>
				</PillRoot>
			) : null}
		</div>
	)
}

function PillarBlock({
	fw_id,
	open,
	on_toggle,
	pillar,
	transition,
	textSize = "body",
}: {
	fw_id: string
	open: boolean
	on_toggle: () => void
	pillar: FrameworkPillar
	transition: Transition
	textSize?: TypographyKey
}) {
	const panel_id = `pillar-${fw_id}-${pillar.name}`

	return (
		<PbTabPanel
			size="sm"
			interactive={false}
			className={cn(
				"p-0 bg-muted/30",
				ui.surface.structure.shadowNone,
				ui.surface.structure.border,
				ui.radius.base,
				ui.motion.duration,
				"transition-[background-color] duration-[var(--motion-duration-base)]",
				"hover:bg-muted/15 dark:hover:bg-muted/10"
			)}
		>
			<button
				type="button"
				onClick={(event) => {
					runWithViewportAnchor(event.currentTarget, on_toggle)
				}}
				aria-expanded={open}
				aria-controls={panel_id}
				className={cn(
					"flex w-full items-center justify-between text-left",
					ui.spacing.controlX,
					ui.spacing.controlY,
					ui.radius.base,
					ui.motion.duration,
					"hover:bg-muted/15 dark:hover:bg-muted/10",
					ui.surface.state.focus.ring
				)}
			>
				<div className={cn("flex min-w-0 items-center", ui.gap.sm)}>
					<PillarChevron open={open} transition={transition} />
					<PbText size={textSize} className="truncate text-foreground/90">
						<InfoLabel text={pillar.name} infoKey={`framework:${fw_id}:pillar:${pillar.name}`} />
					</PbText>
				</div>
			</button>

			<Collapse open={open} transition={transition} id={panel_id} ariaLabel={FrameworksUiCopy.pillarDetailsLabel.replace("{pillar}", pillar.name)}>
				<div className="px-3 pb-3 pt-0.5">
					<PbBulletList
						className={cn("pl-8 text-foreground/90", ui.margin.topSm)}
						items={pillar.items}
						size={textSize}
						getKey={(item) => stableKeyFromText(item, `${frameworks_key_prefix}-${panel_id}-item`)}
						renderItem={(item) => {
							const key = stableKeyFromText(item, `${frameworks_key_prefix}-${panel_id}-item`)
							return Renderer.Copy.renderInlineMarkdown(item, key)
						}}
					/>
				</div>
			</Collapse>
		</PbTabPanel>
	)
}

function FrameworkCard({
	fw,
	is_open,
	on_toggle_pillar,
	transition,
}: {
	fw: Framework
	is_open: (key: string) => boolean
	on_toggle_pillar: (key: string) => void
	transition: Transition
}) {
	const theme_key = fw.type.toLowerCase() as FrameworkThemeKey
	const Icon = framework_icon_map[fw.icon]
	const icon_tone = ui.frameworks[theme_key].filterText
	const icon_frame_class = cn(ui.iconCard.frame, "shrink-0")

	return (
		<PbTabCard hover shadow glow={framework_glow[theme_key]} className={ui.frameworks[theme_key].tint}>
			<PbCardLayer>
				<PbCardHeader
					className="pb-3"
					title={
						<span className={cn("inline-flex items-center", ui.gap.sm)}>
							<span className={cn(icon_frame_class, icon_tone)} aria-hidden="true">
								<Icon className={ui.iconCard.size} />
							</span>
							<span className={ui.typography.title.lg}>
								{Renderer.Copy.renderInlineText(fw.alias, { keyPrefix: `${frameworks_key_prefix}-framework-${fw.id}-title` })}
							</span>
						</span>
					}
					action={
						<Badge className={cn("px-2.5 py-1", ui.frameworks[theme_key].badge)}>
							<Renderer.Copy.InlineText text={fw.type} keyPrefix={`${frameworks_key_prefix}-badge-${fw.id}`} />
						</Badge>
					}
					description={<PbSubtleText size="caption">{Renderer.Copy.renderInlineMarkdown(fw.description, `${frameworks_key_prefix}-framework-${fw.id}-desc`)}</PbSubtleText>}
				/>

				<PbCardContent>
					<div className={cn("flex flex-col", ui.gap.sm)}>
						{fw.pillars.map((p) => {
							const key = FrameworkPillarKey(fw.id, p.name)
							return <PillarBlock key={key} fw_id={fw.id} pillar={p} open={is_open(key)} on_toggle={() => on_toggle_pillar(key)} transition={transition} />
						})}
					</div>
				</PbCardContent>
			</PbCardLayer>
		</PbTabCard>
	)
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function TabFrameworks() {
	const reduce_motion = useReducedMotionBool()
	const collapse_transition = reduce_motion ? uiMotion.frameworks.collapse.reduced : uiMotion.frameworks.collapse.tween
	const tab = TabById["frameworks"]

	const is_desktop = useMediaQuery("(min-width: 768px)")
	const is_xl = useMediaQuery("(min-width: 1280px)")

	const [filter, set_filter] = React.useState<FrameworkFilterValue>("all")
	const [cols, set_cols] = React.useState<ColumnCount>(2)
	const [open_keys, set_open_keys] = React.useState<Set<string>>(() => new Set())
	const is_open = React.useCallback((k: string) => open_keys.has(k), [open_keys])

	const reveal_pillars = React.useCallback((frameworkId: string, query: string) => {
		const trimmed = query.trim().toLowerCase()
		if (!trimmed) return
		const fw = FrameworkDefinitions.find((candidate) => candidate.id === frameworkId)
		if (!fw) return
		const next_keys = fw.pillars
			.filter((pillar) => {
				const pillar_match = pillar.name.toLowerCase().includes(trimmed)
				const item_match = pillar.items.some((item) => item.toLowerCase().includes(trimmed))
				return pillar_match || item_match
			})
			.map((pillar) => FrameworkPillarKey(fw.id, pillar.name))

		if (!next_keys.length) return
		set_open_keys((prev) => {
			const next = new Set(prev)
			next_keys.forEach((key) => next.add(key))
			return next
		})
	}, [])

	const effective_cols: ColumnCount = !is_desktop ? 1 : cols
	const col_options: readonly ColumnCount[] = !is_desktop ? [] : is_xl ? [1, 2, 3] : [1, 2]

	const on_filter_change = React.useCallback((next: FrameworkFilterValue) => {
		set_filter(next)
		write_preference(PlaybookStorage.frameworks.filter, next)
	}, [])

	const on_cols_change = React.useCallback((next: ColumnCount) => {
		set_cols(next)
		write_preference(PlaybookStorage.frameworks.cols, String(next))
	}, [])

	React.useEffect(() => {
		if (typeof window === "undefined") return
		const on_filter_event = (event: Event) => {
			const detail = (event as CustomEvent<{ filter?: string }>).detail
			const next = detail?.filter ? parse_framework_filter_value(detail.filter) : null
			if (next) {
				set_filter(next)
				write_preference(PlaybookStorage.frameworks.filter, next)
			}
		}
		window.addEventListener(PlaybookEvents.frameworksFilter, on_filter_event as EventListener)
		return () => window.removeEventListener(PlaybookEvents.frameworksFilter, on_filter_event as EventListener)
	}, [])

	React.useEffect(() => {
		const stored_filter = read_preference(PlaybookStorage.frameworks.filter)
		const parsed_filter = stored_filter ? parse_framework_filter_value(stored_filter) : null
		if (parsed_filter) set_filter(parsed_filter)

		const stored_cols = read_preference(PlaybookStorage.frameworks.cols)
		const parsed_cols = stored_cols ? Number(stored_cols) : null
		if (parsed_cols === 1 || parsed_cols === 2 || parsed_cols === 3) set_cols(parsed_cols)
	}, [])

	React.useEffect(() => {
		if (typeof window === "undefined") return
		const on_reveal_event = (event: Event) => {
			const detail = (event as CustomEvent<{ frameworkId?: string; query?: string }>).detail
			if (!detail?.frameworkId || !detail?.query) return
			reveal_pillars(detail.frameworkId, detail.query)
		}
		window.addEventListener(PlaybookEvents.frameworksReveal, on_reveal_event as EventListener)
		return () => window.removeEventListener(PlaybookEvents.frameworksReveal, on_reveal_event as EventListener)
	}, [reveal_pillars])

	React.useEffect(() => {
		if (typeof window === "undefined") return
		const stored = read_preference(PlaybookStorage.frameworks.reveal)
		if (!stored) return
		remove_preference(PlaybookStorage.frameworks.reveal)
		try {
			const data = JSON.parse(stored) as { frameworkId?: string; query?: string }
			if (data.frameworkId && data.query) reveal_pillars(data.frameworkId, data.query)
		} catch (error) {
			console.warn("Failed to parse framework reveal payload:", error)
		}
	}, [reveal_pillars])

	React.useEffect(() => {
		if (!is_desktop) return
		if (!is_xl && cols === 3) set_cols(2)
	}, [is_desktop, is_xl, cols])

	const toggle_pillar = React.useCallback((key: string) => {
		set_open_keys((prev) => {
			const next = new Set(prev)
			if (next.has(key)) next.delete(key)
			else next.add(key)
			return next
		})
	}, [])

	const frameworks = React.useMemo(() => {
		const pool = filter === "all" ? FrameworkDefinitions : FrameworkDefinitions.filter((fw) => fw.type === filter)
		return [...pool].sort(by_alias)
	}, [filter])
	const rows = React.useMemo(() => chunk(frameworks, effective_cols), [frameworks, effective_cols])

	const grid_style = React.useMemo<React.CSSProperties>(() => ({ gridTemplateColumns: `repeat(${effective_cols}, minmax(0, 1fr))` }), [effective_cols])

	return (
		<PbTabShell
			tabId="frameworks"
			alias={tab.alias}
			description={tab.description}
			keyPrefix={`${frameworks_key_prefix}-intro`}
			gap="sm"
			focus={false}
			introClassName={ui.margin.bottomMd}
			className={ui.margin.bottomNone}
		>
			<FrameworksBar value={filter} onChange={on_filter_change} cols={cols} onChangeCols={on_cols_change} col_options={col_options} />

			<div className={cn("flex flex-col", ui.gap.sm)}>
				{rows.map((row, i) => (
					<PbReveal key={`${filter}-${effective_cols}-row-${i}`} className="w-full">
						<div style={grid_style} className={cn("grid", ui.gap.sm)}>
							{row.map((fw) => (
								<div
									key={fw.id}
									data-search-target={search_target_for_framework(fw.id)}
									data-search-align="focus"
									data-search-focus-offset={12}
									className="w-full"
								>
									<FrameworkCard fw={fw} is_open={is_open} on_toggle_pillar={toggle_pillar} transition={collapse_transition} />
								</div>
							))}
							{row.length < effective_cols
								? Array.from({ length: effective_cols - row.length }, (_, j) => <div key={`filler-${i}-${j}`} className="hidden md:block" aria-hidden="true" />)
								: null}
						</div>
					</PbReveal>
				))}
			</div>
		</PbTabShell>
	)
}
