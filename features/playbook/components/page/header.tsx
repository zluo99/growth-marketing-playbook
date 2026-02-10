"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, useMotionValue, useSpring } from "framer-motion"

import { ui } from "@/components/tokens/design"
import { uiMotion, useRafThrottle, useReducedMotionBool } from "@/components/tokens/motion"
import { Bar, BarRail, BarScroller, BarScrollButton } from "@/components/nav/bar"
import { Dropdown, type DropdownItem } from "@/components/nav/dropdown"
import { MotionPillIndicator, PillList, PillRoot, PillTrigger, useMotionPillRail } from "@/components/nav/pill"
import { clamp_value, cn } from "@/lib/utils"
import { useTapFeedback } from "@/lib/hooks/use-tap-feedback"

import { TabById, TabOrder, type TabId, type TabMeta, PlaybookTabs } from "../../definitions/tabs"
import { Renderer } from "../ui/renderer"
import { PageCopy } from "../../copy/page"
import { Search } from "@/components/nav/search"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type TabsBarProps = { activeTab: TabId; onGoToTab: (v: TabId) => void; reduceMotion: boolean }

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const tab_order = TabOrder
const tab_options: DropdownItem<TabId>[] = PlaybookTabs.map((t) => ({ value: t.id, label: t.alias, icon: t.icon }))
const scroller_id = "playbook-tabs-scroller"

const arrow_variants = {
	show: { opacity: 1, scale: 1, filter: "blur(0px)" },
	hide: { opacity: 0, scale: 0.96, filter: "blur(1px)" },
} as const

const desktop_media_query = "(min-width: 768px)"

const hide_extra_px = 26
const hide_lock_margin_px = 8

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const get_sticky_top_px = () => (window.matchMedia(desktop_media_query).matches ? 16 : 12)

function useIsDesktopBreakpoint() {
	const [is_desktop, set_is_desktop] = React.useState(false)

	React.useEffect(() => {
		if (typeof window === "undefined") return

		const mql = window.matchMedia(desktop_media_query)
		const on_change = (event: MediaQueryListEvent) => set_is_desktop(event.matches)

		set_is_desktop(mql.matches)

		if (typeof mql.addEventListener === "function") {
			mql.addEventListener("change", on_change)
			return () => mql.removeEventListener("change", on_change)
		}

		mql.addListener(on_change)
		return () => mql.removeListener(on_change)
	}, [])

	return is_desktop
}

/* -------------------------------------------------------------------------- */
/* Hooks                                                                      */
/* -------------------------------------------------------------------------- */

function useMeasureHeight<T extends HTMLElement>(ref: React.RefObject<T | null>) {
	const [height, set_height] = React.useState(0)

	React.useLayoutEffect(() => {
		const el = ref.current
		if (!el) return

		const measure = () => {
			const next = Math.ceil(el.getBoundingClientRect().height)
			set_height((prev) => (prev === next ? prev : next))
		}

		measure()

		const ro = new ResizeObserver(measure)
		ro.observe(el)
		window.addEventListener("resize", measure)

		return () => {
			window.removeEventListener("resize", measure)
			ro.disconnect()
		}
	}, [ref])

	return height
}

function useStickyState<T extends HTMLElement>(sentinel_ref: React.RefObject<T | null>) {
	const [is_stuck, set_is_stuck] = React.useState(false)

	React.useEffect(() => {
		const el = sentinel_ref.current
		if (!el) return

		let obs: IntersectionObserver | null = null
		const setup = () => {
			const sticky_top = get_sticky_top_px()
			obs?.disconnect()
			obs = new IntersectionObserver((entries) => set_is_stuck(!entries[0].isIntersecting), {
				threshold: 0,
				rootMargin: `-${sticky_top + 1}px 0px 0px 0px`,
			})
			obs.observe(el)
		}

		setup()
		window.addEventListener("resize", setup)
		return () => {
			window.removeEventListener("resize", setup)
			obs?.disconnect()
		}
	}, [sentinel_ref])

	return is_stuck
}

