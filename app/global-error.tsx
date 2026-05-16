"use client"

import { useEffect } from "react"

import { PageCopy } from "@/features/playbook/copy/page"

export default function GlobalError({
	error,
}: {
	error: Error & { digest?: string }
}) {
	useEffect(() => {
		console.error("Unhandled global error", { error, digest: error.digest, boundary: "app/global-error" })
	}, [error])

	return (
		<html lang="en">
			<body>
				<div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-start justify-center gap-3 px-6 py-16">
					<h2 className="text-xl font-semibold text-foreground">{PageCopy.systemStates.globalError.title}</h2>
					<p className="text-sm text-muted-foreground">{PageCopy.systemStates.globalError.message}</p>
				</div>
			</body>
		</html>
	)
}
