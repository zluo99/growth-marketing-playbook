/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import { getMetricDefinition, type MetricId } from "./metrics"
import { getTermByToken } from "./terms"
import { SpendById, SpendBySourceL3, SpendIds, type SpendId } from "./spend"
import { UtmSourceVendorDefinitions, UtmVendorBySource, VendorsBySourceL3 } from "./utm-source-to-vendors"
import { UtmMediumBySourceL3, UtmMediumByValue } from "./utm-medium-to-sources"
import { UtmPlacementByCompoundKey, UtmPlacementDefinitions, buildUtmPlacementKey } from "./utm-placement-to-placements"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type SourceL1 = "Inbound" | "Outbound"

export type Range = { min: number; max: number }

type BenchmarkDraft = Partial<{
  b2b_roas_range: Range
  b2b_roas_description: string
  b2c_roas_range: Range
  b2c_roas_description: string
  b2b_lead_to_deal_cvr_range: Range
  b2b_lead_to_deal_cvr_description: string
  b2c_lead_to_deal_cvr_range: Range
  b2c_lead_to_deal_cvr_description: string
}>

type SourceRowDraft = Readonly<{
  source_l1: SourceL1
  source_l2: string
  source_l3: string
  description_short: string
  description_long: string
  benchmark?: BenchmarkDraft
}>

type SourceRow = SourceRowDraft
export type SourceL2 = SourceRow["source_l2"]
export type SourceL3 = SourceRow["source_l3"]

type SourceBenchmark = Readonly<{
  source_l3: SourceL3
  b2b_roas_range: Range | null
  b2b_roas_description: string | null
  b2c_roas_range: Range | null
  b2c_roas_description: string | null
  b2b_lead_to_deal_cvr_range: Range | null
  b2b_lead_to_deal_cvr_description: string | null
  b2c_lead_to_deal_cvr_range: Range | null
  b2c_lead_to_deal_cvr_description: string | null
}>

export type UtmField = "utm_source" | "utm_medium" | "utm_campaign" | "utm_content" | "utm_term" | "utm_placement"

type UtmSourceVariant = { utm_source: string; utm_placement?: string; placement?: string; vendor?: string }

export type UtmValues = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  utm_placement?: string
  utm_medium_description?: string
  utm_source_variants?: readonly UtmSourceVariant[]
  utm_campaign_description?: string
  utm_content_description?: string
  utm_term_description?: string
  utm_placement_description?: string
  utm_placement_alias?: string
}

export type Source = {
  source_l1: SourceL1
  source_l2: SourceL2
  source_l3: SourceL3
  description_short: string
  description_long: string
  vendor: readonly string[]
  utm: UtmValues | null
  spend_ids: readonly SpendId[]
  spend_aliases: readonly string[]
  b2b_roas_range: Range | null
  b2c_roas_range: Range | null
  b2b_lead_to_deal_cvr_range: Range | null
  b2c_lead_to_deal_cvr_range: Range | null
  lines: readonly string[]
}

type SourceFieldRef = { kind: "metric"; id: MetricId } | { kind: "term"; token: string } | { kind: "text" }

type SourceFieldDef = Readonly<{
  alias: string
  description: string
  ref?: SourceFieldRef
  allowed_values?: readonly string[]
  formula?: unknown
}>

/* -------------------------------------------------------------------------- */
/* Constants: Sources                                                         */
/* -------------------------------------------------------------------------- */

