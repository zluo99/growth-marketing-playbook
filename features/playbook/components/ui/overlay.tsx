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
			<Button
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
						className={cn("relative z-10 flex h-full min-h-0 w-full max-h-full md:h-auto", maxWidthClassName ?? ui.overlay.maxWidth)}
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
							className={cn("flex h-full min-h-0 w-full flex-col max-h-full md:h-auto md:max-h-[88vh]", panelClassName)}
						>
							<PbCardLayer className="flex h-full min-h-0 flex-1 flex-col">
								<PbCardHeader title={title} action={action} />
								<PbCardContent className={cn("min-h-0 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]", contentClassName)}>
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
