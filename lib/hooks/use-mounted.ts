import * as React from "react"

export function useMounted() {
	const [mounted, set_mounted] = React.useState(false)
	React.useEffect(() => set_mounted(true), [])
	return mounted
}
