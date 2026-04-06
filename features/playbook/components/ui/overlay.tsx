"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"

import { ui } from "@/components/tokens/design"
import { uiMotion, useReducedMotionBool } from "@/components/tokens/motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { PbCardContent, PbCardHeader, PbCardLayer, PbTabCard } from "@/features/playbook/components/ui/ui"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type PbOverlayProps = {
	open: boolean
	onClose: () => void
	title: React.ReactNode
	ariaLabel: string
	closeAriaLabel: string
	headerActions?: React.ReactNode
	children?: React.ReactNode
	maxWidthClassName?: string
	panelClassName?: string
	contentClassName?: string
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

const CloseIcon = ({ className }: { className?: string }) => (
	<svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
		<line x1="5" y1="5" x2="19" y2="19" className="stroke-current stroke-[1.5]" strokeLinecap="round" />
		<line x1="19" y1="5" x2="5" y2="19" className="stroke-current stroke-[1.5]" strokeLinecap="round" />
	</svg>
)

const overlay_focusable_selector = [
	'a[href]',
	'area[href]',
	'button:not([disabled])',
	'input:not([disabled]):not([type="hidden"])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'iframe',
	'audio[controls]',
	'video[controls]',
	'[contenteditable]:not([contenteditable="false"])',
	'[tabindex]:not([tabindex="-1"])',
].join(",")

let body_scroll_lock_count = 0
let body_overflow_snapshot: string | null = null

type OverlayHiddenSnapshot = {
	element: HTMLElement
	aria_hidden: string | null
	had_inert: boolean
}

let background_inert_lock_count = 0
let background_hidden_snapshots: OverlayHiddenSnapshot[] = []

function lock_body_scroll() {
	if (typeof document === "undefined") return
	if (body_scroll_lock_count === 0) {
		body_overflow_snapshot = document.body.style.overflow
		document.body.style.overflow = "hidden"
	}
	body_scroll_lock_count += 1
}

function unlock_body_scroll() {
	if (typeof document === "undefined" || body_scroll_lock_count === 0) return
	body_scroll_lock_count -= 1
	if (body_scroll_lock_count > 0) return
	document.body.style.overflow = body_overflow_snapshot ?? ""
	body_overflow_snapshot = null
}

function lock_background_content(excluded_root: HTMLElement) {
	if (typeof document === "undefined") return
	if (background_inert_lock_count === 0) {
		background_hidden_snapshots = []
		const body_children = Array.from(document.body.children)
		for (const child of body_children) {
			if (!(child instanceof HTMLElement)) continue
			if (child === excluded_root) continue
			background_hidden_snapshots.push({
				element: child,
				aria_hidden: child.getAttribute("aria-hidden"),
				had_inert: child.hasAttribute("inert"),
			})
			child.setAttribute("aria-hidden", "true")
			child.setAttribute("inert", "")
		}
	}
	background_inert_lock_count += 1
}

function unlock_background_content() {
	if (typeof document === "undefined" || background_inert_lock_count === 0) return
	background_inert_lock_count -= 1
	if (background_inert_lock_count > 0) return
	for (const snapshot of background_hidden_snapshots) {
		if (snapshot.aria_hidden == null) snapshot.element.removeAttribute("aria-hidden")
		else snapshot.element.setAttribute("aria-hidden", snapshot.aria_hidden)
		if (snapshot.had_inert) snapshot.element.setAttribute("inert", "")
		else snapshot.element.removeAttribute("inert")
	}
	background_hidden_snapshots = []
}

function is_focusable_visible(element: HTMLElement) {
	if (element.hidden) return false
	const style = window.getComputedStyle(element)
	if (style.display === "none" || style.visibility === "hidden") return false
	return true
}

function get_focusable_elements(root: HTMLElement) {
	const elements = Array.from(root.querySelectorAll<HTMLElement>(overlay_focusable_selector))
	return elements.filter((element) => is_focusable_visible(element) && element.tabIndex >= 0)
}

