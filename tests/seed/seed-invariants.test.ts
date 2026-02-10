import { SpendDefinitions } from "../../features/playbook/definitions/spend"
import { Sources } from "../../features/playbook/definitions/sources"
import { UtmPlacementDefinitions } from "../../features/playbook/definitions/utm-placement-to-placements"
import { UtmSourceVendorDefinitions } from "../../features/playbook/definitions/utm-source-to-vendors"

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message)
}

function run() {
	const source_l3_set = new Set(Sources.map((source) => source.source_l3))
	const utm_source_set = new Set(UtmSourceVendorDefinitions.map((row) => row.utm_source))

	for (const spend of SpendDefinitions) {
		for (const source_l3 of spend.source_l3) {
			assert(source_l3_set.has(source_l3), `[Spend] Unknown source_l3 "${source_l3}" in spend "${spend.id}"`)
		}
	}

	for (const row of UtmPlacementDefinitions) {
		assert(utm_source_set.has(row.utm_source), `[UTM Placement] Unknown utm_source "${row.utm_source}"`)
	}

	console.log("seed invariants: ok")
}

run()
