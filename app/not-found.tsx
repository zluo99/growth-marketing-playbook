"use client"

import Link from "next/link"

export default function NotFound() {
	return (
		<div className="mx-auto flex min-h-[40vh] w-full max-w-3xl flex-col items-start justify-center gap-3 px-6 py-16">
			<h2 className="text-xl font-semibold text-foreground">Page not found</h2>
			<p className="text-sm text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist.</p>
			<Link href="/overview" className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm hover:bg-muted">
				Go to overview
			</Link>
		</div>
	)
}