export function PbOverlay({
	open,
	onClose,
	title,
	ariaLabel,
	closeAriaLabel,
	headerActions,
	children,
	maxWidthClassName,
	panelClassName,
	contentClassName,
}: PbOverlayProps) {
	const reduce_motion = useReducedMotionBool()
	const compact_viewport_scroll_fallback_class = "[@media(max-height:48rem)]:overflow-y-auto"
	const overlay_root_ref = React.useRef<HTMLDivElement | null>(null)
	const dialog_ref = React.useRef<HTMLDivElement | null>(null)
	const close_button_ref = React.useRef<HTMLButtonElement | null>(null)
	const previous_focus_ref = React.useRef<HTMLElement | null>(null)

	React.useEffect(() => {
		if (!open) return

		const overlay_root = overlay_root_ref.current
		const dialog = dialog_ref.current
		if (!overlay_root || !dialog) return

		lock_body_scroll()
		lock_background_content(overlay_root)
		const active_element = document.activeElement
		previous_focus_ref.current = active_element instanceof HTMLElement ? active_element : null

		const focus_initial_target = () => {
			const autofocus = dialog.querySelector<HTMLElement>("[data-autofocus]")
			if (autofocus) {
				autofocus.focus()
				return
			}
			const focusables = get_focusable_elements(dialog)
			if (focusables.length > 0) {
				focusables[0].focus()
				return
			}
			if (close_button_ref.current) close_button_ref.current.focus()
			else dialog.focus()
		}

		const focus_frame = window.requestAnimationFrame(focus_initial_target)

		const on_document_key_down = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.preventDefault()
				onClose()
				return
			}
			if (event.key !== "Tab") return

			const focusables = get_focusable_elements(dialog)
			if (!focusables.length) {
				event.preventDefault()
				dialog.focus()
				return
			}

			const first = focusables[0]
			const last = focusables[focusables.length - 1]
			const active = document.activeElement instanceof HTMLElement ? document.activeElement : null

			if (event.shiftKey) {
				if (!active || !dialog.contains(active) || active === first) {
					event.preventDefault()
					last.focus()
				}
				return
			}

			if (!active || !dialog.contains(active) || active === last) {
				event.preventDefault()
				first.focus()
			}
		}

		document.addEventListener("keydown", on_document_key_down)

		return () => {
			window.cancelAnimationFrame(focus_frame)
			document.removeEventListener("keydown", on_document_key_down)
			unlock_background_content()
			unlock_body_scroll()
			const previous_focus = previous_focus_ref.current
			if (previous_focus && previous_focus.isConnected) previous_focus.focus()
		}
	}, [open, onClose])

	if (typeof document === "undefined") return null

	const backdrop_transition = reduce_motion ? uiMotion.overlay.panel.reduced : uiMotion.overlay.backdrop
	const panel_transition = reduce_motion ? uiMotion.overlay.panel.reduced : uiMotion.overlay.panel.spring

	const action = (
		<div className={cn("flex shrink-0 items-center", ui.gap.sm)}>
			{headerActions}
			<Button
				ref={close_button_ref}
				variant="outline"
				size="iconSm"
				onClick={onClose}
				className="shrink-0"
				aria-label={closeAriaLabel}
			>
				<CloseIcon className={cn(ui.iconNude.md, ui.motion.duration, "pointer-events-none transition-colors")} />
			</Button>
		</div>
	)

	return createPortal(
		<AnimatePresence>
			{open ? (
				<motion.div
					key="pb-overlay-root"
					ref={overlay_root_ref}
					className={ui.overlay.container}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={backdrop_transition}
				>
					<motion.button
						type="button"
						className={cn("absolute inset-0", ui.overlay.backdrop)}
						aria-label={closeAriaLabel}
						onClick={onClose}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={backdrop_transition}
					/>

					<motion.div
						ref={dialog_ref}
						className={cn(
							"relative z-10 flex h-full min-h-0 w-full max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] md:h-auto md:max-h-[88dvh]",
							maxWidthClassName ?? ui.overlay.maxWidth
						)}
						tabIndex={-1}
						role="dialog"
						aria-modal="true"
						aria-label={ariaLabel}
						initial={{ opacity: 0, y: 12, scale: 0.985 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 8, scale: 0.99 }}
						transition={panel_transition}
					>
						<PbTabCard
							shadow
							className={cn("flex h-full min-h-0 w-full max-h-full flex-col md:h-auto", panelClassName)}
						>
							<PbCardLayer className="flex h-full min-h-0 flex-1 flex-col">
								<PbCardHeader title={title} action={action} />
								<PbCardContent
									className={cn(
										"min-h-0 overflow-hidden overscroll-contain [-webkit-overflow-scrolling:touch]",
										contentClassName,
										compact_viewport_scroll_fallback_class
									)}
								>
									{children}
								</PbCardContent>
							</PbCardLayer>
						</PbTabCard>
					</motion.div>
				</motion.div>
			) : null}
		</AnimatePresence>,
		document.body
	)
}
