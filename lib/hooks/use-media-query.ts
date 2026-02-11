import * as React from "react"

type LegacyMediaQueryList = MediaQueryList & {
	addListener?: (listener: (event: MediaQueryListEvent) => void) => void
	removeListener?: (listener: (event: MediaQueryListEvent) => void) => void
}

export function useMediaQuery(query: string) {
	const [matches, set_matches] = React.useState(false)

	React.useEffect(() => {
		if (typeof window === "undefined") return

		const mq = window.matchMedia(query) as LegacyMediaQueryList
		const apply = () => set_matches(mq.matches)
		apply()

		if (typeof mq.addEventListener === "function") {
			mq.addEventListener("change", apply)
			return () => mq.removeEventListener("change", apply)
		}

		if (typeof mq.addListener === "function") {
			mq.addListener(apply)
			return () => mq.removeListener?.(apply)
		}

		return undefined
	}, [query])

	return matches
}
