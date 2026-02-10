/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type TermDefinitionShape = {
  id: string
  alias: string
  description: string
}

/* -------------------------------------------------------------------------- */
/* Definition: Terms                                                          */
/* -------------------------------------------------------------------------- */

export const TermDefinitions = [
  {
    id: "activation",
    alias: "Activation",
    description: "First moment a user experiences core product value, often predictive of retention",
  },
  {
    id: "attribution_model",
    alias: "Attribution Model",
    description: "Rules and logic used to assign credit for an outcome to specific marketing touches",
  },
  {
    id: "attribution_window",
    alias: "Attribution Window",
    description: "Time span during which touches are eligible for credit for an outcome",
  },
  {
    id: "capex",
    alias: "Capex",
    description: "Capital expenditure recorded as a long-lived investment on the balance sheet",
  },
  {
    id: "cash_conversion",
    alias: "Cash Conversion",
    description: "Efficiency of converting earnings into cash after working-capital changes and one-time items",
  },
  {
    id: "churn",
    alias: "Churn",
    description: "Loss over time tracked separately as customer churn and revenue churn",
  },
  {
    id: "cohort",
    alias: "Cohort",
    description: "Group anchored to the same start date or event for consistent tracking over time",
  },
  {
    id: "control_group",
    alias: "Control Group",
    description: "Population not exposed to an intervention used to estimate the counterfactual outcome",
  },
  {
    id: "treatment_group",
    alias: "Treatment Group",
    description: "Population exposed to an intervention used to estimate incremental impact versus control",
  },
  {
    id: "holdout",
    alias: "Holdout",
    description: "Deliberate control design where eligible entities are withheld from exposure to measure lift",
  },
  {
    id: "geo_test",
    alias: "Geo Test",
    description: "Experiment design that varies spend or exposure by geography to estimate incremental impact",
  },
  {
    id: "matched_markets",
    alias: "Matched Markets",
    description: "Set of similar geographies used to construct credible controls for lift measurement",
  },
  {
    id: "matchback",
    alias: "Matchback",
    description: "Method that links offline exposure to downstream outcomes using identity keys",
  },
  {
    id: "five_forces",
    alias: "Five Forces",
    description: "Industry structure framework across rivalry, entrants, substitutes, supplier power, and buyer power",
  },
  {
    id: "growth_flywheel",
    alias: "Growth Flywheel",
    description: "Self-reinforcing loop of actions that compounds growth over time",
  },
  {
    id: "gtm",
    alias: "GTM",
    description: "Go-to-market strategy and motions used to reach, convert, and expand customers",
  },
  {
    id: "icp",
    alias: "ICP",
    description: "Ideal customer profile defined by strongest fit, economics, win rate, and retention potential",
  },
  {
    id: "identity_graph",
    alias: "Identity Graph",
    description: "Reconciled map that links multiple identifiers and objects to one prospect_id for consistent attribution and measurement",
  },
  {
    id: "object_model",
    alias: "Object Model",
    description: "Unified entity layer that standardizes object identity, hierarchy, timestamps, and attribution-ready fields",
  },
  {
    id: "touch_model",
    alias: "Touch Model",
    description: "Unified touch-event layer that normalizes interactions across sales and marketing systems into one schema",
  },
  {
    id: "object_touch_model",
    alias: "Object-Touch Model",
    description: "Joined journey layer combining object and touch models into one prospect-level analytical dataset for path and attribution modeling",
  },
  {
    id: "incrementality",
    alias: "Incrementality",
    description: "Causal impact proven via treatment versus control rather than attribution rules",
  },
  {
    id: "ip",
    alias: "IP",
    description: "Intellectual property that creates defensibility such as patents, trade secrets, or proprietary data and algorithms",
  },
  {
    id: "kpis",
    alias: "KPIs",
    description: "Small set of metrics used to evaluate performance and drive accountability",
  },
  {
    id: "markov_model",
    alias: "Markov Model",
    description: "Attribution approach that estimates channel contribution from path transitions and removal effects",
  },
  {
    id: "month",
    alias: "Month",
    description: "Calendar month bucket used for reporting rollups (typically normalized to the first day of the month)",
  },
  {
    id: "moat",
    alias: "Moat",
    description: "Durable advantage that protects unit economics such as switching costs, network effects, distribution, or IP",
  },
  {
    id: "mta",
    alias: "Multi-Touch Attribution",
    description: "Multi-touch attribution that distributes credit across eligible touches rather than using a single touch",
  },
  {
    id: "north_star_metric",
    alias: "North Star Metric",
    description: "Single metric intended to reflect delivered customer value and durable growth",
  },
  {
    id: "opex",
    alias: "Opex",
    description: "Operating expense recorded in-period such as payroll, rent, or software",
  },
  {
    id: "pmf",
    alias: "PMF",
    description: "Product-market fit demonstrated by durable pull for a defined segment and repeatable value delivery",
  },
  {
    id: "qa",
    alias: "QA",
    description: "Quality assurance process that validates data and campaigns before decisions are made",
  },
  {
    id: "qoe",
    alias: "QoE",
    description: "Quality of earnings view that normalizes profitability by adjusting for one-time items and accounting noise",
  },
  {
    id: "removal_effect",
    alias: "Removal Effect",
    description: "Attribution diagnostic that measures the conversion impact of removing a step from observed paths",
  },
  {
    id: "sales_cycle",
    alias: "Sales Cycle",
    description: "Customer journey from first meaningful intent through close, often segmented by motion and reset after inactivity",
  },
  {
    id: "week_start",
    alias: "Week Start",
    description: "Week bucket anchor date used for reporting rollups (for example, Sunday start-of-week)",
  },
  {
    id: "semantic_model",
    alias: "Semantic Model",
    description: "Governed business layer that maps terms to physical schemas to enforce consistent definitions and trusted reporting",
  },
  {
    id: "sga",
    alias: "SG&A",
    description: "Selling, general, and administrative overhead required to run the business, typically tracked as a share of revenue",
  },
  {
    id: "source_description",
    alias: "Source Description",
    description: "Plain-English definitions of attribution sources used for reporting and rollups",
  },
  {
    id: "data",
    alias: "Data",
    description: "Dataset origin label used to distinguish records pulled from different source tables in a unified query",
  },
  {
    id: "ssot",
    alias: "SSOT",
    description: "Single source of truth used as the authoritative system for definitions and reporting",
  },
  {
    id: "sta",
    alias: "Single-Touch Attribution",
    description: "Single-touch attribution that assigns all credit to a single touchpoint in the customer journey (typically first or last)",
  },
  {
    id: "tam_sam",
    alias: "TAM/SAM",
    description: "Market sizing that separates total addressable market from the serviceable portion you can realistically win",
  },
  {
    id: "utm",
    alias: "UTM",
    description: "Standard URL parameters used to label inbound traffic for attribution across channels and platforms",
  },
  {
    id: "utms",
    alias: "UTMs",
    description: "Standard URL parameters used to label inbound traffic for attribution across channels and platforms",
  },
  {
    id: "utm_source",
    alias: "UTM Source",
    description: "UTM field that identifies the publisher or platform that sent the traffic",
  },
  {
    id: "utm_medium",
    alias: "UTM Medium",
    description: "UTM field that identifies the channel or traffic type that delivered the visit",
  },
  {
    id: "utm_campaign",
    alias: "UTM Campaign",
    description: "UTM field that identifies the initiative, promotion, or campaign driving the visit",
  },
  {
    id: "utm_term",
    alias: "UTM Term",
    description: "UTM field that identifies the keyword, audience, or targeting dimension, most commonly used for paid search",
  },
  {
    id: "utm_content",
    alias: "UTM Content",
    description: "UTM field that identifies the creative asset or message variation that generated the click",
  },
  {
    id: "utm_placement",
    alias: "UTM Placement",
    description: "UTM field that identifies the inventory or surface where the ad or link appeared",
  },
  {
    id: "wtp",
    alias: "WTP",
    description: "Willingness-to-pay ceiling for a segment based on perceived value, alternatives, and budget constraints",
  },
] as const satisfies readonly TermDefinitionShape[]

type TermDefinition = (typeof TermDefinitions)[number]

const normalize = (s: string) => s.trim().toLowerCase()

const TermIndex = TermDefinitions.reduce<Record<string, TermDefinition>>((acc, term) => {
  for (const token of [term.id, term.alias]) acc[normalize(token)] = term
  return acc
}, {})

/* -------------------------------------------------------------------------- */
/* Export                                                                     */
/* -------------------------------------------------------------------------- */

export const TermTokens = Object.keys(TermIndex)

export function getTermByToken(token: string): TermDefinition | undefined {
  return TermIndex[normalize(token)]
}
