"use client"

import { useEffect } from "react"

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
					<h2 className="text-xl font-semibold text-foreground">Application error</h2>
					<p className="text-sm text-muted-foreground">A fatal error occurred. Refresh the page to recover.</p>
				</div>
			</body>
		</html>
	)
}