function useTabBarHide({
	bar_ref,
	bar_height,
	is_stuck,
	y_target,
}: {
	bar_ref: React.RefObject<HTMLDivElement | null>
	bar_height: number
	is_stuck: boolean
	y_target: ReturnType<typeof useMotionValue<number>>
}) {
	React.useEffect(() => {
		const bar = bar_ref.current
		if (!bar) return

		let last_y = Math.max(0, window.scrollY || 0)
		let hidden_progress = 0
		let raf_id: number | null = null

		const set_interactive = (v: boolean) => {
			bar.style.pointerEvents = v ? "auto" : "none"
		}

		const apply = () => {
			const curr = Math.max(0, window.scrollY || 0)
			const raw_delta = curr - last_y
			last_y = curr

			if (!is_stuck) {
				hidden_progress = 0
				y_target.set(0)
				set_interactive(true)
				return
			}

			const sticky_top = get_sticky_top_px()
			if (curr <= sticky_top + hide_lock_margin_px) {
				hidden_progress = 0
				y_target.set(0)
				set_interactive(true)
				return
			}

			const hide_dist = Math.max(1, bar_height + hide_extra_px)
			const delta = clamp_value(raw_delta, -40, 40)

			hidden_progress = clamp_value(hidden_progress + delta, 0, hide_dist)
			y_target.set(-hidden_progress)
			set_interactive(hidden_progress < hide_dist - 2)
		}

		const apply_raf = () => {
			if (raf_id != null) return
			raf_id = requestAnimationFrame(() => {
				raf_id = null
				apply()
			})
		}

		apply()
		const on_scroll = () => apply_raf()
		const on_resize = () => apply_raf()
		window.addEventListener("scroll", on_scroll, { passive: true })
		window.addEventListener("resize", on_resize, { passive: true })

		return () => {
			window.removeEventListener("scroll", on_scroll)
			window.removeEventListener("resize", on_resize)
		}
	}, [bar_height, bar_ref, is_stuck, y_target])
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function TabLabel({ tab, isActive, className }: { tab: TabMeta; isActive: boolean; className?: string }) {
	const Icon = tab.icon
	const iconTone = isActive ? ui.icon.default.fg : ui.icon.interactive.all
	const labelTone = isActive ? ui.text.default.fg : cn(ui.text.muted.fg, ui.text.interactive.groupHover)

	return (
		<span className={cn("inline-flex items-center", ui.gap.sm, className)}>
			<Icon className={cn(ui.iconNude.md, "shrink-0", ui.motion.duration, iconTone)} />
			<span className={cn("min-w-0 truncate", ui.typography.label, ui.motion.duration, labelTone)}>
				<Renderer.Copy.InlineText text={tab.alias} keyPrefix={`tabs-nav-${tab.id}`} />
			</span>
		</span>
	)
}

export const HoverMorphArrow = React.memo(function HoverMorphArrow({
	dir,
	hovered = false,
	className,
}: {
	dir: "left" | "right"
	hovered?: boolean
	className?: string
}) {
	const reduce_motion = useReducedMotionBool()
	const transition = React.useMemo(
		() =>
			reduce_motion
				? { duration: 0 }
				: { duration: uiMotion.tokens.durations.base, ease: uiMotion.tokens.easing.standard },
		[reduce_motion]
	)
	const active = hovered

	const tip = dir === "left" ? 8 : 16
	const join_nudge = dir === "left" ? -0.5 : 0.5
	const tailLength = 8
	const headPoints = dir === "left" ? "14,2 8,6 14,10" : "10,2 16,6 10,10"
	const tail = dir === "left" ? { x1: tip, x2: tip + tailLength, shift: -2.5 } : { x1: tip, x2: tip - tailLength, shift: 2.5 }

	return (
		<span
			className={cn(
				"inline-flex h-3.5 w-7 items-center justify-center transition-colors duration-200 ease-out",
				active ? ui.text.default.fg : ui.text.muted.fg,
				className
			)}
		>
			<svg viewBox="0 0 24 12" className="h-3.5 w-7" aria-hidden="true" focusable="false">
				<motion.g animate={{ x: active ? tail.shift : 0 }} transition={transition}>
					<polyline points={headPoints} className="fill-none stroke-current stroke-[1.35]" strokeLinecap="round" strokeLinejoin="round" />
				</motion.g>

				<motion.line
					x1={tail.x1 + join_nudge}
					x2={active ? tail.x2 : tail.x1 + join_nudge}
					y1={6}
					y2={6}
					className="stroke-current stroke-[1.35]"
					strokeLinecap="round"
					initial={false}
					animate={{ x2: active ? tail.x2 : tail.x1 + join_nudge }}
					transition={transition}
				/>
			</svg>
		</span>
	)
})

function HomeButton({ onGoToTab }: { onGoToTab: (id: TabId) => void }) {
	const { isTapActive, tapFeedbackProps } = useTapFeedback<HTMLAnchorElement>()

	const on_click = React.useCallback(
		(event: React.MouseEvent<HTMLAnchorElement>) => {
			event.preventDefault()
			onGoToTab("overview")
		},
		[onGoToTab]
	)

	return (
		<Link
			href="/overview"
			aria-label={PageCopy.headerNavigation.homeButtonAria}
			onClick={on_click}
			data-pressed={isTapActive ? "true" : undefined}
			onPointerDown={tapFeedbackProps.onPointerDown}
			onPointerUp={tapFeedbackProps.onPointerUp}
			onPointerCancel={tapFeedbackProps.onPointerCancel}
			onPointerLeave={tapFeedbackProps.onPointerLeave}
			onBlur={tapFeedbackProps.onBlur}
			className={cn(
				ui.nav.iconButton.chrome,
				"data-[pressed=true]:bg-[color:var(--surface-bg-hover)]",
				"data-[pressed=true]:border-[color:var(--border-hover)]",
				"data-[pressed=true]:[box-shadow:var(--shadow-md)]"
			)}
		>
			<span className={cn(ui.nav.iconButton.contentChrome, "h-full w-full")}>
				<Image
					src="/favicon.ico"
					alt={PageCopy.headerNavigation.homeImageAlt}
					width={ui.brand.homeMarkPx}
					height={ui.brand.homeMarkPx}
					priority
					className={cn(
						ui.brand.homeMarkClass,
						isTapActive ? "opacity-100" : "opacity-60 group-hover:opacity-100",
						"dark:invert",
						ui.motion.duration
					)}
				/>
			</span>
		</Link>
	)
}

function TabsDropdown({ activeTab, onGoToTab }: { activeTab: TabId; onGoToTab: (id: TabId) => void }) {
	return (
		<Dropdown
			align="stretch"
			ariaLabel={PageCopy.headerNavigation.tabsLabel}
			value={activeTab}
			onChange={onGoToTab}
			items={tab_options}
			menuMaxHeightClassName="max-h-[480px]"
			triggerLabel={<TabLabel tab={TabById[activeTab]} isActive className="h-full" />}
		/>
	)
}

const TabsBarRail = React.memo(function TabsBarRail({ activeTab, onGoToTab, reduceMotion }: TabsBarProps) {
	const content_row_ref = React.useRef<HTMLDivElement>(null)
	const rail = useMotionPillRail<TabId>({ activeKey: activeTab, spring: uiMotion.nav.pillSpring })

	const [hoverLeft, setHoverLeft] = React.useState(false)
	const [hoverRight, setHoverRight] = React.useState(false)

	const settle = useRafThrottle(() => {
		rail.pill.measure()
	})

	const ensure_visible = React.useCallback(
		(id: TabId, behavior: "instant" | "smooth" = "smooth") => {
			const btn = rail.triggerRefs.current[id]
			if (!btn) return
			btn.scrollIntoView({ block: "nearest", inline: "center", behavior: behavior === "instant" || reduceMotion ? "auto" : "smooth" })
			settle()
		},
		[rail.triggerRefs, reduceMotion, settle]
	)

	React.useEffect(() => {
		ensure_visible(activeTab, "smooth")
	}, [activeTab, ensure_visible])

	const prefetched_ref = React.useRef<Record<string, boolean>>({})
	const prefetch_tab = React.useCallback((id: TabId) => {
		if (prefetched_ref.current[id]) return
		prefetched_ref.current[id] = true
		if (id === "reports-sql") void import("../../tabs/reports-sql")
		if (id === "reports-workspace") void import("../../tabs/reports-workspace")
	}, [])

	const on_key_down = React.useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return
			e.preventDefault()

			const idx = tab_order.indexOf(activeTab)
			if (idx < 0) return

			const next =
				e.key === "Home"
					? tab_order[0]
					: e.key === "End"
						? tab_order[tab_order.length - 1]
						: e.key === "ArrowLeft"
							? tab_order[Math.max(0, idx - 1)]
							: tab_order[Math.min(tab_order.length - 1, idx + 1)]

			if (next === activeTab) return

			prefetch_tab(next)
			onGoToTab(next)

			requestAnimationFrame(() => {
				rail.triggerRefs.current[next]?.focus?.()
				ensure_visible(next, "instant")
			})
		},
		[activeTab, ensure_visible, onGoToTab, prefetch_tab, rail.triggerRefs]
	)

	return (
		<Bar variant="chrome" className="relative">
			{({ scrollerRef, canScrollLeft, canScrollRight, scrollByPage }) => {
				return (
					<>
						<motion.div
							className="absolute top-1/2 z-30 -translate-y-1/2"
							variants={arrow_variants}
							animate={canScrollLeft ? "show" : "hide"}
							transition={uiMotion.tabs.arrowTransition}
							style={{ left: ui.nav.arrow.insetRem, pointerEvents: canScrollLeft ? "auto" : "none" }}
						>
							<BarScrollButton
								dir="left"
								onClick={() => scrollByPage("left")}
								ariaLabel={PageCopy.headerNavigation.scrollLeftAria}
								controlsId={scroller_id}
								onMouseEnter={() => setHoverLeft(true)}
								onMouseLeave={() => setHoverLeft(false)}
								onFocus={() => setHoverLeft(true)}
								onBlur={() => setHoverLeft(false)}
							>
								<HoverMorphArrow dir="left" hovered={hoverLeft} />
							</BarScrollButton>
						</motion.div>

						<motion.div
							className="absolute top-1/2 z-30 -translate-y-1/2"
							variants={arrow_variants}
							animate={canScrollRight ? "show" : "hide"}
							transition={uiMotion.tabs.arrowTransition}
							style={{ right: ui.nav.arrow.insetRem, pointerEvents: canScrollRight ? "auto" : "none" }}
						>
							<BarScrollButton
								dir="right"
								onClick={() => scrollByPage("right")}
								ariaLabel={PageCopy.headerNavigation.scrollRightAria}
								controlsId={scroller_id}
								onMouseEnter={() => setHoverRight(true)}
								onMouseLeave={() => setHoverRight(false)}
								onFocus={() => setHoverRight(true)}
								onBlur={() => setHoverRight(false)}
							>
								<HoverMorphArrow dir="right" hovered={hoverRight} />
							</BarScrollButton>
						</motion.div>

						<BarScroller id={scroller_id} scrollerRef={scrollerRef} canScrollLeft={canScrollLeft} canScrollRight={canScrollRight}>
							<BarRail>
								<div ref={content_row_ref} className={cn("inline-flex w-max items-center", ui.nav.rail.itemGap)}>
									<PillList
										ref={rail.listRef}
										onKeyDown={on_key_down}
										aria-label={PageCopy.headerNavigation.tabsLabel}
										chrome={false}
										className={cn(ui.nav.rail.listChrome, ui.nav.control.height, "items-center")}
									>
										<MotionPillIndicator
											className={cn(ui.nav.rail.indicatorChrome, ui.nav.control.height, ui.radius.control)}
											pill={rail.pill}
											transition={uiMotion.nav.pillTween}
										/>

										{PlaybookTabs.map((t) => {
											const is_active = activeTab === t.id
											return (
												<PillTrigger
													key={t.id}
													value={t.id}
													ref={rail.getTriggerRef(t.id)}
													onPointerDown={() => {
														ensure_visible(t.id, "instant")
														rail.pill.measureRaf()
													}}
													onPointerEnter={() => prefetch_tab(t.id)}
													onFocus={() => prefetch_tab(t.id)}
													className={ui.nav.rail.triggerChrome}
													aria-label={t.description ? `${t.alias}. ${t.description}` : t.alias}
												>
													<TabLabel tab={t} isActive={is_active} className="relative z-10" />
												</PillTrigger>
											)
										})}
									</PillList>
								</div>
							</BarRail>
						</BarScroller>
					</>
				)
			}}
		</Bar>
	)
})