const source_rows = Object.freeze([
  // Inbound / Direct
  {
    source_l1: "Inbound",
    source_l2: "Direct",
    source_l3: "Direct",
    description_short: "Visits without a reliable referrer that fall into direct traffic buckets.",
    description_long:
      "Unattributed sessions with no reliable referrer. Validate via `pageviews` and `session_duration`. Interpret shifts in the context of `attribution_window`, `identity_graph` coverage, and brand spend changes.",
    benchmark: {
      b2b_lead_to_deal_cvr_range: { min: 0.5, max: 2.0 },
      b2b_lead_to_deal_cvr_description: "Mixed intent. Improves with stronger brand demand and cleaner lead routing.",
      b2c_lead_to_deal_cvr_range: { min: 0.5, max: 1.5 },
      b2c_lead_to_deal_cvr_description: "Varies widely. Strong brand demand and lower friction lift conversion."
    }
  },
  {
    source_l1: "Inbound",
    source_l2: "Direct",
    source_l3: "Direct Mail",
    description_short: "Offline mail or gifting campaigns redeemed via QR, PURL, or codes.",
    description_long:
      "Offline mail or gifting redeemed via QR, PURL, or codes, plus `matchback` when available. Judge on `leads`, `opportunities`, `deals`, and `sales_cycle_time`, and validate incremental lift before scaling.",
    benchmark: {
      b2b_lead_to_deal_cvr_range: { min: 0.5, max: 2.0 },
      b2b_lead_to_deal_cvr_description: "Offline direct response; effectiveness depends on matchback rate and offer fit.",
      b2c_lead_to_deal_cvr_range: { min: 0.5, max: 1.5 },
      b2c_lead_to_deal_cvr_description: "Varies by offer and redemption mechanism; best with clear redemption paths and strong CTAs."
    }
  },
  {
    source_l1: "Inbound",
    source_l2: "Direct",
    source_l3: "Other & Unmapped",
    description_short: "Traffic with unmapped or inconsistent utm_medium values that needs cleanup.",
    description_long:
      "`utm_medium` is present but not mapped. Treat as a hygiene issue and fix `utms` and `ssot` before making performance calls."
  },

  // Inbound / Email
  {
    source_l1: "Inbound",
    source_l2: "Email",
    source_l3: "Email Broadcast",
    description_short: "One-to-many email sends such as newsletters, launches, and announcements.",
    description_long:
      "One to many email: newsletters, announcements, launches. Track `delivered`, `opens`, `open_rate`, `clicks`, `ctr`, `unsubscribes`, plus downstream `leads` and `lead_to_deal_cvr`. Keep `utm_campaign` and `utm_medium` consistent.",
    benchmark: {
      b2b_lead_to_deal_cvr_range: { min: 1.0, max: 4.0 },
      b2b_lead_to_deal_cvr_description: "Higher intent with segmentation and fast follow up. Often mixes expansion and awareness.",
      b2c_lead_to_deal_cvr_range: { min: 0.5, max: 2.5 },
      b2c_lead_to_deal_cvr_description: "Offer clarity and friction dominate. Strongest with targeted messaging and fast time to value."
    }
  },
  {
    source_l1: "Inbound",
    source_l2: "Email",
    source_l3: "Email Nurture",
    description_short: "Automated lifecycle email sequences for onboarding, drip, and reactivation.",
    description_long:
      "Lifecycle automation: drip and reactivation. Optimize `cvr`, `conversions`, `leads`, `opportunities_from_leads`, and monitor `unsubscribes`. Standardize `utm_medium` and `utm_campaign`.",
    benchmark: {
      b2b_lead_to_deal_cvr_range: { min: 1.0, max: 3.5 },
      b2b_lead_to_deal_cvr_description: "Improves with scoring, personalization, and fast follow up on engagement.",
      b2c_lead_to_deal_cvr_range: { min: 0.5, max: 2.0 },
      b2c_lead_to_deal_cvr_description: "Improves when messaging reduces friction and clarifies value quickly."
    }
  },

  // Inbound / Events
  {
    source_l1: "Inbound",
    source_l2: "Events",
    source_l3: "Local Events",
    description_short: "Local or regional in-person events focused on direct pipeline capture.",
    description_long:
      "Local or regional in person events. Measure `leads`, `opportunities`, `deals`, and `sales_cycle_time`. Attribute via `matchback` when possible. Validate lift with `holdout` or `geo_test` when feasible.",
    benchmark: {
      b2b_roas_range: { min: 1.0, max: 3.0 },
      b2b_roas_description: "ROAS improves when event costs are tracked cleanly and follow up converts meetings into qualified pipeline.",
      b2b_lead_to_deal_cvr_range: { min: 0.5, max: 2.0 },
      b2b_lead_to_deal_cvr_description: "Higher conversion when meetings are pre booked and qualification is consistent.",
      b2c_roas_range: { min: 1.0, max: 2.5 },
      b2c_roas_description: "ROAS depends on offer relevance, attendance quality, and speed from event interaction to purchase path.",
      b2c_lead_to_deal_cvr_range: { min: 0.5, max: 1.5 },
      b2c_lead_to_deal_cvr_description: "Event to purchase depends on the offer and immediacy of the next step."
    }
  },
  {
    source_l1: "Inbound",
    source_l2: "Events",
    source_l3: "National Events",
    description_short: "Large conferences and trade shows that influence pipeline beyond last-click credit.",
    description_long:
      "Major conferences and trade shows. Evaluate on `opportunities`, `opp_to_deal_cvr`, `deals`, and `sales_cycle_time`, not last click. Connect attendance via `matchback` when possible.",
    benchmark: {
      b2b_lead_to_deal_cvr_range: { min: 0.5, max: 2.0 },
      b2b_lead_to_deal_cvr_description: "Depends on lead capture quality, routing, and post event cadence.",
      b2c_lead_to_deal_cvr_range: { min: 0.5, max: 1.5 },
      b2c_lead_to_deal_cvr_description: "Varies. Strongest with event exclusive offers and fast follow up."
    }
  },
  {
    source_l1: "Inbound",
    source_l2: "Events",
    source_l3: "Webinars",
    description_short: "Virtual events and webinars used to educate and capture demand.",
    description_long:
      "Virtual events and webinars. Track `eligible_population`, `conversions`, `cvr`, plus `lead_to_opp_cvr` and `lead_to_deal_cvr`. Keep `utm_source` and `utm_campaign` consistent.",
    benchmark: {
      b2b_lead_to_deal_cvr_range: { min: 1.0, max: 3.0 },
      b2b_lead_to_deal_cvr_description: "Best when sales follows up on engagement signals quickly.",
      b2c_lead_to_deal_cvr_range: { min: 0.5, max: 2.0 },
      b2c_lead_to_deal_cvr_description: "Improves with a clear CTA and short time to value after attendance."
    }
  },

  // Inbound / Organic
  {
    source_l1: "Inbound",
    source_l2: "Organic",
    source_l3: "Content",
    description_short: "Owned content distribution across site and owned channels.",
    description_long:
      "Owned content distribution. Monitor `pageviews`, `session_duration`, `leads`, and `lead_to_deal_cvr`. Define inclusion rules under `ssot`.",
    benchmark: {
      b2b_lead_to_deal_cvr_range: { min: 0.5, max: 1.5 },
      b2b_lead_to_deal_cvr_description: "Often top or mid funnel. Depends on offers, gating, and nurture.",
      b2c_lead_to_deal_cvr_range: { min: 0.5, max: 1.0 },
      b2c_lead_to_deal_cvr_description: "Improves with clear product linkage and low friction conversion."
    }
  },
  {
    source_l1: "Inbound",
    source_l2: "Organic",
    source_l3: "Organic Social",
    description_short: "Unpaid social and community posts that drive reach and traffic.",
    description_long:
      "Unpaid social and community distribution. Track `reach`, `clicks`, `ctr`, plus downstream `leads`. Use `utms` to separate from dark social.",
    benchmark: {
      b2b_lead_to_deal_cvr_range: { min: 0.0, max: 1.0 },
      b2b_lead_to_deal_cvr_description: "Lower intent. Improves with clear CTAs and retargeting.",
      b2c_lead_to_deal_cvr_range: { min: 0.0, max: 0.5 },
      b2c_lead_to_deal_cvr_description: "Depends on offer and landing experience."
    }
  },
  {
    source_l1: "Inbound",
    source_l2: "Organic",
    source_l3: "PR & Earned",
    description_short: "Press coverage and earned media that bring referral traffic and backlinks.",
    description_long:
      "Earned media: press and backlinks. Validate impact with `incrementality` via `geo_test` and `matched_markets` when possible. Otherwise track `cohort` shifts in `leads`, `revenue`, and `arr_from_leads`.",
    benchmark: {
      b2b_lead_to_deal_cvr_range: { min: 0.5, max: 1.5 },
      b2b_lead_to_deal_cvr_description: "Often influence heavy. Conversion depends on landing relevance and brand strength.",
      b2c_lead_to_deal_cvr_range: { min: 0.5, max: 1.0 },
      b2c_lead_to_deal_cvr_description: "Spiky traffic. Conversion varies by fit and post click clarity."
    }
  },
  {
    source_l1: "Inbound",
    source_l2: "Organic",
    source_l3: "SEO",
    description_short: "Organic search traffic from ranking on relevant queries.",
    description_long:
      "Organic search demand capture. Evaluate `cvr`, `leads`, and `lead_to_deal_cvr`. Be consistent on `mta` rules and the `attribution_window` so credit does not drift over time.",
    benchmark: {
      b2b_lead_to_deal_cvr_range: { min: 0.5, max: 2.0 },
      b2b_lead_to_deal_cvr_description: "Varies by query mix. Improves with high intent pages and clear CTAs.",
      b2c_lead_to_deal_cvr_range: { min: 0.5, max: 1.5 },
      b2c_lead_to_deal_cvr_description: "Higher conversion on bottom funnel queries. UX and speed matter."
    }
  },

  // Inbound / Paid
  {
    source_l1: "Inbound",
    source_l2: "Paid",
    source_l3: "Paid Search",
    description_short: "Paid search campaigns capturing existing demand via CPC bidding.",
    description_long:
      "CPC demand capture. Optimize `cpc`, `ctr`, `cvr`, `cac`, and `roas`. Lower funnel intent typically drives stronger `roas`. Keep `utm_source`, `utm_term`, and `utm_campaign` consistent with a clear `attribution_window`.",
    benchmark: {
      b2b_roas_range: { min: 2.0, max: 6.0 },
      b2b_roas_description: "High intent capture. ROAS depends on brand mix, CPC inflation, and landing to routing speed.",
      b2b_lead_to_deal_cvr_range: { min: 0.5, max: 2.5 },
      b2b_lead_to_deal_cvr_description: "Strongest on bottom funnel queries. Declines as you expand to broader terms.",
      b2c_roas_range: { min: 2.0, max: 5.0 },
      b2c_roas_description: "Demand capture. ROAS driven by query intent, CPCs, and onsite conversion rate.",
      b2c_lead_to_deal_cvr_range: { min: 0.5, max: 2.0 },
      b2c_lead_to_deal_cvr_description: "Bottom funnel queries convert best. Shopping and brand terms outperform generic."
    }
  },
  {
    source_l1: "Inbound",
    source_l2: "Paid",
    source_l3: "Paid Social",
    description_short: "Paid social prospecting and retargeting across social platforms.",
    description_long:
      "Paid social prospecting and retargeting. Track `impressions`, `cpm`, `clicks`, `ctr`, `cpa`, `cac`, and `roas`. Validate with `mta` and `incrementality`.",
    benchmark: {
      b2b_roas_range: { min: 1.0, max: 3.5 },
      b2b_roas_description: "Prospecting plus retargeting blend. ROAS improves with tight ICP targeting and strong offer to landing match.",
      b2b_lead_to_deal_cvr_range: { min: 0.5, max: 1.0 },
      b2b_lead_to_deal_cvr_description: "Often mid funnel. Best when retargeting and lead qualification are disciplined.",
      b2c_roas_range: { min: 1.5, max: 4.0 },
      b2c_roas_description: "Creative driven channel. ROAS depends on creative velocity, audience fit, and site conversion rate.",
      b2c_lead_to_deal_cvr_range: { min: 0.5, max: 1.5 },
      b2c_lead_to_deal_cvr_description: "Performance varies by creative and offer. Scaling needs creative refresh and strong post click UX."
    }
  },
  {
    source_l1: "Inbound",
    source_l2: "Paid",
    source_l3: "Paid Video",
    description_short: "Paid video placements online or on CTV aimed at performance and lift.",
    description_long:
      "Paid video, including online and CTV. Validate assisted impact with `incrementality`, `geo_test`, and `matched_markets`. Track downstream `leads` and `revenue` and keep `attribution_window` rules consistent.",
    benchmark: {
      b2b_roas_range: { min: 1.0, max: 3.0 },
      b2b_roas_description: "Performance video can drive direct response. ROAS depends on creative, audience, and landing path.",
      b2b_lead_to_deal_cvr_range: { min: 0.0, max: 1.0 },
      b2b_lead_to_deal_cvr_description: "Often mid funnel. Improves when retargeting pools and conversion paths are tight.",
      b2c_roas_range: { min: 1.0, max: 3.5 },
      b2c_roas_description: "Creative first DR channel. ROAS depends on offer clarity, hook rate, and onsite conversion.",
      b2c_lead_to_deal_cvr_range: { min: 0.0, max: 1.0 },
      b2c_lead_to_deal_cvr_description: "Best when creative iteration is fast and post click experience is optimized."
    }
  },
  {
    source_l1: "Inbound",
    source_l2: "Paid",
    source_l3: "Programmatic Display",
    description_short: "Programmatic display and retargeting across web inventory.",
    description_long:
      "Programmatic display and retargeting. Track `cpm`, `ctr`, and `cvr`. Validate `roas` with a disciplined `attribution_window` because view through settings can inflate credit.",
    benchmark: {
      b2b_roas_range: { min: 1.5, max: 4.0 },
      b2b_roas_description: "Best as retargeting and ABM support. ROAS depends on audience quality, frequency control, and view through bias.",
      b2b_lead_to_deal_cvr_range: { min: 0.5, max: 1.0 },
      b2b_lead_to_deal_cvr_description: "Generally mid to low intent. Strongest with retargeting pools and clean suppression.",
      b2c_roas_range: { min: 1.0, max: 3.5 },
      b2c_roas_description: "Retargeting heavy. ROAS is sensitive to attribution settings and frequency caps.",
      b2c_lead_to_deal_cvr_range: { min: 0.0, max: 1.0 },
      b2c_lead_to_deal_cvr_description: "Works best with tight audiences and strong offers. Watch diminishing returns at high frequency."
    }
  },
  {
    source_l1: "Inbound",
    source_l2: "Paid",
    source_l3: "Review Sites",
    description_short: "Paid listings and placements on software or marketplace review sites.",
    description_long:
      "Paid marketplace and review placements. Judge on `lead_to_deal_cvr`, `cost_per_deal`, and `roas`. Validate ICP fit before scaling. Keep `utm_source` consistent so marketplace traffic stays isolated.",
    benchmark: {
      b2b_roas_range: { min: 2.0, max: 7.0 },
      b2b_roas_description: "High intent marketplace traffic. ROAS driven by category fit, profile quality, and competitive bidding.",
      b2b_lead_to_deal_cvr_range: { min: 1.0, max: 3.5 },
      b2b_lead_to_deal_cvr_description: "Often late stage. Strongest when routing is fast and leads are treated as bottom funnel.",
      b2c_roas_range: { min: 1.5, max: 5.5 },
      b2c_roas_description: "Comparable to marketplaces. ROAS depends on offer competitiveness and attribution hygiene.",
      b2c_lead_to_deal_cvr_range: { min: 0.5, max: 3.0 },
      b2c_lead_to_deal_cvr_description: "High intent when fit is good. Ensure tracking prevents last click arbitrage."
    }
  },
  {
    source_l1: "Inbound",
    source_l2: "Paid",
    source_l3: "Pay Per Lead",
    description_short: "Fixed or tiered cost-per-lead programs with partners.",
    description_long:
      "Fixed or tiered CPL programs. Monitor `cost_per_lead`, `lead_to_deal_cvr`, `opp_to_deal_cvr`, and unit economics via `cac` and `roas`. Speed to lead is a primary lever. Keep `utms` clean to avoid partner leakage.",
    benchmark: {
      b2b_roas_range: { min: 1.0, max: 3.5 },
      b2b_roas_description: "ROAS depends on qualification rigor, lead routing speed, and partner quality.",
      b2b_lead_to_deal_cvr_range: { min: 0.5, max: 2.0 },
      b2b_lead_to_deal_cvr_description: "Varies by partner and filters. Watch duplicates and low intent submissions.",
      b2c_roas_range: { min: 1.0, max: 3.0 },
      b2c_roas_description: "Depends on partner quality, offer fit, and conversion flow."
    }
  },

  // Inbound / Partners
  {
    source_l1: "Inbound",
    source_l2: "Partners",
    source_l3: "Affiliates",
    description_short: "Performance-based affiliate partners paid on conversions.",
    description_long:
      "Performance payout affiliates. Optimize `cpa`, `cac`, and `roas`. Require `utm_source` and `utm_campaign` to prevent channel leakage.",
    benchmark: {
      b2b_roas_range: { min: 2.0, max: 6.0 },
      b2b_roas_description: "Performance aligned when payouts track conversions. ROAS depends on partner quality and incremental mix.",
      b2b_lead_to_deal_cvr_range: { min: 1.0, max: 3.0 },
      b2b_lead_to_deal_cvr_description: "Quality depends on partner ICP overlap and enablement.",
      b2c_roas_range: { min: 1.5, max: 4.5 },
      b2c_roas_description: "Efficient when audiences align. ROAS is sensitive to attribution windows and coupon or last click behavior.",
      b2c_lead_to_deal_cvr_range: { min: 0.5, max: 2.0 },
      b2c_lead_to_deal_cvr_description: "Best with clean rules, suppression, and clear handoffs."
    }
  },
  {
    source_l1: "Inbound",
    source_l2: "Partners",
    source_l3: "Co-marketing",
    description_short: "Partnered co-marketing campaigns run jointly with another brand.",
    description_long:
      "Partner co marketing. Measure `leads`, `opportunities_from_leads`, and `lead_to_deal_cvr`. Align on shared `utm` and `kpis`.",
    benchmark: {
      b2b_lead_to_deal_cvr_range: { min: 1.0, max: 3.0 },
      b2b_lead_to_deal_cvr_description: "Quality depends on partner ICP overlap and enablement.",
      b2c_lead_to_deal_cvr_range: { min: 0.5, max: 2.0 },
      b2c_lead_to_deal_cvr_description: "Best with clear handoffs and attribution hygiene."
    }
  },
  {
    source_l1: "Inbound",
    source_l2: "Partners",
    source_l3: "Integrations",
    description_short: "Marketplace listings and integration-driven referrals.",
    description_long:
      "Integration marketplaces, listings, and referrals. Track `cvr`, `leads`, `lead_to_opp_cvr`, and `lead_to_deal_cvr`. Connect product to CRM via `identity_graph`.",
    benchmark: {
      b2b_lead_to_deal_cvr_range: { min: 1.0, max: 3.0 },
      b2b_lead_to_deal_cvr_description: "Quality depends on ICP overlap and partner enablement.",
      b2c_lead_to_deal_cvr_range: { min: 0.5, max: 2.0 },
      b2c_lead_to_deal_cvr_description: "Best with clear handoffs and measurement hygiene."
    }
  },
  {
    source_l1: "Inbound",
    source_l2: "Partners",
    source_l3: "Resellers",
    description_short: "Channel partners and resellers sourcing deals.",
    description_long:
      "Channel and reseller sourced. Attribute through CRM linkage and evaluate `opportunities`, `opp_to_deal_cvr`, `deals`, and `sales_cycle_time`.",
    benchmark: {
      b2b_lead_to_deal_cvr_range: { min: 1.0, max: 3.0 },
      b2b_lead_to_deal_cvr_description: "Depends on partner sourced lead quality and sales process alignment.",
      b2c_lead_to_deal_cvr_range: { min: 0.5, max: 2.0 },
      b2c_lead_to_deal_cvr_description: "Depends on partner quality and end customer experience."
    }
  },

  // Inbound / Product Led Growth
  {
    source_l1: "Inbound",
    source_l2: "Product Led Growth",
    source_l3: "PLG In-app",
    description_short: "In-product prompts and surfaces that convert users or expand accounts.",
    description_long:
      "In product surfaces driving conversion and expansion. Use `identity_graph` to map to CRM and judge on `arr` and `revenue`, with `cohort` analysis to separate lift from seasonality.",
    benchmark: {
      b2b_roas_range: { min: 3.0, max: 10.0 },
      b2b_roas_description: "When costs are measurable, ROAS depends on activation to revenue lift and incremental upgrades.",
      b2b_lead_to_deal_cvr_range: { min: 0.5, max: 2.0 },
      b2b_lead_to_deal_cvr_description: "Depends on activation to sales handoff and product qualification.",
      b2c_roas_range: { min: 2.5, max: 9.0 },
      b2c_roas_description: "ROAS depends on activation lift and upgrade propensity. Validate with retention cohorts and incremental upgrades.",
      b2c_lead_to_deal_cvr_range: { min: 0.5, max: 1.5 },
      b2c_lead_to_deal_cvr_description: "Improves with onboarding and in product conversion surfaces."
    }
  },
  {
    source_l1: "Inbound",
    source_l2: "Product Led Growth",
    source_l3: "PLG Acquisition",
    description_short: "Self-serve signups and trials driven by product-led acquisition.",
    description_long:
      "Self serve signup and trial starts. Attribute via `utm` when present plus `identity_graph` stitching. Track `conversions`, `cvr`, `leads`, and downstream outcomes.",
    benchmark: {
      b2b_roas_range: { min: 3.0, max: 10.0 },
      b2b_roas_description: "ROAS hinges on signup to activation and assisted conversion. Validate with experiments when possible.",
      b2b_lead_to_deal_cvr_range: { min: 0.5, max: 2.0 },
      b2b_lead_to_deal_cvr_description: "Depends on activation quality and SDR follow up on product signals.",
      b2c_roas_range: { min: 2.5, max: 9.0 },
      b2c_roas_description: "ROAS driven by conversion rate improvements and downstream paid conversion.",
      b2c_lead_to_deal_cvr_range: { min: 0.5, max: 1.5 },
      b2c_lead_to_deal_cvr_description: "Improves with short paths to value and strong conversion prompts."
    }
  },
  {
    source_l1: "Inbound",
    source_l2: "Product Led Growth",
    source_l3: "PLG Upgrade",
    description_short: "Self-serve upgrades from free to paid without sales touch.",
    description_long:
      "Free to paid upgrades without sales touch. Measure `arr`, `revenue`, and `payback`. Analyze by `cohort` to separate lift from seasonality.",
    benchmark: {
      b2b_roas_range: { min: 3.0, max: 10.0 },
      b2b_roas_description: "ROAS driven by incremental upgrades from packaging, pricing, and in product prompts. Validate with A/B tests and cohorts.",
      b2b_lead_to_deal_cvr_range: { min: 0.5, max: 2.0 },
      b2b_lead_to_deal_cvr_description: "Depends on upgrade triggers and how sales assist is routed.",
      b2c_roas_range: { min: 2.5, max: 9.0 },
      b2c_roas_description: "ROAS depends on incremental upgrades and retention impact.",
      b2c_lead_to_deal_cvr_range: { min: 0.5, max: 1.5 },
      b2c_lead_to_deal_cvr_description: "Improves with clear upgrade prompts and minimal friction."
    }
  },

  // Inbound / Referral
  {
    source_l1: "Inbound",
    source_l2: "Referral",
    source_l3: "Customer Referral",
    description_short: "Customer-led referral programs that encourage invites.",
    description_long:
      "Customer driven referrals via program or tracked invites. Evaluate `lead_to_deal_cvr` and `opp_to_deal_cvr`, plus longer term `ltv` using `identity_graph` stitching.",
    benchmark: {
      b2b_lead_to_deal_cvr_range: { min: 1.5, max: 5.0 },
      b2b_lead_to_deal_cvr_description: "Trust transfer increases qualification and close rates.",
      b2c_lead_to_deal_cvr_range: { min: 1.0, max: 3.5 },
      b2c_lead_to_deal_cvr_description: "Strong with real advocacy loops. Avoid promo arbitrage."
    }
  },
  {
    source_l1: "Inbound",
    source_l2: "Referral",
    source_l3: "Employee Referral",
    description_short: "Employee introductions and referrals into pipeline.",
    description_long:
      "Employee introductions and referrals. Compare `opportunities`, `deals`, and `sales_cycle_time` versus other channels. Use `identity_graph` when stitching is needed.",
    benchmark: {
      b2b_lead_to_deal_cvr_range: { min: 1.0, max: 4.5 },
      b2b_lead_to_deal_cvr_description: "Often high quality. Volume is limited by network size and enablement.",
      b2c_lead_to_deal_cvr_range: { min: 1.0, max: 3.0 },
      b2c_lead_to_deal_cvr_description: "Works when sharing is authentic and the offer is simple."
    }
  },

  // Outbound / Prospecting
  {
    source_l1: "Outbound",
    source_l2: "Prospecting",
    source_l3: "Outbound Call",
    description_short: "Phone outreach and dialer-driven prospecting to target accounts.",
    description_long:
      "Phone and dialer outreach to new or target prospects. Attribute via CRM dispositions and judge on `opportunities`, `deals`, and `opp_to_deal_cvr`.",
    benchmark: {
      b2b_lead_to_deal_cvr_range: { min: 0.0, max: 1.0 },
      b2b_lead_to_deal_cvr_description: "Cold channel. Depends on ICP targeting and message market fit."
    }
  },
  {
    source_l1: "Outbound",
    source_l2: "Prospecting",
    source_l3: "Outbound Email",
    description_short: "Cold outbound email sequences to prospects.",
    description_long:
      "Cold outbound email sequences. Monitor `delivered`, `opens`, `open_rate`, and `clicks`, but judge on outcomes: `opportunities`, `deals`, and `opp_to_deal_cvr`.",
    benchmark: {
      b2b_lead_to_deal_cvr_range: { min: 0.0, max: 1.0 },
      b2b_lead_to_deal_cvr_description: "Depends on ICP targeting and message market fit. Routing matters."
    }
  },
  {
    source_l1: "Outbound",
    source_l2: "Prospecting",
    source_l3: "Outbound SMS",
    description_short: "Cold or warm SMS outreach inside prospecting sequences.",
    description_long:
      "Cold and warm SMS in prospecting sequences. Attribute via platform plus CRM outcomes. Use shortlinks and `utms` when clicks exist. Judge on `opportunities` and `deals`.",
    benchmark: {
      b2b_lead_to_deal_cvr_range: { min: 0.0, max: 1.0 },
      b2b_lead_to_deal_cvr_description: "Depends on deliverability, consent hygiene, and offer fit."
    }
  },
  {
    source_l1: "Outbound",
    source_l2: "Prospecting",
    source_l3: "Outbound Social DM",
    description_short: "Manual outbound DMs and social comments for prospecting.",
    description_long:
      "Manual outbound DMs and comments. Attribute via logged outreach plus CRM, and use `utms` when driving clicks. Judge on `opportunities` and `deals`.",
    benchmark: {
      b2b_lead_to_deal_cvr_range: { min: 0.0, max: 1.0 },
      b2b_lead_to_deal_cvr_description: "Depends on ICP, offer, and multi touch orchestration."
    }
  },
  {
    source_l1: "Outbound",
    source_l2: "Prospecting",
    source_l3: "Outbound Walk-In",
    description_short: "In-person walk-in outreach to local prospects.",
    description_long:
      "In person walk in outreach. Attribute via logged visits and CRM. Use QR, PURL, and `utms` for follow ups. Judge on `opportunities`, `deals`, and `sales_cycle_time`.",
    benchmark: {
      b2b_lead_to_deal_cvr_range: { min: 0.0, max: 1.0 },
      b2b_lead_to_deal_cvr_description: "Highly variable. Depends on location targeting, offer relevance, and fast follow up."
    }
  },

  // Outbound / Purchased Data
  {
    source_l1: "Outbound",
    source_l2: "Purchased Data",
    source_l3: "Data Signals",
    description_short: "Purchased intent or enrichment signals used to prioritize outreach.",
    description_long:
      "Purchased intent and enrichment signals used to prioritize outreach. Not a delivery channel. Measure lift versus a `control_group` using `opportunities` and `deals`, and use `treatment_group` when possible.",
    benchmark: {
      b2b_lead_to_deal_cvr_range: { min: 0.0, max: 0.5 },
      b2b_lead_to_deal_cvr_description: "Improves when intent is routed quickly and paired with relevant messaging."
    }
  },
  {
    source_l1: "Outbound",
    source_l2: "Purchased Data",
    source_l3: "Purchased Lists",
    description_short: "Purchased contact lists used for outbound campaigns.",
    description_long:
      "Purchased lists used for outreach. Judge on `lead_to_opp_cvr`, `opp_to_deal_cvr`, `cost_per_opportunity`, and unit economics via `cac` and `roas`, with consent and compliance hygiene. Selectivity matters due to overhead.",
    benchmark: {
      b2b_roas_range: { min: 1.0, max: 2.5 },
      b2b_roas_description: "Usually low efficiency. ROAS depends on list verification, ICP fit, deliverability, and fast routing.",
      b2b_lead_to_deal_cvr_range: { min: 0.0, max: 0.5 },
      b2b_lead_to_deal_cvr_description: "Cold and low intent. Improves with enrichment, segmentation, and tight messaging.",
      b2c_roas_range: { min: 0.5, max: 2.0 },
      b2c_roas_description: "Rare in B2C and riskier. ROAS depends on compliance, list quality, and offer market fit."
    }
  },

  // Outbound / Target Accounts
  {
    source_l1: "Outbound",
    source_l2: "Target Accounts",
    source_l3: "ABM Orchestration",
    description_short: "High-touch ABM outreach and orchestrated touches for named accounts.",
    description_long:
      "Human led 1:1 or exec led ABM touches for named accounts. Attribute at the account level via logged touches and matchback. Judge on `opportunities`, `deals`, and `sales_cycle_time`.",
    benchmark: {
      b2b_lead_to_deal_cvr_range: { min: 0.5, max: 2.5 },
      b2b_lead_to_deal_cvr_description: "Higher ACV accounts close at lower rates but higher value. Orchestration matters."
    }
  },
  {
    source_l1: "Outbound",
    source_l2: "Target Accounts",
    source_l3: "ABM Advertising",
    description_short: "Paid ads targeted to named accounts or account lists.",
    description_long:
      "Paid ads targeted to named accounts. Attribute with `utms` plus account matching. Judge on `opportunities`, `deals`, and `roas`, with fast follow up on engagement.",
    benchmark: {
      b2b_roas_range: { min: 1.0, max: 3.5 },
      b2b_roas_description: "ROAS depends on account selection, audience quality, and sales follow up velocity.",
      b2b_lead_to_deal_cvr_range: { min: 0.5, max: 2.0 },
      b2b_lead_to_deal_cvr_description: "Best when engagement signals trigger follow up and meetings.",
      b2c_roas_range: { min: 1.0, max: 3.0 },
      b2c_roas_description: "Rare in B2C; ROAS depends on targeting and offer fit. Treat as experimental when present."
    }
  }
] as const satisfies readonly SourceRowDraft[])

