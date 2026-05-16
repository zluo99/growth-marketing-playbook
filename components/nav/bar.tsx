"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"
import { motion } from "framer-motion"

import { ui } from "@/components/tokens/design"
import { uiMotion, useRafThrottle, useReducedMotionBool } from "@/components/tokens/motion"
import { cn } from "@/lib/cn"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type BarVariant = "chrome" | "shell"

export type BarRenderArgs = {
	scrollerRef: React.RefObject<HTMLDivElement>
	canScrollLeft: boolean
	canScrollRight: boolean
	scrollByPage: (dir: "left" | "right") => void
	reduceMotion: boolean
	recompute: () => void
}

export type BarProps = {
	ariaLabel?: string
	variant?: BarVariant
	className?: string
	children: (args: BarRenderArgs) => React.ReactNode
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

export function Bar({ ariaLabel = "Navigation", variant = "chrome", className, children }: BarProps) {
	const reduce_motion = useReducedMotionBool()
	const scroller_ref = React.useRef<HTMLDivElement>(null)
	const settle_raf_ref = React.useRef<number | null>(null)

	type OverflowState = { canScrollLeft: boolean; canScrollRight: boolean }
	const [state, setState] = React.useState<OverflowState>({ canScrollLeft: false, canScrollRight: false })

	const recompute = React.useCallback(() => {
		const el = scroller_ref.current
		if (!el) return

		const left = el.scrollLeft
		const max = Math.max(0, el.scrollWidth - el.clientWidth)
		const eps = 2
		const has_overflow = max > eps

		const next = {
			canScrollLeft: has_overflow && left > eps,
			canScrollRight: has_overflow && left < max - eps,
		}

		setState((prev) => (prev.canScrollLeft === next.canScrollLeft && prev.canScrollRight === next.canScrollRight ? prev : next))
	}, [])

	const recompute_raf = useRafThrottle(recompute)

	const cancel_settle_loop = React.useCallback(() => {
		if (settle_raf_ref.current == null) return
		cancelAnimationFrame(settle_raf_ref.current)
		settle_raf_ref.current = null
	}, [])

	const settle_after_scroll = React.useCallback(
		(target_left: number) => {
			cancel_settle_loop()

			let frames = 0
			let last_left: number | null = null

			const tick = () => {
				const el = scroller_ref.current
				if (!el) {
					settle_raf_ref.current = null
					return
				}

				recompute()
				const left = el.scrollLeft
				const near_target = Math.abs(left - target_left) <= 1
				const stable = last_left == null ? false : Math.abs(left - last_left) <= 0.5
				last_left = left
				frames += 1

				if ((near_target && stable) || frames >= 30) {
					settle_raf_ref.current = null
					recompute()
					return
				}

				settle_raf_ref.current = requestAnimationFrame(tick)
			}

			settle_raf_ref.current = requestAnimationFrame(tick)
		},
		[cancel_settle_loop, recompute]
	)

	React.useEffect(() => cancel_settle_loop, [cancel_settle_loop])

	React.useEffect(() => {
		const el = scroller_ref.current
		if (!el) return

		const on_scroll = () => recompute_raf()
		el.addEventListener("scroll", on_scroll, { passive: true })

		const ro = new ResizeObserver(() => recompute_raf())
		ro.observe(el)
		let observed_child: HTMLElement | null = null
		const sync_child_observer = () => {
			const next = el.firstElementChild instanceof HTMLElement ? el.firstElementChild : null
			if (observed_child === next) return
			if (observed_child) ro.unobserve(observed_child)
			if (next) ro.observe(next)
			observed_child = next
		}
		sync_child_observer()

		const mo = new MutationObserver(() => {
			sync_child_observer()
			recompute_raf()
		})
		mo.observe(el, { childList: true })

		const on_resize = () => recompute_raf()
		window.addEventListener("resize", on_resize, { passive: true })

		recompute()

		return () => {
			el.removeEventListener("scroll", on_scroll)
			window.removeEventListener("resize", on_resize)
			mo.disconnect()
			if (observed_child) ro.unobserve(observed_child)
			ro.disconnect()
		}
	}, [recompute, recompute_raf])

	const scroll_by_page = React.useCallback(
		(dir: "left" | "right") => {
			const el = scroller_ref.current
			if (!el) return

			const max = Math.max(0, el.scrollWidth - el.clientWidth)
			const amt = Math.max(240, Math.floor(el.clientWidth * 0.8))
			const raw_to = Math.max(0, Math.min(dir === "left" ? el.scrollLeft - amt : el.scrollLeft + amt, max))
			const to = Math.abs(raw_to - max) <= 2 ? max : raw_to
			const use_smooth = !reduce_motion && Math.abs(to - el.scrollLeft) > 1

			el.scrollTo({ left: to, behavior: use_smooth ? "smooth" : "auto" })
			recompute()
			if (use_smooth) settle_after_scroll(to)
		},
		[reduce_motion, recompute, settle_after_scroll]
	)

	const root_chrome = variant === "shell" ? cn(ui.nav.shell.base, ui.nav.heights.md) : cn(ui.nav.chrome.md)

	return (
		<div role="region" aria-label={ariaLabel} className={cn(root_chrome, "relative flex items-center", className)}>
			{children({
				scrollerRef: scroller_ref,
				canScrollLeft: state.canScrollLeft,
				canScrollRight: state.canScrollRight,
				scrollByPage: scroll_by_page,
				reduceMotion: reduce_motion,
				recompute: recompute_raf,
			})}
		</div>
	)
}

export function BarScroller({
	id,
	scrollerRef,
	canScrollLeft,
	canScrollRight,
	dragScroll = true,
	className,
	children,
}: {
	id?: string
	scrollerRef: React.RefObject<HTMLDivElement>
	canScrollLeft: boolean
	canScrollRight: boolean
	dragScroll?: boolean
	className?: string
	children: React.ReactNode
}) {
	const drag_ref = React.useRef<{
		pointerId: number
		startX: number
		startLeft: number
		didDrag: boolean
	} | null>(null)
	const suppress_click_ref = React.useRef(false)
	const clear_suppress_ref = React.useRef<number | null>(null)

	const arm_click_suppression = React.useCallback(() => {
		suppress_click_ref.current = true
		if (clear_suppress_ref.current != null) window.clearTimeout(clear_suppress_ref.current)
		clear_suppress_ref.current = window.setTimeout(() => {
			suppress_click_ref.current = false
			clear_suppress_ref.current = null
		}, 180)
	}, [])

	React.useEffect(() => {
		return () => {
			if (clear_suppress_ref.current != null) window.clearTimeout(clear_suppress_ref.current)
		}
	}, [])

	const on_pointer_down = React.useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			if (!dragScroll || event.button !== 0 || event.pointerType !== "mouse") return
			const el = scrollerRef.current
			if (!el) return
			drag_ref.current = {
				pointerId: event.pointerId,
				startX: event.clientX,
				startLeft: el.scrollLeft,
				didDrag: false,
			}
		},
		[dragScroll, scrollerRef]
	)

	const on_pointer_move = React.useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			const session = drag_ref.current
			if (!session || session.pointerId !== event.pointerId) return
			const el = scrollerRef.current
			if (!el) return

			const dx = event.clientX - session.startX
			if (!session.didDrag && Math.abs(dx) >= 6) session.didDrag = true
			if (!session.didDrag) return

			el.scrollLeft = session.startLeft - dx
			event.preventDefault()
		},
		[scrollerRef]
	)

	const end_drag = React.useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			const session = drag_ref.current
			if (!session || session.pointerId !== event.pointerId) return
			drag_ref.current = null

			if (session.didDrag) arm_click_suppression()
		},
		[arm_click_suppression]
	)

	const on_click_capture = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
		if (!suppress_click_ref.current) return
		suppress_click_ref.current = false
		event.preventDefault()
		event.stopPropagation()
	}, [])

	return (
		<div className="relative flex h-full min-w-0 flex-1 items-center">
			{canScrollLeft ? (
				<div
					className={cn(
						"pointer-events-none absolute inset-y-0 left-0 z-20 w-16 rounded-l-[var(--radius)]",
						"bg-gradient-to-r from-muted/80 via-muted/50 to-transparent dark:from-muted/60 dark:via-muted/40 dark:to-transparent"
					)}
				/>
			) : null}

			{canScrollRight ? (
				<div
					className={cn(
						"pointer-events-none absolute inset-y-0 right-0 z-20 w-16 rounded-r-[var(--radius)]",
						"bg-gradient-to-l from-muted/80 via-muted/50 to-transparent dark:from-muted/60 dark:via-muted/40 dark:to-transparent"
					)}
				/>
			) : null}

			<div
				id={id}
				ref={scrollerRef}
				onPointerDown={on_pointer_down}
				onPointerMove={on_pointer_move}
				onPointerUp={end_drag}
				onPointerCancel={end_drag}
				onPointerLeave={end_drag}
				onClickCapture={on_click_capture}
				className={cn(
					"relative z-10 min-w-0 flex-1 overflow-x-auto overflow-y-visible",
					"[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
					"touch-pan-x overscroll-x-contain select-none",
					"transition-[padding] duration-200 ease-out",
					className
				)}
				style={{
					paddingLeft: canScrollLeft ? ui.nav.rail.scroller.padOverflowRem : ui.nav.rail.scroller.padDefaultRem,
					paddingRight: canScrollRight ? ui.nav.rail.scroller.padOverflowRem : ui.nav.rail.scroller.padDefaultRem,
					scrollPaddingLeft: canScrollLeft ? ui.nav.rail.scroller.scrollPadOverflowPx : ui.nav.rail.scroller.scrollPadDefaultPx,
					scrollPaddingRight: canScrollRight ? ui.nav.rail.scroller.scrollPadOverflowPx : ui.nav.rail.scroller.scrollPadDefaultPx,
					WebkitOverflowScrolling: "touch",
					touchAction: "pan-x",
				}}
			>
				{children}
			</div>
		</div>
	)
}

