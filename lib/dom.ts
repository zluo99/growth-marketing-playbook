export function clamp_value(value: number, min: number, max: number) {
	return Math.max(min, Math.min(max, value))
}

export function lerp_value(start: number, end: number, t: number) {
	return start + (end - start) * t
}

export function runWithViewportAnchor<T>(anchor: HTMLElement | null | undefined, action: () => T): T {
	const can_measure = typeof window !== "undefined" && !!anchor
	const before_top = can_measure ? anchor.getBoundingClientRect().top : null
	const result = action()

	if (before_top == null) return result

	requestAnimationFrame(() => {
		if (typeof window === "undefined") return
		if (!anchor?.isConnected) return
		const after_top = anchor.getBoundingClientRect().top
		const delta = after_top - before_top
		if (Math.abs(delta) > 0.5) window.scrollBy({ top: delta, behavior: "auto" })
	})

	return result
}

function findHorizontalScrollContainer(node: HTMLElement) {
	let current: HTMLElement | null = node.parentElement
	while (current) {
		if (current.scrollWidth > current.clientWidth + 1) {
			const styles = window.getComputedStyle(current)
			const overflow_x = styles.overflowX
			if (overflow_x === "auto" || overflow_x === "scroll") return current
		}
		current = current.parentElement
	}
	return null
}

export function scrollIntoHorizontalView(
	target: HTMLElement,
	options: {
		behavior?: ScrollBehavior
		align?: "center" | "nearest"
	} = {}
) {
	if (typeof window === "undefined") return
	const container = findHorizontalScrollContainer(target)
	if (!container) return

	const behavior = options.behavior ?? "smooth"
	const align = options.align ?? "center"
	const target_rect = target.getBoundingClientRect()
	const container_rect = container.getBoundingClientRect()

	const left_delta = target_rect.left - container_rect.left
	const right_delta = target_rect.right - container_rect.right

	if (align === "nearest") {
		if (left_delta < 0) container.scrollBy({ left: left_delta, behavior })
		else if (right_delta > 0) container.scrollBy({ left: right_delta, behavior })
		return
	}

	const centered_left = container.scrollLeft + left_delta - (container.clientWidth - target_rect.width) / 2
	const max_left = Math.max(0, container.scrollWidth - container.clientWidth)
	const next_left = clamp_value(centered_left, 0, max_left)
	container.scrollTo({ left: next_left, behavior })
}
