/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type MetricTypeL1 = "attribute" | "measure"
export type MetricTypeL2 = "primary" | "secondary"

export type MetricFormula =
  | { kind: "fraction"; numerator: string; denominator: string }
  | { kind: "scaled_fraction"; numerator: string; denominator: string; factor: number }
  | { kind: "product"; left: string; right: string }
  | { kind: "difference"; left: string; right: string }

export type MetricDefinition<K extends string> = {
  id: K
  alias: string
  type_l1: MetricTypeL1
  type_l2?: MetricTypeL2
  description: string
  formula?: MetricFormula
}

/* -------------------------------------------------------------------------- */
/* Definition: Metrics                                                        */
/* -------------------------------------------------------------------------- */

const MetricDefinitionList = [
  {
    id: "active_accounts",
    alias: "Active Accounts",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Count of distinct active accounts in the selected slice",
  },
  {
    id: "arpa",
    alias: "ARPA",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Average recurring revenue per active account in the selected slice",
    formula: { kind: "fraction", numerator: "arr", denominator: "active_accounts" },
  },
  {
    id: "arr",
    alias: "ARR",
    type_l1: "measure",
    type_l2: "primary",
    description: "Annual recurring revenue for the selected slice",
  },
  {
    id: "arr_control",
    alias: "ARR (Control)",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Annual recurring revenue for the control group in the selected slice",
  },
  {
    id: "arr_from_leads",
    alias: "ARR From Leads",
    type_l1: "measure",
    type_l2: "primary",
    description: "Annual recurring revenue attributed to the specified lead cohort",
  },
  {
    id: "arr_treatment",
    alias: "ARR (Treatment)",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Annual recurring revenue for the treatment group in the selected slice",
  },
  {
    id: "attribution_window",
    alias: "Attribution Window",
    type_l1: "attribute",
    description: "Explicit eligibility rule applied before attribution (for example, last_touch_within_days)",
  },
  {
    id: "cac",
    alias: "CAC",
    type_l1: "measure",
    type_l2: "primary",
    description: "Average acquisition cost per new customer in the selected slice",
    formula: { kind: "fraction", numerator: "total_spend", denominator: "new_customers" },
  },
  {
    id: "clicks",
    alias: "Clicks",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Count of click events in the selected slice",
  },
  {
    id: "control",
    alias: "Control",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Outcome value for the control group for the selected outcome metric",
  },
  {
    id: "contribution_margin_per_period",
    alias: "Contribution Margin Per Period",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Average contribution margin per customer per period used for payback analysis",
  },
  {
    id: "conversions",
    alias: "Conversions",
    type_l1: "measure",
    type_l2: "primary",
    description: "Count of conversion events for the selected step in the selected slice",
  },
  {
    id: "cpa",
    alias: "CPA",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Average acquisition cost per conversion in the selected slice",
    formula: { kind: "fraction", numerator: "total_spend", denominator: "conversions" },
  },
  {
    id: "cpc",
    alias: "CPC",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Average acquisition cost per click in the selected slice",
    formula: { kind: "fraction", numerator: "total_spend", denominator: "clicks" },
  },
  {
    id: "cpm",
    alias: "CPM",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Average acquisition cost per 1,000 impressions in the selected slice",
    formula: { kind: "scaled_fraction", numerator: "total_spend", denominator: "impressions", factor: 1000 },
  },
  {
    id: "cost_per_deal",
    alias: "Cost Per Deal",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Average acquisition cost per closed-won deal in the selected slice",
    formula: { kind: "fraction", numerator: "total_spend", denominator: "deals" },
  },
  {
    id: "cost_per_lead",
    alias: "Cost Per Lead",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Average acquisition cost per lead created in the selected slice",
    formula: { kind: "fraction", numerator: "total_spend", denominator: "leads" },
  },
  {
    id: "cost_per_mail_send",
    alias: "Cost Per Mail Send",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Average acquisition cost per mail send in the selected slice",
    formula: { kind: "fraction", numerator: "total_spend", denominator: "mail_sends" },
  },
  {
    id: "cost_per_opportunity",
    alias: "Cost Per Opportunity",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Average acquisition cost per qualified opportunity created in the selected slice",
    formula: { kind: "fraction", numerator: "total_spend", denominator: "opportunities" },
  },
  {
    id: "ctr",
    alias: "CTR",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Rate of impressions that resulted in a click in the selected slice",
    formula: { kind: "fraction", numerator: "clicks", denominator: "impressions" },
  },
  {
    id: "cvr",
    alias: "CVR",
    type_l1: "measure",
    type_l2: "primary",
    description: "Rate of eligible entities that converted for the selected step in the selected slice",
    formula: { kind: "fraction", numerator: "conversions", denominator: "eligible_population" },
  },
  {
    id: "deals",
    alias: "Deals",
    type_l1: "measure",
    type_l2: "primary",
    description: "Count of closed-won deals in the selected slice",
  },
  {
    id: "deals_control",
    alias: "Deals (Control)",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Count of closed-won deals for the control group in the selected slice",
  },
  {
    id: "deals_from_leads",
    alias: "Deals From Leads",
    type_l1: "measure",
    type_l2: "primary",
    description: "Count of closed-won deals attributed to the specified lead cohort",
  },
  {
    id: "deals_treatment",
    alias: "Deals (Treatment)",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Count of closed-won deals for the treatment group in the selected slice",
  },
  {
    id: "delivered",
    alias: "Delivered",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Count of delivered messages in the selected slice",
  },
  {
    id: "eligible_population",
    alias: "Eligible Population",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Count of entities eligible to convert for the selected step in the selected slice",
  },
  {
    id: "gross_margin",
    alias: "Gross Margin",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Gross margin for the selected slice, kept consistent as either a rate or an amount within a view",
  },
  {
    id: "gross_margin_x_lifetime",
    alias: "Gross Margin × Lifetime",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Lifetime gross margin factor used in LTV and payback modeling",
    formula: { kind: "product", left: "gross_margin", right: "lifetime" },
  },
  {
    id: "identity_graph",
    alias: "Identity Graph",
    type_l1: "attribute",
    description: "Prospect-level stitched identity map that links people, accounts, and CRM objects under deterministic merge rules",
  },
  {
    id: "journey_path",
    alias: "Journey Path",
    type_l1: "attribute",
    description: "Canonical ordered sequence of touches for a prospect used for path analysis and attribution models",
  },
  {
    id: "impressions",
    alias: "Impressions",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Count of impression events in the selected slice",
  },
  {
    id: "incremental_lift",
    alias: "Incremental Lift",
    type_l1: "measure",
    type_l2: "primary",
    description: "Incremental change attributable to the intervention for the selected outcome metric",
    formula: { kind: "difference", left: "treatment", right: "control" },
  },
  {
    id: "incremental_lift_arr",
    alias: "Incremental Lift (ARR)",
    type_l1: "measure",
    type_l2: "primary",
    description: "Incremental annual recurring revenue attributable to the intervention",
    formula: { kind: "difference", left: "arr_treatment", right: "arr_control" },
  },
  {
    id: "incremental_lift_deals",
    alias: "Incremental Lift (Deals)",
    type_l1: "measure",
    type_l2: "primary",
    description: "Incremental closed-won deals attributable to the intervention",
    formula: { kind: "difference", left: "deals_treatment", right: "deals_control" },
  },
  {
    id: "is_converted",
    alias: "Is Converted",
    type_l1: "attribute",
    description: "Prospect-level boolean conversion outcome used for journey CVR and attribution model scoring",
  },
  {
    id: "landing_pageviews",
    alias: "Landing Pageviews",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Count of landing pageview events in the selected slice",
  },
  {
    id: "leads",
    alias: "Leads",
    type_l1: "measure",
    type_l2: "primary",
    description: "Count of distinct leads created in the selected slice",
  },
  {
    id: "lead_created_date",
    alias: "Lead Created Date",
    type_l1: "attribute",
    description: "Timestamp when the lead was created",
  },
  {
    id: "lead_id",
    alias: "Lead ID",
    type_l1: "attribute",
    description: "Stable unique identifier for a lead",
  },
  {
    id: "lead_to_deal_cvr",
    alias: "Lead → Deal CVR",
    type_l1: "measure",
    type_l2: "primary",
    description: "Rate of leads from this source that became closed-won deals in the selected slice",
    formula: { kind: "fraction", numerator: "deals_from_leads", denominator: "leads" },
  },
  {
    id: "lead_to_opp_cvr",
    alias: "Lead → Opportunity CVR",
    type_l1: "measure",
    type_l2: "primary",
    description: "Rate of leads from this source that became qualified opportunities in the selected slice",
    formula: { kind: "fraction", numerator: "opportunities_from_leads", denominator: "leads" },
  },
  {
    id: "lifetime",
    alias: "Lifetime",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Average expected customer lifetime used for LTV and payback modeling",
  },
  {
    id: "ltv",
    alias: "LTV",
    type_l1: "measure",
    type_l2: "primary",
    description: "Estimated lifetime value per active account for the selected slice",
    formula: { kind: "product", left: "arpa", right: "gross_margin_x_lifetime" },
  },
  {
    id: "ltv_from_leads",
    alias: "LTV From Leads",
    type_l1: "measure",
    type_l2: "primary",
    description: "Estimated lifetime value attributed to the specified lead cohort",
  },
  {
    id: "mail_sends",
    alias: "Mail Sends",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Count of messages sent or attempted in the selected slice",
  },
  {
    id: "new_customers",
    alias: "New Customers",
    type_l1: "measure",
    type_l2: "primary",
    description: "Count of distinct first-time customers acquired in the selected slice",
  },
  {
    id: "object_created_date",
    alias: "Object Created Date",
    type_l1: "attribute",
    description: "Timestamp when the CRM object was created",
  },
  {
    id: "object_id",
    alias: "Object ID",
    type_l1: "attribute",
    description: "Stable unique identifier for a CRM object; multiple object_id values can belong to one prospect_id",
  },
  {
    id: "object_type",
    alias: "Object Type",
    type_l1: "attribute",
    description: "CRM entity type for the record",
  },
  {
    id: "opens",
    alias: "Opens",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Count of open events in the selected slice",
  },
  {
    id: "open_rate",
    alias: "Open Rate",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Rate of delivered messages that were opened in the selected slice",
    formula: { kind: "fraction", numerator: "opens", denominator: "delivered" },
  },
  {
    id: "opportunities",
    alias: "Opportunities",
    type_l1: "measure",
    type_l2: "primary",
    description: "Count of qualified opportunities created in the selected slice",
  },
  {
    id: "opportunities_from_leads",
    alias: "Opportunities From Leads",
    type_l1: "measure",
    type_l2: "primary",
    description: "Count of qualified opportunities attributed to the specified lead cohort",
  },
  {
    id: "opp_to_deal_cvr",
    alias: "Opportunity → Deal CVR",
    type_l1: "measure",
    type_l2: "primary",
    description: "Rate of qualified opportunities that became closed-won deals in the selected slice",
    formula: { kind: "fraction", numerator: "deals", denominator: "opportunities" },
  },
  {
    id: "pageviews",
    alias: "Pageviews",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Count of pageview events in the selected slice",
  },
  {
    id: "payback",
    alias: "Payback",
    type_l1: "measure",
    type_l2: "primary",
    description: "Estimated payback period for acquisition spend in the selected slice",
    formula: { kind: "fraction", numerator: "cac", denominator: "contribution_margin_per_period" },
  },
  {
    id: "prospect_id",
    alias: "Prospect ID",
    type_l1: "attribute",
    description: "Stable unique identifier for a prospect used as the anchor key for identity_graph stitching and journey aggregation",
  },
  {
    id: "reach",
    alias: "Reach",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Count of distinct users or accounts exposed in the selected slice",
  },
  {
    id: "removal_effect",
    alias: "Removal Effect",
    type_l1: "measure",
    type_l2: "primary",
    description: "Markov lift estimate of conversion impact when a step is removed from observed paths",
  },
  {
    id: "revenue",
    alias: "Revenue",
    type_l1: "measure",
    type_l2: "primary",
    description: "Recognized revenue for the selected slice",
  },
  {
    id: "roas",
    alias: "ROAS",
    type_l1: "measure",
    type_l2: "primary",
    description: "Return on ad spend for the selected slice based on ARR",
    formula: { kind: "fraction", numerator: "arr", denominator: "total_spend" },
  },
  {
    id: "sales_cycle_time",
    alias: "Sales Cycle Time",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Average elapsed time from opportunity creation to close in the selected slice",
  },
  {
    id: "session_duration",
    alias: "Session Duration",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Average session duration in the selected slice",
  },
  {
    id: "source",
    alias: "Source",
    type_l1: "attribute",
    description: "Canonical source rollup used for consistent attribution across source L1–L3",
  },
  {
    id: "source_l1",
    alias: "Source L1",
    type_l1: "attribute",
    description: "Top-level go-to-market motion classification for the source",
  },
  {
    id: "source_l2",
    alias: "Source L2",
    type_l1: "attribute",
    description: "Channel grouping within the motion for the source",
  },
  {
    id: "source_l3",
    alias: "Source L3",
    type_l1: "attribute",
    description: "Reporting-level source used as the system of record for source definitions",
  },
  {
    id: "spend",
    alias: "Spend",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Marketing spend amount used for rollups and grouping in the selected slice",
  },
  {
    id: "spend_date",
    alias: "Spend Date",
    type_l1: "attribute",
    description: "Date when marketing spend was recognized or posted",
  },
  {
    id: "spend_type",
    alias: "Spend Type",
    type_l1: "attribute",
    description: "Strategic classification of spend intent used to evaluate ROI in context",
  },
  {
    id: "total_spend",
    alias: "Total Spend",
    type_l1: "measure",
    type_l2: "primary",
    description: "Total marketing spend in the selected slice",
  },
  {
    id: "touch_count",
    alias: "Touch Count",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Number of observed touches for the prospect in the selected window, typically used for journey depth and CVR cuts",
  },
  {
    id: "treatment",
    alias: "Treatment",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Outcome value for the treatment group for the selected outcome metric",
  },
  {
    id: "unsubscribes",
    alias: "Unsubscribes",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Count of unsubscribe events in the selected slice",
  },
  {
    id: "vendor",
    alias: "Vendor",
    type_l1: "attribute",
    description: "Execution platform or partner used to evaluate vendor-level performance",
  },
  {
    id: "vertical",
    alias: "Vertical",
    type_l1: "attribute",
    description: "Business segment or industry classification for the record",
  },
  {
    id: "website_time",
    alias: "Website Time",
    type_l1: "measure",
    type_l2: "secondary",
    description: "Time spent on site in the selected slice",
  },
] as const satisfies readonly MetricDefinition<string>[]

/* -------------------------------------------------------------------------- */
/* Utils                                                                      */
/* -------------------------------------------------------------------------- */

export type MetricId = (typeof MetricDefinitionList)[number]["id"]

const MetricDefinitions = Object.freeze(
  MetricDefinitionList.reduce(
    (acc, metric) => ((acc[metric.id as MetricId] = metric as MetricDefinition<MetricId>), acc),
    {} as Record<MetricId, MetricDefinition<MetricId>>
  )
)

/* -------------------------------------------------------------------------- */
/* Export                                                                     */
/* -------------------------------------------------------------------------- */

export { MetricDefinitions, MetricDefinitionList }

export const isMetricId = (id: string): id is MetricId => typeof id === "string" && id in MetricDefinitions

export function getMetricDefinition(id: MetricId): MetricDefinition<MetricId> {
  return MetricDefinitions[id]
}


