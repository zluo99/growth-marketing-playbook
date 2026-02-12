"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"
import { motion, type HTMLMotionProps, type MotionProps, type Transition } from "framer-motion"

import { ui, type TypographyKey } from "@/components/tokens/design"
import { uiMotion, useRafThrottle, useReducedMotionBool } from "@/components/tokens/motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useMounted } from "@/lib/hooks/use-mounted"
import { clamp_value, cn, lerp_value } from "@/lib/utils"

import { Renderer } from "@/features/playbook/components/ui/renderer"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type WithHover = { hover?: boolean }
type WithShadow = { shadow?: boolean }

type HeadingTag = "div" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
type SurfaceTone = "card" | "panel" | "popover"
type Tone = "default" | "muted"

type StackGap = "sm" | "md" | "lg"
type PanelSurfaceSize = "sm" | "md"
type ScrollRoot = Window | HTMLElement

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const tone_class = {
	default: "text-foreground",
	muted: "text-muted-foreground",
} as const satisfies Record<Tone, string>

const typography_class = {
	body: ui.typography.body,
	caption: ui.typography.caption,
	label: ui.typography.label,
	"title-sm": ui.typography.title.sm,
	"title-md": ui.typography.title.md,
	"title-lg": ui.typography.title.lg,
} as const satisfies Record<TypographyKey, string>

const panel_opaque_classes = "bg-white text-black dark:bg-black dark:text-white"

const motion_keys = new Set([
	"initial",
	"animate",
	"exit",
	"whileHover",
	"whileTap",
	"whileFocus",
	"whileInView",
	"viewport",
	"transition",
	"variants",
	"layout",
	"layoutId",
	"drag",
	"dragConstraints",
	"dragElastic",
	"dragMomentum",
	"dragPropagation",
	"dragTransition",
	"onAnimationStart",
	"onAnimationComplete",
	"onUpdate",
])

export const FocusMinScrollableDistancePx = 96
const focus_line_ratio = 0.45
const focus_sticky_band_px = 180
const ratio_sticky_min = 0.08
const search_highlight_attr = "data-search-highlight"
const scroll_event_options: AddEventListenerOptions = { passive: true }

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function render_inline_copy(node: React.ReactNode, key_prefix = "pb-inline") {
	return typeof node === "string" ? Renderer.Copy.renderInlineText(node, { keyPrefix: key_prefix }) : node
}

export const createUnknownMetricLogger = (label: string) => (token: string) => {
	if (process.env.NODE_ENV !== "production") console.warn(`[${label}] Unknown metric token: "${token}"`)
	return token
}

function surface_class(opts: { hover: boolean; radius: string; shadow?: boolean; tone: SurfaceTone }) {
	const surface = opts.tone === "card" ? ui.surface.structure.card : opts.tone === "panel" ? ui.surface.structure.panel : ui.surface.structure.popover
	return cn(
		opts.radius,
		surface,
		ui.surface.structure.shadowNone,
		ui.motion.duration,
		ui.component.outline.base,
		opts.hover && ui.component.outline.hover,
		opts.hover && opts.shadow && ui.component.hoverShadow
	)
}

function strip_motion_props<T extends Record<string, unknown>>(props: T) {
	const out: Record<string, unknown> = {}
	for (const k in props) if (!motion_keys.has(k)) out[k] = props[k]
	return out as Omit<T, keyof MotionProps>
}

function get_scroll_root(scroll_root_ref?: React.RefObject<HTMLElement | null>) {
	if (scroll_root_ref?.current) return scroll_root_ref.current
	return typeof window === "undefined" ? null : window
}

function get_scroll_metrics(scroll_root: ScrollRoot) {
	if (scroll_root instanceof Window) {
		const d = document.documentElement
		const vh = window.innerHeight || 0
		const top = window.scrollY || d.scrollTop || 0
		const max = Math.max(0, (d.scrollHeight || 0) - vh)
		return { top, max, scrollable: max > 1, vh, viewport_top: 0, viewport_bottom: vh }
	}

	const vh = scroll_root.clientHeight || 0
	const top = scroll_root.scrollTop || 0
	const max = Math.max(0, (scroll_root.scrollHeight || 0) - vh)
	const rect = scroll_root.getBoundingClientRect()
	return { top, max, scrollable: max > 1, vh, viewport_top: rect.top, viewport_bottom: rect.bottom }
}

