"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"

import { ui } from "@/components/tokens/design"
import { cn } from "@/lib/cn"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type ErrorBoundaryProps = {
	children: React.ReactNode
	fallback?: React.ReactNode
}

type ErrorBoundaryState = {
	hasError: boolean
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props)
		this.state = { hasError: false }
	}

	static getDerivedStateFromError(): ErrorBoundaryState {
		return { hasError: true }
	}

	componentDidCatch(error: Error, info: React.ErrorInfo) {
		console.error(error, info.componentStack)
	}

	render() {
		if (this.state.hasError) {
			return this.props.fallback ?? (
				<div className={cn(ui.radius.base, ui.spacing.panelMd, ui.typography.body, "border border-destructive/30 bg-destructive/5 text-destructive flex flex-col gap-3")}>
					<span>This section failed to load.</span>
					<button
						type="button"
						className={cn(ui.control.base, ui.button.size.sm, ui.radius.control, ui.typography.body, "w-fit bg-background")}
						onClick={() => window.location.reload()}
					>
						Reload page
					</button>
				</div>
			)
		}
		return this.props.children
	}
}

export function TabError({ name }: { name: string }) {
	return (
		<div className={cn(ui.radius.base, ui.spacing.panelMd, ui.typography.body, "border border-destructive/30 bg-destructive/5 text-destructive flex flex-col gap-3")}>
			<span>The <strong>{name}</strong> tab failed to load.</span>
			<button
				type="button"
				className={cn(ui.control.base, ui.button.size.sm, ui.radius.control, ui.typography.body, "w-fit bg-background")}
				onClick={() => window.location.reload()}
			>
				Retry
			</button>
		</div>
	)
}
