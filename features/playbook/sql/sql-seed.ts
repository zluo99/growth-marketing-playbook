/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import { listSources, type SourceL1, type SourceL2, type SourceL3 } from "../definitions/sources"
import { SourceL1Weights, SourceL2Weights, SourceSeed } from "../definitions/sources-with-weights"
import { VendorsBySourceL3 } from "../definitions/utm-source-to-vendors"
import { VerticalAliases } from "../definitions/verticals"
import { SpendBySourceL3, type SpendId } from "../definitions/spend"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type SqlJsDatabase = {
	run: (sql: string, params?: unknown[]) => unknown
	close?: () => void
}

export type SeedOptions = {
	clearExisting?: boolean
	seed?: number
	months?: number
	rowsPerMonthUncohorted?: number
}

/* -------------------------------------------------------------------------- */
/* Custom: Taxonomy                                                          */
/* -------------------------------------------------------------------------- */

type Taxonomy = Readonly<{
	l2_by_l1: Readonly<Record<SourceL1, readonly SourceL2[]>>
	l3_by_l2: Readonly<Record<SourceL2, readonly SourceL3[]>>
	l2_weights_by_l1: Readonly<Record<SourceL1, Readonly<Record<SourceL2, number>>>>
}>

function build_taxonomy(): Taxonomy {
	const rows = listSources()

	const l2_by_l1_seen: Record<SourceL1, Set<string>> = {
		Inbound: new Set<string>()
		, Outbound: new Set<string>()
	}

	const l2_by_l1_list: Record<SourceL1, SourceL2[]> = {
		Inbound: []
		, Outbound: []
	}

	const l3_by_l2_seen: Record<string, Set<string>> = {}
	const l3_by_l2_list: Record<string, SourceL3[]> = {}

	for (const r of rows) {
		if (!l2_by_l1_seen[r.source_l1].has(r.source_l2)) {
			l2_by_l1_seen[r.source_l1].add(r.source_l2)
			l2_by_l1_list[r.source_l1].push(r.source_l2)
		}

		;(l3_by_l2_seen[r.source_l2] ??= new Set<string>())
		;(l3_by_l2_list[r.source_l2] ??= [])

		if (!l3_by_l2_seen[r.source_l2]!.has(r.source_l3)) {
			l3_by_l2_seen[r.source_l2]!.add(r.source_l3)
			l3_by_l2_list[r.source_l2]!.push(r.source_l3)
		}
	}

	const l2_by_l1 = Object.freeze({
		Inbound: Object.freeze(l2_by_l1_list.Inbound) as readonly SourceL2[]
		, Outbound: Object.freeze(l2_by_l1_list.Outbound) as readonly SourceL2[]
	})

	const l3_by_l2 = Object.freeze(
		Object.fromEntries(
			Object.entries(l3_by_l2_list).map(([source_l2, xs]) => [source_l2, Object.freeze(xs)])
		)
	) as Readonly<Record<SourceL2, readonly SourceL3[]>>

	const weights_for = (pool: readonly SourceL2[]) =>
		Object.freeze(
			Object.fromEntries(pool.map((source_l2) => [source_l2, SourceL2Weights[source_l2] ?? 1]))
		) as Readonly<Record<SourceL2, number>>

	const l2_weights_by_l1 = Object.freeze({
		Inbound: weights_for(l2_by_l1.Inbound)
		, Outbound: weights_for(l2_by_l1.Outbound)
	})

	return Object.freeze({ l2_by_l1, l3_by_l2, l2_weights_by_l1 })
}

const taxonomy = build_taxonomy()
const spend_candidates = Object.freeze(
	listSources().filter((r) => (SpendBySourceL3[r.source_l3] ?? []).length > 0)
)

const seed_window = Object.freeze({
	start_year: 2020,
	start_month: 1,
	months: 36,
})

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function mulberry_32(seed: number) {
	let t = seed >>> 0
	return function rand() {
		t += 0x6d2b79f5
		let x = Math.imul(t ^ (t >>> 15), 1 | t)
		x ^= x + Math.imul(x ^ (x >>> 7), 61 | x)
		return ((x ^ (x >>> 14)) >>> 0) / 4294967296
	}
}

function pad_2(n: number) {
	return String(n).padStart(2, "0")
}

function iso_date(y: number, m: number, d: number) {
	return `${y}-${pad_2(m)}-${pad_2(d)}`
}

