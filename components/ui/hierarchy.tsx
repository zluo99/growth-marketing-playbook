"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronRight } from "lucide-react"

import { ui } from "@/components/tokens/design"
import { uiMotion, useReducedMotionBool } from "@/components/tokens/motion"
import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type HierarchyTone = keyof typeof ui.table
type HierarchyDataProps = Record<`data-${string}`, string | number | undefined>
type HierarchyLeafLayout = "compact" | "text"

export type HierarchyLevel<Row> = {
	id: string
	header: React.ReactNode
	sectionAction?: React.ReactNode
	getValue: (row: Row) => string
	getLabel?: (row: Row) => React.ReactNode
	defaultExpanded?: boolean
}

type HierarchyProps<Row> = {
	rows: readonly Row[]
	levels: readonly [HierarchyLevel<Row>, ...HierarchyLevel<Row>[]]
	detailHeader?: React.ReactNode
	renderDetail: (row: Row) => React.ReactNode
	getRowKey: (row: Row) => string
	getLeafLayout?: (row: Row) => HierarchyLeafLayout
	openGroupKeys?: readonly string[]
	onOpenGroupKeysChange?: (keys: readonly string[]) => void
	getLeafProps?: (row: Row) => (React.HTMLAttributes<HTMLDivElement> & HierarchyDataProps) | undefined
	className?: string
	containerClassName?: string
	headerTone?: HierarchyTone
	showTrail?: boolean
	emptyState?: React.ReactNode
}

type HierarchyLeaf<Row> = {
	kind: "leaf"
	key: string
	label: React.ReactNode
	row: Row
}

type HierarchyGroup<Row> = {
	kind: "group"
	key: string
	label: React.ReactNode
	depth: number
	defaultExpanded: boolean
	leafCount: number
	children: readonly HierarchyNode<Row>[]
}

type HierarchyNode<Row> = HierarchyLeaf<Row> | HierarchyGroup<Row>

/* -------------------------------------------------------------------------- */
/* Utils                                                                      */
/* -------------------------------------------------------------------------- */

function count_leaves<Row>(nodes: readonly HierarchyNode<Row>[]) {
	let total = 0
	for (const node of nodes) {
		total += node.kind === "leaf" ? 1 : count_leaves(node.children)
	}
	return total
}

function build_hierarchy<Row>(
	rows: readonly Row[],
	levels: readonly [HierarchyLevel<Row>, ...HierarchyLevel<Row>[]],
	getRowKey: (row: Row) => string,
	depth = 0,
	ancestor_key = ""
): readonly HierarchyNode<Row>[] {
	const level = levels[depth]
	const make_label = (row: Row) => level.getLabel?.(row) ?? level.getValue(row)

	if (depth === levels.length - 1) {
		return rows.map((row) => ({
			kind: "leaf",
			key: getRowKey(row),
			label: make_label(row),
			row,
		}))
	}

	const grouped = new Map<string, Row[]>()
	for (const row of rows) {
		const value = level.getValue(row)
		const bucket = grouped.get(value)
		if (bucket) bucket.push(row)
		else grouped.set(value, [row])
	}

	return Array.from(grouped.entries()).map(([value, grouped_rows]) => {
		const group_key = ancestor_key ? `${ancestor_key}__${level.id}:${value}` : `${level.id}:${value}`
		const children = build_hierarchy(grouped_rows, levels, getRowKey, depth + 1, group_key)
		return {
			kind: "group",
			key: group_key,
			label: make_label(grouped_rows[0]),
			depth,
			defaultExpanded: level.defaultExpanded ?? depth === 0,
			leafCount: count_leaves(children),
			children,
		}
	})
}

function collect_default_open_keys<Row>(nodes: readonly HierarchyNode<Row>[]) {
	const keys: string[] = []
	for (const node of nodes) {
		if (node.kind !== "group") continue
		if (node.defaultExpanded) keys.push(node.key)
		keys.push(...collect_default_open_keys(node.children))
	}
	return keys
}

function render_section_header<Row>(level: HierarchyLevel<Row> | undefined, opts?: { is_terminal?: boolean }) {
	if (!level?.header) return null
	const header_class = opts?.is_terminal ? ui.hierarchy.sectionHeaderDeep : ui.hierarchy.sectionHeader

	return (
		<div className={header_class}>
			<div className={ui.hierarchy.sectionLabel}>
				{level.sectionAction ? <span className="shrink-0">{level.sectionAction}</span> : null}
				<span className="min-w-0 break-words">{level.header}</span>
			</div>
		</div>
	)
}

export function HierarchyDisclosureGlyph({ open }: { open: boolean }) {
	return (
		<span className={ui.hierarchy.disclosureGlyph} aria-hidden="true">
			<span className={ui.hierarchy.disclosureBar} />
			{open ? null : <span className={ui.hierarchy.disclosureBarVertical} />}
		</span>
	)
}

