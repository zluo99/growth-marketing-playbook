"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"

import { ui } from "@/components/tokens/design"
import { useRafThrottle, useReducedMotionBool } from "@/components/tokens/motion"
import { cn } from "@/lib/utils"

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

export function Bar({ ariaLabel, variant = "chrome", className, children }: BarProps) {
	const reduce_motion = useReducedMotionBool()
	const scroller_ref = React.useRef<HTMLDivElement>(null)

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

	React.useEffect(() => {
		const el = scroller_ref.current
		if (!el) return

		const on_scroll = () => recompute_raf()
		el.addEventListener("scroll", on_scroll, { passive: true })

		const ro = new ResizeObserver(() => recompute_raf())
		ro.observe(el)

		recompute()

		return () => {
			el.removeEventListener("scroll", on_scroll)
			ro.disconnect()
		}
	}, [recompute, recompute_raf])

	const scroll_by_page = React.useCallback(
		(dir: "left" | "right") => {
			const el = scroller_ref.current
			if (!el) return

			const max = Math.max(0, el.scrollWidth - el.clientWidth)
			const amt = Math.max(240, Math.floor(el.clientWidth * 0.8))
			const to = Math.max(0, Math.min(dir === "left" ? el.scrollLeft - amt : el.scrollLeft + amt, max))

			el.scrollTo({ left: to, behavior: reduce_motion ? "auto" : "smooth" })
			recompute_raf()
		},
		[reduce_motion, recompute_raf]
	)

	const root_chrome = variant === "shell" ? cn(ui.nav.shell.base, ui.nav.heights.md) : cn(ui.nav.chrome.md)

	return (
		<div role={ariaLabel ? "group" : undefined} aria-label={ariaLabel} className={cn(root_chrome, "relative flex items-center", className)}>
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
	className,
	children,
}: {
	id?: string
	scrollerRef: React.RefObject<HTMLDivElement>
	canScrollLeft: boolean
	canScrollRight: boolean
	className?: string
	children: React.ReactNode
}) {
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
				className={cn(
					"relative z-10 min-w-0 flex-1 overflow-x-auto overflow-y-visible",
					"[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
					"transition-[padding] duration-200 ease-out",
					className
				)}
				style={{
					paddingLeft: canScrollLeft ? ui.nav.rail.scroller.padOverflowRem : ui.nav.rail.scroller.padDefaultRem,
					paddingRight: canScrollRight ? ui.nav.rail.scroller.padOverflowRem : ui.nav.rail.scroller.padDefaultRem,
					scrollPaddingLeft: canScrollLeft ? ui.nav.rail.scroller.scrollPadOverflowPx : ui.nav.rail.scroller.scrollPadDefaultPx,
					scrollPaddingRight: canScrollRight ? ui.nav.rail.scroller.scrollPadOverflowPx : ui.nav.rail.scroller.scrollPadDefaultPx,
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