export function BarRail({ className, children }: { className?: string; children: React.ReactNode }) {
	return <div className={cn("inline-flex w-max items-center", ui.nav.rail.itemGap, className)}>{children}</div>
}

export function BarScrollButton({
	dir,
	onClick,
	ariaLabel,
	controlsId,
	className,
	children,
	onMouseEnter,
	onMouseLeave,
	onFocus,
	onBlur,
	...button_props
}: {
	dir: "left" | "right"
	onClick: () => void
	ariaLabel: string
	controlsId?: string
	className?: string
	children?: React.ReactNode
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type" | "onClick" | "aria-label" | "aria-controls">) {
	const [hovered, set_hovered] = React.useState(false)

	const on_mouse_enter = React.useCallback(
		(event: React.MouseEvent<HTMLButtonElement>) => {
			set_hovered(true)
			onMouseEnter?.(event)
		},
		[onMouseEnter]
	)

	const on_mouse_leave = React.useCallback(
		(event: React.MouseEvent<HTMLButtonElement>) => {
			set_hovered(false)
			onMouseLeave?.(event)
		},
		[onMouseLeave]
	)

	const on_focus = React.useCallback(
		(event: React.FocusEvent<HTMLButtonElement>) => {
			set_hovered(true)
			onFocus?.(event)
		},
		[onFocus]
	)

	const on_blur = React.useCallback(
		(event: React.FocusEvent<HTMLButtonElement>) => {
			set_hovered(false)
			onBlur?.(event)
		},
		[onBlur]
	)

	return (
		<button
			type="button"
			onClick={onClick}
			onMouseEnter={on_mouse_enter}
			onMouseLeave={on_mouse_leave}
			onFocus={on_focus}
			onBlur={on_blur}
			aria-label={ariaLabel}
			aria-controls={controlsId}
			className={cn(ui.nav.arrow.buttonChrome, "group min-h-[44px] min-w-[44px]", className)}
			{...button_props}
		>
			{children ?? (
				<BarMorphArrow dir={dir} hovered={hovered} />
			)}
		</button>
	)
}

export const BarMorphArrow = React.memo(function BarMorphArrow({
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
	const tail_length = 8
	const head_points = dir === "left" ? "14,2 8,6 14,10" : "10,2 16,6 10,10"
	const tail = dir === "left" ? { x1: tip, x2: tip + tail_length, shift: -2.5 } : { x1: tip, x2: tip - tail_length, shift: 2.5 }

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
					<polyline points={head_points} className="fill-none stroke-current stroke-[1.35]" strokeLinecap="round" strokeLinejoin="round" />
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

