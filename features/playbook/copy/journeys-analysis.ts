type AnalysisPanelId = `${number}`

export type AnalysisPanel = {
	id: AnalysisPanelId
	title: string
	body: string
	bullets: readonly string[]
}

export type AnalysisDiagram = {
	prospect_id: string
	objects: readonly {
		object_id: string
		object_type: string
	}[]
	touches: readonly {
		touch_id: string
		object_id: string
	}[]
}

type AnalysisCard = {
	title: string
	body: string
	panels: readonly AnalysisPanel[]
	diagram: AnalysisDiagram
	rSnippet: string
	ui: {
		analysisItemLabel: string
		snippetTitle: string
		snippetOpenButtonLabel: string
		snippetOpenButtonAria: string
		snippetCloseButtonAria: string
		snippetCopyButtonLabel: string
		snippetCopyButtonLabelCopied: string
		snippetCopyButtonAria: string
		snippetCopyButtonAriaCopied: string
	}
}

export const AnalysisCopy: AnalysisCard = {
	title: "Journey analysis",
	body: "Build `mta` in order: stabilize `object_model`, stabilize `touch_model`, then analyze one governed `object_touch_model` base.",

	panels: [
		{
			id: "1",
			title: "Unify objects",
			body: "Set the identity layer first.",
			bullets: [
				"Anchor the `identity_graph` on `prospect_id`, then map one-to-many `object_id` records such as lead, opportunity, and deal.",
				"Standardize `source` and `utms` once in `object_model` so downstream cuts stay consistent.",
			],
		},
		{
			id: "2",
			title: "Unify touches",
			body: "Build one ordered touch stream.",
			bullets: [
				"Normalize tasks, meetings, emails, and pageviews into one `touch_model` keyed by `touch_id`.",
				"Map each `touch_id` to one `object_id`, then inherit `prospect_id` through the object relationship.",
			],
		},
		{
			id: "3",
			title: "Analyze from one model",
			body: "Compare models without drift.",
			bullets: [
				"Run first-touch, last-touch, decay, and `markov_model` from the same `object_touch_model` base.",
				"Normalize columns once, then materialize one governed journey base aligned to `object_touch_model`.",
				"Rank leverage with `removal_effect`, top `journey_path` volume, and `cvr` by `touch_count`.",
				"Ship guardrails beside every output: path volume, a `source_l2` cut at `prospect_id`, and model assumptions.",
			],
		},
	],

	diagram: {
		prospect_id: "deal-044",
		objects: [
			{ object_id: "L-991", object_type: "lead" },
			{ object_id: "O-203", object_type: "opportunity" },
			{ object_id: "D-044", object_type: "deal" },
		],
		touches: [
			{ touch_id: "touch-formsubmit-100", object_id: "L-991" },
			{ touch_id: "touch-meeting-245", object_id: "L-991" },
			{ touch_id: "touch-emailreply-389", object_id: "O-203" },
		],
	},

	rSnippet: `
library(dplyr)
library(readr)
library(stringr)
library(ChannelAttribution)

# Goal: produce one prospect-level journey dataset, then score path leverage and guardrails.
# Input can be object-level or touch-level; we standardize and aggregate to prospect-level.

# 1) Ingest one CSV and normalize expected field names (case variants only).
raw <- read_csv("sales-cycle-master.csv", show_col_types = FALSE) %>%
  rename(
    prospect_id = any_of(c("prospect_id", "PROSPECT_ID")),
    journey_path = any_of(c("journey_path", "JOURNEY_PATH")),
    is_converted = any_of(c("is_converted", "IS_CONVERTED")),
    touch_count = any_of(c("touch_count", "TOUCH_COUNT")),
    source_l2 = any_of(c("source_l2", "SOURCE_L2"))
  )

# Hard-stop early if required canonical fields are missing.
# Note: source_l2 is optional and handled in a conditional output block below.
required_cols <- c("prospect_id", "journey_path", "is_converted", "touch_count")
missing_cols <- setdiff(required_cols, names(raw))
if (length(missing_cols) > 0) {
  stop(paste("Missing required columns:", paste(missing_cols, collapse = ", ")))
}

# Parse common truthy variants into a strict boolean conversion flag.
to_bool <- function(x) {
  if (is.logical(x)) return(x)
  x_chr <- tolower(trimws(as.character(x)))
  x_chr %in% c("true", "t", "1", "yes", "y")
}

# Reduce repeated consecutive steps so paths are comparable for Markov analysis.
collapse_consecutive <- function(path) {
  parts <- str_split(path, " > ", simplify = FALSE)[[1]]
  parts <- parts[parts != ""]
  if (length(parts) == 0) return(NA_character_)
  paste(parts[c(TRUE, parts[-1] != parts[-length(parts)])], collapse = " > ")
}

# 2) Clean types, enforce non-null required fields, and standardize path delimiters.
d <- raw %>%
  mutate(
    prospect_id = as.character(prospect_id),
    journey_path = str_squish(as.character(journey_path)),
    journey_path = str_replace_all(journey_path, "\\\\s*>\\\\s*", " > "),
    is_converted = to_bool(is_converted),
    touch_count = as.numeric(gsub(",", "", as.character(touch_count)))
  ) %>%
  filter(!is.na(prospect_id), !is.na(journey_path), !is.na(is_converted), !is.na(touch_count)) %>%
  mutate(
    journey_path_reduced = vapply(journey_path, collapse_consecutive, character(1))
  ) %>%
  filter(!is.na(journey_path_reduced))

# 3) Collapse to one record per prospect_id.
# Assumption: keep the path from the row with the highest touch_count for that prospect.
# Conversion is prospect-level OR across rows; source_l2 keeps first non-empty value.
d <- d %>%
  group_by(prospect_id) %>%
  arrange(desc(touch_count), .by_group = TRUE) %>%
  summarise(
    journey_path_reduced = first(journey_path_reduced),
    is_converted = any(is_converted, na.rm = TRUE),
    touch_count = max(touch_count, na.rm = TRUE),
    source_l2 = first(source_l2[!is.na(source_l2) & source_l2 != ""], default = NA_character_),
    .groups = "drop"
  )

# Insight 1: Top pathways by volume, with CVR attached.
top_paths <- d %>%
  count(journey_path_reduced, sort = TRUE) %>%
  slice_head(n = 10) %>%
  left_join(
    d %>%
      group_by(journey_path_reduced) %>%
      summarise(cvr = mean(is_converted), .groups = "drop"),
    by = "journey_path_reduced"
  )

# Insight 2: CVR by touch-depth buckets.
touch_cvr <- d %>%
  mutate(
    touch_count_bucket = case_when(
      touch_count <= 2 ~ "1-2",
      touch_count <= 5 ~ "3-5",
      touch_count <= 8 ~ "6-8",
      TRUE ~ "9+"
    )
  ) %>%
  group_by(touch_count_bucket) %>%
  summarise(
    n = n(),
    cvr = mean(is_converted),
    .groups = "drop"
  ) %>%
  arrange(touch_count_bucket)

# Insight 3: Performance by source_l2 (optional field).
source_l2_cvr <- if ("source_l2" %in% names(d)) {
  d %>%
    filter(!is.na(source_l2), source_l2 != "") %>%
    group_by(source_l2) %>%
    summarise(
      n = n(),
      cvr = mean(is_converted),
      .groups = "drop"
    ) %>%
    arrange(desc(n))
} else {
  tibble::tibble(source_l2 = character(), n = numeric(), cvr = numeric())
}

# Insight 4: Markov removal effect on reduced prospect-level paths.
# var_value uses the same binary conversion flag so model output is conversion-impact oriented.
markov_out <- markov_model(
  Data = d,
  var_path = "journey_path_reduced",
  var_conv = "is_converted",
  var_value = "is_converted",
  out_more = TRUE
)

removal_effect <- markov_out$removal_effects %>%
  arrange(desc(removal_effects_conversion)) %>%
  slice_head(n = 10)

top_paths
touch_cvr
source_l2_cvr
removal_effect
`.trim(),
	ui: {
		analysisItemLabel: "Step {n}",
		snippetTitle: "R snippet",
		snippetOpenButtonLabel: "Open R snippet",
		snippetOpenButtonAria: "Open R snippet popup",
		snippetCloseButtonAria: "Close R snippet popup",
		snippetCopyButtonLabel: "Copy",
		snippetCopyButtonLabelCopied: "Copied",
		snippetCopyButtonAria: "Copy to clipboard",
		snippetCopyButtonAriaCopied: "Copied to clipboard",
	},
} as const