/* -------------------------------------------------------------------------- */
/* Definition: Benchmarks                                                     */
/* -------------------------------------------------------------------------- */

const to_benchmark = (r: SourceRow): SourceBenchmark => {
  const b = r.benchmark as BenchmarkDraft | undefined
  return Object.freeze({
    source_l3: r.source_l3 as SourceL3,
    b2b_roas_range: b?.b2b_roas_range ?? null,
    b2b_roas_description: b?.b2b_roas_description ?? null,
    b2c_roas_range: b?.b2c_roas_range ?? null,
    b2c_roas_description: b?.b2c_roas_description ?? null,
    b2b_lead_to_deal_cvr_range: b?.b2b_lead_to_deal_cvr_range ?? null,
    b2b_lead_to_deal_cvr_description: b?.b2b_lead_to_deal_cvr_description ?? null,
    b2c_lead_to_deal_cvr_range: b?.b2c_lead_to_deal_cvr_range ?? null,
    b2c_lead_to_deal_cvr_description: b?.b2c_lead_to_deal_cvr_description ?? null
  })
}

export const BenchmarksBySourceL3: Readonly<Record<SourceL3, SourceBenchmark>> = Object.freeze(
  source_rows.reduce((acc, r) => {
    acc[r.source_l3 as SourceL3] = to_benchmark(r)
    return acc
  }, {} as Record<SourceL3, SourceBenchmark>)
)

