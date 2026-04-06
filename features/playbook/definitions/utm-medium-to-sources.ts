import type { SourceL3 } from "./sources"

/* -------------------------------------------------------------------------- */
/* Definition: Canonical utm_medium -> source_l3 mapping                      */
/* -------------------------------------------------------------------------- */

type UtmMediumDefinition = {
  utm_medium: string
  source_l3: SourceL3
  description: string | null
}

const UtmMediumDefinitions = Object.freeze([
  { utm_medium: "direct", source_l3: "Direct", description: "Matches the widely used direct medium label in analytics tooling; use when you must force attribution away from referrer-loss collapsing into direct." },
  { utm_medium: "direct_mail", source_l3: "Direct Mail", description: "Uses a clear snake_case label that is common in offline-to-online tracking; avoids overloading direct while staying readable in reports." },
  { utm_medium: "{unmapped}", source_l3: "Other & Unmapped", description: "Sentinel medium representing either empty or unmapped values; keeps hygiene gaps explicit without inventing additional mediums." },

  { utm_medium: "email_broadcast", source_l3: "Email Broadcast", description: "Includes the email prefix to align with common channel grouping rules while differentiating broadcast from nurture via a stable suffix." },
  { utm_medium: "email_nurture", source_l3: "Email Nurture", description: "Keeps the email prefix for interoperability while separating lifecycle automation from broadcast using a single, consistent suffix." },

  { utm_medium: "event_local", source_l3: "Local Events", description: "Uses an event prefix to avoid conflating with referral or email; local/national split is encoded in a stable suffix for clean rollups." },
  { utm_medium: "event_national", source_l3: "National Events", description: "Mirrors event_local naming for symmetry and predictable parsing while keeping local vs national attribution explicit." },
  { utm_medium: "webinar", source_l3: "Webinars", description: "Uses the widely recognized webinar medium label; avoids unnecessary prefixes and keeps webinar traffic distinct from generic events." },

  { utm_medium: "content", source_l3: "Content", description: "Keeps a short, human-readable medium that is easy to standardize; avoids overloading organic since source_l3 already encodes the channel." },
  { utm_medium: "social_organic", source_l3: "Organic Social", description: "Explicitly distinguishes organic social from paid_social using a common, unambiguous compound medium." },
  { utm_medium: "earned", source_l3: "PR & Earned", description: "Avoids generic referral by using a specific earned label; reduces ambiguity in dashboards and prevents mis-bucketing into referral." },
  { utm_medium: "organic", source_l3: "SEO", description: "Uses the canonical organic medium used across analytics tools for unpaid search; maximizes interoperability." },

  { utm_medium: "cpc", source_l3: "Paid Search", description: "Uses the canonical cpc medium widely expected by analytics tools and ad platforms for paid search." },
  { utm_medium: "paid_social", source_l3: "Paid Social", description: "Matches common paid_social conventions; makes paid vs organic social unambiguous without relying on source parsing." },
  { utm_medium: "paid_video", source_l3: "Paid Video", description: "Keeps naming parallel to paid_social while calling out video explicitly; avoids conflation with programmatic or social video." },
  { utm_medium: "programmatic", source_l3: "Programmatic Display", description: "Uses a concise, commonly understood programmatic label instead of generic display; reduces ambiguity with non-programmatic placements." },
  { utm_medium: "review", source_l3: "Review Sites", description: "Short, specific medium that avoids conflation with affiliate or partner referral while staying readable in rollups." },
  { utm_medium: "cpl", source_l3: "Pay Per Lead", description: "Uses the canonical cpl abbreviation for cost-per-lead buying; keeps it distinct from affiliate and programmatic." },

  { utm_medium: "affiliate", source_l3: "Affiliates", description: "Canonical affiliate medium label; widely used and interoperable with partner reporting conventions." },
  { utm_medium: "partner_comarketing", source_l3: "Co-marketing", description: "Uses a partner_ prefix to keep all partner mediums grouped; suffix distinguishes the partner motion without needing utm_source parsing." },
  { utm_medium: "partner_integration", source_l3: "Integrations", description: "Keeps partner_ prefix for consistent grouping; integration suffix prevents ambiguity with generic referral." },
  { utm_medium: "partner_reseller", source_l3: "Resellers", description: "Keeps partner_ prefix for consistent grouping; reseller suffix makes channel intent explicit in dashboards." },

  { utm_medium: "product_inapp", source_l3: "PLG In-app", description: "Uses a product_ prefix to separate product-led flows from marketing channels; inapp suffix is short and consistently applied." },
  { utm_medium: "product_acquisition", source_l3: "PLG Acquisition", description: "Keeps product_ prefix to separate from paid/organic; acquisition suffix matches the canonical source_l3 label." },
  { utm_medium: "product_upgrade", source_l3: "PLG Upgrade", description: "Keeps product_ prefix for grouping; upgrade suffix matches the canonical source_l3 label and avoids lifecycle email confusion." },

  { utm_medium: "referral_customer", source_l3: "Customer Referral", description: "Uses referral_ prefix to match common referral semantics; customer suffix distinguishes it from employee referrals." },
  { utm_medium: "referral_employee", source_l3: "Employee Referral", description: "Pairs with referral_customer for symmetry; employee suffix keeps internal advocacy attribution distinct." },

  { utm_medium: "outbound_call", source_l3: "Outbound Call", description: "Uses outbound_ prefix to keep outbound mediums grouped; call suffix matches the canonical source_l3 label." },
  { utm_medium: "outbound_email", source_l3: "Outbound Email", description: "Avoids the generic email medium to prevent blending with inbound lifecycle email; outbound_ prefix keeps it cleanly separated." },
  { utm_medium: "outbound_sms", source_l3: "Outbound SMS", description: "Uses outbound_ prefix for grouping; sms suffix is canonical and prevents confusion with lifecycle messaging." },
  { utm_medium: "outbound_social", source_l3: "Outbound Social DM", description: "Uses outbound_ prefix for grouping; social suffix is concise while still mapping 1:1 to the outbound social dm source." },
  { utm_medium: "outbound_walk_in", source_l3: "Outbound Walk-In", description: "Uses outbound_ prefix for grouping; walk_in suffix keeps formatting consistent and readable in tools." },

  { utm_medium: "data_signals", source_l3: "Data Signals", description: "Keeps data_ prefix to group purchased-data mediums; signals suffix distinguishes it from list-based acquisition." },
  { utm_medium: "purchased_list", source_l3: "Purchased Lists", description: "Uses an explicit purchased_ label to avoid ambiguity with signals; list suffix is singular and stable for reporting." },

  { utm_medium: "abm_orchestration", source_l3: "ABM Orchestration", description: "Uses abm_ prefix to group ABM mediums; orchestration suffix matches the canonical source label and separates from ads." },
  { utm_medium: "abm_ads", source_l3: "ABM Advertising", description: "Uses abm_ prefix for grouping; ads suffix is short and conventional while mapping 1:1 to ABM Advertising." }
] as const satisfies readonly UtmMediumDefinition[])

type UtmMedium = (typeof UtmMediumDefinitions)[number]["utm_medium"]

export const UtmMediumByValue = Object.freeze(
  UtmMediumDefinitions.reduce(
    (acc, row) => ((acc[row.utm_medium] = row), acc),
    {} as Record<UtmMedium, (typeof UtmMediumDefinitions)[number]>
  )
)

export const UtmMediumBySourceL3 = Object.freeze(
  UtmMediumDefinitions.reduce(
    (acc, { utm_medium, source_l3 }) => ((acc[source_l3] = utm_medium), acc),
    {} as Record<SourceL3, UtmMedium>
  )
)
