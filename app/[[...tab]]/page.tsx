"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import PbBody from "@/features/playbook/components/page/body"
import PbFooter from "@/features/playbook/components/page/footer"

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function Page() {
	return (
		<main className="flex min-h-screen w-full min-w-0 flex-col">
			<div className="flex-1">
				<PbBody />
			</div>
			<PbFooter />
		</main>
	)
}