/* -------------------------------------------------------------------------- */
/* Definition: UTMs                                                           */
/* -------------------------------------------------------------------------- */

const utm_placeholder_tips = Object.freeze({
  campaign:
    "Use a consistent campaign slug: channel_objective_audience_geo_date (or similar). Lowercase, underscores, no spaces. Include offer or test id when useful.",
  content:
    "Use a creative or unit identifier: asset slug and variant (e.g., video_15s_v3 or headline_b). Lowercase with underscores.",
  term:
    "Use a keyword or audience token. For search, keep {keyword}. For paid social and display, use an audience or segment slug. Lowercase with underscores."
})

const utm_term_source_l3 = new Set<SourceL3>(["Paid Search", "Paid Social", "SEO"])

const utm_campaign_source_l3 = new Set<SourceL3>([
  "Email Broadcast",
  "Email Nurture",
  "Local Events",
  "National Events",
  "Webinars",
  "Content",
  "Organic Social",
  "PR & Earned",
  "SEO",
  "Paid Search",
  "Paid Social",
  "Paid Video",
  "Programmatic Display",
  "Review Sites",
  "Pay Per Lead",
  "Affiliates",
  "Co-marketing",
  "Integrations",
  "Resellers",
  "PLG In-app",
  "PLG Acquisition",
  "PLG Upgrade",
  "Customer Referral",
  "Employee Referral",
  "Outbound Email",
  "Outbound Social DM",
  "ABM Orchestration",
  "ABM Advertising"
])