export function HierarchyDisclosure({ open }: { open: boolean }) {
	const reduce_motion = useReducedMotionBool()
	const transition_duration_ms = reduce_motion ? uiMotion.frameworks.hierarchy.disclosure.reducedDurationMs : uiMotion.frameworks.hierarchy.disclosure.durationMs

	return (
		<span
			className={cn(ui.hierarchy.disclosureButton, open ? ui.hierarchy.disclosureButtonOpen : null)}
			style={{
				transitionDuration: `${transition_duration_ms}ms`,
				transitionTimingFunction: uiMotion.frameworks.hierarchy.disclosure.timingFunction,
			}}
			aria-hidden="true"
		>
			<HierarchyDisclosureGlyph open={open} />
		</span>
	)
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

export function Hierarchy<Row>({
	rows,
	levels,
	detailHeader,
	renderDetail,
	getRowKey,
	getLeafLayout,
	openGroupKeys,
	onOpenGroupKeysChange,
	getLeafProps,
	className,
	containerClassName,
	headerTone = "blue",
	showTrail = true,
	emptyState,
}: HierarchyProps<Row>) {
	const nodes = React.useMemo(() => build_hierarchy(rows, levels, getRowKey), [getRowKey, levels, rows])
	const default_open_keys = React.useMemo(() => collect_default_open_keys(nodes), [nodes])
	const reduce_motion = useReducedMotionBool()
	const is_controlled = openGroupKeys != null
	const [uncontrolled_open_groups, set_uncontrolled_open_groups] = React.useState<Set<string>>(() => new Set(default_open_keys))
	const open_groups = React.useMemo(() => new Set(is_controlled ? openGroupKeys : uncontrolled_open_groups), [is_controlled, openGroupKeys, uncontrolled_open_groups])

	const toggle_group = React.useCallback((key: string) => {
		const update = (prev: Set<string>) => {
			const next = new Set(prev)
			if (next.has(key)) next.delete(key)
			else next.add(key)
			onOpenGroupKeysChange?.(Array.from(next))
			return next
		}

		if (is_controlled) {
			update(open_groups)
			return
		}

		set_uncontrolled_open_groups((prev) => update(prev))
	}, [is_controlled, onOpenGroupKeysChange, open_groups])
	const top_level_level = levels[0]
	const show_header = showTrail || detailHeader != null

	const render_nodes = React.useCallback(
		function render_nodes(items: readonly HierarchyNode<Row>[]) {
			return items.map((node) => {
				if (node.kind === "leaf") {
					const leaf_props = getLeafProps?.(node.row)
					const leaf_layout = getLeafLayout?.(node.row) ?? "compact"
					const leaf_row_class = leaf_layout === "text" ? ui.hierarchy.leafRowText : ui.hierarchy.leafRowCompact
					const leaf_value_wrap_class = leaf_layout === "text" ? ui.hierarchy.leafValueWrapText : ui.hierarchy.leafValueWrapCompact
					const leaf_detail_class = leaf_layout === "text" ? ui.hierarchy.leafDetailText : ui.hierarchy.leafDetailCompact
					return (
						<div key={node.key} {...leaf_props} className={cn(leaf_row_class, leaf_props?.className)}>
							<div className={leaf_value_wrap_class}>
								<div className={ui.hierarchy.value}>{node.label}</div>
							</div>
							<div className={leaf_detail_class}>{renderDetail(node.row)}</div>
						</div>
					)
				}

				const is_open = open_groups.has(node.key)
				const next_level = levels[node.depth + 1]
				const next_level_is_terminal = node.depth + 1 === levels.length - 1
				return (
					<div key={node.key} className={ui.hierarchy.nodeStack}>
						<button
							type="button"
							data-state={is_open ? "active" : "inactive"}
							aria-expanded={is_open}
							onClick={() => toggle_group(node.key)}
							className={cn(ui.hierarchy.groupRow, is_open ? ui.hierarchy.groupRowOpen : null)}
						>
							<HierarchyDisclosure open={is_open} />

							<div className={cn(ui.hierarchy.groupValueWrap, ui.hierarchy.valueWrap)}>
								<div className={ui.hierarchy.value}>{node.label}</div>
							</div>

							<div className={ui.hierarchy.count}>{node.leafCount}</div>
						</button>

						<AnimatePresence initial={false}>
							{is_open ? (
								<motion.div
									key={`${node.key}-children`}
									initial={reduce_motion ? { opacity: 0 } : { height: 0, opacity: 0, y: -uiMotion.frameworks.hierarchy.offsetY }}
									animate={reduce_motion ? { opacity: 1 } : { height: "auto", opacity: 1, y: 0 }}
									exit={reduce_motion ? { opacity: 0 } : { height: 0, opacity: 0, y: -uiMotion.frameworks.hierarchy.offsetY }}
									transition={reduce_motion ? uiMotion.frameworks.hierarchy.reduced : uiMotion.frameworks.hierarchy.expand}
									className={ui.hierarchy.motionBody}
								>
									<div className={ui.hierarchy.children}>
										{render_section_header(next_level, { is_terminal: next_level_is_terminal })}
										{render_nodes(node.children)}
									</div>
								</motion.div>
							) : null}
						</AnimatePresence>
					</div>
				)
			})
		},
		[getLeafLayout, getLeafProps, levels, open_groups, reduce_motion, renderDetail, toggle_group]
	)

	return (
		<div className={cn(ui.hierarchy.shell, className)}>
			<div className={cn(ui.hierarchy.scroller, containerClassName)}>
				{show_header ? (
					<div className={cn(ui.hierarchy.header, ui.table[headerTone] ?? ui.table.blue)}>
						<div className={ui.hierarchy.trail}>
							{showTrail
								? levels.map((level, idx) => (
										<React.Fragment key={level.id}>
											<span className="min-w-0 break-words">{level.header}</span>
											{idx < levels.length - 1 ? <ChevronRight className={cn(ui.iconNude.sm, "shrink-0 opacity-70")} aria-hidden="true" /> : null}
										</React.Fragment>
									))
								: null}
						</div>

						<div className="min-w-0">{detailHeader}</div>
					</div>
				) : null}

				<div className={ui.hierarchy.body}>
					{render_section_header(top_level_level)}
					{rows.length ? render_nodes(nodes) : emptyState ?? <div className={cn(ui.typography.body, ui.copy.mutedSoft)}>No rows.</div>}
				</div>
			</div>
		</div>
	)
}

/* -------------------------------------------------------------------------- */
/* Export                                                                     */
/* -------------------------------------------------------------------------- */

export type { HierarchyLeafLayout, HierarchyProps, HierarchyTone }
