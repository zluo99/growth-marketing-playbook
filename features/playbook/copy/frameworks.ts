/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type FrameworkType = "Consulting" | "Data" | "Marketing"
export type FrameworkThemeKey = Lowercase<FrameworkType>

export type FrameworkPillar = {
	name: string
	items: string[]
}

export type FrameworkIcon =
	| "handshake"
	| "layers"
	| "sparkles"
	| "search"
	| "stethoscope"
	| "megaphone"
	| "log-in"
	| "trending-up"
	| "eye-off"
	| "bar-chart-3"
	| "coins"
	| "flask"

export type Framework = {
	id: string
	alias: string
	icon: FrameworkIcon
	type: FrameworkType
	description: string
	pillars: FrameworkPillar[]
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const FrameworkTypeValues = ["Consulting", "Data", "Marketing"] as const satisfies ReadonlyArray<FrameworkType>

export const FrameworkDefinitions: readonly Framework[] = [
	{
		id: "ab-testing",
		alias: "A/B Testing",
		icon: "flask",
		type: "Data",
		description: "**Decision-grade experiments:** run clean tests, quantify lift, and ship learnings safely.",
		pillars: [
			{
				name: "Design",
				items: [
					"**Decision first:** define the action if B wins or loses. If you will not act, do not test.",
					"**One primary metric + guardrails:** pick one outcome (`cvr`, `leads`, `deals`, `arr_from_leads`) plus harm metrics (unsubscribes, complaints, deliverability).",
					"**Eligibility + randomization:** define who is in scope, assignment method, and how you prevent leakage.",
					"**Freeze variants:** no mid test edits. Changes become a new test.",
					"**Pre-register lite:** hypothesis, audience, duration, stop rules, plus a fast `qa` checklist.",
				],
			},
			{
				name: "Evaluate",
				items: [
					"**Funnel order:** touch -> lead -> opportunity -> deal -> revenue. Do not crown early proxies when downstream metrics disagree.",
					"**Lift over vibes:** report treatment vs control and the delta, not just percent change.",
					"**Planned cuts only:** pre-spec segments (`source_l2`, `vertical`, stage) to avoid p-hacking.",
					"**Data health checks:** sample ratio mismatch, tracking breaks, bot spikes, and uneven delivery.",
				],
			},
			{
				name: "Ship",
				items: [
					"**Stop when decision-ready:** minimum sample size plus stable direction across multiple days, not a one day spike.",
					"**Time-box seasonality:** run full week cycles when weekday effects matter.",
					"**Stop for harm fast:** if guardrails break, revert immediately.",
					"**Document + iterate:** winner, loser, effect size, audience, learnings, and the next hypothesis. Store it in the `ssot`.",
				],
			},
		],
	},
	{
		id: "acquisition",
		alias: "Acquisition",
		icon: "handshake",
		type: "Consulting",
		description: "**Deal thesis:** size the market, validate the target, and underwrite synergies.",
		pillars: [
			{
				name: "Market Context",
				items: [
					"**Market size & profit pools:** `tam_sam`, growth momentum, and profit pools by segment.",
					"**Demand & `wtp`:** priority jobs, urgency, and willingness to pay by segment.",
					"**Competitive position & `moat`:** share, positioning, switching costs, and barriers to win.",
				],
			},
			{
				name: "Target Fundamentals",
				items: [
					"**Product & differentiation:** roadmap fit, proof points, lock-in, and customer evidence.",
					"**Operating model & repeatability:** `gtm`, delivery, support, and supply that scale without breaking.",
					"**Financial quality:** revenue mix, margin durability, `cash_conversion`, and `qoe` to normalize one-time items.",
				],
			},
			{
				name: "Synergy Thesis",
				items: [
					"**Revenue synergy:** cross-sell, upsell, geo or segment expansion, and bundling with clear assumptions.",
					"**Cost synergy:** `sga`, stack consolidation, and procurement with timing and one-time costs.",
					"**Integration & risk:** sequencing, culture and retention risk, and execution readiness.",
				],
			},
			{
				name: "Risks and Exit",
				items: [
					"**Regulatory & concentration:** approvals path and reliance on key customers or suppliers.",
					"**Retention & continuity:** customer stickiness and critical talent risk through integration.",
					"**Exit path & returns:** hold vs sell triggers, timeline, and downside guardrails.",
				],
			},
		],
	},
	{
		id: "agent-skills-progressive-disclosure",
		alias: "Progressive Disclosure",
		icon: "layers",
		type: "Data",
		description: "**Progressive disclosure:** keep context lean and load depth on demand.",
		pillars: [
			{
				name: "Principle",
				items: [
					"**Keep context lean:** carry only what you need to choose the next step. Load depth when triggered.",
					"**Progressive disclosure:** stay lightweight by default while enabling depth on demand.",
				],
			},
			{
				name: "Three Levels",
				items: [
					"**Level 1: Metadata:** preload name and description to detect relevance.",
					"**Level 2: Skill body:** load full instructions only when the skill is active.",
					"**Level 3+: Linked resources:** pull references, code, or assets only when needed.",
				],
			},
			{
				name: "Build & Iterate",
				items: [
					"**Close gaps:** start from observed failures and add skills that remove them.",
					"**Name clearly:** use unambiguous names and descriptions so the right skill triggers.",
					"**Deterministic when critical:** use code for parsing, transforms, and extraction.",
				],
			},
		],
	},
	{
		id: "brand-positioning",
		alias: "Brand Positioning",
		icon: "sparkles",
		type: "Marketing",
		description: "**Brand positioning:** define emotional, experiential, functional, and purpose-led edges.",
		pillars: [
			{ name: "Emotional Territory", items: ["Traits and feelings you want the brand to evoke."] },
			{
				name: "Experiential Proof",
				items: ["Signals delivered through the experience such as consistency, convenience, expertise, and service."],
			},
			{ name: "Functional Proof", items: ["Credible, ownable advantages such as quality, design, reliability, and breadth."] },
			{ name: "Purpose", items: ["Commitments beyond profit such as sustainability, inclusion, and cultural impact."] },
		],
	},
	{
		id: "data-scrutinization",
		alias: "Data Scrutinization",
		icon: "search",
		type: "Data",
		description: "**Data scrutiny:** separate signal from noise when a number moves.",
		pillars: [
			{
				name: "Counterfactual",
				items: [
					"**Counterfactual first:** define what would have happened anyway. Isolate lift before assigning credit.",
					"**Experimental design:** use `holdout`, `geo_test`, or `matched_markets`. If you must use pre or post, keep controls.",
				],
			},
			{
				name: "Baseline & Volatility",
				items: [
					"**Comparable windows:** show absolute values alongside percent deltas.",
					"**Volatility check:** flag anomalous comps, one-time effects, and normal variability.",
				],
			},
			{
				name: "Composition",
				items: [
					"**Cut the data:** product, geo, channel, segment, `cohort`, and price or mix.",
					"**Find pockets:** isolate offsets, outliers, or one pocket driving the move.",
				],
			},
			{
				name: "Benchmarks",
				items: [
					"**Context:** market or category growth, peers, plan or forecast, and history.",
					"**Margin lens:** separate margin rate from margin dollars before calling improvement.",
				],
			},
			{
				name: "Signal Quality",
				items: [
					"**Persistence:** confirm across days or weeks, not a one day blip.",
					"**Confidence:** check sample size and uncertainty before calling a signal.",
				],
			},
		],
	},
	{
		id: "diagnose-plays",
		alias: "Diagnose Plays",
		icon: "stethoscope",
		type: "Marketing",
		description: "**Play diagnosis:** find what broke, what worked, and what to do next.",
		pillars: [
			{
				name: "Target & Fit",
				items: [
					"**Audience value vs volume:** prioritize segments that support `ltv` and margin, not volume alone.",
					"**`pmf` & message:** match the use case to creative and proof that the segment trusts.",
					"**Routing & handoffs:** audit lead quality, follow-up speed, and operational blockers.",
				],
			},
			{
				name: "Economics & Performance",
				items: [
					"**Unit economics:** `cost_per_lead`, `cost_per_opportunity`, `cost_per_deal` vs `ltv` or `arr`, plus `payback`.",
					"**Conversion breakpoints:** `cvr`, `lead_to_opp_cvr`, `opp_to_deal_cvr`.",
					"**Channel health:** watch for saturation and structural issues such as rising cost with flat conversion.",
				],
			},
			{
				name: "Brand & Incrementality",
				items: [
					"**Measured lift:** `incremental_lift`, `incremental_lift_deals`, and `incremental_lift_arr` from geo and holdout designs.",
					"**Create vs capture:** confirm lift justifies incremental spend vs cannibalization.",
					"**Halo effects:** quantify impact on brand, search, and adjacent channels.",
				],
			},
		],
	},
	{
		id: "media-planning-buying",
		alias: "Media Planning & Buying",
		icon: "megaphone",
		type: "Marketing",
		description: "**Plan & buy:** strategy, execution, and measurement without noise.",
		pillars: [
			{
				name: "Media Planning",
				items: [
					"**Objective & role:** awareness vs consideration vs conversion, with clear success metrics.",
					"**Audience strategy:** segments, intent, exclusions, and frequency control.",
					"**Budget & phasing:** always on vs bursts, seasonal weighting, and reach goals.",
					"**Mix & overlap:** manage channel mix, overlap, and saturation guardrails.",
					"**Measurement plan:** primary `kpis`, lift design such as `holdout` or `geo_test`, and attribution guardrails.",
				],
			},
			{
				name: "Media Buying",
				items: [
					"**Inventory & placement:** direct, programmatic, social, and search, plus brand safety controls.",
					"**Bidding & pacing:** `cpm`, `cpc`, and `cpa` targets, bid caps, dayparting, and frequency.",
					"**Optimization loop:** rotate creative, prune audiences and placements, and fix the landing experience.",
					"**`qa` & post-buy:** fraud, viewability, suitability, delivery reconciliation, and documented learnings.",
				],
			},
		],
	},
	{
		id: "entry",
		alias: "Entry",
		icon: "log-in",
		type: "Consulting",
		description: "**Market entry:** validate attractiveness, economics, and right to win before committing.",
		pillars: [
			{
				name: "Market Attractiveness",
				items: [
					"**Market size & profit pools:** `tam_sam`, growth, and profit pools by segment.",
					"**Demand & `wtp`:** priority jobs, unmet needs, and willingness to pay sensitivity.",
					"**Structure & barriers (`five_forces`):** rivalry, entrants, substitutes, suppliers, and buyers.",
				],
			},
			{
				name: "Entry Economics",
				items: [
					"**Revenue model & `payback`:** price, volume, adoption ramp, and `payback` math.",
					"**Investment & talent:** fixed vs variable, `capex`, `opex`, and scarce skills required.",
					"**Breakeven & sensitivity:** breakpoints, scenarios, and downside protection.",
				],
			},
			{
				name: "Fit & Advantage",
				items: [
					"**Right to win:** brand and product proof vs incumbents.",
					"**Route to market:** channels, partners, and distribution access.",
					"**Defensibility:** differentiation, switching costs, network effects, and `ip` when it is real.",
				],
			},
		],
	},
	{
		id: "growth",
		alias: "Growth",
		icon: "trending-up",
		type: "Consulting",
		description: "**Growth strategy:** pick where to play and how to scale with confidence.",
		pillars: [
			{
				name: "Market",
				items: [
					"**Segments & needs:** behaviors, use cases, and value drivers.",
					"**Position & share:** whitespace vs rivals, differentiation, and pricing power.",
					"**Tailwinds & headwinds:** macro factors, seasonality, and demand cycles.",
				],
			},
			{
				name: "Client Foundations",
				items: [
					"**Product & roadmap:** performance, bets, attach, and cannibalization risk.",
					"**Capabilities & capacity:** org, ops, tech, and capital to scale.",
					"**Proof & right to win:** evidence of `pmf`, differentiation, and credible proof points.",
				],
			},
			{
				name: "Growth Paths",
				items: [
					"**Deepen core:** penetration, retention, and usage, plus `arpa` with existing customers.",
					"**New customers and markets:** segments, geos, and channels prioritized by reach and efficiency.",
					"**New offerings:** products and bundles, pricing and mix moves, and test and learn.",
					"**Value capture:** pricing and packaging that protect margin.",
				],
			},
		],
	},
	{
		id: "incrementality-attribution-illusion",
		alias: "Incrementality & Attribution Illusion",
		icon: "eye-off",
		type: "Marketing",
		description: "**Incrementality proof:** avoid attribution traps and prove true lift.",
		pillars: [
			{
				name: "Observed Reality",
				items: [
					"**Flat results after spend cuts:** low `incrementality` when revenue and customers do not fall.",
					"**Stable new customer volume:** demand converts without paid exposure.",
					"**Profit lifts when spend drops:** signals over-investment.",
				],
			},
			{
				name: "Attribution Traps",
				items: [
					"**Branded search bias:** high intent demand inflates `roas`.",
					"**Capture vs create:** dashboards reward capture over creation.",
					"**Last-touch bias:** over-credits lower funnel channels, especially without a counterfactual.",
				],
			},
			{
				name: "How to Prove",
				items: [
					"**Experiments:** `geo_test` and `holdout` to establish a counterfactual.",
					"**Lift over platform credit:** judge channels on `incremental_lift`, not platform attribution.",
					"**Split roles:** separate demand creation from demand capture.",
				],
			},
			{
				name: "Strategic Implications",
				items: [
					"**Harvest vs create:** treat branded search as harvesting unless proven incremental.",
					"**Rebalance budgets:** upper funnel is under-credited. Adjust spend based on measured lift.",
					"**Decide on profit + lift:** not `roas` alone.",
				],
			},
		],
	},
	{
		id: "performance-analysis",
		alias: "Performance Analysis",
		icon: "bar-chart-3",
		type: "Marketing",
		description: "**Performance analysis:** isolate the drivers of channel and campaign results.",
		pillars: [
			{
				name: "Cost & Delivery",
				items: [
					"**Spend lens:** `total_spend` by `spend_type`, `vendor`, and source (`source_l1`, `source_l2`, `source_l3`).",
					"**Delivery & engagement:** `impressions`, `reach`, `clicks`, `ctr`, `landing_pageviews`, `pageviews`, `session_duration`.",
				],
			},
			{
				name: "Revenue & Funnel",
				items: [
					"**Outcome stack:** `leads`, `opportunities`, `deals`, `arr`, or `arr_from_leads` for cohorting.",
					"**Funnel breakpoints:** `cvr`, `lead_to_opp_cvr`, `opp_to_deal_cvr`, `sales_cycle_time`.",
					"**Efficiency:** `roas`, `cac`, `cost_per_lead`, `cost_per_opportunity`, `cost_per_deal`.",
				],
			},
			{
				name: "Action",
				items: [
					"**Reallocate:** fund where expected value beats cost. Track `cost_per_lead` and `cost_per_deal` vs `ltv` and `arr`.",
					"**Pause or taper:** when returns fade, such as rising `cost_per_lead` with flat `cvr`.",
					"**Guardrails:** use `payback` and `incremental_lift_arr` to scale with confidence.",
				],
			},
		],
	},
	{
		id: "profitability",
		alias: "Profitability",
		icon: "coins",
		type: "Consulting",
		description: "**Profit engine:** dissect revenue, costs, and position to protect and expand margin.",
		pillars: [
			{
				name: "Revenue Drivers",
				items: [
					"**Price & mix:** realization, discounting, elasticity, and product mix.",
					"**Volume & pipeline:** demand drivers, conversion, retention, and `churn`.",
					"**Quality of growth:** recurring vs one-time, cohort health, and durability.",
					"**Value capture:** upsell, cross-sell, attach, and yield by segment.",
				],
			},
			{
				name: "Cost Structure",
				items: [
					"**Fixed vs variable:** leverage, breakpoints, and capital intensity.",
					"**Unit economics:** `gross_margin`, contribution, and fully loaded per unit.",
					"**Productivity:** labor and ops productivity, automation, and waste reduction.",
					"**Overhead discipline:** `sga` efficiency, vendor spend, and working capital.",
				],
			},
			{
				name: "Market Position",
				items: [
					"**Competitive position:** share, differentiation, whitespace, and pricing power.",
					"**Customer concentration:** reliance on key accounts and exposure risk.",
					"**`moat`:** barriers to entry, switching costs, and ecosystem strength.",
					"**Right to win:** brand, distribution access, and `ip` that sustain returns.",
				],
			},
		],
	},
] as const

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export const FrameworkPillarKey = (framework_id: string, pillar_name: string) => `${framework_id}::${pillar_name}`

/* -------------------------------------------------------------------------- */
/* UI Copy Types                                                              */
/* -------------------------------------------------------------------------- */

type InfoMap = Record<string, string>

export type FrameworkFilterValue = "all" | FrameworkType

type FrameworksUiCopy = {
	fallbackDescription: string
	filtersGroupLabel: string
	filterBarLabel: string
	columnsBarLabel: string
	pillarDetailsLabel: string
}

/* -------------------------------------------------------------------------- */
/* UI Copy Constants                                                          */
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
/* UI Copy: Info Map (alphabetical keys)                                      */
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

	"framework:diagnose-plays:pillar:Brand & Incrementality":
		"Validate `incremental_lift` and whether the play creates or captures demand.",
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
		"Prove causality with `geo_test` or `holdout` against a counterfactual.",
	"framework:incrementality-attribution-illusion:pillar:Observed Reality":
		"What happened when spend changed: revenue, customers, and profit.",
	"framework:incrementality-attribution-illusion:pillar:Strategic Implications":
		"How budgets and channel roles should shift once `incrementality` is understood.",

	"framework:media-planning-buying:pillar:Media Buying":
		"Execute in-platform with bidding, optimization, `qa`, and reconciliation.",
	"framework:media-planning-buying:pillar:Media Planning":
		"Set objective, audience, budget, mix, and `kpis` before spend.",

	"framework:performance-analysis:pillar:Action":
		"Reallocate, pause, or scale using `roas`, `payback`, and `incremental_lift_arr`.",
	"framework:performance-analysis:pillar:Cost & Delivery": "Validate spend and delivery before debating outcomes.",
	"framework:performance-analysis:pillar:Revenue & Funnel":
		"Track `leads` -> `opportunities` -> `deals` and resulting `arr`.",

	"framework:profitability:pillar:Cost Structure": "**Cost structure:** fixed vs variable costs and unit economics.",
	"framework:profitability:pillar:Market Position": "**Position:** competitive dynamics, differentiation, and concentration risk.",
	"framework:profitability:pillar:Revenue Drivers": "**Revenue drivers:** how price, mix, and volume create revenue.",
}

