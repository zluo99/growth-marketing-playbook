"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"

import type { TabId } from "../../definitions/tabs"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type PbBodyTabContextValue = {
	activeTab: TabId
	nextTab: TabId | null
	prevTab: TabId | null
	goToTab: (id: TabId) => void
	goToNext: () => void
	goToPrev: () => void
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

export const PbBodyTabContext = React.createContext<PbBodyTabContextValue | null>(null)

/* -------------------------------------------------------------------------- */
/* Hooks                                                                      */
/* -------------------------------------------------------------------------- */

export function usePbTabsNav() {
	const ctx = React.useContext(PbBodyTabContext)
	if (!ctx) throw new Error("usePbTabsNav must be used within PbBody")
	return ctx
}
