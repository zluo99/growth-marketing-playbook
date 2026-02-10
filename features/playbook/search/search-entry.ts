/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import type { TabId } from "@/features/playbook/definitions/tabs"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type CopyEntryInput = {
	id: string
	title: string
	description?: string
	displayDescription?: string
	category?: "copy"
	tabId?: TabId
	badge?: string
	meta?: string
	breadcrumbs?: readonly string[]
	extra?: readonly string[]
	searchExtras?: readonly string[]
	scrollTarget?: string
}