function add_months(y: number, m: number, delta: number) {
	const idx = y * 12 + (m - 1) + delta
	const ny = Math.floor(idx / 12)
	const nm = (idx % 12) + 1
	return { y: ny, m: nm }
}

function pick<T>(rng: () => number, arr: readonly T[]) {
	return arr[Math.floor(rng() * arr.length)] as T
}

function pick_weighted_key<T extends string>(rng: () => number, weights: Record<T, number>) {
	let total = 0
	for (const k in weights) total += weights[k as T]

	let r = rng() * total
	for (const k in weights) {
		r -= weights[k as T]
		if (r <= 0) return k as T
	}

	return Object.keys(weights)[0] as T
}

function pick_source(rng: () => number) {
	const source_l1 = pick_weighted_key(rng, SourceL1Weights)
	const source_l2 = pick_weighted_key(rng, taxonomy.l2_weights_by_l1[source_l1])
	const l3_pool = taxonomy.l3_by_l2[source_l2] ?? ([] as readonly SourceL3[])
	const source_l3 = l3_pool.length > 0 ? pick(rng, l3_pool) : ("Direct" as SourceL3)
	return { source_l1, source_l2, source_l3 }
}

function pick_vendor_for_source(rng: () => number, source_l3: SourceL3): string | null {
	const vendor_pool = VendorsBySourceL3[source_l3] ?? []
	return vendor_pool.length > 0 ? pick(rng, vendor_pool) : null
}

function next_stage_day(rng: () => number, from_day: number, min_lag = 1, max_lag = 10) {
	const max_available = 28 - from_day
	if (max_available <= 0) return 28

	const lag_low = Math.min(min_lag, max_available)
	const lag_high = Math.min(max_lag, max_available)
	const lag_span = Math.max(1, lag_high - lag_low + 1)
	const lag = lag_low + Math.floor(rng() * lag_span)
	return from_day + lag
}