export function getFocusViewportBounds() {
	if (typeof window === "undefined") return { vh: 0, top: 0, bottom: 0, sticky: 0 }
	const vh = window.innerHeight || 0
	const sticky = window.matchMedia("(min-width: 768px)").matches ? 96 : 72
	return { vh, top: sticky, bottom: vh, sticky }
}

function overlap_ratio(rect: DOMRect, viewport_top: number, viewport_bottom: number) {
	const overlap = Math.min(viewport_bottom, rect.bottom) - Math.max(viewport_top, rect.top)
	return rect.height > 0 ? clamp_value(overlap / rect.height, 0, 1) : 0
}

function find_highlighted_item(root: HTMLElement | null) {
	if (!root) return null
	const highlight = root.querySelector(`[${search_highlight_attr}]`)
	if (!highlight) return null
	return highlight.closest<HTMLElement>("[data-slot='pb-focus-item']")
}

function resolve_search_focus_offset(item: HTMLElement | null, fallback: number) {
	if (!item) return fallback
	const target = item.querySelector<HTMLElement>("[data-search-target]")
	if (!target) return fallback
	const raw = target.dataset.searchFocusOffset
	if (!raw) return fallback
	const parsed = Number(raw)
	return Number.isFinite(parsed) ? parsed : fallback
}

