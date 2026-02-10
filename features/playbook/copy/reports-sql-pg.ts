export type PgPresetId = "funnel_monthly" | "funnel_monthly_roi" | "funnel_weekly"
export type PgPreset<K extends string> = { id: K; description: string; code: string }

export type PgCopy = {
	title: string
	body: string
	icon: "code"
	labels: {
		run_btn_running: string
		run_btn_ready: string
		run_btn_not_ready: string
		download_btn: string
		editor_title: string
		editor_help: string
		viewer_title: string
		viewer_help: string
		empty_success_no_rows: string
		empty_no_result: string
		run_error_generic: string
		download_default_name: string
	}
	ui: {
		resize: {
			label: string
			widthsLabel: string
		}
		resultsToggle: {
			showPreviewOnly: string
			showAllRows: string
		}
	}
}

export const PgCopy: PgCopy = {
	title: "SQL playground",
	body: "Run queries using the available tables (spoofed data from 2020-01-01 to 2022-12-31). Results use standardized metrics (e.g. `source`, `spend_type`, `arr`, `roas`) from the shared `semantic_model`.",
	icon: "code",
	labels: {
		run_btn_running: "Running query...",
		run_btn_ready: "Run query",
		run_btn_not_ready: "Load preset and run",
		download_btn: "Download CSV",
		editor_title: "SQL editor",
		editor_help: "Start from a preset or write your own query, then run it.",
		viewer_title: "Results",
		viewer_help: "Run a query to see results; empty sets still mean success.",
		empty_success_no_rows: "Query succeeded but returned no rows.",
		empty_no_result: "No results yet. Run a query to view them.",
		run_error_generic: "SQL error",
		download_default_name: "query",
	},
	ui: {
		resize: {
			label: "Resize editor and results panels",
			widthsLabel: "Resize SQL editor and results widths",
		},
		resultsToggle: {
			showPreviewOnly: "Show preview only",
			showAllRows: "Show all {n} rows",
		},
	},
} as const

export const PgPresets = [
	{
		id: "funnel_monthly",
		description: "Monthly funnel by source and vertical with lead, opportunity, and deal counts plus deal ARR.",
		code: `
-- file: funnel_monthly.sql
SELECT
	DATE(SUBSTR(object_created_date, 1, 7) || '-01') AS month
	, source_l1
	, source_l2
	, source_l3
	, vertical
	, COUNT(DISTINCT CASE WHEN object_type = 'Lead' THEN object_id END) AS leads
	, COUNT(DISTINCT CASE WHEN object_type = 'Opportunity' THEN object_id END) AS opportunities
	, COUNT(DISTINCT CASE WHEN object_type = 'Deal' THEN object_id END) AS deals
	, SUM(CASE WHEN object_type = 'Deal' THEN arr ELSE NULL END) AS arr
FROM funnel_uncohorted
GROUP BY 1, 2, 3, 4, 5
ORDER BY 1, 2, 3, 4, 5
;`.trim(),
	},
	{
		id: "funnel_monthly_roi",
		description: "Monthly spend and lead-cohort outcomes by source and vendor with conversion rates, ARR, and LTV.",
		code: `
-- file: funnel_monthly_roi.sql
SELECT
	'funnel_spend' AS data
	, DATE(SUBSTR(spend_date, 1, 7) || '-01') AS month
	, spend_type
	, source_l1
	, source_l2
	, source_l3
	, vendor
	, SUM(spend) AS spend
	, NULL AS leads
	, NULL AS lead_to_opp_cvr
	, NULL AS opportunities_from_leads
	, NULL AS opp_to_deal_cvr
	, NULL AS deals_from_leads
	, NULL AS arr_from_leads
	, NULL AS ltv_from_leads
FROM funnel_spend
GROUP BY 1, 2, 3, 4, 5, 6, 7

UNION ALL

SELECT
	'funnel_cohorted' AS data
	, DATE(SUBSTR(lead_created_date, 1, 7) || '-01') AS month
	, NULL AS spend_type
	, source_l1
	, source_l2
	, source_l3
	, vendor
	, NULL AS spend
	, COUNT(DISTINCT lead_id) AS leads
	, 1.0 * SUM(opportunities_from_leads)/NULLIF(COUNT(DISTINCT lead_id), 0) AS lead_to_opp_cvr
	, SUM(opportunities_from_leads) AS opportunities_from_leads
	, 1.0 * SUM(deals_from_leads)/NULLIF(SUM(opportunities_from_leads), 0) AS opp_to_deal_cvr
	, SUM(deals_from_leads) AS deals_from_leads
	, SUM(arr_from_leads) AS arr_from_leads
	, SUM(ltv_from_leads) AS ltv_from_leads
FROM funnel_cohorted
GROUP BY 1, 2, 3, 4, 5, 6, 7
ORDER BY 1, 2, 3, 4, 5, 6, 7
;`.trim(),
	},
	{
		id: "funnel_weekly",
		description: "Weekly funnel by source and vertical for 2020 with Sunday week starts.",
		code: `
-- file: funnel_weekly.sql
-- Week starts Sunday. Filter source data to full-year 2020.
SELECT
	DATE(
		DATE(object_created_date)
		, '-' || CAST(STRFTIME('%w', DATE(object_created_date)) AS INTEGER) || ' days'
	) AS week_start
	, source_l1
	, source_l2
	, source_l3
	, vertical
	, COUNT(DISTINCT CASE WHEN object_type = 'Lead' THEN object_id END) AS leads
	, COUNT(DISTINCT CASE WHEN object_type = 'Opportunity' THEN object_id END) AS opportunities
	, COUNT(DISTINCT CASE WHEN object_type = 'Deal' THEN object_id END) AS deals
	, SUM(CASE WHEN object_type = 'Deal' THEN arr ELSE NULL END) AS arr
FROM funnel_uncohorted
WHERE DATE(object_created_date) >= DATE('2020-01-01')
	AND DATE(object_created_date) <= DATE('2020-12-31')
GROUP BY 1, 2, 3, 4, 5
ORDER BY 1, 2, 3, 4, 5
;`.trim(),
	},
] as const satisfies readonly PgPreset<PgPresetId>[]

export const PgDefaultSql = PgPresets[0].code
