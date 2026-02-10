import { type SourceL3 } from "./sources"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type SpendDefinition = {
  id: string
  alias: string
  description: string
  source_l3: readonly SourceL3[]
}

/* -------------------------------------------------------------------------- */
/* Definition: Spend tiers                                                    */
/* -------------------------------------------------------------------------- */

export const SpendDefinitions = Object.freeze([
  {
    id: "brand",
    alias: "Brand",
    description:
      "Upper and mid funnel programs that build future demand and preference. Judge on reach, lift, and downstream conversion, not clicks alone.",
    source_l3: [
      // Inbound / Events
      "Local Events",
      "National Events",
      "Webinars",
      // Inbound / Organic
      "PR & Earned",
      // Inbound / Paid
      "Paid Search",
      "Paid Social",
      "Programmatic Display",
      "Review Sites",
      "Pay Per Lead",
      // Inbound / Partners
      "Affiliates",
      "Co-marketing",
      "Integrations",
      "Resellers",
      // Outbound / Target Accounts
      "ABM Advertising"
    ]
  },
  {
    id: "performance",
    alias: "Performance",
    description:
      "Direct response programs that harvest in market demand. Optimize on CAC, ROAS, and payback, then pressure test incrementality as you scale.",
    source_l3: [
      // Inbound / Events
      "Local Events",
      // Inbound / Paid
      "Paid Search",
      "Paid Social",
      "Paid Video",
      "Programmatic Display",
      "Review Sites",
      "Pay Per Lead",
      // Inbound / Partners
      "Affiliates",
      // Inbound / Product Led Growth
      "PLG In-app",
      "PLG Acquisition",
      "PLG Upgrade",
      // Outbound / Purchased Data
      "Purchased Lists",
      // Outbound / Target Accounts
      "ABM Advertising"
    ]
  },
  {
    id: "commission",
    alias: "Commission",
    description:
      "Variable payout spend tied to referral outcomes. Track as commission so referral economics remain distinct from brand and performance budgets.",
    source_l3: [
      // Inbound / Referral
      "Customer Referral",
      "Employee Referral"
    ]
  },
  {
    id: "overhead",
    alias: "Overhead",
    description:
      "Shared people, tools, and fixed costs not tied to a single channel. Include intentionally when you need fully loaded financial metrics.",
    source_l3: [
      // Inbound / Direct
      "Direct",
      "Direct Mail",
      "Other & Unmapped",
      // Inbound / Email
      "Email Broadcast",
      "Email Nurture",
      // Inbound / Organic
      "Content",
      "Organic Social",
      "SEO",
      "PR & Earned",
      // Inbound / Events
      "Local Events",
      "National Events",
      "Webinars",
      // Outbound / Prospecting
      "Outbound Call",
      "Outbound Email",
      "Outbound SMS",
      "Outbound Social DM",
      "Outbound Walk-In",
      // Outbound / Purchased Data
      "Data Signals",
      "Purchased Lists",
      // Outbound / Target Accounts
      "ABM Orchestration"
    ]
  }
] as const satisfies readonly SpendDefinition[])

export type SpendId = (typeof SpendDefinitions)[number]["id"]

/* -------------------------------------------------------------------------- */
/* Utils                                                                      */
/* -------------------------------------------------------------------------- */

export const SpendIds = Object.freeze(SpendDefinitions.map((r) => r.id) as readonly SpendId[])

export const SpendById = Object.freeze(
  SpendDefinitions.reduce(
    (acc, r) => ((acc[r.id] = { id: r.id, alias: r.alias, description: r.description }), acc),
    {} as Record<SpendId, Omit<SpendDefinition, "source_l3">>
  )
)

export const SpendBySourceL3 = Object.freeze(
  SpendDefinitions.reduce((acc, r) => {
    for (const source_l3 of r.source_l3) {
      const existing = acc[source_l3] ?? []
      acc[source_l3] = Object.freeze([...existing, r.id])
    }
    return acc
  }, {} as Partial<Record<SourceL3, readonly SpendId[]>>)
)
