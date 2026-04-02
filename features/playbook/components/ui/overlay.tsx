"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"

import { ui } from "@/components/tokens/design"
import { uiMotion, useReducedMotionBool } from "@/components/tokens/motion"
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

	React.useEffect(() => {
		if (!open) return

		const previous_overflow = document.body.style.overflow
		document.body.style.overflow = "hidden"

		return () => {
			document.body.style.overflow = previous_overflow
		}
	}, [open])

	if (typeof document === "undefined") return null

	const backdrop_transition = reduce_motion ? uiMotion.overlay.panel.reduced : uiMotion.overlay.backdrop
	const panel_transition = reduce_motion ? uiMotion.overlay.panel.reduced : uiMotion.overlay.panel.spring

	const action = (
		<div className={cn("flex shrink-0 items-center", ui.gap.sm)}>
			{headerActions}
			<button
				type="button"
				onClick={onClose}
				className={cn(ui.overlay.closeButton, "inline-flex h-9 w-9 items-center justify-center p-0 leading-none")}
				aria-label={closeAriaLabel}
			>
				<CloseIcon className={ui.overlay.closeIcon} />
			</button>
		</div>
	)

	return createPortal(
		<AnimatePresence>
			{open ? (
				<motion.div key="pb-overlay-root" className={ui.overlay.container} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={backdrop_transition}>
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
						className={cn("relative z-10 w-full", maxWidthClassName ?? ui.overlay.maxWidth)}
						role="dialog"
						aria-modal="true"
						aria-label={ariaLabel}
						initial={{ opacity: 0, y: 12, scale: 0.985 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 8, scale: 0.99 }}
						transition={panel_transition}
					>
						<PbTabCard hover={false} shadow className={cn("max-h-[88vh]", ui.overlay.panel, panelClassName)}>
							<PbCardLayer>
								<PbCardHeader title={title} action={action} />
								<PbCardContent className={contentClassName}>{children}</PbCardContent>
							</PbCardLayer>
						</PbTabCard>
					</motion.div>
				</motion.div>
			) : null}
		</AnimatePresence>,
		document.body
	)
}
