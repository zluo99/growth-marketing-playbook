import type { DefinitionSearchCategory, SearchCategory } from "@/features/playbook/search/schema"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type BrandCopy = {
	title: string
	byline: string
}

type HeaderContentCopy = {
	linkedinUrl: string
	githubUrl: string
	email: string
}

type TabsNavCopy = {
	prevLabel: string
	nextLabel: string
}

type FooterCopy = {
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
	githubLabel: string
}

type IntroOverlayCopy = {
	scrollHint: string
}

type HeaderNavCopy = {
	homeButtonAria: string
	homeImageAlt: string
	tabsLabel: string
	scrollLeftAria: string
	scrollRightAria: string
}

type SearchCopy = {
	placeholder: string
	ariaLabel: string
	closeButtonAria: string
	resultsAriaLabel: string
	tabsLabel: string
	definitionsLabel: string
	definitionGroupLabels: Record<DefinitionSearchCategory, string>
	emptyState: string
	noTabMatches: string
	noDefinitionMatches: string
	resultsCountLabel: string
	loadingCatalog: string
	catalogError: string
	categoryLabels: Record<SearchCategory, string>
}

type SystemStateCopy = {
	error: {
		title: string
		message: string
		actionLabel: string
	}
	globalError: {
		title: string
		message: string
	}
	notFound: {
		title: string
		message: string
		actionLabel: string
		actionHref: string
	}
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
		githubUrl: "https://github.com/zluo99",
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
		},
		emptyState: "No matches yet. Try another phrase.",
		noTabMatches: "No tab matches",
		noDefinitionMatches: "No reference matches",
		resultsCountLabel: "{count} results",
		loadingCatalog: "Loading search...",
		catalogError: "Search unavailable. Refresh to retry.",
		categoryLabels: {
			tab: "Tab",
			framework: "Framework",
			term: "Term",
			metric: "Metric",
			copy: "Copy",
		},
	},
	systemStates: {
		error: {
			title: "Something went wrong",
			message: "An unexpected error occurred. You can retry the last action.",
			actionLabel: "Try again",
		},
		globalError: {
			title: "Application error",
			message: "A fatal error occurred. Refresh the page to recover.",
		},
		notFound: {
			title: "Page not found",
			message: "The page you're looking for doesn't exist.",
			actionLabel: "Go to overview",
			actionHref: "/overview",
		},
	},
	footer: {
		brandTitle: BrandCopy.title,
		brandMarkAlt: "Growth Marketing Playbook home",
		disclaimer: "© {year} John Luo. Content uses spoofed data, best practices, and experience.",
		themeLabel: "Theme",
		themeOptions: {
			light: "Light",
			system: "System",
			dark: "Dark",
		},
		emailLabel: "Email",
		linkedinLabel: "LinkedIn",
		githubLabel: "GitHub",
	},
	introOverlay: {
		scrollHint: "Scroll down to continue",
	},
} as const satisfies {
	headerContent: HeaderContentCopy
	headerTabsNav: TabsNavCopy
	headerNavigation: HeaderNavCopy
	bodySearch: SearchCopy
	systemStates: SystemStateCopy
	footer: FooterCopy
	introOverlay: IntroOverlayCopy
}

