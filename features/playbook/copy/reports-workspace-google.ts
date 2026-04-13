type GoogleWorkspaceCard = {
	embedUrl: string
	openUrl: string
	openLabel: string
	title: string
	body: string
}

type WorkspaceUiCopy = {
	preloadSheetsTitle: string
	preloadSlidesTitle: string
}

export const SheetsCopy: GoogleWorkspaceCard = {
	embedUrl: "https://docs.google.com/spreadsheets/d/1gfEyBNJNBhaAYyBfr5a6p3bF9hqwhSHioTN43k_rZFI/view?rm=minimal",
	openUrl: "https://docs.google.com/spreadsheets/d/1gfEyBNJNBhaAYyBfr5a6p3bF9hqwhSHioTN43k_rZFI/view?usp=sharing",
	openLabel: "Open",
	title: "Operating report (Sheets)",
	body: "Use one shared operating report. This sample Sheet consumes the same CSV exports produced in {reports-sql}.",
} as const

export const SlidesCopy: GoogleWorkspaceCard = {
	embedUrl: "https://docs.google.com/presentation/d/1iTLKJVf6hTCRc_KP_1LwfVQ6oYzNd55pqWh-LTgT0KQ/embed?start=false&loop=false&delayms=3000",
	openUrl: "https://docs.google.com/presentation/d/1iTLKJVf6hTCRc_KP_1LwfVQ6oYzNd55pqWh-LTgT0KQ/view?usp=sharing",
	openLabel: "Open",
	title: "Decision deck (Slides)",
	body: "Use a deck to turn the report into decisions, risks, and next moves. This sample Slides deck imports directly from Sheets.",
} as const

export const WorkspaceUiCopy: WorkspaceUiCopy = {
	preloadSheetsTitle: "sheets-preload",
	preloadSlidesTitle: "slides-preload",
} as const
