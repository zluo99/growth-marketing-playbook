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

export const overview_tab_title = "A technical playbook to run the growth marketing function"
export const overview_tab_subtitle = "Designed and created by John Luo"
export const overview_tab_separator = " • "
const overview_tab_description = `${overview_tab_title}${overview_tab_separator}${overview_tab_subtitle}`

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
		description: "Build governed staging models and semantic definitions",
	},
	{
		id: "reports-workspace",
		alias: "Automating Reports",
		icon: FileSpreadsheet,
		description: "Turn governed data into reporting and decision-ready reviews",
	},
	{
		id: "journeys",
		alias: "Building Journeys",
		icon: Route,
		description: "Model how prospects move from touch to deal and where lift comes from",
	},
	{
		id: "plays",
		alias: "Running Plays",
		icon: Zap,
		description: "Diagnose channels, spend, and source performance to decide the next move",
	},
	{
		id: "frameworks",
		alias: "Frameworks",
		icon: Layers,
		description: "Mental models for strategy, analytics, and execution",
	},
] satisfies readonly TabMeta[]

export const TabById = PlaybookTabs.reduce<Record<TabId, TabMeta>>((acc, tab) => {
	acc[tab.id] = tab
	return acc
}, {} as Record<TabId, TabMeta>)

export const TabOrder = PlaybookTabs.map((tab) => tab.id) as readonly TabId[]
