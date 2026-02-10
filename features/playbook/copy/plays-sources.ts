export type SourcesCard = {
	title: string
	body: string
	footer: string
	downloadLabel: string
	segmentToggle: {
		ariaLabel: string
		toB2B: string
		toB2C: string
		labelB2B: string
		labelB2C: string
	}
	fieldDropdownLabel: string
	fieldInfoAriaLabel: string
	naLabel: string
}

export const SourcesCopy: SourcesCard = {
	title: "Sources",
	body: "Browse the canonical `source` taxonomy. Use the fourth column to explore.",
	footer: "Hover over metrics, terms, and `utms` for details.",
	downloadLabel: "Download CSV",
	segmentToggle: {
		ariaLabel: "Toggle segment benchmarks",
		toB2B: "Switch to B2B benchmarks",
		toB2C: "Switch to B2C benchmarks",
		labelB2B: "B2B",
		labelB2C: "B2C",
	},
	fieldDropdownLabel: "Select field",
	fieldInfoAriaLabel: "Field info",
	naLabel: "N/A",
} as const
