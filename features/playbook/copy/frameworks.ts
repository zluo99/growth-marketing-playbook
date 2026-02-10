/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import { FrameworkTypeValues, type FrameworkType } from "@/features/playbook/definitions/frameworks"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type InfoMap = Record<string, string>

export type FrameworkFilterValue = "all" | FrameworkType

export type FrameworksUiCopy = {
	fallbackDescription: string
	filtersGroupLabel: string
	filterBarLabel: string
	columnsBarLabel: string
	pillarDetailsLabel: string
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const framework_type_options = FrameworkTypeValues.map((value) => ({ v: value, label: value })) as ReadonlyArray<{
	v: FrameworkType
	label: string
}>

export const FrameworkFilterOptions = [{ v: "all", label: "All" }, ...framework_type_options] as const satisfies ReadonlyArray<{
	v: FrameworkFilterValue
	label: string
}>

export const FrameworksUiCopy: FrameworksUiCopy = {
	fallbackDescription: "Pillars and prompts.",
	filtersGroupLabel: "Frameworks filters",
	filterBarLabel: "Framework filter",
	columnsBarLabel: "Columns",
	pillarDetailsLabel: "{pillar} details",
}

/* -------------------------------------------------------------------------- */
/* Custom: Info map (alphabetical keys)                                       */
/* -------------------------------------------------------------------------- */

export const FrameworkInfoCopy: InfoMap = {
	"framework:ab-testing:pillar:Design":
		"Design for a decision: define the action, pick one primary metric plus guardrails, confirm eligibility and randomization, then freeze variants.",
	"framework:ab-testing:pillar:Evaluate":
		"Evaluate lift in funnel order and validate data health before calling a winner. Segment only when pre-planned.",
	"framework:ab-testing:pillar:Ship":
		"Stop when decision-ready or for harm, then document the result and roll the learning into the next hypothesis.",

	"framework:acquisition:pillar:Market Context": "**Market context:** size and growth, demand, and competitive intensity.",
	"framework:acquisition:pillar:Risks and Exit": "**Risks & exit:** downside scenarios, timing, and the exit path.",
	"framework:acquisition:pillar:Synergy Thesis": "**Synergy thesis:** value creation via revenue upside and cost leverage.",
	"framework:acquisition:pillar:Target Fundamentals": "**Target fundamentals:** product strength, scalability, and financial quality.",

	"framework:agent-skills-progressive-disclosure:pillar:Build & Iterate": "Improve from failures and make triggers unambiguous.",
	"framework:agent-skills-progressive-disclosure:pillar:Principle": "Load only what you need now and pull depth when useful.",
	"framework:agent-skills-progressive-disclosure:pillar:Three Levels": "Metadata first, full skill next, linked assets last.",

	"framework:brand-positioning:pillar:Emotional Territory": "How you want people to feel about the brand.",
	"framework:brand-positioning:pillar:Experiential Proof": "Proof delivered through the product and service experience.",
	"framework:brand-positioning:pillar:Functional Proof": "Benefits you can credibly own and defend.",
	"framework:brand-positioning:pillar:Purpose": "Values and commitments beyond profit.",

	"framework:data-scrutinization:pillar:Baseline & Volatility": "Use comparable windows and account for normal variability.",
	"framework:data-scrutinization:pillar:Benchmarks": "Add context from market, peers, plan, and history.",
	"framework:data-scrutinization:pillar:Composition": "Break down the data to isolate what is actually moving.",
	"framework:data-scrutinization:pillar:Counterfactual": "Define what would have happened anyway before assigning credit.",
	"framework:data-scrutinization:pillar:Signal Quality": "Confirm persistence and validate confidence.",

	"framework:diagnose-plays:pillar:Brand & Incrementality": "Measured lift and whether the play creates or captures demand.",
	"framework:diagnose-plays:pillar:Economics & Performance": "Unit economics and conversion performance by stage.",
	"framework:diagnose-plays:pillar:Target & Fit": "Audience value, `pmf`, and targeting and messaging fit.",

	"framework:entry:pillar:Entry Economics": "**Economics:** revenue ramp, pricing, costs, and breakeven timing.",
	"framework:entry:pillar:Fit & Advantage": "**Right to win:** brand and product fit, `gtm` access, and defensibility.",
	"framework:entry:pillar:Market Attractiveness": "**Attractiveness:** demand, size and growth, and competitive intensity.",

	"framework:growth:pillar:Client Foundations": "**Foundations:** product strength plus the capacity to scale.",
	"framework:growth:pillar:Growth Paths": "**Growth paths:** deepen core, win new customers and markets, and expand offerings.",
	"framework:growth:pillar:Market": "**Market:** customer needs, competition, and category tailwinds and headwinds.",

	"framework:incrementality-attribution-illusion:pillar:Attribution Traps":
		"Why attribution systems structurally over-credit certain channels.",
	"framework:incrementality-attribution-illusion:pillar:How to Prove":
		"How to isolate causal impact with experiments and a counterfactual.",
	"framework:incrementality-attribution-illusion:pillar:Observed Reality":
		"What happened when spend changed: revenue, customers, and profit.",
	"framework:incrementality-attribution-illusion:pillar:Strategic Implications":
		"How budgets and channel roles should shift once `incrementality` is understood.",

	"framework:media-planning-buying:pillar:Media Buying":
		"Execute in-platform with bidding, optimization, `qa`, and reconciliation.",
	"framework:media-planning-buying:pillar:Media Planning":
		"Define objective, audience, budget, mix, and measurement before spend.",

	"framework:performance-analysis:pillar:Action": "Decide to reallocate, pause, or scale based on return and risk.",
	"framework:performance-analysis:pillar:Cost & Delivery": "Validate spend and delivery before debating outcomes.",
	"framework:performance-analysis:pillar:Revenue & Funnel": "Track outcomes and conversion across the funnel.",

	"framework:profitability:pillar:Cost Structure": "**Cost structure:** fixed vs variable costs and unit economics.",
	"framework:profitability:pillar:Market Position": "**Position:** competitive dynamics, differentiation, and concentration risk.",
	"framework:profitability:pillar:Revenue Drivers": "**Revenue drivers:** how price, mix, and volume create revenue.",
}

