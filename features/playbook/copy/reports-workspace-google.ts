export type GoogleWorkspaceCard = {
	embedUrl: string
	openUrl: string
	openLabel: string
	title: string
	body: string
}

export type WorkspaceUiCopy = {
	preloadSheetsTitle: string
	preloadSlidesTitle: string
}

export const SheetsCopy: GoogleWorkspaceCard = {
	embedUrl: "https://docs.google.com/spreadsheets/d/1gfEyBNJNBhaAYyBfr5a6p3bF9hqwhSHioTN43k_rZFI/view?rm=minimal",
	openUrl: "https://docs.google.com/spreadsheets/d/1gfEyBNJNBhaAYyBfr5a6p3bF9hqwhSHioTN43k_rZFI/view?usp=sharing",
	openLabel: "Open",
	title: "Reporting layer (Sheets)",
	body: "Use a master report as the shared readout. Here, I've embedded a sample Google Sheets based on the prior tab's CSV exports:",
} as const

export const SlidesCopy: GoogleWorkspaceCard = {
	embedUrl: "https://docs.google.com/presentation/d/1iTLKJVf6hTCRc_KP_1LwfVQ6oYzNd55pqWh-LTgT0KQ/embed?start=false&loop=false&delayms=3000",
	openUrl: "https://docs.google.com/presentation/d/1iTLKJVf6hTCRc_KP_1LwfVQ6oYzNd55pqWh-LTgT0KQ/view?usp=sharing",
	openLabel: "Open",
	title: "Presentation layer (Slides)",
	body: "Use a deck for decision-ready narratives. Here, I've embedded a sample Google Slides that can import directly from the Google Sheets:",
} as const

export const WorkspaceUiCopy: WorkspaceUiCopy = {
	preloadSheetsTitle: "sheets-preload",
	preloadSlidesTitle: "slides-preload",
} as const
