import Link from "next/link"

import { PageCopy } from "@/features/playbook/copy/page"

export default function NotFound() {
	return (
		<div className="mx-auto flex min-h-[40vh] w-full max-w-3xl flex-col items-start justify-center gap-3 px-6 py-16">
			<h2 className="text-xl font-semibold text-foreground">{PageCopy.systemStates.notFound.title}</h2>
			<p className="text-sm text-muted-foreground">{PageCopy.systemStates.notFound.message}</p>
			<Link
				href={PageCopy.systemStates.notFound.actionHref}
				className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2"
			>
				{PageCopy.systemStates.notFound.actionLabel}
			</Link>
		</div>
	)
}
