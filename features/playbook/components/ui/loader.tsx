"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"

import { ui } from "@/components/tokens/design"
import { useReducedMotionBool } from "@/components/tokens/motion"
import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function SkeletonLine({ w = "w-full", className }: { w?: string; className?: string }) {
	return <div className={cn("h-3 rounded-md bg-muted/60 dark:bg-muted/40", w, className)} />
}

export function LoaderCardSkeleton() {
	const animate = !useReducedMotionBool()

	return (
		<div className={cn("flex flex-col", ui.gap.lg)}>
			<div
				className={cn(
					"flex flex-col",
					ui.surface.structure.panel,
					ui.surface.structure.border,
					ui.radius.base,
					ui.surface.structure.shadowNone,
					"overflow-hidden"
				)}
			>
				<div className={cn(ui.spacing.panelMd, animate ? "animate-[pulse_1.05s_ease-in-out_infinite]" : "")}>
					<div className={cn("flex items-start justify-between", ui.gap.md)}>
						<div className="min-w-0 flex-1">
							<SkeletonLine w="w-52" className="h-4" />
							<SkeletonLine w="w-[68%]" className="mt-2" />
							<SkeletonLine w="w-[52%]" className="mt-2" />
						</div>
						<SkeletonLine w="w-24" className={cn(ui.size.controls.sm.h, ui.radius.control)} />
					</div>

					<div className={cn("mt-5", ui.surface.structure.border, ui.radius.base, "overflow-hidden")}>
						<div className={cn(ui.spacing.panelMd)}>
							<SkeletonLine w="w-40" />
							<SkeletonLine w="w-[72%]" className="mt-2" />
							<SkeletonLine w="w-[64%]" className="mt-2" />
							<div className={cn("mt-4 rounded-md bg-muted/50 dark:bg-muted/35", "h-56")} />
							<SkeletonLine w="w-[38%]" className="mt-4" />
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