const utm_content_source_l3 = new Set<SourceL3>([
  "Email Broadcast",
  "Email Nurture",
  "Webinars",
  "Content",
  "Organic Social",
  "SEO",
  "Paid Search",
  "Paid Social",
  "Paid Video",
  "Programmatic Display",
  "Review Sites",
  "Pay Per Lead",
  "Affiliates",
  "Co-marketing",
  "Outbound Email",
  "Outbound Social DM",
  "ABM Advertising"
])

const vendor_rows_by_source_l3 = Object.freeze(
  UtmSourceVendorDefinitions.reduce((acc, r) => {
    for (const source_l3 of r.source_l3) acc[source_l3] = Object.freeze([...(acc[source_l3] ?? []), r])
    return acc
  }, {} as Record<SourceL3, readonly (typeof UtmSourceVendorDefinitions)[number][]>)
)

const placements_by_utm_source = Object.freeze(
  Object.entries(
    UtmPlacementDefinitions.reduce((acc, r) => {
      ;(acc[r.utm_source] ??= []).push(r)
      return acc
    }, {} as Record<string, (typeof UtmPlacementDefinitions)[number][]>)
  ).reduce((acc, [utm_source, rows]) => {
    acc[utm_source] = Object.freeze(rows)
    return acc
  }, {} as Record<string, readonly (typeof UtmPlacementDefinitions)[number][]>)
)

