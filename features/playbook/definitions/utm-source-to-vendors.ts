import { type SourceL3 } from "./sources"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type UtmSourceVendorDefinition = {
  utm_source: string
  vendor: string
  description: string
  source_l3: readonly SourceL3[]
}

/* -------------------------------------------------------------------------- */
/* Definition: Canonical utm_source -> vendor mapping                         */
/* -------------------------------------------------------------------------- */

export const UtmSourceVendorDefinitions = Object.freeze([
  // Inbound / Email
  { utm_source: "customer_io", vendor: "Customer.io", description: "Customer engagement platform for lifecycle email and messaging automation.", source_l3: ["Email Nurture"] },
  { utm_source: "hubspot", vendor: "HubSpot", description: "CRM and marketing automation platform for email, forms, workflows, and lead management.", source_l3: ["Email Broadcast", "Email Nurture"] },
  { utm_source: "iterable", vendor: "Iterable", description: "Cross-channel marketing automation platform focused on lifecycle campaigns (email, SMS, push).", source_l3: ["Email Broadcast", "Email Nurture"] },
  { utm_source: "marketo", vendor: "Marketo", description: "B2B marketing automation platform for lead nurturing, scoring, and campaign orchestration.", source_l3: ["Email Broadcast", "Email Nurture"] },

  // Inbound / Paid
  { utm_source: "google", vendor: "Google Ads", description: "Advertising platform for search, display, video, and Performance Max campaigns.", source_l3: ["Paid Search", "Programmatic Display", "Paid Video"] },
  { utm_source: "microsoft", vendor: "Microsoft Ads", description: "Search advertising platform for Bing and Microsoft network properties.", source_l3: ["Paid Search"] },
  { utm_source: "meta", vendor: "Meta", description: "Advertising platform for Facebook/Instagram paid social and audience-based targeting.", source_l3: ["Paid Social"] },
  { utm_source: "linkedin", vendor: "LinkedIn Ads", description: "B2B advertising platform for targeting, paid social, and ABM-style campaigns.", source_l3: ["Paid Social", "ABM Advertising"] },
  { utm_source: "dv360", vendor: "DV360", description: "Google programmatic buying platform for display, video, and connected TV inventory.", source_l3: ["Programmatic Display", "Paid Video"] },
  { utm_source: "ttd", vendor: "The Trade Desk", description: "Independent DSP for programmatic display, video, and CTV buying.", source_l3: ["Programmatic Display", "Paid Video"] },
  { utm_source: "criteo", vendor: "Criteo", description: "Commerce media and retargeting platform for performance display advertising.", source_l3: ["Programmatic Display"] },

  // Inbound / Paid / Review Sites
  { utm_source: "g2", vendor: "G2", description: "B2B software review marketplace for listings, intent, and demand generation.", source_l3: ["Review Sites"] },
  { utm_source: "capterra", vendor: "Capterra", description: "Software review and listing marketplace used for discovery and lead gen.", source_l3: ["Review Sites"] },
  { utm_source: "trustradius", vendor: "TrustRadius", description: "B2B review platform used for listings, product research, and lead generation.", source_l3: ["Review Sites"] },

  // Inbound / Partners
  { utm_source: "impact", vendor: "impact.com", description: "Affiliate and partner management platform for tracking partners, payouts, and performance attribution.", source_l3: ["Affiliates"] },
  { utm_source: "partnerstack", vendor: "PartnerStack", description: "Partner and affiliate platform used to manage SaaS partner programs and referral tracking.", source_l3: ["Affiliates", "Co-marketing"] },

  // Inbound / Referral
  { utm_source: "saasquatch", vendor: "SaaSquatch", description: "Referral platform for customer referral programs, rewards, and invite tracking.", source_l3: ["Customer Referral"] },

  // Outbound / Prospecting
  { utm_source: "outreach", vendor: "Outreach", description: "Sales engagement platform for sequencing outbound emails and prospecting tasks.", source_l3: ["Outbound Email", "Outbound Call"] },
  { utm_source: "salesloft", vendor: "Salesloft", description: "Sales engagement platform for outbound sequences, calls, and activity tracking.", source_l3: ["Outbound Email", "Outbound Call"] },
  { utm_source: "sendoso", vendor: "Sendoso", description: "Direct mail and gifting platform used for sales and marketing outreach.", source_l3: ["Direct Mail", "ABM Orchestration"] },

  // Outbound / Purchased Data
  { utm_source: "6sense", vendor: "6sense", description: "ABM and intent platform for account identification, intent signals, and orchestration.", source_l3: ["Data Signals", "ABM Advertising"] },
  { utm_source: "demandbase", vendor: "Demandbase", description: "ABM platform for account targeting, intent signals, and advertising orchestration.", source_l3: ["Data Signals", "ABM Advertising"] },
  { utm_source: "zoominfo", vendor: "ZoomInfo", description: "B2B data platform for contact/company intelligence, intent, and list building.", source_l3: ["Data Signals", "Purchased Lists"] },
  { utm_source: "clearbit", vendor: "Clearbit", description: "Data enrichment platform for firmographic and contact enrichment.", source_l3: ["Data Signals"] },
  { utm_source: "apollo", vendor: "Apollo", description: "Prospecting database and outbound platform for contacts, sequencing, and list sourcing.", source_l3: ["Outbound Email", "Data Signals", "Purchased Lists"] }
] as const satisfies readonly UtmSourceVendorDefinition[])

type UtmSourceId = (typeof UtmSourceVendorDefinitions)[number]["utm_source"]

/* -------------------------------------------------------------------------- */
/* Utils                                                                      */
/* -------------------------------------------------------------------------- */

export const UtmVendorBySource = Object.freeze(
  UtmSourceVendorDefinitions.reduce(
    (acc, r) => ((acc[r.utm_source] = r.vendor), acc),
    {} as Record<UtmSourceId, string>
  )
)

export const VendorDescriptionByName = Object.freeze(
  UtmSourceVendorDefinitions.reduce((acc, r) => {
    acc[r.vendor] ??= r.description
    return acc
  }, {} as Record<string, string>)
)

export const VendorsBySourceL3 = Object.freeze(
  UtmSourceVendorDefinitions.reduce((acc, r) => {
    for (const source_l3 of r.source_l3) acc[source_l3] = Object.freeze([...(acc[source_l3] ?? []), r.vendor])
    return acc
  }, {} as Record<SourceL3, readonly string[]>)
)

if (process.env.NODE_ENV !== "production") {
  const seenSources = new Set<string>()
  const duplicateSources = new Set<string>()
  for (const v of UtmSourceVendorDefinitions) {
    if (seenSources.has(v.utm_source)) duplicateSources.add(v.utm_source)
    else seenSources.add(v.utm_source)
  }
  if (duplicateSources.size > 0) {
    console.warn("[definitions] duplicate utm_source in vendor catalog:", Array.from(duplicateSources).sort())
  }

  // use string set so .has(...) accepts arbitrary checks without type errors
  const utm_source_values = new Set<string>(UtmSourceVendorDefinitions.map((r) => r.utm_source))
  if (utm_source_values.has("(empty)")) {
    console.warn('[definitions] utm_source should not include "(empty)"; use sources.ts hygiene buckets instead')
  }
}
