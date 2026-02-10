"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { motion, type Transition } from "framer-motion"

import { ui } from "@/components/tokens/design"
import { useMotionPill } from "@/components/tokens/motion"
import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type PillContentProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
type PillContentRef = React.ComponentRef<typeof TabsPrimitive.Content>

type PillListProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
	chrome?: boolean
	opaque?: boolean
}
type PillListRef = React.ComponentRef<typeof TabsPrimitive.List>

type PillTriggerProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
	standard?: boolean
}
type PillTriggerRef = React.ComponentRef<typeof TabsPrimitive.Trigger>

type MotionSpring = Parameters<typeof useMotionPill>[0]["spring"]

export type MotionPillRailState<K extends string> = {
	listRef: React.RefObject<HTMLDivElement>
	triggerRefs: React.MutableRefObject<Record<K, HTMLElement | null>>
	getTriggerRef: (key: K) => (el: HTMLElement | null) => void
	pill: ReturnType<typeof useMotionPill<K>>
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const PillRoot = TabsPrimitive.Root

/* -------------------------------------------------------------------------- */
/* Hooks                                                                      */
/* -------------------------------------------------------------------------- */

export function useMotionPillRail<K extends string>({ activeKey, spring }: { activeKey: K; spring: MotionSpring }): MotionPillRailState<K> {
	const listRef = React.useRef<HTMLDivElement>(null)
	const triggerRefs = React.useRef<Record<K, HTMLElement | null>>({} as Record<K, HTMLElement | null>)

	const pill = useMotionPill<K>({
		activeKey,
		railRef: listRef as unknown as React.RefObject<HTMLElement | null>,
		itemRefs: triggerRefs as unknown as React.RefObject<Record<K, HTMLElement | null>>,
		spring,
	})

	const getTriggerRef = React.useCallback(
		(key: K) => (el: HTMLElement | null) => {
			triggerRefs.current[key] = el
		},
		[]
	)

	return { listRef, triggerRefs, getTriggerRef, pill }
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

const PillContent = React.forwardRef<PillContentRef, PillContentProps>(function PillContent({ className, ...props }, ref) {
	return <TabsPrimitive.Content ref={ref} data-slot="pill-content" className={cn("outline-none", className)} {...props} />
})
PillContent.displayName = TabsPrimitive.Content.displayName ?? "PillContent"

const PillList = React.forwardRef<PillListRef, PillListProps>(function PillList({ className, chrome = true, opaque = false, ...props }, ref) {
	return (
		<TabsPrimitive.List
			ref={ref}
			data-slot="pill-list"
			className={cn(
				"inline-flex items-center border-0 bg-transparent p-0 shadow-none",
				chrome ? ui.nav.shell.base : null,
				chrome ? ui.nav.shell.blurBg : null,
				chrome && opaque ? ui.surface.structure.opaque : null,
				!chrome ? "border-0 bg-transparent p-0 shadow-none" : null,
				className
			)}
			{...props}
		/>
	)
})
PillList.displayName = TabsPrimitive.List.displayName ?? "PillList"

const PillTrigger = React.forwardRef<PillTriggerRef, PillTriggerProps>(function PillTrigger({ className, standard = true, ...props }, ref) {
	return (
		<TabsPrimitive.Trigger
			ref={ref}
			data-slot="pill-trigger"
			className={cn(
				"inline-flex items-center justify-center whitespace-nowrap disabled:pointer-events-none disabled:opacity-50",
				"box-border",
				standard ? ui.nav.control.height : null,
				standard ? ui.nav.control.padX : null,
				ui.typography.body,
				ui.control.ghost,
				ui.surface.state.focus.ring,
				ui.motion.duration,
				ui.radius.control,
				ui.text.interactive.base,
				ui.text.interactive.hover,
				ui.text.interactive.groupHover,
				ui.text.interactive.inactive,
				ui.text.interactive.active,
				ui.surface.state.hover.border,
				ui.surface.state.press.shadow,
				ui.surface.state.hover.shadowMd,
				ui.surface.state.hover.bg,
				ui.surface.state.active.bg,
				ui.surface.state.active.border,
				"border border-transparent bg-transparent",
				className
			)}
			{...props}
		/>
	)
})
PillTrigger.displayName = TabsPrimitive.Trigger.displayName ?? "PillTrigger"

export function MotionPillIndicator<K extends string>({
	className,
	pill,
	transition,
}: {
	className?: string
	pill: MotionPillRailState<K>["pill"]
	transition?: Transition
}) {
	return (
		<motion.div
			className={className}
			style={{
				x: pill.reduceMotion ? pill.xTarget : pill.x,
				width: pill.reduceMotion ? pill.wTarget : pill.w,
			}}
			transition={pill.reduceMotion ? transition : undefined}
		/>
	)
}

function MutedCaption({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
	return <p className={cn(ui.typography.caption, ui.copy.mutedSoft, ui.margin.bottomNone, className)} {...props} />
}

/* -------------------------------------------------------------------------- */
/* Export                                                                     */
/* -------------------------------------------------------------------------- */

export { MutedCaption, PillRoot, PillContent, PillList, PillTrigger }
export type { PillContentProps, PillListProps, PillTriggerProps }
