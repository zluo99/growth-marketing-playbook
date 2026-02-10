/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import type { ComponentType } from "react"
import { BookOpen, Database, FileSpreadsheet, Layers, Route, Zap } from "lucide-react"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type TabId = "overview" | "reports-sql" | "reports-workspace" | "journeys" | "plays" | "frameworks"

export type TabMeta = {
	id: TabId
	alias: string
	icon: ComponentType<{ className?: string }>
	description?: string
}

/* -------------------------------------------------------------------------- */
/* Definition: Tabs                                                           */
/* -------------------------------------------------------------------------- */

const overview_tab_description = "A technical playbook to run the growth marketing function • Designed and created by John Luo"

export const PlaybookTabs = [
	{
		id: "overview",
		alias: "Overview",
		icon: BookOpen,
		description: overview_tab_description,
	},
	{
		id: "reports-sql",
		alias: "Staging Models",
		icon: Database,
		description: "Build durable and consistent data models",
	},
	{
		id: "reports-workspace",
		alias: "Automating Reports",
		icon: FileSpreadsheet,
		description: "Report on performance and financials to drive strategic decisions in marketing and sales",
	},
	{
		id: "journeys",
		alias: "Building Journeys",
		icon: Route,
		description: "Understand how prospects move from awareness to decision and identify levers to improve performance",
	},
	{
		id: "plays",
		alias: "Running Plays",
		icon: Zap,
		description: "Execute data-driven strategies to increase demand, improve conversion/efficiency, and drive revenue",
	},
	{
		id: "frameworks",
		alias: "Frameworks",
		icon: Layers,
		description: "Mental models and checklists",
	},
] satisfies readonly TabMeta[]

export const TabById = PlaybookTabs.reduce<Record<TabId, TabMeta>>((acc, tab) => {
	acc[tab.id] = tab
	return acc
}, {} as Record<TabId, TabMeta>)

export const TabOrder = PlaybookTabs.map((tab) => tab.id) as readonly TabId[]
