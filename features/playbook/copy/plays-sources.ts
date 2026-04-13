type SourcesCard = {
	title: string
	body: string
	downloadLabel: string
	expandL1Label: string
	expandL2Label: string
	collapseL1Label: string
	collapseL2Label: string
	collapseToL1Label: string
	fieldDropdownLabel: string
	naLabel: string
}

export const SourcesCopy: SourcesCard = {
	title: "Sources",
	body: "Browse the governed `source` taxonomy. Use the fourth column to inspect description, vendor, `utms`, or benchmark context.",
	downloadLabel: "Download CSV",
	expandL1Label: "Expand all Source L1",
	expandL2Label: "Expand all Source L2",
	collapseL1Label: "Collapse all Source L1",
	collapseL2Label: "Collapse all Source L2",
	collapseToL1Label: "Collapse to Source L1",
	fieldDropdownLabel: "Select field",
	naLabel: "N/A",
} as const