const non_aliased_placements_by_utm_source = Object.freeze(
  Object.entries(placements_by_utm_source).reduce((acc, [utm_source, rows]) => {
    acc[utm_source] = Object.freeze(rows.filter((p) => String(p.utm_placement) !== String(p.utm_source)))
    return acc
  }, {} as Record<string, readonly (typeof UtmPlacementDefinitions)[number][]>)
)

const build_utm_defaults_for_source = (source_l3: SourceL3): UtmValues | null => {
  const utm_medium = UtmMediumBySourceL3[source_l3]
  if (!utm_medium) return null

  const medium_meta = UtmMediumByValue[utm_medium]
  const vendorRows = vendor_rows_by_source_l3[source_l3] ?? []
  const placementRows = vendorRows.flatMap((v) => non_aliased_placements_by_utm_source[v.utm_source] ?? [])

  const firstPlacement = placementRows[0]
  const utm_source = firstPlacement?.utm_source ?? vendorRows[0]?.utm_source ?? "(empty)"
  const utm_placement = firstPlacement?.utm_placement
  const utm_placement_alias = firstPlacement?.placement ?? utm_placement

  const utm_term = utm_term_source_l3.has(source_l3) ? "{term}" : undefined
  const utm_campaign = utm_campaign_source_l3.has(source_l3) ? "{campaign}" : undefined
  const utm_content = utm_content_source_l3.has(source_l3) ? "{content}" : undefined

  const utm_source_variants: UtmSourceVariant[] = []
  for (const v of vendorRows) {
    const placementsForVendor = non_aliased_placements_by_utm_source[v.utm_source] ?? []
    if (placementsForVendor.length === 0) {
      utm_source_variants.push({ utm_source: v.utm_source, vendor: v.vendor })
      continue
    }
    for (const p of placementsForVendor)
      utm_source_variants.push({
        utm_source: p.utm_source,
        utm_placement: p.utm_placement,
        placement: p.placement,
        vendor: v.vendor
      })
  }

  return Object.freeze({
    utm_source,
    utm_medium,
    ...(utm_campaign ? { utm_campaign } : {}),
    ...(utm_campaign ? { utm_campaign_description: utm_placeholder_tips.campaign } : {}),
    ...(utm_content ? { utm_content } : {}),
    ...(utm_content ? { utm_content_description: utm_placeholder_tips.content } : {}),
    ...(utm_term ? { utm_term } : {}),
    ...(utm_term ? { utm_term_description: utm_placeholder_tips.term } : {}),
    ...(utm_placement ? { utm_placement } : {}),
    ...(utm_placement_alias ? { utm_placement_alias } : {}),
    ...(medium_meta?.description ? { utm_medium_description: medium_meta.description } : {}),
    ...(utm_source_variants.length ? { utm_source_variants } : {})
  })
}

