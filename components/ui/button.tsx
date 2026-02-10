"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { ui } from "@/components/tokens/design"
import { cn } from "@/lib/utils"

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

export const buttonVariants = cva(button_base_class, {
	variants: {
		size: {
			default: ui.button.size.default,
			icon: ui.button.size.icon,
			lg: ui.button.size.lg,
			sm: ui.button.size.sm,
		},
		variant: {
			default: cn("bg-primary text-primary-foreground", "hover:bg-primary/90", ui.surface.state.hover.shadowMd),
			destructive: cn("bg-destructive text-destructive-foreground", "hover:bg-destructive/90", ui.surface.state.hover.shadowMd),

			ghost: cn(ui.control.ghost, ui.text.interactive.all, "bg-transparent", ui.surface.state.hover.bg, ui.surface.state.hover.shadowMd),
			link: "text-primary underline-offset-4 hover:underline",
			outline: cn(ui.control.base, ui.text.interactive.all, "bg-background", ui.surface.state.hover.bg, ui.surface.state.hover.border, ui.surface.state.hover.shadowMd),

			secondary: cn("bg-secondary text-secondary-foreground", "hover:bg-secondary/80", ui.surface.state.hover.shadowMd),
			success: cn(ui.status.success.fill, ui.status.success.fillHover, ui.surface.state.hover.shadowMd),

			successOutline: cn(
				ui.control.base,
				ui.status.success.outline,
				ui.status.success.outlineHover,
				ui.text.interactive.all,
				ui.surface.state.hover.shadowMd
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
			{...(resolved_type ? { type: resolved_type } : null)}
			className={cn(buttonVariants({ variant, size }), className)}
			{...props}
		/>
	)
})

Button.displayName = "Button"