/* -------------------------------------------------------------------------- */
/* Export                                                                     */
/* -------------------------------------------------------------------------- */

export function PbHeader({
	activeTab,
	onGoToTab,
	reduceMotion,
}: {
	activeTab: TabId
	onGoToTab: (id: TabId) => void
	reduceMotion: boolean
}) {
	const [searchOpen, setSearchOpen] = React.useState(false)
	const sentinel_ref = React.useRef<HTMLDivElement | null>(null)
	const is_stuck = useStickyState(sentinel_ref)

	const y_target = useMotionValue(0)
	const y = useSpring(y_target, uiMotion.tabs.barSpring)

	const bar_ref = React.useRef<HTMLDivElement | null>(null)
	const bar_height = useMeasureHeight(bar_ref)
	useTabBarHide({ bar_ref, bar_height, is_stuck, y_target })

	const is_desktop = useIsDesktopBreakpoint()
	const showTabs = !searchOpen
	const nav_gap_class = cn("flex items-stretch", ui.gap.xs)
	const tabs_wrapper_class = cn(
		"flex-1 min-w-0 transition-opacity",
		ui.motion.duration,
		searchOpen ? "opacity-0 pointer-events-none w-0" : "opacity-100 pointer-events-auto w-full"
	)
	const on_go_to_tab_from_header = React.useCallback(
		(id: TabId) => {
			onGoToTab(id)
			if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "auto" })
		},
		[onGoToTab]
	)
	const tabs_control = is_desktop ? (
		<TabsBarRail activeTab={activeTab} onGoToTab={on_go_to_tab_from_header} reduceMotion={reduceMotion} />
	) : (
		<PillRoot value={activeTab} onValueChange={() => {}} className="w-full">
			<TabsDropdown activeTab={activeTab} onGoToTab={on_go_to_tab_from_header} />
		</PillRoot>
	)

	return (
		<>
			<div ref={sentinel_ref} aria-hidden="true" className="h-0 w-full" />

			<motion.div ref={bar_ref} style={{ y: reduceMotion ? y_target : y }} className={cn("sticky z-50 w-full will-change-transform", "top-3 md:top-4")}>
				<div className={cn("pointer-events-none", ui.nav.headerGap)} />

				<div className="w-full">
					<div className={nav_gap_class}>
						<HomeButton onGoToTab={on_go_to_tab_from_header} />
						<Search onGoToTab={on_go_to_tab_from_header} onOpenChange={setSearchOpen} />
						<div className={tabs_wrapper_class} aria-hidden={!showTabs}>
							{showTabs ? tabs_control : null}
						</div>
					</div>
				</div>
			</motion.div>
		</>
	)
}