function pick_spend_row(rng: () => number): { source_l1: SourceL1; source_l2: SourceL2; source_l3: SourceL3; spend_type: SpendId } {
	if (spend_candidates.length === 0) throw new Error("No spend-eligible source rows found from SpendBySourceL3")

	const source = pick(rng, spend_candidates)
	const source_l3 = source.source_l3 as SourceL3
	const allowed_spend_types = SpendBySourceL3[source_l3] ?? ([] as readonly SpendId[])
	if (allowed_spend_types.length === 0) throw new Error(`SpendBySourceL3 is missing spend types for ${source_l3}`)

	const spend_type = pick(rng, allowed_spend_types)
	return {
		source_l1: source.source_l1 as SourceL1,
		source_l2: source.source_l2 as SourceL2,
		source_l3,
		spend_type,
	}
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function init_tables(db: SqlJsDatabase, opts: { dropExisting: boolean }) {
	if (opts.dropExisting) {
		db.run(`DROP TABLE IF EXISTS funnel_uncohorted;`)
		db.run(`DROP TABLE IF EXISTS funnel_cohorted;`)
		db.run(`DROP TABLE IF EXISTS funnel_spend;`)
	}

	db.run(`
		CREATE TABLE IF NOT EXISTS funnel_uncohorted (
			object_created_date TEXT
			, object_id TEXT
			, object_type TEXT
			, source_l1 TEXT
			, source_l2 TEXT
			, source_l3 TEXT
			, vendor TEXT
			, vertical TEXT
			, arr REAL
		);
	`)

	db.run(`
		CREATE TABLE IF NOT EXISTS funnel_cohorted (
			lead_created_date TEXT
			, lead_id TEXT
			, source_l1 TEXT
			, source_l2 TEXT
			, source_l3 TEXT
			, vendor TEXT
			, opportunities_from_leads INTEGER
			, deals_from_leads INTEGER
			, arr_from_leads REAL
			, ltv_from_leads REAL
		);
	`)

	db.run(`
		CREATE TABLE IF NOT EXISTS funnel_spend (
			spend_date TEXT
			, spend_type TEXT
			, source_l1 TEXT
			, source_l2 TEXT
			, source_l3 TEXT
			, vendor TEXT
			, spend REAL
		);
	`)
}

function with_tx(db: SqlJsDatabase, fn: () => void) {
	db.run("BEGIN;")
	try {
		fn()
		db.run("COMMIT;")
	} catch (e) {
		db.run("ROLLBACK;")
		throw e
	}
}

/* -------------------------------------------------------------------------- */
/* Constants: SQL                                                             */
/* -------------------------------------------------------------------------- */

const sql_statements = Object.freeze({
	insert_uncohorted: `
		INSERT INTO funnel_uncohorted (
			object_created_date
			, object_id
			, object_type
			, source_l1
			, source_l2
			, source_l3
			, vendor
			, vertical
			, arr
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
	`
	, insert_cohorted: `
		INSERT INTO funnel_cohorted (
			lead_created_date
			, lead_id
			, source_l1
			, source_l2
			, source_l3
			, vendor
			, opportunities_from_leads
			, deals_from_leads
			, arr_from_leads
			, ltv_from_leads
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
	`
	, insert_spend: `
		INSERT INTO funnel_spend (
			spend_date
			, spend_type
			, source_l1
			, source_l2
			, source_l3
			, vendor
			, spend
		) VALUES (?, ?, ?, ?, ?, ?, ?);
	`
	, indexes: Object.freeze([
		`CREATE INDEX IF NOT EXISTS idx_fu_created ON funnel_uncohorted(object_created_date);`
		, `CREATE INDEX IF NOT EXISTS idx_fu_sources ON funnel_uncohorted(source_l1, source_l2, source_l3);`
		, `CREATE INDEX IF NOT EXISTS idx_fc_created ON funnel_cohorted(lead_created_date);`
		, `CREATE INDEX IF NOT EXISTS idx_fs_spend ON funnel_spend(spend_date);`
		, `CREATE INDEX IF NOT EXISTS idx_fs_sources ON funnel_spend(source_l1, source_l2, source_l3);`
	] as const)
})

/* -------------------------------------------------------------------------- */
/* Export                                                                     */
/* -------------------------------------------------------------------------- */

export function seedSpoofData(db: SqlJsDatabase, opts: SeedOptions = {}) {
	const {
		clearExisting = true
		, seed = 42
		, months = seed_window.months
		, rowsPerMonthUncohorted = 900
	} = opts

	init_tables(db, { dropExisting: clearExisting })

	const start_year = seed_window.start_year
	const start_month = seed_window.start_month
	const rng = mulberry_32(seed)

	with_tx(db, () => {
		/* funnel_uncohorted */

		let id_counter = 1

		for (let mi = 0; mi < months; mi++) {
			const { y, m } = add_months(start_year, start_month, mi)

			const season = 0.85 + 0.3 * Math.sin((mi / 12) * Math.PI * 2)
			const rows = Math.floor(rowsPerMonthUncohorted * season)

			for (let i = 0; i < rows; i++) {
				const day = 1 + Math.floor(rng() * 28)
				const created = iso_date(y, m, day)

				const { source_l1, source_l2, source_l3 } = pick_source(rng)
				const vendor = pick_vendor_for_source(rng, source_l3)
				const vertical = pick(rng, VerticalAliases)

				const lead_id = `L-${id_counter++}`
				db.run(sql_statements.insert_uncohorted, [created, lead_id, "Lead", source_l1, source_l2, source_l3, vendor, vertical, null])

				if (rng() >= SourceSeed.conversion_rates.lead_to_opp_by_l1[source_l1]) continue

				const opp_id = `O-${id_counter++}`
				const opp_day = next_stage_day(rng, day)
				const opp_created = iso_date(y, m, opp_day)

				db.run(sql_statements.insert_uncohorted, [opp_created, opp_id, "Opportunity", source_l1, source_l2, source_l3, vendor, vertical, null])

				if (rng() >= SourceSeed.conversion_rates.opp_to_deal_by_l1[source_l1]) continue

				const deal_id = `D-${id_counter++}`
				const deal_day = next_stage_day(rng, opp_day)
				const deal_created = iso_date(y, m, deal_day)

				const base = 6000 + rng() * 24000
				const big = rng() < 0.08 ? 60000 + rng() * 120000 : 0
				const lift = SourceSeed.arr_lift_by_l2[source_l2] ?? 1
				const arr = Math.round(((base + big) * lift) / 100) * 100

				db.run(sql_statements.insert_uncohorted, [deal_created, deal_id, "Deal", source_l1, source_l2, source_l3, vendor, vertical, arr])
			}
		}

		/* funnel_cohorted */

		let cohort_lead_counter = 1

		for (let mi = 0; mi < months; mi++) {
			const { y, m } = add_months(start_year, start_month, mi)
			const cohort_rows = Math.floor(rowsPerMonthUncohorted * 0.25)

			for (let i = 0; i < cohort_rows; i++) {
				const day = 1 + Math.floor(rng() * 28)
				const lead_created_date = iso_date(y, m, day)

				const { source_l1, source_l2, source_l3 } = pick_source(rng)
				const vendor = pick_vendor_for_source(rng, source_l3)

				const lead_id = `CL-${cohort_lead_counter++}`

				const opp_rate = SourceSeed.conversion_rates.cohort_opp_rate_by_l1[source_l1]
				const deal_given_opp = SourceSeed.conversion_rates.cohort_deal_given_opp_by_l1[source_l1]

				const opps = rng() < opp_rate ? 1 : 0
				const deals = opps > 0 && rng() < deal_given_opp ? 1 : 0

				const base_arr = 8000 + rng() * 32000
				const big_arr = rng() < 0.06 ? 80000 + rng() * 100000 : 0
				const lift = SourceSeed.arr_lift_by_l2[source_l2] ?? 1
				const arr_from_leads = deals > 0 ? Math.round(((base_arr + big_arr) * lift) / 100) * 100 : 0
				const ltv_multiplier = 2.4 + rng() * 2.2
				const ltv_from_leads = deals > 0 ? Math.round((arr_from_leads * ltv_multiplier) / 100) * 100 : 0

				db.run(sql_statements.insert_cohorted, [
					lead_created_date
					, lead_id
					, source_l1
					, source_l2
					, source_l3
					, vendor
					, opps
					, deals
					, arr_from_leads
					, ltv_from_leads
				])
			}
		}

		/* funnel_spend */

		const insert_spend_row = (spend_date: string) => {
			const { source_l1, source_l2, source_l3, spend_type } = pick_spend_row(rng)
			const vendor = pick_vendor_for_source(rng, source_l3)

			const channel_multiplier = SourceSeed.spend_multiplier_by_l1[source_l1]
			const l2_multiplier = SourceSeed.spend_multiplier_by_l2[source_l2] ?? 1
			const type_multiplier = SourceSeed.spend_multiplier_by_spend_type[spend_type]

			const spend = Math.round((500 + rng() * 6000) * channel_multiplier * l2_multiplier * type_multiplier)
			db.run(sql_statements.insert_spend, [spend_date, spend_type, source_l1, source_l2, source_l3, vendor, spend])
		}
		const insert_spend_row_for_source = (spend_date: string, source_l3: SourceL3, spend_type: SpendId) => {
			const source = spend_candidates.find((r) => r.source_l3 === source_l3)
			if (!source) return

			const allowed_spend_types = SpendBySourceL3[source_l3] ?? []
			if (!allowed_spend_types.includes(spend_type)) return

			const source_l1 = source.source_l1 as SourceL1
			const source_l2 = source.source_l2 as SourceL2
			const vendor = pick_vendor_for_source(rng, source_l3)

			const channel_multiplier = SourceSeed.spend_multiplier_by_l1[source_l1]
			const l2_multiplier = SourceSeed.spend_multiplier_by_l2[source_l2] ?? 1
			const type_multiplier = SourceSeed.spend_multiplier_by_spend_type[spend_type]

			const spend = Math.round((500 + rng() * 6000) * channel_multiplier * l2_multiplier * type_multiplier)
			db.run(sql_statements.insert_spend, [spend_date, spend_type, source_l1, source_l2, source_l3, vendor, spend])
		}

		for (let mi = 0; mi < months; mi++) {
			const { y, m } = add_months(start_year, start_month, mi)
			const spend_days = 28
			const spend_rows_per_day = 2
			const spend_extra_rows = 4

			for (let day = 1; day <= spend_days; day++) {
				const spend_date = iso_date(y, m, day)
				for (let i = 0; i < spend_rows_per_day; i++) {
					insert_spend_row(spend_date)
				}
			}

			for (let i = 0; i < spend_extra_rows; i++) {
				const spend_date = iso_date(y, m, 1 + Math.floor(rng() * spend_days))
				insert_spend_row(spend_date)
			}

			const local_events_spend_date = iso_date(y, m, 1 + Math.floor(rng() * spend_days))
			insert_spend_row_for_source(local_events_spend_date, "Local Events", "performance")
		}
	})

	for (const stmt of sql_statements.indexes) db.run(stmt)
}


