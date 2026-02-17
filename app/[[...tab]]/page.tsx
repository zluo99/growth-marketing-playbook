"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

import { ui } from "@/components/tokens/design"
import { uiMotion, useReducedMotionBool } from "@/components/tokens/motion"
import { clamp_value, cn } from "@/lib/utils"

import PbBody from "@/features/playbook/components/page/body"
import PbFooter from "@/features/playbook/components/page/footer"
import { OverviewOverlayLetters } from "@/features/playbook/tabs/overview-overlay"
import { overview_tab_separator, overview_tab_subtitle, overview_tab_title } from "@/features/playbook/definitions/tabs"

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const intro_scroll_distance_px = 520
const intro_complete_threshold = 0.999
const intro_completion_hold_ms = 900
let intro_completed_once = false

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

type LetterDelta = { dx: number; dy: number; sx: number; sy: number } | null

const total_intro_letters = Array.from(`${overview_tab_title}${overview_tab_separator}${overview_tab_subtitle}`).length

function cubic_bezier_value(t: number, p0: number, p1: number, p2: number, p3: number) {
	const u = 1 - t
	return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
}

function cubic_bezier_slope(t: number, p0: number, p1: number, p2: number, p3: number) {
	const u = 1 - t
	return 3 * u * u * (p1 - p0) + 6 * u * t * (p2 - p1) + 3 * t * t * (p3 - p2)
}

function bezier_ease_value(t: number, curve: readonly [number, number, number, number]) {
	const [x1, y1, x2, y2] = curve
	let x = t
	let guess = t
	for (let i = 0; i < 5; i++) {
		const current = cubic_bezier_value(guess, 0, x1, x2, 1)
		const slope = cubic_bezier_slope(guess, 0, x1, x2, 1)
		if (Math.abs(slope) < 1e-5) break
		guess -= (current - x) / slope
		guess = clamp_value(guess, 0, 1)
	}
	return cubic_bezier_value(guess, 0, y1, y2, 1)
}

