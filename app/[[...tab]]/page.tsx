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
import { OverviewOverlayLetters } from "@/features/playbook/tabs/overview-intro"
import { overview_tab_separator, overview_tab_subtitle, overview_tab_title } from "@/features/playbook/definitions/tabs"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type LetterDelta = { dx: number; dy: number; sx: number; sy: number } | null

/* -------------------------------------------------------------------------- */
/* Constants: intro                                                           */
/* -------------------------------------------------------------------------- */

const intro_scroll_distance_px = 520
const intro_complete_threshold = 0.985
const intro_completion_hold_ms = 900
let intro_completed_once = false

const intro_title_chars = Array.from(overview_tab_title)
const intro_separator_chars = Array.from(overview_tab_separator)
const intro_subtitle_chars = Array.from(overview_tab_subtitle)

const intro_title_length = intro_title_chars.length
const intro_separator_length = intro_separator_chars.length
const intro_subtitle_length = intro_subtitle_chars.length

const total_intro_letters = intro_title_length + intro_separator_length + intro_subtitle_length

const intro_typing_wpm = 360
const intro_typing_delay_ms = 700
const intro_typing_interval_ms = Math.max(16, Math.round(60000 / (intro_typing_wpm * 5)))
const intro_overlay_scale = 1

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

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
	const x = t
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

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function OverviewIntroOverlay({ active, onComplete }: { active: boolean; onComplete: () => void }) {
	const reduce_motion = useReducedMotionBool()
	const [progress, set_progress] = React.useState(0)
	const progress_ref = React.useRef(0)
	const target_ref = React.useRef(0)
	const completed_ref = React.useRef(false)
	const raf_ref = React.useRef<number | null>(null)
	const smooth_ref = React.useRef<number | null>(null)
	const scroll_lock_ref = React.useRef<{ y: number; top: string; position: string; width: string; left: string; right: string } | null>(null)
	const letter_refs = React.useRef<(HTMLSpanElement | null)[]>([])
	const overlay_root_ref = React.useRef<HTMLDivElement | null>(null)
	const [deltas, set_deltas] = React.useState<LetterDelta[]>([])
	const [base_positions, set_base_positions] = React.useState<Array<{ x: number; y: number } | null>>([])
	const [overlay_origin, set_overlay_origin] = React.useState<{ x: number; y: number; width?: number } | null>(null)
	const [typed_title_count, set_typed_title_count] = React.useState(0)
	const [typed_subtitle_count, set_typed_subtitle_count] = React.useState(0)
	const [scroll_enabled, set_scroll_enabled] = React.useState(false)
	const scroll_enabled_ref = React.useRef(false)

	React.useEffect(() => {
		scroll_enabled_ref.current = scroll_enabled
	}, [scroll_enabled])

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
		set_base_positions([])
		set_overlay_origin(null)
		set_typed_title_count(0)
		set_typed_subtitle_count(0)
		set_scroll_enabled(false)
		set_progress(0)
	}, [active])

	React.useEffect(() => {
		if (!active || reduce_motion) return
		let cancelled = false
		let title_timer: number | null = null
		let subtitle_timer: number | null = null
		let subtitle_delay_timer: number | null = null

		const clear_all = () => {
			if (title_timer != null) window.clearInterval(title_timer)
			if (subtitle_timer != null) window.clearInterval(subtitle_timer)
			if (subtitle_delay_timer != null) window.clearTimeout(subtitle_delay_timer)
			title_timer = null
			subtitle_timer = null
			subtitle_delay_timer = null
		}

		const start_subtitle = () => {
			if (cancelled) return
			if (intro_subtitle_length === 0) {
				set_scroll_enabled(true)
				return
			}
			let subtitle_idx = 0
			subtitle_timer = window.setInterval(() => {
				if (cancelled) {
					clear_all()
					return
				}
				subtitle_idx += 1
				set_typed_subtitle_count(subtitle_idx)
				if (subtitle_idx >= intro_subtitle_length) {
					clear_all()
					set_scroll_enabled(true)
				}
			}, intro_typing_interval_ms)
		}

		const start_title = () => {
			if (intro_title_length === 0) {
				subtitle_delay_timer = window.setTimeout(start_subtitle, intro_typing_delay_ms)
				return
			}
			let title_idx = 0
			title_timer = window.setInterval(() => {
				if (cancelled) {
					clear_all()
					return
				}
				title_idx += 1
				set_typed_title_count(title_idx)
				if (title_idx >= intro_title_length) {
					if (title_timer != null) window.clearInterval(title_timer)
					title_timer = null
					subtitle_delay_timer = window.setTimeout(start_subtitle, intro_typing_delay_ms)
				}
			}, intro_typing_interval_ms)
		}

		start_title()

		return () => {
			cancelled = true
			clear_all()
		}
	}, [active, reduce_motion])

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
			const should_snap = target >= 1 && next >= intro_complete_threshold
			const snapped = should_snap || Math.abs(target - next) < 0.001 ? target : next
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

		const anchor = target_map.get(0) ?? target_nodes[0]
		if (anchor) {
			const rect = anchor.getBoundingClientRect()
			const container = document.querySelector<HTMLElement>(".app-container")
			const container_rect = container?.getBoundingClientRect()
			const width = container_rect?.width
			set_overlay_origin((prev) => {
				if (prev && prev.x === rect.left && prev.y === rect.top && prev.width === width) return prev
				return { x: rect.left, y: rect.top, width }
			})
		}

		const overlay_rect = overlay_root_ref.current?.getBoundingClientRect()
		const origin_x = overlay_rect?.left ?? overlay_origin?.x
		const origin_y = overlay_rect?.top ?? overlay_origin?.y
		if (origin_x != null && origin_y != null) {
			const next_positions = Array.from({ length: total_intro_letters }, (_, idx) => {
				const el = letter_refs.current[idx]
				if (!el) return null
				const from = el.getBoundingClientRect()
				return { x: from.left - origin_x, y: from.top - origin_y }
			})
			set_base_positions(next_positions)
		}
	}, [active, overlay_origin?.x, overlay_origin?.y])

	const apply_delta = React.useCallback(
		(delta: number) => {
			if (!scroll_enabled_ref.current) return
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
		const body = document.body
		const scroll_y = window.scrollY || 0
		scroll_lock_ref.current = {
			y: scroll_y,
			top: body.style.top,
			position: body.style.position,
			width: body.style.width,
			left: body.style.left,
			right: body.style.right,
		}
		body.style.position = "fixed"
		body.style.top = `-${scroll_y}px`
		body.style.left = "0"
		body.style.right = "0"
		body.style.width = "100%"

		return () => {
			const locked = scroll_lock_ref.current
			if (locked) {
				body.style.top = locked.top
				body.style.position = locked.position
				body.style.width = locked.width
				body.style.left = locked.left
				body.style.right = locked.right
				window.scrollTo({ top: locked.y, left: 0, behavior: "auto" })
				scroll_lock_ref.current = null
			}
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
		const on_key_down = (event: KeyboardEvent) => {
			const key = event.key
			if (
				key === "ArrowDown" ||
				key === "ArrowUp" ||
				key === "PageDown" ||
				key === "PageUp" ||
				key === "Home" ||
				key === "End" ||
				key === " " ||
				key === "Spacebar"
			) {
				event.preventDefault()
			}
		}

		window.addEventListener("wheel", on_wheel, { passive: false })
		window.addEventListener("touchstart", on_touch_start, { passive: false })
		window.addEventListener("touchmove", on_touch_move, { passive: false })
		window.addEventListener("keydown", on_key_down)

		return () => {
			window.removeEventListener("wheel", on_wheel)
			window.removeEventListener("touchstart", on_touch_start)
			window.removeEventListener("touchmove", on_touch_move)
			window.removeEventListener("keydown", on_key_down)
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
		const raf = requestAnimationFrame(measure_deltas)
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

	React.useLayoutEffect(() => {
		if (typeof document === "undefined") return
		const root = document.documentElement
		const next = active && !reduce_motion ? "0" : "1"
		root.style.setProperty("--overview-intro-target-opacity", next)
	}, [active, reduce_motion])

	React.useLayoutEffect(() => {
		if (typeof document === "undefined") return
		const root = document.documentElement
		const next = active && !reduce_motion ? `${(progress * 100).toFixed(3)}%` : "100%"
		const next_opacity = active && !reduce_motion ? `${Math.min(1, Math.max(0, progress)).toFixed(4)}` : "1"
		root.style.setProperty("--overview-intro-progress", next)
		root.style.setProperty("--overview-intro-progress-opacity", next_opacity)
	}, [active, progress, reduce_motion])

	React.useEffect(() => {
		return () => {
			if (typeof document === "undefined") return
			document.documentElement.style.removeProperty("--overview-intro-target-opacity")
			document.documentElement.style.removeProperty("--overview-intro-progress")
			document.documentElement.style.removeProperty("--overview-intro-progress-opacity")
		}
	}, [])

	if (!active || reduce_motion) return null

	const overlay_opacity = clamp_value(1 - progress, 0, 1)
	const overlay_style: React.CSSProperties = overlay_origin
		? { left: overlay_origin.x, top: overlay_origin.y, width: overlay_origin.width }
		: { left: 0, top: 0, opacity: 0 }

	return (
		<div className="fixed inset-0 z-50">
			<div className="absolute inset-0 bg-background" style={{ opacity: overlay_opacity }} />
			<div className="relative h-full w-full">
				<div className="absolute relative" style={overlay_style} ref={overlay_root_ref}>
					<div className={cn("pointer-events-none select-none text-left", "text-foreground")}>
						<OverviewOverlayLetters
							role="overlay"
							layout="stack"
							reserveSeparator
							keyPrefix="overview-intro"
							className={cn("flex flex-col", ui.gap.md)}
							subtitleClassName={ui.margin.topMd}
							renderLetter={({ char, index, props }) => {
								const delta = deltas[index]
								const base = base_positions[index]
								const stagger_span = uiMotion.intro.overlay.letterStaggerSpan
								const stagger_start =
									total_intro_letters > 1 ? (index / (total_intro_letters - 1)) * stagger_span : 0
								const local = clamp_value((progress - stagger_start) / Math.max(1e-6, 1 - stagger_start), 0, 1)
								const eased = bezier_ease_value(local, uiMotion.intro.overlay.letterEase)
								const settle = clamp_value((progress - 0.9) / 0.1, 0, 1)
								const final_eased = eased + (1 - eased) * settle
								const intro_scale = 1 + (intro_overlay_scale - 1) * (1 - final_eased)
								const target_scale = delta ? 1 + ((Math.sqrt(delta.sx * delta.sy) - 1) * final_eased) : 1
								const scale = intro_scale * target_scale
								const is_title_letter = index < intro_title_length
								const is_separator = index >= intro_title_length && index < intro_title_length + intro_separator_length
								const is_subtitle_letter = index >= intro_title_length + intro_separator_length
								const title_done = typed_title_count >= intro_title_length
								const subtitle_done = typed_subtitle_count >= intro_subtitle_length
								const is_typing_title = !title_done
								const is_typing_subtitle = title_done && !subtitle_done
								const cursor_index = is_typing_title
									? Math.max(0, typed_title_count - 1)
									: is_typing_subtitle
										? intro_title_length + intro_separator_length + Math.max(0, typed_subtitle_count - 1)
										: -1
								const show_cursor = cursor_index === index && (is_typing_title || is_typing_subtitle)
								const typed =
									is_title_letter
										? index < typed_title_count
										: is_separator
											? title_done
											: is_subtitle_letter
												? index - (intro_title_length + intro_separator_length) < typed_subtitle_count
												: false

								const wrapper_style: React.CSSProperties | undefined = base
									? {
											position: "absolute",
											left: base.x,
											top: base.y,
											display: "inline-block",
											transform: delta
												? `translate(${delta.dx * final_eased}px, ${delta.dy * final_eased}px) scale(${scale})`
												: undefined,
											transformOrigin: "top left",
										}
									: delta
										? {
												transform: `translate(${delta.dx * final_eased}px, ${delta.dy * final_eased}px) scale(${scale})`,
												transformOrigin: "top left",
											}
										: undefined

								return (
									<span
										key={`overlay-${index}`}
										{...props}
										ref={set_letter_ref(index)}
										style={wrapper_style}
										className={cn(props.className, "will-change-transform")}
									>
										<span style={{ opacity: typed ? 1 : 0 }}>{char}</span>
										{show_cursor ? <span className="intro-typing-cursor">_</span> : null}
									</span>
								)
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	)
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

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
					html,
					body {
						overscroll-behavior: none;
						touch-action: none;
					}
					[data-overview-overlay='target'] [data-overview-letter] {
						opacity: 0;
					}
					[data-overview-overlay='target'] [data-overview-separator='true'] {
						opacity: var(--overview-intro-progress-opacity, 0);
					}
					@keyframes intro-cursor-blink {
						0%,
						49% {
							opacity: 1;
						}
						50%,
						100% {
							opacity: 0;
						}
					}
					.intro-typing-cursor {
						position: absolute;
						left: 100%;
						top: 0;
						transform: translateX(0.08em);
						display: inline-block;
						color: currentColor;
						animation: intro-cursor-blink 1s steps(1, end) infinite;
						pointer-events: none;
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
