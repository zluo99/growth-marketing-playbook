"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { ui } from "@/components/tokens/design"
import { cn } from "@/lib/cn"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
	asChild?: boolean
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const button_base_class = cn(
	"inline-flex items-center justify-center gap-2 align-middle leading-none",
	"select-none whitespace-nowrap font-medium",
	"disabled:pointer-events-none disabled:opacity-50",
	ui.radius.base,
	"[&]:!rounded-[var(--radius)]",
	ui.surface.structure.shadowNone,
	ui.motion.duration,
	ui.surface.state.focus.ring
)

const hover_or_active_surface_bg = cn(ui.surface.state.hover.bg, "active:bg-[color:var(--surface-bg-hover)]")
const hover_or_active_surface_border = cn(ui.surface.state.hover.border, "active:border-[color:var(--border-hover)]")
const hover_or_active_shadow_md = cn(ui.surface.state.hover.shadowMd, "active:[box-shadow:var(--shadow-md)]")
const hover_or_active_blue_surface_bg = cn("hover:!bg-[color:var(--accent-blue-soft-row-hover)]", "active:!bg-[color:var(--accent-blue-soft-row-hover)]")
const hover_or_active_blue_surface_border = cn(
	"hover:!border-[color:var(--accent-blue-soft-border-hover)]",
	"focus-visible:!border-[color:var(--accent-blue-soft-border-hover)]",
	"active:!border-[color:var(--accent-blue-soft-border-hover)]"
)

export const buttonVariants = cva(button_base_class, {
	variants: {
		size: {
			default: ui.button.size.default,
			icon: ui.button.size.icon,
			iconXs: ui.button.size.iconXs,
			iconSm: ui.button.size.iconSm,
			lg: ui.button.size.lg,
			sm: ui.button.size.sm,
		},
		variant: {
			default: cn("bg-primary text-primary-foreground", "hover:bg-primary/90 active:bg-primary/90", hover_or_active_shadow_md),
			destructive: cn("bg-destructive text-destructive-foreground", "hover:bg-destructive/90 active:bg-destructive/90", hover_or_active_shadow_md),

			ghost: cn(ui.control.ghost, ui.text.interactive.all, "bg-transparent active:text-foreground", hover_or_active_surface_bg, hover_or_active_shadow_md),
			link: "text-primary underline-offset-4 hover:underline",
			outline: cn(ui.control.base, ui.text.interactive.all, "bg-background active:text-foreground", hover_or_active_surface_bg, hover_or_active_surface_border, hover_or_active_shadow_md),
			surfaceSolid: cn(
				ui.control.base,
				"bg-background text-foreground",
				hover_or_active_surface_bg,
				hover_or_active_surface_border,
				hover_or_active_shadow_md
			),
			blueOutline: cn(
				ui.control.base,
				ui.text.interactive.all,
				"bg-background active:text-foreground",
				hover_or_active_blue_surface_bg,
				hover_or_active_blue_surface_border,
				ui.search.focusRing,
				hover_or_active_shadow_md
			),
			aiOutline: cn(ui.control.base, ui.ai.buttonOutline, hover_or_active_shadow_md),

			secondary: cn("bg-secondary text-secondary-foreground", "hover:bg-secondary/80 active:bg-secondary/80", hover_or_active_shadow_md),
			success: cn(ui.status.success.fill, ui.status.success.fillHover, "active:bg-[color:var(--accent-green-bg-hover)] active:border-[color:var(--accent-green-border-strong-hover)]", hover_or_active_shadow_md),

			successOutline: cn(
				ui.control.base,
				ui.status.success.outline,
				ui.status.success.outlineHover,
				"active:border-[color:var(--accent-green-border-strong-hover)]",
				ui.text.interactive.all,
				"active:text-foreground",
				hover_or_active_shadow_md
			),
		},
	},
	defaultVariants: {
		size: "default",
		variant: "default",
	},
})

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
	{ className, variant, size, asChild = false, type, ...props },
	ref
) {
	const Comp = asChild ? Slot : "button"
	const resolved_type = Comp === "button" ? (type ?? "button") : undefined

	return (
		<Comp
			ref={ref}
			data-slot="button"
			{...(resolved_type ? { type: resolved_type } : null)}
			className={cn(buttonVariants({ variant, size }), className)}
			{...props}
		/>
	)
})

Button.displayName = "Button"
