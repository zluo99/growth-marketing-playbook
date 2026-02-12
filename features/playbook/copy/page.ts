/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type BrandCopy = {
	title: string
	byline: string
}

export type HeaderContentCopy = {
	linkedinUrl: string
	email: string
}

export type TabsNavCopy = {
	prevLabel: string
	nextLabel: string
}

export type FooterCopy = {
	brandTitle: string
	brandMarkAlt: string
	disclaimer: string
	themeLabel: string
	themeOptions: {
		light: string
		system: string
		dark: string
	}
	emailLabel: string
	linkedinLabel: string
}

export type HeaderNavCopy = {
	homeButtonAria: string
	homeImageAlt: string
	tabsLabel: string
	scrollLeftAria: string
	scrollRightAria: string
}

export type SearchCopy = {
	placeholder: string
	ariaLabel: string
	closeButtonAria: string
	resultsAriaLabel: string
	tabsLabel: string
	definitionsLabel: string
	definitionGroupLabels: Record<string, string>
	emptyState: string
	noTabMatches: string
	noDefinitionMatches: string
	resultsCountLabel: string
	loadingCatalog: string
	catalogError: string
	categoryLabels: Record<string, string>
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

export const BrandCopy: BrandCopy = {
	title: "Growth Marketing Playbook",
	byline: "Built by John Luo",
}

export const PageCopy = {
	headerContent: {
		linkedinUrl: "https://www.linkedin.com/in/zluo99/",
		email: "jzluo99@gmail.com",
	},
	headerTabsNav: {
		prevLabel: "Previous tab",
		nextLabel: "Next tab",
	},
	headerNavigation: {
		homeButtonAria: "Go to overview",
		homeImageAlt: "Growth Marketing Playbook home",
		tabsLabel: "Playbook tabs",
		scrollLeftAria: "Scroll tabs left",
		scrollRightAria: "Scroll tabs right",
	},
	bodySearch: {
		placeholder: "Search tabs and definitions",
		ariaLabel: "Search the playbook",
		closeButtonAria: "Close search",
		resultsAriaLabel: "Search results",
		tabsLabel: "Tabs",
		definitionsLabel: "Definitions",
		definitionGroupLabels: {
			term: "Terms",
			metric: "Metrics",
			source: "Sources",
			spend: "Spend",
			vertical: "Verticals",
			utm_medium: "UTM Mediums",
			utm_source: "UTM Sources",
			utm_placement: "UTM Placements",
		},
		emptyState: "No matches yet. Try another phrase.",
		noTabMatches: "No tab matches",
		noDefinitionMatches: "No definitions found",
		resultsCountLabel: "{count} results",
		loadingCatalog: "Loading search...",
		catalogError: "Search unavailable. Refresh to retry.",
		categoryLabels: {
			tab: "Tab",
			framework: "Framework",
			term: "Term",
			source: "Source",
			metric: "Metric",
			spend: "Spend",
			vertical: "Vertical",
			utm_medium: "UTM Medium",
			utm_source: "UTM Source",
			utm_placement: "UTM Placement",
			copy: "Copy",
		},
	},
	footer: {
		brandTitle: BrandCopy.title,
		brandMarkAlt: "Growth Marketing Playbook home",
		disclaimer: "(c) {year} John Luo. Content uses spoofed data, best practices, and experience.",
		themeLabel: "Theme",
		themeOptions: {
			light: "Light",
			system: "System",
			dark: "Dark",
		},
		emailLabel: "Email",
		linkedinLabel: "LinkedIn",
	},
} as const satisfies {
	headerContent: HeaderContentCopy
	headerTabsNav: TabsNavCopy
	headerNavigation: HeaderNavCopy
	bodySearch: SearchCopy
	footer: FooterCopy
}



