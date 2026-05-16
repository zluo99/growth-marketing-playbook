"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"
import { createPortal } from "react-dom"

import { ui } from "@/components/tokens/design"
import { cn } from "@/lib/cn"
import { clamp_value } from "@/lib/dom"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type TooltipAlign = "center" | "end" | "start"
type TooltipSide = "bottom" | "left" | "right" | "top"

type TooltipProviderCtx = {
	disabled: boolean
	suspendGlobal: boolean
}

type TooltipCtx = {
	id: string
	open: boolean
	setOpen: (v: boolean) => void
	triggerEl: HTMLElement | null
	setTriggerEl: (el: HTMLElement | null) => void
	disabled: boolean
}

const TooltipProviderContext = React.createContext<TooltipProviderCtx>({ disabled: false, suspendGlobal: false })
const TooltipContext = React.createContext<TooltipCtx | null>(null)

function useTooltipCtx() {
	const ctx = React.useContext(TooltipContext)
	if (!ctx) throw new Error("Tooltip components must be used within <Tooltip>.")
	return ctx
}

function useTooltipProviderCtx() {
	return React.useContext(TooltipProviderContext)
}

/* -------------------------------------------------------------------------- */
/* Utils                                                                      */
/* -------------------------------------------------------------------------- */

function chain<T extends React.SyntheticEvent>(their?: (e: T) => void, ours?: (e: T) => void) {
	return (e: T) => {
		their?.(e)
		ours?.(e)
	}
}

function is_tooltip_suspended() {
	return document.body.getAttribute("data-tooltip-suspended") === "true"
}

function read_motion_ms(fallback = 150) {
	const root = document.documentElement
	const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
	if (reduced) return 80

	const v = parseFloat(getComputedStyle(root).getPropertyValue("--motion-duration-base"))
	return Number.isFinite(v) && v > 0 ? v : fallback
}

