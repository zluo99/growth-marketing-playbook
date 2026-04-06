/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type UtmPlacementDefinition = {
  utm_source: string
  utm_placement: string
  placement: string
}

/* -------------------------------------------------------------------------- */
/* Definition: Canonical utm_source/placement -> placement mapping            */
/* -------------------------------------------------------------------------- */

export const UtmPlacementDefinitions = Object.freeze([
  // Inbound / Email
  { utm_source: "customer_io", utm_placement: "email", placement: "Email" },
  { utm_source: "hubspot", utm_placement: "email", placement: "Email" },
  { utm_source: "iterable", utm_placement: "email", placement: "Email" },
  { utm_source: "marketo", utm_placement: "email", placement: "Email" },

  // Inbound / Paid
  { utm_source: "google", utm_placement: "search", placement: "Search" },
  { utm_source: "google", utm_placement: "gdn", placement: "GDN" },
  { utm_source: "google", utm_placement: "pmax", placement: "PMax" },
  { utm_source: "google", utm_placement: "youtube", placement: "YouTube" },
  { utm_source: "microsoft", utm_placement: "search", placement: "Search" },
  { utm_source: "meta", utm_placement: "facebook", placement: "Facebook" },
  { utm_source: "meta", utm_placement: "instagram", placement: "Instagram" },
  { utm_source: "meta", utm_placement: "audience_network", placement: "Audience Network" },
  { utm_source: "linkedin", utm_placement: "feed", placement: "Feed" },
  { utm_source: "linkedin", utm_placement: "message_ads", placement: "Message Ads" },
  { utm_source: "dv360", utm_placement: "open_web_display", placement: "Open Web Display" },
  { utm_source: "dv360", utm_placement: "ctv", placement: "CTV" },
  { utm_source: "ttd", utm_placement: "open_web_display", placement: "Open Web Display" },
  { utm_source: "ttd", utm_placement: "ctv", placement: "CTV" },
  { utm_source: "criteo", utm_placement: "retargeting_display", placement: "Retargeting Display" },

  // Inbound / Paid / Review Sites
  { utm_source: "g2", utm_placement: "listing", placement: "Listing" },
  { utm_source: "g2", utm_placement: "cpc", placement: "CPC" },
  { utm_source: "capterra", utm_placement: "listing", placement: "Listing" },
  { utm_source: "capterra", utm_placement: "cpc", placement: "CPC" },
  { utm_source: "trustradius", utm_placement: "listing", placement: "Listing" },

  // Inbound / Partners (Affiliates)
  { utm_source: "impact", utm_placement: "affiliate_link", placement: "Affiliate Link" },
  { utm_source: "impact", utm_placement: "affiliate_coupon", placement: "Affiliate Coupon" },
  { utm_source: "partnerstack", utm_placement: "affiliate_link", placement: "Affiliate Link" },

  // Inbound / Referral
  { utm_source: "saasquatch", utm_placement: "invite_link", placement: "Invite Link" },
  { utm_source: "saasquatch", utm_placement: "share_link", placement: "Share Link" },

  // Outbound / Prospecting
  { utm_source: "outreach", utm_placement: "email_sequence", placement: "Email Sequence" },
  { utm_source: "salesloft", utm_placement: "email_sequence", placement: "Email Sequence" },
  { utm_source: "sendoso", utm_placement: "direct_mail", placement: "Direct Mail" },

  // Outbound / Purchased Data
  { utm_source: "6sense", utm_placement: "intent", placement: "Intent" },
  { utm_source: "demandbase", utm_placement: "intent", placement: "Intent" },
  { utm_source: "zoominfo", utm_placement: "data_enrichment", placement: "Data Enrichment" },
  { utm_source: "clearbit", utm_placement: "data_enrichment", placement: "Data Enrichment" },
  { utm_source: "apollo", utm_placement: "email_list", placement: "Email List" }
] as const satisfies readonly UtmPlacementDefinition[])

/* -------------------------------------------------------------------------- */
/* Utils                                                                      */
/* -------------------------------------------------------------------------- */

export const buildUtmPlacementKey = (r: UtmPlacementDefinition) => `${r.utm_source}::${r.utm_placement}`

export const UtmPlacementByCompoundKey = Object.freeze(
  UtmPlacementDefinitions.reduce(
    (acc, r) => ((acc[buildUtmPlacementKey(r)] = r), acc),
    {} as Record<string, UtmPlacementDefinition>
  )
)

if (process.env.NODE_ENV !== "production") {
  const seenKeys = new Set<string>()
  const duplicateKeys = new Set<string>()
  for (const r of UtmPlacementDefinitions) {
    const key = buildUtmPlacementKey(r)
    if (seenKeys.has(key)) duplicateKeys.add(key)
    else seenKeys.add(key)
  }
  if (duplicateKeys.size > 0) {
    console.warn("[definitions] duplicate utm_source+utm_placement in placement catalog:", Array.from(duplicateKeys).sort())
  }
}
