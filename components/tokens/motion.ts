"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"
import {
	useMotionValue,
	useReducedMotion,
	useSpring,
	type MotionValue,
	type SpringOptions,
	type Transition,
} from "framer-motion"

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const durations = {
	fast: 0.12,
	base: 0.15,
	medium: 0.24,
	extended: 0.42,
	reduced: 0.08,
	enterReduced: 0.16,
} as const

const easing = {
	standard: [0.22, 1, 0.36, 1] as const,
	emphasis: [0.25, 1, 0.3, 1] as const,
} as const

const springs = {
	strong: { stiffness: 460, damping: 44, mass: 0.9 },
	pill: { stiffness: 700, damping: 60, mass: 0.72 },
	pillCompact: { stiffness: 1100, damping: 60, mass: 0.6 },
	enter: { stiffness: 520, damping: 46, mass: 0.9 },
} as const

const transitions = {
	pillTween: { type: "tween", duration: durations.fast, ease: easing.standard } satisfies Transition,
	arrow: { type: "spring", ...springs.strong } satisfies Transition,
	collapse: { type: "tween", duration: durations.medium, ease: easing.emphasis } satisfies Transition,
	collapseReduced: { duration: durations.reduced, ease: "easeOut" } satisfies Transition,
	enterReduced: { duration: durations.enterReduced, ease: "easeOut" } satisfies Transition,
	enterSpring: { type: "spring", ...springs.enter } satisfies Transition,
	reveal: { type: "tween", duration: durations.extended, ease: easing.standard } satisfies Transition,
	revealReduced: { duration: 0.01 } satisfies Transition,
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

export const uiMotion = {
	tokens: {
		durations,
		easing,
	},
	nav: {
		pillSpring: springs.pill,
		pillSpringCompact: springs.pillCompact,
		pillTween: transitions.pillTween,
	},
	frameworks: {
		enter: {
			reduced: transitions.enterReduced,
			spring: transitions.enterSpring,
		},
		collapse: {
			reduced: transitions.collapseReduced,
			tween: transitions.collapse,
		},
		dropdownInline: {
			shrink: { type: "tween", duration: durations.medium, ease: easing.standard } satisfies Transition,
			reveal: { type: "tween", duration: durations.base, ease: easing.standard } satisfies Transition,
			reduced: transitions.enterReduced,
			stagger: 0.03,
			revealDelay: 0.08,
		},
	},
	tabs: {
		arrowTransition: transitions.arrow,
		barSpring: springs.strong,
	},
	reveal: {
		offsetY: 14,
		viewport: {
			once: false,
			amount: 0.2,
			margin: "0px 0px -12% 0px",
		},
		enter: {
			reduced: transitions.revealReduced,
			tween: transitions.reveal,
		},
	},
} as const

export const navMenuFadeVariants = {
	hidden: { opacity: 0, y: -8 },
	visible: { opacity: 1, y: 0 },
} as const

/* -------------------------------------------------------------------------- */
/* Hooks                                                                      */
/* -------------------------------------------------------------------------- */

export function useReducedMotionBool() {
	return !!useReducedMotion()
}

export function useRafThrottle<Args extends readonly unknown[]>(fn: (...args: Args) => void) {
	const raf_ref = React.useRef<number | null>(null)
	const fn_ref = React.useRef(fn)

	React.useEffect(() => {
		fn_ref.current = fn
	}, [fn])

	React.useEffect(() => {
		return () => {
			if (raf_ref.current != null) cancelAnimationFrame(raf_ref.current)
		}
	}, [])

	return React.useCallback((...args: Args) => {
		if (raf_ref.current != null) return
		raf_ref.current = requestAnimationFrame(() => {
			raf_ref.current = null
			fn_ref.current(...args)
		})
	}, [])
}

type AnyEl = HTMLElement

function safe_round(n: number) {
	const v = Math.round(n)
	return Object.is(v, -0) ? 0 : v
}

function measure_pill<K extends string>(opts: {
	activeKey: K
	itemRefs: React.RefObject<Record<K, AnyEl | null>>
	railRef: React.RefObject<AnyEl | null>
}) {
	const rail = opts.railRef.current
	const map = opts.itemRefs.current
	const item = map ? map[opts.activeKey] : null
	if (!rail || !item) return null

	const rail_rect = rail.getBoundingClientRect()
	const item_rect = item.getBoundingClientRect()

	return {
		x: safe_round(item_rect.left - rail_rect.left),
		w: safe_round(item_rect.width),
		item,
		rail,
	} as const
}

export function useMotionPill<K extends string>(opts: {
	activeKey: K
	itemRefs: React.RefObject<Record<K, AnyEl | null>>
	railRef: React.RefObject<AnyEl | null>
	spring: SpringOptions
}) {
	const reduce_motion = useReducedMotionBool()

	const x_target = useMotionValue(0)
	const w_target = useMotionValue(0)

	const x_spring = useSpring(x_target, opts.spring)
	const w_spring = useSpring(w_target, opts.spring)

	const x = reduce_motion ? x_target : x_spring
	const w = reduce_motion ? w_target : w_spring

	const measure = React.useCallback(() => {
		const m = measure_pill(opts)
		if (!m) return
		x_target.set(m.x)
		w_target.set(m.w)
	}, [opts, w_target, x_target])

	const measure_raf = useRafThrottle(measure)

	React.useLayoutEffect(() => {
		measure()
	}, [measure])

	React.useEffect(() => {
		let ro: ResizeObserver | null = null

		const attach = () => {
			const m = measure_pill(opts)
			if (!m) return
			ro = new ResizeObserver(() => measure_raf())
			ro.observe(m.rail)
			ro.observe(m.item)
		}

		attach()
		window.addEventListener("resize", measure_raf)

		return () => {
			window.removeEventListener("resize", measure_raf)
			ro?.disconnect()
		}
	}, [measure_raf, opts])

	return {
		reduceMotion: reduce_motion,
		xTarget: x_target,
		wTarget: w_target,
		x,
		w,
		measure,
		measureRaf: measure_raf,
	} as const satisfies {
		reduceMotion: boolean
		xTarget: MotionValue<number>
		wTarget: MotionValue<number>
		x: MotionValue<number>
		w: MotionValue<number>
		measure: () => void
		measureRaf: () => void
	}
}
