"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"

/* -------------------------------------------------------------------------- */
/* Hooks                                                                      */
/* -------------------------------------------------------------------------- */

export function useCopyToClipboard(timeout_ms = 1200) {
	const [copied, set_copied] = React.useState(false)
	const timeout_ref = React.useRef<number | null>(null)

	const clear = React.useCallback(() => {
		if (timeout_ref.current != null) window.clearTimeout(timeout_ref.current)
		timeout_ref.current = null
	}, [])

	React.useEffect(() => clear, [clear])

	const copy = React.useCallback(
		async (text: string) => {
			if (!navigator?.clipboard?.writeText) return false
			try {
				await navigator.clipboard.writeText(text)
				set_copied(true)
				clear()
				timeout_ref.current = window.setTimeout(() => set_copied(false), timeout_ms)
				return true
			} catch {
				return false
			}
		},
		[clear, timeout_ms]
	)

	return { copied, copy }
}