function OverviewIntroOverlay({ active, onComplete }: { active: boolean; onComplete: () => void }) {
	const reduce_motion = useReducedMotionBool()
	const [progress, set_progress] = React.useState(0)
	const progress_ref = React.useRef(0)
	const target_ref = React.useRef(0)
	const completed_ref = React.useRef(false)
	const raf_ref = React.useRef<number | null>(null)
	const smooth_ref = React.useRef<number | null>(null)
	const letter_refs = React.useRef<(HTMLSpanElement | null)[]>([])
	const [deltas, set_deltas] = React.useState<LetterDelta[]>([])

	const set_letter_ref = React.useCallback(
		(index: number) => (el: HTMLSpanElement | null) => {
			letter_refs.current[index] = el
		},
		[]
	)

	React.useEffect(() => {
		if (!active) return
		progress_ref.current = 0
		target_ref.current = 0
		completed_ref.current = false
		set_deltas([])
		set_progress(0)
	}, [active])

	const schedule_progress = React.useCallback((next: number) => {
		progress_ref.current = next
		if (raf_ref.current != null) return
		raf_ref.current = window.requestAnimationFrame(() => {
			raf_ref.current = null
			set_progress(progress_ref.current)
		})
	}, [])

	const animate_to_target = React.useCallback(() => {
		const tick = () => {
			const current = progress_ref.current
			const target = target_ref.current
			const next = current + (target - current) * 0.18
			const snapped = Math.abs(target - next) < 0.001 ? target : next
			schedule_progress(snapped)
			if (snapped !== target) {
				smooth_ref.current = window.requestAnimationFrame(tick)
			} else {
				smooth_ref.current = null
			}
		}

		if (smooth_ref.current == null) {
			smooth_ref.current = window.requestAnimationFrame(tick)
		}
	}, [schedule_progress])

	const measure_deltas = React.useCallback(() => {
		if (!active) return
		const target_nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-overview-role='target'][data-overview-letter]"))
		const target_map = new Map<number, HTMLElement>()
		for (const node of target_nodes) {
			const raw = node.dataset.overviewLetter
			if (!raw) continue
			const idx = Number(raw)
			if (!Number.isFinite(idx)) continue
			target_map.set(idx, node)
		}

		const next_deltas = Array.from({ length: total_intro_letters }, (_, idx) => {
			const el = letter_refs.current[idx]
			const target = target_map.get(idx)
			if (!el || !target) return null
			const from = el.getBoundingClientRect()
			const to = target.getBoundingClientRect()
			const sx = from.width > 0 ? to.width / from.width : 1
			const sy = from.height > 0 ? to.height / from.height : 1
			return { dx: to.left - from.left, dy: to.top - from.top, sx, sy }
		})
		set_deltas(next_deltas)
	}, [active])

	const apply_delta = React.useCallback(
		(delta: number) => {
			const next = clamp_value(target_ref.current + delta / intro_scroll_distance_px, 0, 1)
			target_ref.current = next
			animate_to_target()
		},
		[animate_to_target]
	)

	React.useLayoutEffect(() => {
		if (!active) return
		if (reduce_motion) {
			onComplete()
			return
		}
		if (typeof window !== "undefined") window.scrollTo({ top: 0, left: 0, behavior: "auto" })
		const prev_scroll_restoration = typeof history !== "undefined" ? history.scrollRestoration : null
		if (typeof history !== "undefined") history.scrollRestoration = "manual"
		const root = document.documentElement
		const body = document.body
		const prev_root_overflow = root.style.overflow
		const prev_body_overflow = body.style.overflow
		const prev_root_padding = root.style.paddingRight
		const prev_body_padding = body.style.paddingRight
		const scrollbar_gap = Math.max(0, window.innerWidth - root.clientWidth)
		if (scrollbar_gap > 0) {
			const computed_pad = parseFloat(window.getComputedStyle(body).paddingRight) || 0
			body.style.paddingRight = `${computed_pad + scrollbar_gap}px`
		}
		root.style.overflow = "hidden"
		body.style.overflow = "hidden"

		return () => {
			root.style.overflow = prev_root_overflow
			body.style.overflow = prev_body_overflow
			root.style.paddingRight = prev_root_padding
			body.style.paddingRight = prev_body_padding
			if (typeof history !== "undefined" && prev_scroll_restoration) history.scrollRestoration = prev_scroll_restoration
		}
	}, [active, onComplete, reduce_motion])

	React.useEffect(() => {
		if (!active || reduce_motion) return
		let touch_y = 0

		const on_wheel = (event: WheelEvent) => {
			event.preventDefault()
			apply_delta(event.deltaY)
		}
		const on_touch_start = (event: TouchEvent) => {
			touch_y = event.touches[0]?.clientY ?? 0
		}
		const on_touch_move = (event: TouchEvent) => {
			const next_y = event.touches[0]?.clientY ?? 0
			const delta = touch_y - next_y
			touch_y = next_y
			apply_delta(delta)
			event.preventDefault()
		}

		window.addEventListener("wheel", on_wheel, { passive: false })
		window.addEventListener("touchstart", on_touch_start, { passive: false })
		window.addEventListener("touchmove", on_touch_move, { passive: false })

		return () => {
			window.removeEventListener("wheel", on_wheel)
			window.removeEventListener("touchstart", on_touch_start)
			window.removeEventListener("touchmove", on_touch_move)
		}
	}, [active, apply_delta, reduce_motion])

	React.useEffect(() => {
		if (!active) return
		return () => {
			if (smooth_ref.current != null) cancelAnimationFrame(smooth_ref.current)
			smooth_ref.current = null
		}
	}, [active])

	React.useLayoutEffect(() => {
		if (!active || reduce_motion) return
		let raf = requestAnimationFrame(measure_deltas)
		const timeout = window.setTimeout(measure_deltas, 120)

		const on_resize = () => measure_deltas()
		window.addEventListener("resize", on_resize)

		const font_ready = "fonts" in document ? (document.fonts?.ready as Promise<unknown> | undefined) : undefined
		font_ready?.then(() => measure_deltas())

		return () => {
			cancelAnimationFrame(raf)
			window.clearTimeout(timeout)
			window.removeEventListener("resize", on_resize)
		}
	}, [active, measure_deltas, reduce_motion])

	React.useEffect(() => {
		if (!active) return
		if (completed_ref.current) return
		if (progress_ref.current >= intro_complete_threshold) {
			completed_ref.current = true
			onComplete()
		}
	}, [active, onComplete, progress])

	if (!active || reduce_motion) return null

	const overlay_opacity = clamp_value(1 - progress, 0, 1)

	return (
		<div className="fixed inset-0 z-50">
			<div className="absolute inset-0 bg-background" style={{ opacity: overlay_opacity }} />
			<div className="relative flex h-full w-full items-center">
				<div className={cn("w-full", ui.intro.overlayPadX)}>
					<div className={cn("mx-auto w-full", ui.intro.overlayMaxWidth)}>
						<div className={cn("pointer-events-none select-none text-left", "text-foreground")}>
							<OverviewOverlayLetters
								role="overlay"
								layout="stack"
								reserveSeparator
								keyPrefix="overview-intro"
								className={cn("flex flex-col", ui.gap.sm)}
								titleClassName={cn(ui.typography.title.xxl, ui.intro.overlayTitleColor)}
								subtitleClassName={cn(ui.typography.title.md, "text-muted-foreground")}
								renderLetter={({ char, index, props }) => {
									const delta = deltas[index]
									const stagger_span = uiMotion.intro.overlay.letterStaggerSpan
									const stagger_start =
										total_intro_letters > 1 ? (index / (total_intro_letters - 1)) * stagger_span : 0
									const local = clamp_value((progress - stagger_start) / Math.max(1e-6, 1 - stagger_start), 0, 1)
									const eased = bezier_ease_value(local, uiMotion.intro.overlay.letterEase)
									const style: React.CSSProperties | undefined = delta
										? {
												transform: `translate(${delta.dx * eased}px, ${delta.dy * eased}px) scale(${1 + ((Math.sqrt(delta.sx * delta.sy) - 1) * eased)})`,
												transformOrigin: "top left",
											}
										: undefined

									return (
										<span
											key={`overlay-${index}`}
											{...props}
											ref={set_letter_ref(index)}
											style={style}
											className={cn(props.className, "will-change-transform")}
										>
											{char}
										</span>
									)
								}}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default function Page() {
	const pathname = usePathname()
	const router = useRouter()
	const show_intro = pathname === "/"
	const [intro_just_completed, set_intro_just_completed] = React.useState(() => intro_completed_once)

	const on_intro_complete = React.useCallback(() => {
		intro_completed_once = true
		set_intro_just_completed(true)
		requestAnimationFrame(() => router.replace("/overview"))
	}, [router])

	React.useEffect(() => {
		if (pathname !== "/overview" || !intro_just_completed) return
		const id = window.setTimeout(() => {
			intro_completed_once = false
			set_intro_just_completed(false)
		}, intro_completion_hold_ms)
		return () => window.clearTimeout(id)
	}, [intro_just_completed, pathname])

	return (
		<main className="flex min-h-screen w-full min-w-0 flex-col">
			{show_intro ? (
				<style jsx global>{`
					[data-overview-overlay='target'] [data-overview-letter] {
						opacity: 0;
					}
					[data-overview-overlay='target'] [data-overview-separator='true'] {
						opacity: 0.32;
					}
				`}</style>
			) : null}
			<div className="flex-1">
				<PbBody allowRootPath={show_intro} introActive={show_intro} suppressReveal={intro_just_completed} />
			</div>
			<PbFooter />
			<OverviewIntroOverlay active={show_intro} onComplete={on_intro_complete} />
		</main>
	)
}
