"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"

import { ui } from "@/components/tokens/design"
import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type BadgeProps = React.ComponentPropsWithoutRef<"span">

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const badge_class = cn(
	"inline-flex items-center justify-center",
	"select-none whitespace-nowrap align-middle font-medium leading-none",
	"min-h-5 shrink-0",
	ui.spacing.chipSm,
	ui.typography.caption,
	ui.radius.control,
	ui.surface.structure.border
)

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(function Badge({ className, ...props }, ref) {
	return <span ref={ref} data-slot="badge" className={cn(badge_class, className)} {...props} />
})

Badge.displayName = "Badge"