function useMotionMs(fallback = 150) {
	const [ms, set_ms] = React.useState(fallback)

	React.useEffect(() => {
		const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")

		const update = () => set_ms(read_motion_ms(fallback))

		update()
		reduced?.addEventListener?.("change", update)
		window.addEventListener("visibilitychange", update)

		return () => {
			reduced?.removeEventListener?.("change", update)
			window.removeEventListener("visibilitychange", update)
		}
	}, [fallback])

	return ms
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

export const TooltipProvider: React.FC<{ children: React.ReactNode; disabled?: boolean; suspendGlobal?: boolean }> = ({ children, disabled = false, suspendGlobal = false }) => {
	React.useEffect(() => {
		if (!suspendGlobal) return

		const prev = document.body.getAttribute("data-tooltip-suspended")
		document.body.setAttribute("data-tooltip-suspended", "true")

		return () => {
			if (prev == null) document.body.removeAttribute("data-tooltip-suspended")
			else document.body.setAttribute("data-tooltip-suspended", prev)
		}
	}, [suspendGlobal])

	const value = React.useMemo(() => ({ disabled, suspendGlobal }) satisfies TooltipProviderCtx, [disabled, suspendGlobal])

	return <TooltipProviderContext.Provider value={value}>{children}</TooltipProviderContext.Provider>
}

export const Tooltip: React.FC<{ children: React.ReactNode; disabled?: boolean }> = ({ children, disabled: disabled_prop }) => {
	const provider = useTooltipProviderCtx()
	const disabled = disabled_prop ?? provider.disabled

	type TipState = { open: boolean; triggerEl: HTMLElement | null }
	const [state, set_state] = React.useState<TipState>({ open: false, triggerEl: null })
	const id = React.useId()

	React.useEffect(() => {
		if (disabled && state.open) set_state((s) => ({ ...s, open: false }))
	}, [disabled, state.open])

	React.useEffect(() => {
		if (state.open && !state.triggerEl) set_state((s) => ({ ...s, open: false }))
	}, [state.open, state.triggerEl])

	React.useEffect(() => {
		if (!state.open) return
		if (typeof document === "undefined") return
		if (provider.suspendGlobal || is_tooltip_suspended()) set_state((s) => ({ ...s, open: false }))
	}, [state.open, provider.suspendGlobal])

	const value = React.useMemo(
		() =>
			({
				id,
				open: state.open,
				setOpen: (v: boolean) => set_state((s) => (s.open === v ? s : { ...s, open: v })),
				triggerEl: state.triggerEl,
				setTriggerEl: (el: HTMLElement | null) => set_state((s) => (s.triggerEl === el ? s : { ...s, triggerEl: el })),
				disabled,
			}) satisfies TooltipCtx,
		[disabled, id, state.open, state.triggerEl]
	)

	return (
		<TooltipContext.Provider value={value}>
			<span data-slot="tooltip" className="relative inline-flex">{children}</span>
		</TooltipContext.Provider>
	)
}

export const TooltipTrigger: React.FC<{ children: React.ReactElement; asChild?: boolean }> = ({ children, asChild }) => {
	const { id, open, setOpen, setTriggerEl, disabled } = useTooltipCtx()
	const child = children as React.ReactElement<React.HTMLAttributes<HTMLElement>>

	const set_refs = React.useCallback((el: HTMLElement | null) => setTriggerEl(el), [setTriggerEl])

	React.useEffect(() => {
		if (!open) return

		const on_blur = () => setOpen(false)

		const on_keydown = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false)
		}

		const on_visibility = () => {
			if (document.visibilityState !== "visible") setOpen(false)
		}

		window.addEventListener("blur", on_blur)
		window.addEventListener("keydown", on_keydown)
		document.addEventListener("visibilitychange", on_visibility)

		return () => {
			window.removeEventListener("blur", on_blur)
			window.removeEventListener("keydown", on_keydown)
			document.removeEventListener("visibilitychange", on_visibility)
		}
	}, [open, setOpen])

	const should_open = React.useCallback(() => {
		if (disabled) return
		if (typeof document === "undefined") return
		if (is_tooltip_suspended()) return
		setOpen(true)
	}, [disabled, setOpen])

	const should_close = React.useCallback(() => setOpen(false), [setOpen])

	const trigger_props = {
		ref: set_refs,
		onBlur: chain(child.props?.onBlur, should_close),
		onFocus: chain(child.props?.onFocus, should_open),
		onMouseEnter: chain(child.props?.onMouseEnter, should_open),
		onMouseLeave: chain(child.props?.onMouseLeave, should_close),
		"aria-describedby": open && !disabled ? id : undefined,
	}

	return asChild ? React.cloneElement(child, trigger_props) : <span {...trigger_props}>{children}</span>
}

function useTooltipPosition({ triggerEl, side, align, sideOffset }: { triggerEl: HTMLElement | null; side: TooltipSide; align: TooltipAlign; sideOffset: number }) {
	const tip_ref = React.useRef<HTMLDivElement | null>(null)
	const raf_ref = React.useRef<number | null>(null)
	const [pos, set_pos] = React.useState({ left: -9999, top: -9999 })

	const compute_pos_now = React.useCallback(() => {
		if (!triggerEl || !tip_ref.current) return

		const t = triggerEl.getBoundingClientRect()
		const r = tip_ref.current.getBoundingClientRect()

		const vw = window.innerWidth
		const vh = window.innerHeight
		const pad = 8

		const top =
			side === "bottom"
				? t.bottom + sideOffset
				: side === "top"
					? t.top - r.height - sideOffset
					: t.top + (t.height - r.height) / 2

		let left = align === "start" ? t.left : align === "end" ? t.right - r.width : t.left + (t.width - r.width) / 2

		if (side === "left") left = t.left - r.width - sideOffset
		if (side === "right") left = t.right + sideOffset

		const next = {
			left: clamp_value(left, pad, vw - r.width - pad),
			top: clamp_value(top, pad, vh - r.height - pad),
		}

		set_pos((prev) => (prev.left === next.left && prev.top === next.top ? prev : next))
	}, [align, side, sideOffset, triggerEl])

	const schedule_pos = React.useCallback(() => {
		if (raf_ref.current != null) return
		raf_ref.current = window.requestAnimationFrame(() => {
			raf_ref.current = null
			compute_pos_now()
		})
	}, [compute_pos_now])

	const cleanup_raf = React.useCallback(() => {
		if (raf_ref.current != null) {
			window.cancelAnimationFrame(raf_ref.current)
			raf_ref.current = null
		}
	}, [])

	return { tip_ref, pos, compute_pos_now, schedule_pos, cleanup_raf }
}

