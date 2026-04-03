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
	body: "Browse the governed `source` taxonomy. Use column four to drill into description, vendor, `utms`, or benchmark context.",
	footer: "Hover any metric, term, vendor, or `utm` field for the governed definition.",
	downloadLabel: "Download CSV",
	fieldDropdownLabel: "Select field",
	naLabel: "N/A",
} as const