const UtmsBySourceL3: Readonly<Record<SourceL3, UtmValues | null>> = Object.freeze(
  source_rows.reduce((acc, r) => {
    const source_l3 = r.source_l3 as SourceL3
    acc[source_l3] = build_utm_defaults_for_source(source_l3)
    return acc
  }, {} as Record<SourceL3, UtmValues | null>)
)

export { VendorsBySourceL3 }

/* -------------------------------------------------------------------------- */
/* Constants: Source fields                                                   */
/* -------------------------------------------------------------------------- */

const build_metric_field = (id: MetricId): SourceFieldDef => {
  const { alias, description, formula } = getMetricDefinition(id)
  return Object.freeze({ alias, description, ref: { kind: "metric", id } as const, ...(formula ? { formula } : {}) })
}

const build_term_field = (token: string): SourceFieldDef => {
  const t = getTermByToken(token)
  return Object.freeze({
    alias: t?.alias ?? token,
    description: t?.description ?? "",
    ref: { kind: "term", token } as const
  })
}

const roas_def = getMetricDefinition("roas")
const lead_to_deal_cvr_def = getMetricDefinition("lead_to_deal_cvr")

export const SourceFieldDefinitions = {
  source: build_metric_field("source"),
  source_l1: build_metric_field("source_l1"),
  source_l2: build_metric_field("source_l2"),
  source_l3: build_metric_field("source_l3"),
  description: build_term_field("source_description"),
  vendor: build_metric_field("vendor"),
  utm: build_term_field("utm"),
  spend_ids: Object.freeze({ ...build_metric_field("spend_type"), allowed_values: SpendIds }),
  b2b_roas_range: Object.freeze({ ...build_metric_field("roas"), alias: `B2B ${roas_def.alias}` }),
  b2c_roas_range: Object.freeze({ ...build_metric_field("roas"), alias: `B2C ${roas_def.alias}` }),
  b2b_lead_to_deal_cvr_range: Object.freeze({ ...build_metric_field("lead_to_deal_cvr"), alias: `B2B ${lead_to_deal_cvr_def.alias}` }),
  b2c_lead_to_deal_cvr_range: Object.freeze({ ...build_metric_field("lead_to_deal_cvr"), alias: `B2C ${lead_to_deal_cvr_def.alias}` })
} as const

export type SourceFieldId = keyof typeof SourceFieldDefinitions

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const format_range_text = (v: Range | null, suffix: string) => (v ? `${String(v.min)}-${String(v.max)}${suffix}` : null)

const summarize_segment_benchmark_line = (
  label: "b2b" | "b2c",
  roas_range: Range | null,
  roas_desc: string | null,
  cvr_range: Range | null,
  cvr_desc: string | null
) => {
  const parts: string[] = []
  const roas = format_range_text(roas_range, "x")
  if (roas) parts.push(`roas ${roas}${roas_desc?.trim() ? ` (${roas_desc.trim()})` : ""}`)
  const cvr = format_range_text(cvr_range, "%")
  if (cvr) parts.push(`lead->deal ${cvr}${cvr_desc?.trim() ? ` (${cvr_desc.trim()})` : ""}`)
  return parts.length ? `${label}: ${parts.join(" | ")}` : `${label}: n/a`
}

