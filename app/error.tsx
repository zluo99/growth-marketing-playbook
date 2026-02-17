"use client"

import { useEffect } from "react"

import { PageCopy } from "@/features/playbook/copy/page"

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	useEffect(() => {
		console.error("Unhandled client error", { error, digest: error.digest, boundary: "app/error" })
	}, [error])

	return (
		<div className="mx-auto flex min-h-[40vh] w-full max-w-3xl flex-col items-start justify-center gap-3 px-6 py-16">
			<h2 className="text-xl font-semibold text-foreground">{PageCopy.systemStates.error.title}</h2>
			<p className="text-sm text-muted-foreground">{PageCopy.systemStates.error.message}</p>
			<button
				type="button"
				onClick={reset}
				className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm hover:bg-muted"
			>
				{PageCopy.systemStates.error.actionLabel}
			</button>
		</div>
	)
}
