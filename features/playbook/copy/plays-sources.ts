export type SourcesCard = {
	title: string
	body: string
	footer: string
	downloadLabel: string
	fieldDropdownLabel: string
	naLabel: string
}

export const SourcesCopy: SourcesCard = {
	title: "Sources",
	body: "Browse the canonical `source` taxonomy. Use column four to drill in.",
	footer: "Hover metrics, terms, and `utms` for definitions.",
	downloadLabel: "Download CSV",
	fieldDropdownLabel: "Select field",
	naLabel: "N/A",
} as const
