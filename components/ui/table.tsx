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

type TableTone = keyof typeof ui.table

type TableProps = React.ComponentPropsWithoutRef<"table"> & {
	containerClassName?: string
	stickyHeader?: boolean
	headerTone?: TableTone
	groupedDividers?: boolean
}

type TableContextValue = {
	sticky_header: boolean
	tone_class: string
	grouped_dividers: boolean
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const TableContext = React.createContext<TableContextValue>({
	sticky_header: true,
	tone_class: ui.table.blue,
	grouped_dividers: false,
})

/* -------------------------------------------------------------------------- */
/* Hooks                                                                      */
/* -------------------------------------------------------------------------- */

function useTableContext() {
	return React.useContext(TableContext)
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

const Table = React.forwardRef<HTMLTableElement, TableProps>(function Table(
	{ className, containerClassName, stickyHeader = true, headerTone = "blue", groupedDividers = false, ...props },
	ref
) {
	const value = React.useMemo<TableContextValue>(
		() => ({
			sticky_header: stickyHeader,
			tone_class: ui.table[headerTone] ?? ui.table.blue,
			grouped_dividers: groupedDividers,
		}),
		[groupedDividers, headerTone, stickyHeader]
	)

	return (
		<TableContext.Provider value={value}>
			<div
				data-slot="table-container"
				className={cn("relative w-full min-h-0 overflow-auto", containerClassName)}
			>
				<table ref={ref} data-slot="table" className={cn("w-full caption-bottom", className)} {...props} />
			</div>
		</TableContext.Provider>
	)
})
Table.displayName = "Table"

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.ComponentPropsWithoutRef<"thead">>(
	function TableHeader({ className, ...props }, ref) {
		return <thead ref={ref} data-slot="table-header" className={cn(className)} {...props} />
	}
)
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<HTMLTableSectionElement, React.ComponentPropsWithoutRef<"tbody">>(
	function TableBody({ className, ...props }, ref) {
		return (
			<tbody ref={ref} data-slot="table-body" className={cn("[&_tr:last-child]:border-0", className)} {...props} />
		)
	}
)
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.ComponentPropsWithoutRef<"tfoot">>(
	function TableFooter({ className, ...props }, ref) {
		return (
			<tfoot
				ref={ref}
				data-slot="table-footer"
				className={cn("border-t border-border/70 bg-muted/30 font-medium [&>tr]:last:border-b-0", className)}
				{...props}
			/>
		)
	}
)
TableFooter.displayName = "TableFooter"

type TableRowProps = React.ComponentPropsWithoutRef<"tr"> & {
	divider?: "strong" | "medium" | "dotted"
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(function TableRow(
	{ className, divider, style, ...props },
	ref
) {
	const { grouped_dividers } = useTableContext()

	const divider_color = "var(--border)"
	const divider_color_faint = "color-mix(in oklch, var(--border) 55%, transparent)"
	const divider_style = React.useMemo<React.CSSProperties | undefined>(() => {
		if (!grouped_dividers || !divider) return undefined

		if (divider === "strong") {
			return { borderTopWidth: 2, borderTopStyle: "solid", borderTopColor: divider_color, borderColor: divider_color }
		}
		if (divider === "medium") {
			return { borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: divider_color, borderColor: divider_color }
		}
		return {
			borderTopWidth: 1,
			borderTopStyle: "dotted",
			borderTopColor: divider_color_faint,
			borderColor: divider_color_faint,
			borderImage: `repeating-linear-gradient(90deg, ${divider_color_faint} 0, ${divider_color_faint} 0.75px, transparent 0.75px, transparent 9px) 1`,
			borderImageSlice: 1,
		}
	}, [divider, divider_color, divider_color_faint, grouped_dividers])

	const divider_class = grouped_dividers && divider ? "border-b-0" : "border-b border-border/70"

	return (
		<tr
			ref={ref}
			data-slot="table-row"
			className={cn(
				divider_class,
				"hover:bg-[color:var(--surface-bg-hover)] data-[state=selected]:bg-muted/50",
				className
			)}
			style={divider_style ? { ...divider_style, ...style } : style}
			{...props}
		/>
	)
})
TableRow.displayName = "TableRow"

type TableHeadProps = React.ComponentPropsWithoutRef<"th">

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
	function TableHead({ className, ...props }, ref) {
		const { sticky_header, tone_class } = useTableContext()

		return (
			<th
				ref={ref}
				data-slot="table-head"
				data-sticky={sticky_header ? "true" : "false"}
				className={cn(
					"h-10 px-2 text-left align-middle font-medium",
					ui.typography.caption,
					"[&:has([role=checkbox])]:pr-0",
					"data-[sticky=true]:sticky data-[sticky=true]:top-0 data-[sticky=true]:z-10",
					tone_class,
					"border-b border-border/70",
					"data-[sticky=true]:shadow-[inset_0_-1px_0_0_color-mix(in_oklch,var(--border)_70%,transparent)]",
					className
				)}
				{...props}
			/>
		)
	}
)
TableHead.displayName = "TableHead"

type TableCellProps = React.ComponentPropsWithoutRef<"td"> & { muted?: boolean }

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(function TableCell(
	{ className, muted = false, ...props },
	ref
) {
	return (
		<td
			ref={ref}
			data-slot="table-cell"
			className={cn(
				"p-2 align-middle whitespace-normal break-words",
				ui.typography.caption,
				muted ? ui.copy.mutedSoft : null,
				"[&:has([role=checkbox])]:pr-0",
				className
			)}
			{...props}
		/>
	)
})
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.ComponentPropsWithoutRef<"caption">>(
	function TableCaption({ className, ...props }, ref) {
		return (
			<caption
				ref={ref}
				data-slot="table-caption"
				className={cn("mt-4 text-muted-foreground", ui.typography.caption, className)}
				{...props}
			/>
		)
	}
)
TableCaption.displayName = "TableCaption"

/* -------------------------------------------------------------------------- */
/* Export                                                                     */
/* -------------------------------------------------------------------------- */

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption }
export type { TableProps, TableTone }