function useFocusStack(
	count: number,
	{
		enabled,
		focusOffsetPx,
		topStickPx,
		bottomStickPx,
		scrollRootRef,
	}: { enabled: boolean; focusOffsetPx: number; topStickPx: number; bottomStickPx: number; scrollRootRef?: React.RefObject<HTMLElement | null> }
) {
	const mounted = useMounted()
	const root_ref = React.useRef<HTMLDivElement | null>(null)
	const item_refs = React.useRef<(HTMLElement | null)[]>([])
	const item_index_ref = React.useRef(new Map<HTMLElement, number>())
	const ratio_ref = React.useRef<number[]>([])

	const [active_index, set_active_index] = React.useState(0)
	const [vis_ratio, set_vis_ratio] = React.useState<number[]>(() => Array.from({ length: count }, () => 0))
	const [scrollable, set_scrollable] = React.useState(true)

	React.useEffect(() => {
		set_vis_ratio((prev) => (prev.length === count ? prev : Array.from({ length: count }, (_, i) => prev[i] ?? 0)))
		set_active_index((prev) => clamp_value(prev, 0, Math.max(0, count - 1)))
		ratio_ref.current = Array.from({ length: count }, (_, i) => ratio_ref.current[i] ?? 0)
		item_refs.current = item_refs.current.slice(0, count)
		item_index_ref.current = new Map(item_refs.current.flatMap((el, idx) => (el ? [[el, idx] as const] : [])))
	}, [count])

	const set_ref = React.useCallback(
		(idx: number) => (el: HTMLElement | null) => {
			const prev = item_refs.current[idx]
			if (prev) item_index_ref.current.delete(prev)
			item_refs.current[idx] = el
			if (el) item_index_ref.current.set(el, idx)
		},
		[]
	)

	const measure = React.useCallback(() => {
		if (!mounted || !enabled) return

		const scroll_root = get_scroll_root(scrollRootRef)
		if (!scroll_root) return

		const { top, max, scrollable: is_scrollable, vh, viewport_top, viewport_bottom } = get_scroll_metrics(scroll_root)
		const root_rect = root_ref.current?.getBoundingClientRect()
		const stack_overflows_viewport = root_rect ? root_rect.height > vh + 1 : false
		const has_scroll_room = is_scrollable && stack_overflows_viewport && max > FocusMinScrollableDistancePx

		set_scrollable((prev) => (prev === has_scroll_room ? prev : has_scroll_room))

		const highlighted_item = find_highlighted_item(root_ref.current)
		const focus_offset_px = resolve_search_focus_offset(highlighted_item, focusOffsetPx)

		const visible_top = root_rect ? clamp_value(root_rect.top, viewport_top, viewport_bottom) : viewport_top
		const visible_bottom = root_rect ? clamp_value(root_rect.bottom, viewport_top, viewport_bottom) : viewport_bottom
		const focus_y = clamp_value(viewport_top + vh * focus_line_ratio + focus_offset_px, visible_top + 8, visible_bottom - 8)

		const items = item_refs.current
		const ratios = ratio_ref.current
		let next_vis = Array.from({ length: count }, (_, i) => ratios[i] ?? 0)

		const is_at_top = top <= topStickPx + 4
		const is_at_bottom = max - top <= bottomStickPx + 4

		const rect_cache = new Map<number, DOMRect>()
		const get_rect = (idx: number) => {
			if (rect_cache.has(idx)) return rect_cache.get(idx) ?? null
			const el = items[idx]
			if (!el) return null
			const rect = el.getBoundingClientRect()
			rect_cache.set(idx, rect)
			return rect
		}

		const has_visible_ratio = next_vis.some((ratio) => ratio > 0)
		if (!has_visible_ratio) {
			next_vis = next_vis.map((_, i) => {
				const rect = get_rect(i)
				return rect ? overlap_ratio(rect, viewport_top, viewport_bottom) : 0
			})
		}

		const candidate_indexes = has_visible_ratio
			? next_vis.flatMap((ratio, i) => (ratio > 0 ? [i] : []))
			: next_vis.flatMap((ratio, i) => (ratio > 0 || items[i] ? [i] : []))

		let best_idx = -1
		let best_ratio = -1
		let best_dist = Number.POSITIVE_INFINITY
		let first_visible = -1

		for (let i = 0; i < count; i++) {
			const ratio = next_vis[i] ?? 0
			if (ratio > 0 && first_visible < 0) first_visible = i
		}

		for (const i of candidate_indexes) {
			const ratio = next_vis[i] ?? 0
			const r = get_rect(i)
			if (!r) continue
			const dist = Math.abs(r.top + r.height / 2 - focus_y)

			const ratio_priority = ratio + 1e-6 * (count - i) // prefer higher ratio, then earlier items
			const is_better_ratio = ratio_priority > best_ratio + 1e-6
			const is_better_dist = Math.abs(ratio_priority - best_ratio) <= 1e-6 && dist < best_dist

			if (is_better_ratio || is_better_dist) {
				best_idx = i
				best_ratio = ratio_priority
				best_dist = dist
			}
		}

		if (highlighted_item) {
			const highlighted_idx = item_index_ref.current.get(highlighted_item)
			if (highlighted_idx != null && (next_vis[highlighted_idx] ?? 0) > 0) best_idx = highlighted_idx
		}

		if (count > 0) {
			if (is_at_top && first_visible >= 0) best_idx = first_visible
			else if (is_at_bottom) best_idx = count - 1
		}

		if (
			best_idx >= 0 &&
			active_index >= 0 &&
			active_index < count &&
			(next_vis[active_index] ?? 0) >= ratio_sticky_min
		) {
			const r = get_rect(active_index)
			if (r) {
				const dist = Math.abs(r.top + r.height / 2 - focus_y)
				if (dist <= focus_sticky_band_px) best_idx = active_index
			}
		}

		set_vis_ratio((prev) => {
			if (prev.length !== next_vis.length) return next_vis
			for (let i = 0; i < next_vis.length; i++) if (prev[i] !== next_vis[i]) return next_vis
			return prev
		})

		if (best_idx < 0 && count > 0) best_idx = 0
		if (best_idx >= 0) set_active_index((prev) => (prev === best_idx ? prev : best_idx))
	}, [active_index, count, enabled, focusOffsetPx, mounted, topStickPx, bottomStickPx, scrollRootRef])

	const measure_raf = useRafThrottle(measure)

	React.useLayoutEffect(() => {
		measure()
	}, [measure])

	React.useEffect(() => {
		if (!mounted || !enabled) return
		const scroll_root = get_scroll_root(scrollRootRef)
		if (!scroll_root) return
		const thresholds = [0, 0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 1]
		let ro: ResizeObserver | null = null
		let io: IntersectionObserver | null = null

		const attach_observers = () => {
			if (typeof ResizeObserver !== "undefined") {
				ro = new ResizeObserver(() => measure_raf())
				if (root_ref.current) ro.observe(root_ref.current)
				for (const el of item_refs.current) if (el) ro.observe(el)
			}

			if (typeof IntersectionObserver !== "undefined") {
				io = new IntersectionObserver(
					(entries) => {
						let changed = false
						for (const entry of entries) {
							const idx = item_index_ref.current.get(entry.target as HTMLElement) ?? -1
							if (idx < 0) continue
							const ratio = entry.intersectionRatio
							if (ratio_ref.current[idx] !== ratio) {
								ratio_ref.current[idx] = ratio
								changed = true
							}
						}
						if (changed) measure_raf()
					},
					{ root: scroll_root instanceof Window ? null : scroll_root, threshold: thresholds }
				)
				for (const el of item_refs.current) if (el) io.observe(el)
			}
		}

		attach_observers()
		const on_scroll = () => measure_raf()
		const on_resize = () => measure_raf()

		scroll_root.addEventListener("scroll", on_scroll, scroll_event_options)
		window.addEventListener("resize", on_resize)

		return () => {
			scroll_root.removeEventListener("scroll", on_scroll, scroll_event_options)
			window.removeEventListener("resize", on_resize)
			io?.disconnect()
			ro?.disconnect()
		}
	}, [enabled, measure_raf, mounted, scrollRootRef])

	return { root_ref, set_ref, active_index, vis_ratio, scrollable }
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

export type PbFocusProps = {
	className?: string
	children: React.ReactNode
	enabled?: boolean
	lockInteraction?: boolean
	edgeFade?: boolean
	scrollRootRef?: React.RefObject<HTMLElement | null>
	focusOffsetPx?: number
	inactiveOpacity?: number
	nearOpacity?: number
	outOfViewOpacity?: number
	topStickPx?: number
	bottomStickPx?: number
}

export function PbFocus({
	className,
	children,
	enabled = true,
	lockInteraction = true,
	edgeFade = true,
	scrollRootRef,
	focusOffsetPx = 0,
	inactiveOpacity = 0.18,
	nearOpacity = 0.3,
	outOfViewOpacity = 0.02,
	topStickPx = 24,
	bottomStickPx = 24,
}: PbFocusProps) {
	const reduce_motion = useReducedMotionBool()

	const child_array = React.useMemo(() => React.Children.toArray(children), [children])
	const count = child_array.length

	const { root_ref, set_ref, active_index, vis_ratio, scrollable } = useFocusStack(count, {
		enabled,
		focusOffsetPx,
		topStickPx,
		bottomStickPx,
		scrollRootRef,
	})
	const get_base_opacity = React.useCallback(
		(idx: number) => (idx === active_index ? 1 : Math.abs(idx - active_index) === 1 ? nearOpacity : inactiveOpacity),
		[active_index, inactiveOpacity, nearOpacity]
	)

	const transition_style = reduce_motion ? undefined : "opacity var(--motion-duration-base) var(--motion-ease-standard), filter var(--motion-duration-base) var(--motion-ease-standard)"
	const has_prev = active_index > 0
	const has_next = active_index < count - 1
	const allow_effects = enabled && scrollable && !reduce_motion
	const show_edge_fade = edgeFade && !reduce_motion

	return (
		<div
			ref={root_ref}
			data-slot="pb-focus"
			data-enabled={enabled ? "true" : "false"}
			data-active-index={active_index}
			data-scrollable={allow_effects ? "true" : "false"}
			className={cn("relative", className)}
		>
			{show_edge_fade ? (
				<>
					<div
						aria-hidden="true"
						className={cn(
							"pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-background to-transparent",
							(!has_prev || !allow_effects) && "opacity-0"
						)}
					/>
					<div
						aria-hidden="true"
						className={cn(
							"pointer-events-none absolute inset-x-0 bottom-0 z-10 h-14 bg-gradient-to-t from-background to-transparent",
							(!has_next || !allow_effects) && "opacity-0"
						)}
					/>
				</>
			) : null}

			{child_array.map((child, idx) => {
				const is_active = idx === active_index
				const ratio = vis_ratio[idx] ?? 0
				const lock = enabled && lockInteraction && allow_effects && !is_active
				const opacity = !allow_effects ? 1 : is_active ? 1 : lerp_value(outOfViewOpacity, get_base_opacity(idx), ratio)

				const child_key = React.isValidElement(child) && child.key != null ? child.key : `pb-focus-item-${idx}`

				return (
					<div
						key={child_key}
						ref={set_ref(idx)}
						data-slot="pb-focus-item"
						data-active={is_active ? "true" : "false"}
						style={{
							opacity,
							filter: enabled && scrollable && !is_active ? `saturate(${lerp_value(0.4, 0.8, ratio)})` : undefined,
							transition: transition_style,
							pointerEvents: lock ? "none" : undefined,
						}}
					>
						{child}
					</div>
				)
			})}
		</div>
	)
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

export type PbRevealProps = Omit<HTMLMotionProps<"div">, "children" | "transition" | "viewport"> & {
	children?: React.ReactNode
	enabled?: boolean
	forceMotion?: boolean
	once?: boolean
	amount?: number
	margin?: string
	offsetY?: number
	transition?: Transition
	/* * pass active tab / route key to replay on tab switches */
	replayKey?: React.Key
}

export const PbReveal = React.forwardRef<HTMLDivElement, PbRevealProps>(function PbReveal(
	{ className, enabled = true, forceMotion = false, once: _once, amount: _amount, margin: _margin, offsetY, transition, replayKey, children, ...motion_props },
	ref
) {
	void _once
	void _amount
	void _margin

	const mounted = useMounted()
	const reduce_motion = useReducedMotionBool()

	const is_enabled = enabled && (forceMotion || !reduce_motion)
	const y = offsetY ?? uiMotion.reveal.offsetY
	const enter_transition: Transition = transition ?? (reduce_motion ? uiMotion.reveal.enter.reduced : uiMotion.reveal.enter.tween)

	if (!mounted || !is_enabled) {
		const div_props = strip_motion_props(motion_props as unknown as Record<string, unknown>)
		return (
			<div ref={ref} data-slot="pb-reveal" className={className} {...(div_props as React.HTMLAttributes<HTMLDivElement>)}>
				{children}
			</div>
		)
	}

	return (
		<motion.div
			key={replayKey}
			ref={ref}
			data-slot="pb-reveal"
			className={className}
			initial={{ opacity: 0, y }}
			animate={{ opacity: 1, y: 0 }}
			transition={enter_transition}
			{...(motion_props as unknown as HTMLMotionProps<"div">)}
		>
			{children}
		</motion.div>
	)
})
PbReveal.displayName = "PbReveal"

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

export const PbText = React.forwardRef<
	HTMLSpanElement,
	React.HTMLAttributes<HTMLSpanElement> & {
		size?: TypographyKey
		tone?: Tone
		keyPrefix?: string
	}
>(function PbText({ className, size = "body", tone = "default", keyPrefix, ...props }, ref) {
	return (
		<span ref={ref} data-slot="pb-text" className={cn(typography_class[size], tone_class[tone], className)} {...props}>
			{render_inline_copy(props.children, keyPrefix ?? "pb-text")}
		</span>
	)
})
PbText.displayName = "PbText"

export function PbSubtleText(props: React.ComponentProps<typeof PbText>) {
	return <PbText tone="muted" {...props} />
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

export function PbTabIntro({ alias, description, keyPrefix }: { alias: string; description?: string; keyPrefix: string }) {
	return (
		<div className={cn("flex flex-col", ui.gap.xs)}>
			<div className={cn("text-muted-foreground", ui.typography.caption)}>
				<Renderer.Copy.InlineText text={alias} keyPrefix={`${keyPrefix}-alias`} />
			</div>
			{description ? (
				<p className={cn("text-foreground", ui.typography.title.lg)}>
					<Renderer.Copy.InlineText text={description} keyPrefix={`${keyPrefix}-description`} />
				</p>
			) : null}
		</div>
	)
}

export type PbTabShellProps = {
	alias: string
	description?: string
	keyPrefix: string
	tabId?: string
	className?: string
	gap?: StackGap
	focus?: boolean
	focusClassName?: string
	introClassName?: string
	header?: React.ReactNode
	children?: React.ReactNode
}

export const PbTabShell = React.forwardRef<HTMLDivElement, PbTabShellProps>(function PbTabShell(
	{ alias, description, keyPrefix, tabId, className, gap = "lg", focus = true, focusClassName, introClassName, header, children },
	ref
) {
	const gap_class = ui.gap[gap]
	const intro = <PbTabIntro alias={alias} description={description} keyPrefix={keyPrefix} />

	return (
		<div ref={ref} className={cn("flex flex-col", gap_class, className)} data-search-target={tabId ? `tab:${tabId}` : undefined}>
			{introClassName ? <div className={introClassName}>{intro}</div> : intro}
			{header}
			{focus ? <PbFocus className={cn("flex flex-col", gap_class, focusClassName)}>{children}</PbFocus> : children}
		</div>
	)
})
PbTabShell.displayName = "PbTabShell"

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

export const PbCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & WithHover & WithShadow>(function PbCard(
	{ className, hover = true, shadow = true, ...props },
	ref
) {
	return (
		<div
			ref={ref}
			data-slot="pb-card"
			className={cn("flex flex-col text-card-foreground", surface_class({ hover, radius: ui.radius.base, shadow, tone: "card" }), className)}
			{...props}
		/>
	)
})
PbCard.displayName = "PbCard"

export const PbTabCard = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof PbCard>>(function PbTabCard(
	{ className, shadow = false, ...props },
	ref
) {
	return <PbCard ref={ref} shadow={shadow} className={cn("relative overflow-hidden", className)} {...props} />
})
PbTabCard.displayName = "PbTabCard"

export const PbPanel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & WithHover>(function PbPanel({ className, hover = true, ...props }, ref) {
	return <div ref={ref} data-slot="pb-panel" className={cn(surface_class({ hover, radius: ui.radius.base, shadow: false, tone: "panel" }), className)} {...props} />
})
PbPanel.displayName = "PbPanel"

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

export function PbCardHeader({
	className,
	title,
	description,
	body,
	action,
	titleSize = "title-md",
	descriptionSize = "body",
	titleAs = "div",
}: {
	action?: React.ReactNode
	className?: string
	description?: React.ReactNode
	body?: React.ReactNode
	descriptionSize?: TypographyKey
	title: React.ReactNode
	titleAs?: HeadingTag
	titleSize?: TypographyKey
}) {
	const TitleTag = titleAs
	const resolved_description = body ?? description

	return (
		<div
			data-slot="pb-card-header"
			className={cn("flex flex-wrap items-start justify-between gap-x-6 gap-y-2", ui.spacing.cardHeader, className)}
		>
			<div className="min-w-0 flex-1">
				{typeof title === "string" ? (
					<TitleTag className="leading-tight">
						<PbText size={titleSize} keyPrefix="pb-card-header-title">
							{title}
						</PbText>
					</TitleTag>
				) : (
					<div className={cn("leading-tight", tone_class.default)}>{title}</div>
				)}
			</div>

			{action ? <div className="shrink-0">{action}</div> : null}

			{resolved_description ? (
				typeof resolved_description === "string" ? (
					<PbSubtleText size={descriptionSize} className={cn("basis-full w-full min-w-0")} keyPrefix="pb-card-header-description">
						{resolved_description}
					</PbSubtleText>
				) : (
					<div className={cn(tone_class.muted, "basis-full w-full min-w-0")}>{resolved_description}</div>
				)
			) : null}
		</div>
	)
}

export const PbCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function PbCardContent({ className, ...props }, ref) {
	return <div ref={ref} data-slot="pb-card-content" className={cn("flex-1", ui.spacing.cardContent, className)} {...props} />
})
PbCardContent.displayName = "PbCardContent"

export function PbCardGlow(props: React.HTMLAttributes<HTMLDivElement>) {
	return <div {...props} className={cn("pointer-events-none absolute inset-0 z-0", props.className)} />
}

export function PbCardLayer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div {...props} className={cn("relative z-10", className)} />
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

export function PbHeaderTag({ children, className }: { children: React.ReactNode; className?: string }) {
	return (
		<Badge data-slot="pb-header-tag" className={cn("h-6 leading-none", ui.metrics.pillSecondary, className)}>
			{render_inline_copy(children, "pb-header-tag")}
		</Badge>
	)
}

export function PbNumberBadge({ className, number, ariaLabel }: { className?: string; number: React.ReactNode; ariaLabel?: string }) {
	return (
		<span
			aria-label={ariaLabel}
			data-slot="pb-number-badge"
			className={cn(
				"inline-flex items-center justify-center shrink-0 select-none",
				"min-h-6 min-w-6 px-1",
				"leading-none tabular-nums font-semibold",
				"border",
				ui.typography.caption,
				ui.radius.control,
				ui.metrics.pillSecondary,
				className
			)}
		>
			{number}
		</span>
	)
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

export const PbStack = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { asList?: boolean; gap?: StackGap }>(function PbStack(
	{ className, asList = true, gap = "sm", ...props },
	ref
) {
	return <div ref={ref} data-slot="pb-stack" role={asList ? "list" : undefined} className={cn("flex flex-col", ui.gap[gap], className)} {...props} />
})
PbStack.displayName = "PbStack"

export const PbBullet = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & { asListItem?: boolean; marker?: "none" | "dash" | "dot"; size?: TypographyKey; tone?: Tone }
>(function PbBullet({ className, children, marker = "dot", asListItem = true, size = "body", tone = "default", ...props }, ref) {
	const marker_el =
		marker === "none" ? null : marker === "dash" ? (
			<span aria-hidden="true" className={cn("select-none", tone_class.muted)}>
				-
			</span>
		) : (
			<span aria-hidden="true" className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--surface-fg-muted)]" />
		)

	return (
		<div
			ref={ref}
			data-slot="pb-bullet"
			role={asListItem ? "listitem" : undefined}
			className={cn("flex items-start ps-2 leading-snug", ui.gap.sm, typography_class[size], tone_class[tone], className)}
			{...props}
		>
			{marker_el}
			<span className="min-w-0">{render_inline_copy(children, "pb-bullet")}</span>
		</div>
	)
})
PbBullet.displayName = "PbBullet"

export type PbBulletListProps = {
	className?: string
	gap?: StackGap
	items: readonly string[]
	size?: TypographyKey
	marker?: "none" | "dash" | "dot"
	tone?: Tone
	keyPrefix?: string | ((item: string, index: number) => string)
	getKey?: (item: string, index: number) => string
	renderItem?: (item: string, index: number) => React.ReactNode
	onUnknownToken?: (token: string) => React.ReactNode
}

export function PbBulletList({
	className,
	gap = "sm",
	items,
	size = "body",
	marker = "dot",
	tone = "default",
	keyPrefix = "pb-bullet-list",
	getKey,
	renderItem,
	onUnknownToken,
}: PbBulletListProps) {
	const resolve_key_prefix = React.useCallback(
		(item: string, index: number) => (typeof keyPrefix === "function" ? keyPrefix(item, index) : keyPrefix),
		[keyPrefix]
	)

	return (
		<PbStack asList className={className} gap={gap}>
			{items.map((t, i) => (
				<PbBullet key={getKey?.(t, i) ?? `${i}-${t}`} asListItem marker={marker} size={size} tone={tone}>
					{renderItem ? renderItem(t, i) : <Renderer.Copy.InlineText text={t} keyPrefix={resolve_key_prefix(t, i)} onUnknownToken={onUnknownToken} />}
				</PbBullet>
			))}
		</PbStack>
	)
}

export function PbMetricList({
	className,
	gap = "sm",
	items,
	size = "body",
	tone = "default",
	keyPrefix = "metric-bullet",
	getKey,
	renderItem,
	onUnknownToken,
}: {
	className?: string
	gap?: StackGap
	items: readonly string[]
	size?: TypographyKey
	tone?: Tone
	keyPrefix?: string | ((item: string, index: number) => string)
	getKey?: (item: string, index: number) => string
	renderItem?: (item: string, index: number) => React.ReactNode
	onUnknownToken?: (token: string) => React.ReactNode
}) {
	return (
		<PbBulletList
			className={cn(ui.margin.topSm, className)}
			gap={gap}
			items={items}
			size={size}
			marker="dot"
			tone={tone}
			keyPrefix={keyPrefix}
			getKey={getKey}
			renderItem={renderItem}
			onUnknownToken={onUnknownToken}
		/>
	)
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

type PbButtonProps = {
	className?: string
	href?: string
	icon: React.ReactNode
	label: string
	labelHidden?: boolean
	tooltip?: string
	ariaLabel?: string
	external?: boolean
	tone?: Tone
} & Omit<React.ComponentProps<typeof Button>, "asChild" | "children">

export const PbButton = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, PbButtonProps>(function PbButton(
	{
		className,
		href,
		icon,
		label,
		labelHidden,
		tooltip,
		ariaLabel,
		external,
		variant = "outline",
		size = "sm",
		type,
		tone = "muted",
		...buttonProps
	},
	ref
) {
	const is_external = external ?? (!!href && /^https?:\/\//.test(href))
	const hover_tone = tone === "muted" ? ui.text.interactive.all : ui.text.default.fg
	const resolved_aria_label = ariaLabel ?? (labelHidden ? label : undefined)

	const icon_only = labelHidden
	const icon_el = (
		<span className={cn("block leading-none", ui.iconNude.lg, hover_tone, ui.motion.duration)} aria-hidden="true">
			{icon}
		</span>
	)

	const inner = icon_only ? (
		<span className="flex h-full w-full items-center justify-center">
			{icon_el}
			<span className="sr-only">{label}</span>
		</span>
	) : (
		<span className={cn("inline-flex items-center", ui.gap.sm)}>
			{icon_el}
			<span className={cn(ui.typography.body, hover_tone, ui.motion.duration)}>{render_inline_copy(label, "pb-button")}</span>
		</span>
	)

	const control = href ? (
		<Button asChild variant={variant} size={size} className={cn("group", icon_only ? "p-0" : null, className)} {...buttonProps}>
			<a
				ref={ref as React.Ref<HTMLAnchorElement>}
				href={href}
				aria-label={resolved_aria_label}
				target={is_external ? "_blank" : undefined}
				rel={is_external ? "noreferrer" : undefined}
			>
				{inner}
			</a>
		</Button>
	) : (
		<Button
			type={type}
			variant={variant}
			size={size}
			className={cn("group", className)}
			aria-label={resolved_aria_label}
			ref={ref as React.Ref<HTMLButtonElement>}
			{...buttonProps}
		>
			{inner}
		</Button>
	)

	if (!tooltip) return control

	return (
		<Tooltip>
			<TooltipTrigger asChild>{control}</TooltipTrigger>
			<TooltipContent side="bottom" align="center" className={ui.typography.body}>
				{tooltip}
			</TooltipContent>
		</Tooltip>
	)
})
PbButton.displayName = "PbButton"

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

export type PbTabPanelVariant = "default" | "opaque"
export type PbTabPanelProps = React.ComponentProps<typeof PbPanel> & {
	variant?: PbTabPanelVariant
	interactive?: boolean
	size?: PanelSurfaceSize
}

export const PbTabPanel = React.forwardRef<HTMLDivElement, PbTabPanelProps>(function PbTabPanel(
	{ className, interactive = true, variant = "default", size = "md", ...props },
	ref
) {
	const padding = size === "sm" ? ui.spacing.panelSm : ui.spacing.panelMd
	return (
		<PbPanel
			ref={ref}
			{...props}
			className={cn(
				ui.surface.structure.shadowNone,
				ui.motion.duration,
				padding,
				variant === "opaque" ? panel_opaque_classes : null,
				interactive ? ui.component.outline.hover : null,
				className
			)}
		/>
	)
})
PbTabPanel.displayName = "PbTabPanel"

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

export type LazyGateOptions = {
	fallbackMs?: number
}

const default_fallback_ms = 1000

export function useLazyGate({ fallbackMs = default_fallback_ms }: LazyGateOptions = {}) {
	const [ready, set_ready] = React.useState(false)
	const trigger = React.useCallback(() => set_ready(true), [])

	React.useEffect(() => {
		if (ready) return
		const id = window.setTimeout(trigger, fallbackMs)
		return () => window.clearTimeout(id)
	}, [fallbackMs, ready, trigger])

	return { ready, trigger }
}


