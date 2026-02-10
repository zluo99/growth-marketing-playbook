"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"

import { ui } from "@/components/tokens/design"
import { useReducedMotionBool } from "@/components/tokens/motion"
import { Button } from "@/components/ui/button"
import { useTapFeedback } from "@/lib/hooks/use-tap-feedback"
import { cn } from "@/lib/utils"
import { PillContent, PillRoot } from "@/components/nav/pill"

import { PageCopy } from "../../copy/page"
import { TabById, TabOrder, type TabId } from "../../definitions/tabs"
import TabFrameworks from "../../tabs/frameworks"
import TabJourneys from "../../tabs/journeys"
import TabOverview from "../../tabs/overview"
import TabPlays from "../../tabs/plays"
import { Renderer } from "../ui/renderer"
import { LoaderCardSkeleton } from "../ui/loader"
import { PbHeader, HoverMorphArrow } from "./header"
import { PbBodyTabContext, type PbBodyTabContextValue, usePbTabsNav } from "../context/context"

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const TabReportsSql = dynamic(() => import("../../tabs/reports-sql"), { ssr: false, loading: () => <LoaderCardSkeleton /> })
const TabReportsWorkspace = dynamic(() => import("../../tabs/reports-workspace"), { ssr: false, loading: () => <LoaderCardSkeleton /> })

const tab_components: Record<TabId, React.ComponentType> = {
	overview: TabOverview,
	"reports-sql": TabReportsSql,
	"reports-workspace": TabReportsWorkspace,
	journeys: TabJourneys,
	plays: TabPlays,
	frameworks: TabFrameworks,
}

const tab_order = TabOrder

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const is_tab_id = (v: string): v is TabId => v in TabById

function tab_from_pathname(pathname: string | null): TabId | null {
	if (!pathname) return null
	const segs = pathname.split("/").filter(Boolean)
	for (let i = segs.length - 1; i >= 0; i--) {
		const seg = segs[i]
		if (is_tab_id(seg)) return seg
	}
	return null
}

function tab_path_for(pathname: string | null, tab: TabId) {
	const segs = (pathname ?? "").split("/").filter(Boolean)
	for (let i = segs.length - 1; i >= 0; i--) {
		if (!is_tab_id(segs[i])) continue
		const base = segs.slice(0, i)
		return `/${[...base, tab].join("/")}`
	}
	return `/${tab}`
}

/* -------------------------------------------------------------------------- */
/* Hooks                                                                      */
/* -------------------------------------------------------------------------- */

function useActiveTabFromUrl(default_tab: TabId) {
	const pathname = usePathname()
	const [active_tab, set_active_tab] = React.useState<TabId>(() => tab_from_pathname(pathname) ?? default_tab)
	const active_tab_ref = React.useRef(active_tab)

	React.useEffect(() => {
		active_tab_ref.current = active_tab
	}, [active_tab])

	React.useEffect(() => {
		const resolved = tab_from_pathname(pathname) ?? default_tab
		set_active_tab((prev) => (prev === resolved ? prev : resolved))
	}, [default_tab, pathname])

	React.useEffect(() => {
		if (typeof window === "undefined") return
		const on_popstate = () => {
			const resolved = tab_from_pathname(window.location.pathname) ?? default_tab
			set_active_tab((prev) => (prev === resolved ? prev : resolved))
		}
		window.addEventListener("popstate", on_popstate)
		return () => window.removeEventListener("popstate", on_popstate)
	}, [default_tab])

	React.useEffect(() => {
		if (typeof window === "undefined") return
		if (tab_from_pathname(window.location.pathname)) return
		const next = tab_path_for(window.location.pathname, active_tab)
		if (window.location.pathname !== next) window.history.replaceState(window.history.state, "", next)
	}, [active_tab])

	React.useEffect(() => {
		if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "auto" })
	}, [active_tab])

	const push_tab = React.useCallback(
		(id: TabId) => {
			if (active_tab_ref.current === id) return
			set_active_tab((prev) => (prev === id ? prev : id))
			if (typeof window === "undefined") return
			const next = tab_path_for(window.location.pathname, id)
			if (window.location.pathname !== next) window.history.pushState(window.history.state, "", next)
		},
		[]
	)

	return { activeTab: active_tab, pushTab: push_tab }
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function TabContent({ tabId }: { tabId: TabId }) {
	const ActiveTab = tab_components[tabId]

	return (
		<div className={cn("flex flex-col", ui.gap.md)}>
			<ActiveTab />
		</div>
	)
}

