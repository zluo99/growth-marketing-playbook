import * as React from "react"

export function useMediaQuery(query: string) {
	const [matches, set_matches] = React.useState(false)

	React.useEffect(() => {
		if (typeof window === "undefined") return

		const mq = window.matchMedia(query)
		const apply = () => set_matches(mq.matches)
		apply()

		mq.addEventListener("change", apply)
		return () => mq.removeEventListener("change", apply)
	}, [query])

	return matches
}
