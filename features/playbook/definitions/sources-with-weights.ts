/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import { Sources, type SourceL1, type SourceL2 } from "./sources"
import { SpendIds, type SpendId } from "./spend"

/* -------------------------------------------------------------------------- */
/* Definition: Source weights                                                 */
/* -------------------------------------------------------------------------- */

export const SourceL1Weights = Object.freeze({
	Inbound: 0.7,
	Outbound: 0.3,
} satisfies Record<SourceL1, number>)

const source_l2_weight_overrides: Partial<Record<SourceL2, number>> = Object.freeze({
	Direct: 1.25,
	Email: 1.05,
	Events: 1.05,
	Organic: 1.15,
	Paid: 1.1,
	Partners: 1.05,
	"Product Led Growth": 0.95,
	Referral: 1.05,
	Prospecting: 1.1,
	"Purchased Data": 1,
	"Target Accounts": 1.05,
})

const source_l2_values = Object.freeze(Array.from(new Set(Sources.map((source) => source.source_l2))) as readonly SourceL2[])

export const SourceL2Weights = Object.freeze(
	source_l2_values.reduce<Record<SourceL2, number>>((acc, source_l2) => {
		acc[source_l2] = source_l2_weight_overrides[source_l2] ?? 1
		return acc
	}, {} as Record<SourceL2, number>)
)

/* -------------------------------------------------------------------------- */
/* Definition: Seed defaults                                                  */
/* -------------------------------------------------------------------------- */

export type SourceSeedDefinition = Readonly<{
	conversion_rates: Readonly<{
		lead_to_opp_by_l1: Readonly<Record<SourceL1, number>>
		opp_to_deal_by_l1: Readonly<Record<SourceL1, number>>
		cohort_opp_rate_by_l1: Readonly<Record<SourceL1, number>>
		cohort_deal_given_opp_by_l1: Readonly<Record<SourceL1, number>>
	}>
	arr_lift_by_l2: Readonly<Partial<Record<SourceL2, number>>>
	spend_multiplier_by_l1: Readonly<Record<SourceL1, number>>
	spend_multiplier_by_l2: Readonly<Partial<Record<SourceL2, number>>>
	spend_multiplier_by_spend_type: Readonly<Record<SpendId, number>>
}>

export const SourceSeed: SourceSeedDefinition = Object.freeze({
	conversion_rates: Object.freeze({
		lead_to_opp_by_l1: Object.freeze({
			Inbound: 0.22,
			Outbound: 0.16,
		}),
		opp_to_deal_by_l1: Object.freeze({
			Inbound: 0.2,
			Outbound: 0.24,
		}),
		cohort_opp_rate_by_l1: Object.freeze({
			Inbound: 0.28,
			Outbound: 0.2,
		}),
		cohort_deal_given_opp_by_l1: Object.freeze({
			Inbound: 0.32,
			Outbound: 0.36,
		}),
	}),
	arr_lift_by_l2: Object.freeze({
		Direct: 1,
		Email: 1.02,
		Events: 1.12,
		Organic: 1.05,
		Paid: 1.08,
		Partners: 1.1,
		"Product Led Growth": 0.95,
		Referral: 1.06,
		Prospecting: 1.15,
		"Purchased Data": 1.05,
		"Target Accounts": 1.22,
	} satisfies Partial<Record<SourceL2, number>>),
	spend_multiplier_by_l1: Object.freeze({
		Inbound: 1.15,
		Outbound: 0.85,
	}),
	spend_multiplier_by_l2: Object.freeze({
		Direct: 0.25,
		Email: 0.65,
		Events: 1.25,
		Organic: 0.55,
		Paid: 1.45,
		Partners: 0.75,
		"Product Led Growth": 0.7,
		Referral: 0.4,
		Prospecting: 0.8,
		"Purchased Data": 1.15,
		"Target Accounts": 1.1,
	} satisfies Partial<Record<SourceL2, number>>),
	spend_multiplier_by_spend_type: Object.freeze(Object.fromEntries(SpendIds.map((spend_id) => [spend_id, 1])) as Record<SpendId, number>),
})