function BottomTabNavButtons() {
	const { nextTab, prevTab, goToNext, goToPrev } = usePbTabsNav()

	const nav_btn_class = cn(
		"group inline-flex items-center justify-center",
		ui.gap.xs,
		ui.spacing.controlX,
		ui.nav.control.height,
		ui.radius.control,
		ui.surface.state.focus.ring,
		ui.motion.duration,
		ui.surface.structure.border,
		"bg-background",
		ui.surface.state.hover.bg,
		ui.surface.state.hover.border,
		ui.surface.state.hover.shadowMd,
		"data-[pressed=true]:bg-[color:var(--surface-bg-hover)]",
		"data-[pressed=true]:border-[color:var(--border-hover)]",
		"data-[pressed=true]:[box-shadow:var(--shadow-md)]"
	)

	const NavBtn = ({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) => {
		const [hovered, set_hovered] = React.useState(false)
		const { isTapActive, tapFeedbackProps } = useTapFeedback<HTMLButtonElement>()
		const is_prev = dir === "prev"
		const is_active = hovered || isTapActive

		return (
			<Button
				size="default"
				variant="outline"
				onClick={onClick}
				data-pressed={isTapActive ? "true" : undefined}
				onMouseEnter={() => set_hovered(true)}
				onMouseLeave={() => set_hovered(false)}
				onFocus={() => set_hovered(true)}
				onBlur={(event) => {
					set_hovered(false)
					tapFeedbackProps.onBlur(event)
				}}
				onPointerDown={tapFeedbackProps.onPointerDown}
				onPointerUp={tapFeedbackProps.onPointerUp}
				onPointerCancel={tapFeedbackProps.onPointerCancel}
				onPointerLeave={tapFeedbackProps.onPointerLeave}
				className={nav_btn_class}
			>
				{is_prev ? <HoverMorphArrow dir="left" hovered={is_active} /> : null}
				<span className={cn(ui.motion.duration, ui.text.interactive.all, isTapActive ? "text-foreground" : null)}>
					{is_prev ? PageCopy.headerTabsNav.prevLabel : PageCopy.headerTabsNav.nextLabel}
				</span>
				{!is_prev ? <HoverMorphArrow dir="right" hovered={is_active} /> : null}
			</Button>
		)
	}

	return (
		<div className={cn("flex items-center justify-between", ui.gap.lg)}>
			<div className={cn("flex items-center", ui.gap.lg)}>{prevTab ? <NavBtn dir="prev" onClick={goToPrev} /> : null}</div>
			<div className={cn("flex items-center justify-end", ui.gap.lg)}>{nextTab ? <NavBtn dir="next" onClick={goToNext} /> : null}</div>
		</div>
	)
}

/* -------------------------------------------------------------------------- */
/* Default export                                                             */
/* -------------------------------------------------------------------------- */

export default function PbBody() {
	const reduce_motion = useReducedMotionBool()
	const { activeTab, pushTab } = useActiveTabFromUrl("overview")

	const idx = tab_order.indexOf(activeTab)
	const next_tab = idx >= 0 && idx < tab_order.length - 1 ? tab_order[idx + 1] : null
	const prev_tab = idx > 0 ? tab_order[idx - 1] : null

	const go_to_tab = pushTab

	const go_to_prev = React.useCallback(() => {
		if (prev_tab) pushTab(prev_tab)
	}, [prev_tab, pushTab])

	const go_to_next = React.useCallback(() => {
		if (next_tab) pushTab(next_tab)
	}, [next_tab, pushTab])

	const on_value_change = React.useCallback(
		(v: string) => {
			if (!is_tab_id(v)) return
			pushTab(v)
		},
		[pushTab]
	)

	const ctx = React.useMemo<PbBodyTabContextValue>(
		() => ({ activeTab, nextTab: next_tab, prevTab: prev_tab, goToTab: go_to_tab, goToNext: go_to_next, goToPrev: go_to_prev }),
		[activeTab, go_to_next, go_to_prev, go_to_tab, next_tab, prev_tab]
	)

	return (
		<Renderer.Provider>
			<PbBodyTabContext.Provider value={ctx}>
				<PillRoot value={activeTab} onValueChange={on_value_change} className={cn("w-full flex flex-col")}>
					<PbHeader activeTab={activeTab} onGoToTab={pushTab} reduceMotion={reduce_motion} />

					<PillContent value={activeTab} className={cn("outline-none", ui.gap.lg, "mt-9")}>
						<div className={cn("flex flex-col", ui.gap.lg)}>
							<TabContent tabId={activeTab} />
							<BottomTabNavButtons />
						</div>
					</PillContent>
				</PillRoot>
			</PbBodyTabContext.Provider>
		</Renderer.Provider>
	)
}