export const TooltipContent: React.FC<{
	className?: string
	children: React.ReactNode
	align?: TooltipAlign
	fadeMs?: number
	side?: TooltipSide
	sideOffset?: number
}> = ({ className, children, side = "top", align = "center", sideOffset = 6, fadeMs }) => {
	const { id, open, triggerEl, disabled } = useTooltipCtx()
	const motion_ms = useMotionMs()
	const fade = fadeMs ?? motion_ms

	const { tip_ref, pos, compute_pos_now, schedule_pos, cleanup_raf } = useTooltipPosition({ triggerEl, side, align, sideOffset })
	const hide_timeout_ref = React.useRef<number | null>(null)

	type VisibilityState = { mounted: boolean; visible: boolean }
	type VisibilityAction = "show" | "fade" | "unmount"
	const [visibility, dispatch_visibility] = React.useReducer((s: VisibilityState, a: VisibilityAction): VisibilityState => {
		if (a === "show") return { mounted: true, visible: true }
		if (a === "fade") return { mounted: s.mounted || s.visible, visible: false }
		return { mounted: false, visible: false }
	}, { mounted: false, visible: false })

	React.useEffect(() => {
		if (hide_timeout_ref.current != null) {
			window.clearTimeout(hide_timeout_ref.current)
			hide_timeout_ref.current = null
		}

		if (disabled) {
			dispatch_visibility("unmount")
			return
		}

		if (open) {
			dispatch_visibility("show")
			return
		}

		dispatch_visibility("fade")
		hide_timeout_ref.current = window.setTimeout(() => dispatch_visibility("unmount"), fade)
		return () => {
			if (hide_timeout_ref.current != null) {
				window.clearTimeout(hide_timeout_ref.current)
				hide_timeout_ref.current = null
			}
		}
	}, [disabled, fade, open])

	React.useLayoutEffect(() => {
		if (!visibility.mounted) return

		compute_pos_now()
		window.addEventListener("resize", schedule_pos)
		window.addEventListener("scroll", schedule_pos, true)

		return () => {
			window.removeEventListener("resize", schedule_pos)
			window.removeEventListener("scroll", schedule_pos, true)
			cleanup_raf()
		}
	}, [cleanup_raf, compute_pos_now, schedule_pos, visibility.mounted])

	if (!visibility.mounted || disabled) return null

	return createPortal(
		<div
			ref={tip_ref}
			id={id}
			role="tooltip"
			className={cn("pointer-events-none fixed z-[2147483647] ease-out", ui.motion.durationOpacity, visibility.visible ? "opacity-100" : "opacity-0", className)}
			style={{ top: pos.top, left: pos.left }}
		>
			<div
				className={cn(
					"block max-w-[min(28rem,calc(100vw-2rem))] px-3 py-2",
					ui.typography.caption,
					ui.surface.structure.popover,
					"text-popover-foreground",
					ui.surface.structure.border,
					ui.surface.structure.shadowLg,
					ui.radius.control
				)}
			>
				{children}
			</div>
		</div>,
		document.body
	)
}