const build_source_lines = (r: SourceRow, benchmark: SourceBenchmark | null) =>
  Object.freeze([
    `${r.source_l1} / ${r.source_l2} / ${r.source_l3}`,
    `\tdescription: ${r.description_long}`,
    `\tbenchmark:`,
    `\t\t${summarize_segment_benchmark_line(
      "b2b",
      benchmark?.b2b_roas_range ?? null,
      benchmark?.b2b_roas_description ?? null,
      benchmark?.b2b_lead_to_deal_cvr_range ?? null,
      benchmark?.b2b_lead_to_deal_cvr_description ?? null
    )}`,
    `\t\t${summarize_segment_benchmark_line(
      "b2c",
      benchmark?.b2c_roas_range ?? null,
      benchmark?.b2c_roas_description ?? null,
      benchmark?.b2c_lead_to_deal_cvr_range ?? null,
      benchmark?.b2c_lead_to_deal_cvr_description ?? null
    )}`
  ])

/* -------------------------------------------------------------------------- */
/* Constants: Enriched sources taxonomy                                       */
/* -------------------------------------------------------------------------- */

export const Sources: readonly Source[] = source_rows.map((r): Source => {
  const source_l3 = r.source_l3 as SourceL3
  const spend_ids = SpendBySourceL3[source_l3] ?? []
  const spend_aliases = spend_ids.map((id) => SpendById[id].alias)
  const utm = UtmsBySourceL3[source_l3] ?? null
  const benchmark = BenchmarksBySourceL3[source_l3] ?? null

  return Object.freeze({
    source_l1: r.source_l1,
    source_l2: r.source_l2 as SourceL2,
    source_l3,
    description_short: r.description_short,
    description_long: r.description_long,
    spend_ids: Object.freeze(spend_ids),
    spend_aliases: Object.freeze(spend_aliases),
    vendor: VendorsBySourceL3[source_l3] ?? [],
    utm,
    b2b_roas_range: benchmark?.b2b_roas_range ?? null,
    b2c_roas_range: benchmark?.b2c_roas_range ?? null,
    b2b_lead_to_deal_cvr_range: benchmark?.b2b_lead_to_deal_cvr_range ?? null,
    b2c_lead_to_deal_cvr_range: benchmark?.b2c_lead_to_deal_cvr_range ?? null,
    lines: build_source_lines(r, benchmark)
  })
})

/* -------------------------------------------------------------------------- */
/* Utils                                                                      */
/* -------------------------------------------------------------------------- */

export const listSources = () => Sources

/* -------------------------------------------------------------------------- */
/* Custom: dev checks                                                         */
/* -------------------------------------------------------------------------- */

if (process.env.NODE_ENV !== "production") {
  const assert_range = (label: string, v: Range | null) => {
    if (!v) return
    if (!(Number.isFinite(v.min) && Number.isFinite(v.max))) console.warn(`[definitions] invalid ${label}: non-finite`, v)
    if (v.min < 0 || v.max < 0) console.warn(`[definitions] invalid ${label}: negative`, v)
    if (v.min > v.max) console.warn(`[definitions] invalid ${label}: min > max`, v)
  }

  const is_performance_source = (source_l3: SourceL3) => (SpendBySourceL3[source_l3] ?? []).includes("performance")

  const lead_to_deal_cvr_exceptions = new Set<SourceL3>(["Other & Unmapped"])

  for (const b of Object.values(BenchmarksBySourceL3)) {
    assert_range(`${b.source_l3} b2b_roas_range`, b.b2b_roas_range)
    assert_range(`${b.source_l3} b2c_roas_range`, b.b2c_roas_range)
    assert_range(`${b.source_l3} b2b_lead_to_deal_cvr_range`, b.b2b_lead_to_deal_cvr_range)
    assert_range(`${b.source_l3} b2c_lead_to_deal_cvr_range`, b.b2c_lead_to_deal_cvr_range)

    const perf = is_performance_source(b.source_l3)
    if (perf) {
      if (!b.b2b_roas_range || !b.b2b_roas_description) console.warn("[definitions] missing b2b roas for performance source:", b.source_l3)
      if (!b.b2c_roas_range || !b.b2c_roas_description) console.warn("[definitions] missing b2c roas for performance source:", b.source_l3)
    } else {
      if (b.b2b_roas_range || b.b2b_roas_description) console.warn("[definitions] roas must be null for non-performance source:", b.source_l3, "b2b")
      if (b.b2c_roas_range || b.b2c_roas_description) console.warn("[definitions] roas must be null for non-performance source:", b.source_l3, "b2c")
    }

    if (!lead_to_deal_cvr_exceptions.has(b.source_l3)) {
      if (!(b.b2b_lead_to_deal_cvr_range || b.b2c_lead_to_deal_cvr_range))
        console.warn("[definitions] missing lead->deal cvr range:", b.source_l3)
    }
  }

  const defined_sources = new Set(Object.keys(UtmVendorBySource))
  const utm_defaults = Object.values(UtmsBySourceL3)

  const missing_sources = utm_defaults
    .filter((v): v is UtmValues => !!v?.utm_source && v.utm_source !== "(empty)")
    .map((v) => v.utm_source!)
    .filter((s) => !defined_sources.has(s))

  const missing_placements = utm_defaults
    .filter((v): v is UtmValues => !!v?.utm_source && v.utm_source !== "(empty)")
    .filter((v) => (v.utm_source_variants?.some((x) => !!x.utm_placement) ?? false) && v.utm_placement === undefined)
    .map((v) => v.utm_source!)

  const missing_vendor_placement = utm_defaults
    .filter((v): v is UtmValues => !!v?.utm_source && !!v?.utm_placement && v.utm_source !== "(empty)")
    .filter((v) => {
      const key = buildUtmPlacementKey({
        utm_source: v.utm_source!,
        utm_placement: v.utm_placement!,
        placement: v.utm_placement_alias ?? v.utm_placement!
      })
      return UtmPlacementByCompoundKey[key] === undefined
    })
    .map((v) =>
      buildUtmPlacementKey({
        utm_source: v.utm_source!,
        utm_placement: v.utm_placement!,
        placement: v.utm_placement_alias ?? v.utm_placement!
      })
    )

  if (missing_sources.length) console.warn("[definitions] unmapped utm_source without vendor:", Array.from(new Set(missing_sources)).sort())
  if (missing_placements.length) console.warn("[definitions] utm_source present but utm_placement not set in defaults:", Array.from(new Set(missing_placements)).sort())
  if (missing_vendor_placement.length)
    console.warn("[definitions] utm_source+utm_placement not found in placement catalog:", Array.from(new Set(missing_vendor_placement)).sort())
}

