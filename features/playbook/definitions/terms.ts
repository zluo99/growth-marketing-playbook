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
    description: "First moment a user experiences core product value; often predictive of retention",
  },
  {
    id: "attribution_model",
    alias: "Attribution Model",
    description: "Rules used to assign outcome credit to specific marketing touches",
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
    description: "How efficiently earnings turn into cash after working-capital changes and one-time items",
  },
  {
    id: "churn",
    alias: "Churn",
    description: "Loss over time tracked separately as customer churn and revenue churn",
  },
  {
    id: "cohort",
    alias: "Cohort",
    description: "Group anchored to the same start date or event for consistent measurement over time",
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
    description: "Control design that withholds eligible entities from exposure to measure lift",
  },
  {
    id: "geo_test",
    alias: "Geo Test",
    description: "Experiment that varies spend or exposure by geography to estimate incremental impact",
  },
  {
    id: "matched_markets",
    alias: "Matched Markets",
    description: "Set of similar geographies used to construct credible controls",
  },
  {
    id: "matchback",
    alias: "Matchback",
    description: "Method that links offline exposure to downstream outcomes through identity keys",
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
    description: "Ideal customer profile defined by fit, economics, win rate, and retention potential",
  },
  {
    id: "identity_graph",
    alias: "Identity Graph",
    description: "Reconciled identity map that links multiple identifiers and objects to one prospect_id",
  },
  {
    id: "object_model",
    alias: "Object Model",
    description: "Unified entity layer that standardizes object identity, hierarchy, timestamps, and attribution-ready fields",
  },
  {
    id: "touch_model",
    alias: "Touch Model",
    description: "Unified touch-event layer that normalizes interactions across sales and marketing systems",
  },
  {
    id: "object_touch_model",
    alias: "Object-Touch Model",
    description: "Prospect-level journey layer that joins object and touch models for path and attribution analysis",
  },
  {
    id: "incrementality",
    alias: "Incrementality",
    description: "Causal impact measured through treatment versus control, not attribution rules",
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
    description: "Attribution model that estimates channel contribution from path transitions and removal effects",
  },
  {
    id: "docs.md",
    alias: "docs.md",
    description: "dbt docs file used to store reusable long-form descriptions for models, metrics, and fields",
  },
  {
    id: "month",
    alias: "Month",
    description: "Calendar month bucket used for reporting rollups",
  },
  {
    id: "moat",
    alias: "Moat",
    description: "Durable advantage that protects unit economics such as switching costs, network effects, distribution, or IP",
  },
  {
    id: "mta",
    alias: "Multi-Touch Attribution",
    description: "Attribution model that distributes credit across eligible touches rather than a single touch",
  },
  {
    id: "models.yml",
    alias: "models.yml",
    description: "dbt schema contract file used to publish model and metric definitions, tests, grain, and anchors",
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
    description: "Product-market fit demonstrated by durable pull from a defined segment",
  },
  {
    id: "qa",
    alias: "QA",
    description: "Process that validates data and campaigns before decisions are made",
  },
  {
    id: "qoe",
    alias: "QoE",
    description: "Normalized view of earnings that adjusts for one-time items and accounting noise",
  },
  {
    id: "removal_effect",
    alias: "Removal Effect",
    description: "Attribution diagnostic that measures the conversion impact of removing a step from observed paths",
  },
  {
    id: "sales_cycle",
    alias: "Sales Cycle",
    description: "Customer journey from first meaningful intent through close",
  },
  {
    id: "week_start",
    alias: "Week Start",
    description: "Week bucket anchor date used for reporting rollups",
  },
  {
    id: "semantic_model",
    alias: "Semantic Model",
    description: "Governed business layer that maps business terms to physical schemas for consistent reporting",
  },
  {
    id: "skill.md",
    alias: "skill.md",
    description: "Operating guide for how this playbook's dbt bundle should be read and maintained",
  },
  {
    id: "sga",
    alias: "SG&A",
    description: "Selling, general, and administrative overhead required to run the business, typically tracked as a share of revenue",
  },
  {
    id: "source_description",
    alias: "Source Description",
    description: "Description used to explain attribution sources in reporting and rollups",
  },
  {
    id: "data",
    alias: "Data",
    description: "Dataset origin label used to distinguish records pulled from different source tables",
  },
  {
    id: "ssot",
    alias: "SSOT",
    description: "Single source of truth used as the authoritative system for definitions and reporting",
  },
  {
    id: "sta",
    alias: "Single-Touch Attribution",
    description: "Attribution model that assigns all credit to a single touchpoint",
  },
  {
    id: "tam_sam",
    alias: "TAM/SAM",
    description: "Market sizing that separates total addressable market from the serviceable portion you can realistically win",
  },
  {
    id: "utm",
    alias: "UTM",
    description: "A standard URL parameter used to label inbound traffic for attribution",
  },
  {
    id: "utms",
    alias: "UTMs",
    description: "Standard URL parameters used to label inbound traffic for attribution",
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

export type TermDefinition = (typeof TermDefinitions)[number]
export type TermId = TermDefinition["id"]

const normalize = (s: string) => s.trim().toLowerCase()

const TermIndex = TermDefinitions.reduce<Record<string, TermDefinition>>((acc, term) => {
  for (const token of [term.id, term.alias]) acc[normalize(token)] = term
  return acc
}, {})

export const TermById = Object.freeze(
  TermDefinitions.reduce((acc, term) => {
    acc[term.id] = term
    return acc
  }, {} as Record<TermId, TermDefinition>)
)

/* -------------------------------------------------------------------------- */
/* Export                                                                     */
/* -------------------------------------------------------------------------- */

export const TermTokens = Object.keys(TermIndex)

export function getTermByToken(token: string): TermDefinition | undefined {
  return TermIndex[normalize(token)]
}
