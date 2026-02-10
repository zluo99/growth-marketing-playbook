import * as React from "react"

type TapFeedbackOptions = {
	releaseDelayMs?: number
}

type TapFeedbackProps<T extends HTMLElement> = {
	onPointerDown: React.PointerEventHandler<T>
	onPointerUp: React.PointerEventHandler<T>
	onPointerCancel: React.PointerEventHandler<T>
	onPointerLeave: React.PointerEventHandler<T>
	onBlur: React.FocusEventHandler<T>
}

const DEFAULT_RELEASE_DELAY_MS = 160

export function useTapFeedback<T extends HTMLElement>({ releaseDelayMs = DEFAULT_RELEASE_DELAY_MS }: TapFeedbackOptions = {}) {
	const [isTapActive, set_is_tap_active] = React.useState(false)
	const release_timeout_ref = React.useRef<number | null>(null)

	const clear_release_timeout = React.useCallback(() => {
		if (release_timeout_ref.current == null) return
		window.clearTimeout(release_timeout_ref.current)
		release_timeout_ref.current = null
	}, [])

	const schedule_release = React.useCallback(() => {
		clear_release_timeout()
		release_timeout_ref.current = window.setTimeout(() => {
			set_is_tap_active(false)
			release_timeout_ref.current = null
		}, releaseDelayMs)
	}, [clear_release_timeout, releaseDelayMs])

	const on_pointer_down = React.useCallback<React.PointerEventHandler<T>>(
		(event) => {
			if (event.pointerType !== "touch" && event.pointerType !== "pen") return
			clear_release_timeout()
			set_is_tap_active(true)
		},
		[clear_release_timeout]
	)

	const on_pointer_up = React.useCallback<React.PointerEventHandler<T>>(() => {
		schedule_release()
	}, [schedule_release])

	const on_pointer_cancel = React.useCallback<React.PointerEventHandler<T>>(() => {
		schedule_release()
	}, [schedule_release])

	const on_pointer_leave = React.useCallback<React.PointerEventHandler<T>>(() => {
		schedule_release()
	}, [schedule_release])

	const on_blur = React.useCallback<React.FocusEventHandler<T>>(() => {
		schedule_release()
	}, [schedule_release])

	React.useEffect(() => clear_release_timeout, [clear_release_timeout])

	return {
		isTapActive: isTapActive,
		tapFeedbackProps: {
			onPointerDown: on_pointer_down,
			onPointerUp: on_pointer_up,
			onPointerCancel: on_pointer_cancel,
			onPointerLeave: on_pointer_leave,
			onBlur: on_blur,
		} satisfies TapFeedbackProps<T>,
	}
}
