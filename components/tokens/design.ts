"use client"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type AccentTone = "red" | "orange" | "yellow" | "green" | "blue" | "indigo" | "purple" | "neutral"

type AccentPalette = {
	bg: string
	bgHover: string
	border: string
	borderHover: string
	borderStrong: string
	borderStrongHover: string
	fg: string
	tint: string
	glow: string
	track: string
	fill: string
	dotBorder: string
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const join_classes = (...classes: string[]) => classes.filter(Boolean).join(" ")

/* -------------------------------------------------------------------------- */
/* Constants: accents                                                         */
/* -------------------------------------------------------------------------- */

const accent = {
	red: {
		bg: "bg-[color:var(--accent-red-bg)]",
		bgHover: "hover:bg-[color:var(--accent-red-bg-hover)]",
		border: "border-[color:var(--accent-red-border)]",
		borderHover: "hover:border-[color:var(--accent-red-border-hover)]",
		borderStrong: "border-[color:var(--accent-red-border-strong)]",
		borderStrongHover: "hover:border-[color:var(--accent-red-border-strong-hover)]",
		fg: "text-[color:var(--accent-red-fg)]",
		tint: "bg-[color:color-mix(in_oklch,var(--accent-red-bg)_var(--accent-tint-strength),transparent)]",
		glow: "bg-[radial-gradient(120%_60%_at_50%_10%,var(--glow-red)_0%,transparent_72%)]",
		track: "bg-[color:var(--accent-red-bg)] border border-[color:var(--accent-red-border)] [background-clip:padding-box]",
		fill: "bg-[color:var(--accent-red-fg)]/25",
		dotBorder: "border border-[color:var(--accent-red-border-hover)]",
	},
	orange: {
		bg: "bg-[color:var(--accent-orange-bg)]",
		bgHover: "hover:bg-[color:var(--accent-orange-bg-hover)]",
		border: "border-[color:var(--accent-orange-border)]",
		borderHover: "hover:border-[color:var(--accent-orange-border-hover)]",
		borderStrong: "border-[color:var(--accent-orange-border-strong)]",
		borderStrongHover: "hover:border-[color:var(--accent-orange-border-strong-hover)]",
		fg: "text-[color:var(--accent-orange-fg)]",
		tint: "bg-[color:color-mix(in_oklch,var(--accent-orange-bg)_var(--accent-tint-strength),transparent)]",
		glow: "bg-[radial-gradient(120%_60%_at_50%_10%,var(--glow-orange)_0%,transparent_72%)]",
		track: "bg-[color:var(--accent-orange-bg)] border border-[color:var(--accent-orange-border)] [background-clip:padding-box]",
		fill: "bg-[color:var(--accent-orange-fg)]/25",
		dotBorder: "border border-[color:var(--accent-orange-border-hover)]",
	},
	yellow: {
		bg: "bg-[color:var(--accent-yellow-bg)]",
		bgHover: "hover:bg-[color:var(--accent-yellow-bg-hover)]",
		border: "border-[color:var(--accent-yellow-border)]",
		borderHover: "hover:border-[color:var(--accent-yellow-border-hover)]",
		borderStrong: "border-[color:var(--accent-yellow-border-strong)]",
		borderStrongHover: "hover:border-[color:var(--accent-yellow-border-strong-hover)]",
		fg: "text-[color:var(--accent-yellow-fg)]",
		tint: "bg-[color:color-mix(in_oklch,var(--accent-yellow-bg)_var(--accent-tint-strength),transparent)]",
		glow: "bg-[radial-gradient(120%_60%_at_50%_10%,var(--glow-yellow)_0%,transparent_72%)]",
		track: "bg-[color:var(--accent-yellow-bg)] border border-[color:var(--accent-yellow-border)] [background-clip:padding-box]",
		fill: "bg-[color:var(--accent-yellow-fg)]/25",
		dotBorder: "border border-[color:var(--accent-yellow-border-hover)]",
	},
	green: {
		bg: "bg-[color:var(--accent-green-bg)]",
		bgHover: "hover:bg-[color:var(--accent-green-bg-hover)]",
		border: "border-[color:var(--accent-green-border)]",
		borderHover: "hover:border-[color:var(--accent-green-border-hover)]",
		borderStrong: "border-[color:var(--accent-green-border-strong)]",
		borderStrongHover: "hover:border-[color:var(--accent-green-border-strong-hover)]",
		fg: "text-[color:var(--accent-green-fg)]",
		tint: "bg-[color:color-mix(in_oklch,var(--accent-green-bg)_var(--accent-tint-strength),transparent)]",
		glow: "bg-[radial-gradient(120%_60%_at_50%_10%,var(--glow-green)_0%,transparent_72%)]",
		track: "bg-[color:var(--accent-green-bg)] border border-[color:var(--accent-green-border)] [background-clip:padding-box]",
		fill: "bg-[color:var(--accent-green-fg)]/25",
		dotBorder: "border border-[color:var(--accent-green-border-hover)]",
	},
	blue: {
		bg: "bg-[color:var(--accent-blue-bg)]",
		bgHover: "hover:bg-[color:var(--accent-blue-bg-hover)]",
		border: "border-[color:var(--accent-blue-border)]",
		borderHover: "hover:border-[color:var(--accent-blue-border-hover)]",
		borderStrong: "border-[color:var(--accent-blue-border-strong)]",
		borderStrongHover: "hover:border-[color:var(--accent-blue-border-strong-hover)]",
		fg: "text-[color:var(--accent-blue-fg)]",
		tint: "bg-[color:color-mix(in_oklch,var(--accent-blue-bg)_var(--accent-tint-strength),transparent)]",
		glow: "bg-[radial-gradient(120%_60%_at_50%_10%,var(--glow-blue)_0%,transparent_72%)]",
		track: "bg-[color:var(--accent-blue-bg)] border border-[color:var(--accent-blue-border)] [background-clip:padding-box]",
		fill: "bg-[color:var(--accent-blue-fg)]/25",
		dotBorder: "border border-[color:var(--accent-blue-border-hover)]",
	},
	indigo: {
		bg: "bg-[color:var(--accent-indigo-bg)]",
		bgHover: "hover:bg-[color:var(--accent-indigo-bg-hover)]",
		border: "border-[color:var(--accent-indigo-border)]",
		borderHover: "hover:border-[color:var(--accent-indigo-border-hover)]",
		borderStrong: "border-[color:var(--accent-indigo-border-strong)]",
		borderStrongHover: "hover:border-[color:var(--accent-indigo-border-strong-hover)]",
		fg: "text-[color:var(--accent-indigo-fg)]",
		tint: "bg-[color:color-mix(in_oklch,var(--accent-indigo-bg)_var(--accent-tint-strength),transparent)]",
		glow: "bg-[radial-gradient(120%_60%_at_50%_10%,var(--glow-indigo)_0%,transparent_72%)]",
		track: "bg-[color:var(--accent-indigo-bg)] border border-[color:var(--accent-indigo-border)] [background-clip:padding-box]",
		fill: "bg-[color:var(--accent-indigo-fg)]/25",
		dotBorder: "border border-[color:var(--accent-indigo-border-hover)]",
	},
	purple: {
		bg: "bg-[color:var(--accent-purple-bg)]",
		bgHover: "hover:bg-[color:var(--accent-purple-bg-hover)]",
		border: "border-[color:var(--accent-purple-border)]",
		borderHover: "hover:border-[color:var(--accent-purple-border-hover)]",
		borderStrong: "border-[color:var(--accent-purple-border-strong)]",
		borderStrongHover: "hover:border-[color:var(--accent-purple-border-strong-hover)]",
		fg: "text-[color:var(--accent-purple-fg)]",
		tint: "bg-[color:color-mix(in_oklch,var(--accent-purple-bg)_var(--accent-tint-strength),transparent)]",
		glow: "bg-[radial-gradient(120%_60%_at_50%_10%,var(--glow-purple)_0%,transparent_72%)]",
		track: "bg-[color:var(--accent-purple-bg)] border border-[color:var(--accent-purple-border)] [background-clip:padding-box]",
		fill: "bg-[color:var(--accent-purple-fg)]/25",
		dotBorder: "border border-[color:var(--accent-purple-border-hover)]",
	},
	neutral: {
		bg: "bg-[color:var(--accent-neutral-bg)]",
		bgHover: "hover:bg-[color:var(--accent-neutral-bg-hover)]",
		border: "border-[color:var(--accent-neutral-border)]",
		borderHover: "hover:border-[color:var(--accent-neutral-border-hover)]",
		borderStrong: "border-[color:var(--accent-neutral-border-strong)]",
		borderStrongHover: "hover:border-[color:var(--accent-neutral-border-strong-hover)]",
		fg: "text-[color:var(--accent-neutral-fg)]",
		tint: "bg-[color:color-mix(in_oklch,var(--accent-neutral-bg)_var(--accent-tint-strength),transparent)]",
		glow: "bg-[radial-gradient(120%_60%_at_50%_10%,var(--glow-neutral)_0%,transparent_72%)]",
		track: "bg-[color:var(--accent-neutral-bg)] border border-[color:var(--accent-neutral-border)] [background-clip:padding-box]",
		fill: "bg-[color:var(--accent-neutral-fg)]/25",
		dotBorder: "border border-[color:var(--accent-neutral-border-hover)]",
	},
} as const satisfies Record<AccentTone, AccentPalette>

const accent_pill = (tone: AccentTone) =>
	join_classes(accent[tone].bg, accent[tone].fg, accent[tone].borderStrong, accent[tone].bgHover, accent[tone].borderStrongHover)

const accent_blue_attribute_pill = join_classes(
	"bg-[color:var(--accent-blue-pill-bg)]",
	"hover:bg-[color:var(--accent-blue-pill-bg-hover)]",
	"border-[color:var(--accent-blue-border-strong)]",
	"hover:border-[color:var(--accent-blue-border-strong-hover)]",
	"text-[color:var(--accent-blue-fg)]"
)

const accent_dot = (tone: AccentTone) => join_classes(accent[tone].bg, accent[tone].dotBorder, accent[tone].fg)
const accent_track = (tone: AccentTone) => accent[tone].track
const accent_fill = (tone: AccentTone) => accent[tone].fill
const accent_label = (tone: AccentTone) => accent[tone].fg

/* -------------------------------------------------------------------------- */
/* Constants: core scales                                                     */
/* -------------------------------------------------------------------------- */

const size = {
	controls: {
		sm: { h: "h-9", px: "px-3", box: "h-9 w-9" },
		md: { h: "h-10", px: "px-4", box: "h-10 w-10" },
		lg: { h: "h-11", px: "px-5", box: "h-11 w-11" },
	},
	layout: {
		sm: 360,
		md: 520,
		lg: 600,
	},
} as const

const spacing = {
	panelSm: "p-3",
	panelMd: "p-4 sm:p-5",

	pillY: "py-1",

	cardHeader: "p-4 sm:p-5",
	cardContent: "px-4 pb-4 pt-0 sm:px-5 sm:pb-5 sm:pt-0",

	chipSm: "px-1.5 py-0.25",

	controlX: "px-2",
	controlY: "py-2",

	footerY: "py-4",
} as const

const gap = {
	xs: "gap-1",
	sm: "gap-3",
	md: "gap-6",
	lg: "gap-9",
} as const

const margin = {
	topXs: "mt-1",
	topSm: "mt-2",
	topMd: "mt-3",

	bottomNone: "mb-0",
	bottomMd: "mb-6",
	allNone: "m-0",
} as const

const typography = {
	body: "text-sm leading-5",
	caption: "text-xs leading-4",
	label: "text-sm font-medium leading-[1.25]",
	title: {
		sm: "text-sm font-semibold leading-5",
		md: "text-base font-semibold leading-6",
		lg: "text-lg font-semibold leading-7",
		xl: "text-3xl font-semibold leading-9",
		xxl: "text-4xl font-semibold leading-10",
	},
} as const

export type TypographyKey = "body" | "caption" | "label" | "title-sm" | "title-md" | "title-lg" | "title-xl" | "title-xxl"

const icon_nude = {
	xs: "h-3 w-3",
	sm: "h-3.5 w-3.5",
	md: "h-4 w-4",
	lg: "h-5 w-5",
} as const

/* -------------------------------------------------------------------------- */
/* Constants: copy helpers                                                    */
/* -------------------------------------------------------------------------- */

const copy = {
	helpUnderline: "cursor-help underline decoration-dotted underline-offset-4",
	mutedSoft: "text-[color:var(--color-muted-foreground-soft)]",
	na: "text-[color:var(--color-muted-foreground-na)]",
} as const

const highlight = {
	search: join_classes("text-[color:var(--accent-yellow-highlight-fg)]", "bg-[color:var(--accent-yellow-highlight-bg)]"),
} as const

/* -------------------------------------------------------------------------- */
/* Constants: motion                                                          */
/* -------------------------------------------------------------------------- */

const motion = {
	duration: "duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)]",
	durationFast: "duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)]",
	durationOpacity: "transition-opacity duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)]",
	durationOpacityFilter:
		"transition-[opacity,filter] duration-[var(--motion-duration-base)] ease-[var(--motion-ease-standard)]",
	focusRing: [
		"focus-visible:outline-none",
		"focus-visible:ring-2",
		"focus-visible:ring-ring/50",
		"focus-visible:ring-offset-2",
		"focus-visible:ring-offset-background",
	].join(" "),
	focusRingSearch: [
		"focus-visible:outline-none",
		"focus-visible:ring-2",
		"!focus-visible:ring-[color:var(--accent-blue-soft-ring)]",
		"focus-visible:ring-offset-2",
		"focus-visible:ring-offset-background",
	].join(" "),
} as const

/* -------------------------------------------------------------------------- */
/* Constants: surfaces & state                                                */
/* -------------------------------------------------------------------------- */

const surface = {
	structure: {
		card: "bg-card",
		panel: "bg-background",
		popover: "bg-popover",
		subtleGrey: "bg-muted/80 dark:bg-muted/55",
		subtleGreyFrosted: join_classes(
			"bg-muted/80 dark:bg-muted/55",
			"backdrop-blur supports-[backdrop-filter]:bg-muted/65 dark:supports-[backdrop-filter]:bg-muted/45"
		),
		border: "border border-[color:var(--border)]",
		borderHover: "border border-[color:var(--border-hover)]",
		opaque: "!bg-background",
		shadowNone: "shadow-none [box-shadow:none]",
		shadowLg: "[box-shadow:var(--shadow-lg)]",
	},
	state: {
		hover: {
			bg: "hover:bg-[color:var(--surface-bg-hover)]",
			border: "hover:border-[color:var(--border-hover)]",
			shadowSm: "hover:[box-shadow:var(--shadow-sm)]",
			shadowMd: "hover:[box-shadow:var(--shadow-md)]",
		},
		press: {
			shadow: join_classes(
				"hover:[box-shadow:var(--shadow-md)]",
				"focus-visible:[box-shadow:var(--shadow-md)]",
				"active:[box-shadow:var(--shadow-md)]"
			),
			scaleSm: "active:scale-[0.99]",
			scaleXs: "active:scale-[0.985]",
		},
		focus: { ring: motion.focusRing },
		active: {
			bg: "data-[state=active]:bg-background",
			border: "data-[state=active]:border-[color:var(--border-hover)]",
		},
	},
} as const

const component = {
	outline: {
		base: join_classes(surface.structure.border, motion.duration, "transition-[border-color,box-shadow]"),
		hover: surface.state.hover.border,
		focus: motion.focusRing,
		active: join_classes(surface.state.active.border, surface.state.active.bg),
		activeStatic: "border-[color:var(--border-hover)]",
	},
	hoverShadow: surface.state.hover.shadowMd,
} as const

const search = {
	border: component.outline.base,
	hoverBorderBlue:
		"hover:border-[color:var(--accent-blue-soft-border-hover)] focus-within:border-[color:var(--accent-blue-soft-border-hover)]",
	activeBorderBlue: "border-[color:var(--accent-blue-soft-border-hover)]",

	menuBg: "bg-[color:var(--surface-bg)]",

	// base menu shadow
	menuShadow: "!shadow-[0_12px_32px_rgba(0,0,0,0.15)] dark:!shadow-[0_12px_32px_rgba(0,0,0,0.6)]",

	// keep hover shadow symmetric + never downgrade (no rgba override)
	menuShadowHover: "hover:!shadow-[0_18px_45px_rgba(0,0,0,0.25)] dark:hover:!shadow-[0_18px_45px_rgba(0,0,0,0.75)]",

	menuHover: "hover:border-[color:var(--accent-blue-soft-border-hover)] focus-within:border-[color:var(--accent-blue-soft-border-hover)]",
	menuFocusRing:
		"focus-within:border-[color:var(--accent-blue-soft-border-hover)] focus-within:ring-2 focus-within:ring-[color:var(--accent-blue-soft-ring)] focus-within:ring-offset-2 focus-within:ring-offset-background",
	menuScrollGutter: "[scrollbar-gutter:stable]",
	menuContentPadding: spacing.panelMd,

	rowHoverBorderBlue:
		"hover:border-[color:var(--accent-blue-soft-border-hover)] focus-within:border-[color:var(--accent-blue-soft-border-hover)]",
	rowActiveBorderBlue: "border-[color:var(--accent-blue-soft-border-hover)]",
	rowHoverBgBlue: "hover:bg-[color:var(--accent-blue-soft-row-hover)]",
	rowActiveBgBlue: "bg-[color:var(--accent-blue-soft-bg)]",
	rowActiveShadow: "shadow-[0_12px_24px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_24px_rgba(0,0,0,0.45)]",
	rowBg: "bg-[color:var(--surface-bg)]",
	rowBorder: component.outline.base,

	definitionBg: surface.structure.subtleGreyFrosted,
	definitionBorder: component.outline.base,

	focusRing: motion.focusRingSearch,
	iconColor:
		"group-hover:text-[color:var(--accent-blue-soft-border-hover)] group-focus-within:text-[color:var(--accent-blue-soft-ring)]",

	// keep baseline hover bg aligned to nav controls
	controlHoverBg: surface.state.hover.bg,

	// NEW: blue-tinted frosted hover overlay (symmetric across light/dark via oklch mix + theme vars)
	// - keeps the blur feeling but introduces a subtle blue wash
	controlHoverBlueTint:
		"hover:bg-[color:color-mix(in_oklch,var(--accent-blue-soft-bg)_18%,var(--surface-bg-hover))] supports-[backdrop-filter]:hover:bg-[color:color-mix(in_oklch,var(--accent-blue-soft-bg)_22%,var(--surface-bg-hover))]",
} as const

/* -------------------------------------------------------------------------- */
/* Constants: text & icon states                                              */
/* -------------------------------------------------------------------------- */

const text_interactive_all = join_classes(
	"text-muted-foreground",
	"hover:text-foreground",
	"group-hover:text-foreground",
	"data-[state=inactive]:text-muted-foreground",
	"data-[state=active]:text-foreground"
)

const text_state = {
	default: { fg: "text-foreground" },
	muted: { fg: "text-muted-foreground" },
	interactive: {
		base: "text-muted-foreground",
		hover: "hover:text-foreground",
		groupHover: "group-hover:text-foreground",
		inactive: "data-[state=inactive]:text-muted-foreground",
		active: "data-[state=active]:text-foreground",
		all: text_interactive_all,
	},
} as const

const icon_interactive_all = join_classes(text_state.interactive.base, text_state.interactive.groupHover, text_state.interactive.active)

const icon_state = {
	default: { fg: text_state.default.fg },
	interactive: {
		all: icon_interactive_all,
	},
} as const

/* -------------------------------------------------------------------------- */
/* Constants: radius & controls                                               */
/* -------------------------------------------------------------------------- */

const radius = {
	base: "rounded-[var(--radius)]",
	control: "rounded-[var(--radius-control)]",
} as const

const control = {
	base: "ui-control",
	ghost: "ui-control-ghost [color:inherit]",
} as const

const overlay = {
	container: "fixed inset-0 z-[2147483646] flex items-stretch justify-center overflow-hidden p-3 sm:p-6 md:items-center",
	maxWidth: "max-w-[var(--app-max-w)]",
	backdrop: "bg-background/55 backdrop-blur-sm",
	panel: join_classes(
		"relative overflow-hidden",
		surface.structure.border,
		search.menuBg,
		search.activeBorderBlue,
		search.menuShadow,
		search.menuShadowHover,
		search.menuHover,
		search.menuFocusRing
	),
	moduleChip: {
		base: join_classes(
			"inline-flex h-8 items-center justify-center px-2.5",
			typography.label,
			"rounded-[var(--radius-control)]",
			"ui-control",
			motion.duration,
			surface.state.focus.ring,
			"border",
			surface.state.hover.shadowSm
		),
		inactive: join_classes(
			"!border-[color:var(--border)] !bg-background !text-muted-foreground",
			"hover:!bg-[color:var(--surface-bg-hover)]",
			"hover:!border-[color:var(--border-hover)]",
			"hover:text-foreground"
		),
		active: join_classes(
			"!border-[color:var(--accent-blue-soft-border-hover)] !bg-[color:var(--accent-blue-soft-bg)] !text-foreground",
			"hover:!bg-[color:var(--accent-blue-soft-row-hover)]",
			"hover:!border-[color:var(--accent-blue-soft-border-hover)]"
		),
	},
} as const

/* -------------------------------------------------------------------------- */
/* Constants: status                                                          */
/* -------------------------------------------------------------------------- */

const status_from_accent = (tone: AccentTone) => ({
	fill: join_classes(accent[tone].bg, accent[tone].fg, "border", accent[tone].border),
	fillHover: join_classes(accent[tone].bgHover, accent[tone].borderHover),
	outline: join_classes("bg-background", accent[tone].fg, "border", accent[tone].border),
	outlineHover: accent[tone].borderHover,
})

const status = {
	success: {
		...status_from_accent("green"),
		fillHover: join_classes(accent.green.bgHover, accent.green.borderStrongHover),
	},
	warning: status_from_accent("yellow"),
	error: status_from_accent("red"),
	info: status_from_accent("blue"),
} as const

/* -------------------------------------------------------------------------- */
/* Constants: buttons                                                         */
/* -------------------------------------------------------------------------- */

const icon_frame_base = join_classes("inline-flex items-center justify-center", surface.structure.border, "bg-background", radius.control)

const icon_frame = {
	sm: join_classes(icon_frame_base, "h-8 w-8"),
	md: join_classes(icon_frame_base, size.controls.md.box),
} as const

const icon_card = {
	frame: icon_frame.md,
	size: icon_nude.lg,
} as const

const button = {
	size: {
		default: join_classes(size.controls.md.h, size.controls.md.px, "text-sm"),
		icon: join_classes(size.controls.md.box, "p-0"),
		iconSm: join_classes(size.controls.sm.box, "p-0"),
		lg: join_classes(size.controls.lg.h, size.controls.lg.px, "text-sm"),
		sm: join_classes(size.controls.sm.h, size.controls.sm.px, "text-sm"),
	},
} as const

/* -------------------------------------------------------------------------- */
/* Definition: nav system (ssot)                                              */
/* -------------------------------------------------------------------------- */

const nav_heights = {
	md: "h-12",
} as const

const nav_pad = "p-1"

const nav_header_gap = "h-1.5 md:h-2"

const nav_rail_item_gap = "gap-1"

const nav_scroller = {
	padDefaultRem: "0rem",
	padOverflowRem: "2.75rem",
	scrollPadDefaultPx: 12,
	scrollPadOverflowPx: 52,
} as const

const nav_shell_chrome_base = [
	surface.structure.subtleGreyFrosted,
	surface.structure.shadowNone,
	motion.duration,
	surface.state.hover.border,
	surface.state.hover.shadowMd,
] as const

const nav_shell_chrome = join_classes("relative", radius.base, surface.structure.border, ...nav_shell_chrome_base)

const nav_chrome = {
	md: join_classes(nav_shell_chrome, nav_heights.md, nav_pad),
} as const

const nav_inner = join_classes("flex items-stretch", nav_pad)

const nav_icon_button_chrome = join_classes(
	"group inline-flex items-center justify-center shrink-0",
	nav_shell_chrome,
	nav_heights.md,
	"w-12",
	nav_pad,
	surface.state.focus.ring,
	surface.state.hover.bg,
	text_interactive_all,
	surface.state.press.shadow,
	surface.state.press.scaleSm
)

const nav_icon_trigger_chrome = join_classes(
	"group relative shrink-0 grid place-items-center",
	size.controls.md.box,
	"p-0",
	radius.control,
	control.ghost,
	surface.state.focus.ring,
	motion.duration,
	surface.state.hover.border,
	surface.state.hover.shadowMd,
	surface.state.hover.bg,
	text_interactive_all,
	"border border-transparent bg-transparent"
)

const nav_rail_trigger_chrome = join_classes(
	"group relative shrink-0",
	size.controls.md.h,
	size.controls.md.px,
	radius.control,
	control.ghost,
	surface.state.focus.ring,
	motion.duration,
	surface.state.hover.border,
	surface.state.hover.shadowMd,
	surface.state.hover.bg,
	text_interactive_all,
	surface.state.active.bg,
	surface.state.active.border,
	"border border-transparent bg-transparent"
)

const nav_arrow_button_chrome = join_classes(
	"relative z-30 grid place-items-center",
	size.controls.md.box,
	radius.control,
	control.base,
	surface.state.focus.ring,
	motion.duration,
	surface.state.press.scaleXs,
	"transition-[transform] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)]",
	surface.structure.opaque,
	"!opacity-100 text-foreground border border-transparent",
	surface.state.hover.shadowMd
)

const nav_rail_list_chrome = join_classes(
	"relative inline-flex w-max items-stretch bg-transparent p-0 border-0 ring-0",
	nav_rail_item_gap,
	surface.structure.shadowNone
)

const nav_rail_indicator_chrome = "pointer-events-none absolute left-0 top-0 z-0 box-border bg-background border border-[color:var(--border-hover)]"

const nav = {
	heights: nav_heights,
	pad: nav_pad,
	headerGap: nav_header_gap,

	inner: nav_inner,

	shell: {
		base: nav_shell_chrome,
		blurBg: surface.structure.subtleGreyFrosted,
	},

	chrome: nav_chrome,

	control: {
		height: size.controls.md.h,
		size: size.controls.md.box,
		padX: size.controls.md.px,
	},

	rail: {
		itemGap: nav_rail_item_gap,
		listChrome: nav_rail_list_chrome,
		indicatorChrome: nav_rail_indicator_chrome,
		triggerChrome: nav_rail_trigger_chrome,
		iconTriggerChrome: nav_icon_trigger_chrome,
		scroller: nav_scroller,
	},

	arrow: {
		insetRem: "0.25rem",
		buttonChrome: nav_arrow_button_chrome,
	},

	iconButton: {
		chrome: nav_icon_button_chrome,
		contentChrome: join_classes("relative z-10 grid place-items-center", size.controls.md.box),
	},
} as const

/* -------------------------------------------------------------------------- */
/* Constants: brand                                                           */
/* -------------------------------------------------------------------------- */

const brand = {
	homeMarkPx: 24,
	homeMarkClass: "h-6 w-6",
} as const

/* -------------------------------------------------------------------------- */
/* Constants: misc atoms                                                      */
/* -------------------------------------------------------------------------- */

const frameworks = {
	consulting: {
		tint: accent.orange.tint,
		badge: join_classes(accent.orange.bg, accent.orange.fg, accent.orange.border, accent.orange.bgHover, accent.orange.borderHover),
		filterActive: join_classes(accent.orange.bg, accent.orange.border),
		filterText: accent.orange.fg,
	},
	data: {
		tint: accent.green.tint,
		badge: join_classes(accent.green.bg, accent.green.fg, accent.green.border, accent.green.bgHover, accent.green.borderHover),
		filterActive: join_classes(accent.green.bg, accent.green.border),
		filterText: accent.green.fg,
	},
	marketing: {
		tint: accent.indigo.tint,
		badge: join_classes(accent.indigo.bg, accent.indigo.fg, accent.indigo.border, accent.indigo.bgHover, accent.indigo.borderHover),
		filterActive: join_classes(accent.indigo.bg, accent.indigo.border),
		filterText: accent.indigo.fg,
	},
} as const

const glow = {
	red: accent.red.glow,
	orange: accent.orange.glow,
	yellow: accent.yellow.glow,
	green: accent.green.glow,
	blue: accent.blue.glow,
	indigo: accent.indigo.glow,
	purple: accent.purple.glow,
	neutral: accent.neutral.glow,
	rainbow:
		"mix-blend-normal dark:mix-blend-screen bg-[radial-gradient(128%_42%_at_50%_5%,var(--glow-rainbow-lift)_0%,transparent_58%),radial-gradient(96%_36%_at_16%_8%,var(--glow-rainbow-blue)_0%,transparent_66%),radial-gradient(96%_36%_at_50%_8%,var(--glow-rainbow-green)_0%,transparent_66%),radial-gradient(92%_34%_at_86%_8%,var(--glow-rainbow-orange)_0%,transparent_64%)]",
} as const

const metrics = {
	dotAttribute: accent_dot("blue"),
	dotPrimary: accent_dot("yellow"),
	dotSecondary: accent_dot("neutral"),

	labelAttribute: accent_label("blue"),
	labelPrimary: accent_label("yellow"),
	labelSecondary: accent_label("neutral"),

	pillAttribute: accent_blue_attribute_pill,
	pillPrimary: accent_pill("yellow"),
	pillSecondary: accent_pill("neutral"),
} as const

const range_bar = {
	red: { track: accent_track("red"), fill: accent_fill("red") },
	orange: { track: accent_track("orange"), fill: accent_fill("orange") },
	yellow: { track: accent_track("yellow"), fill: accent_fill("yellow") },
	green: { track: accent_track("green"), fill: accent_fill("green") },
	blue: { track: accent_track("blue"), fill: accent_fill("blue") },
	indigo: { track: accent_track("indigo"), fill: accent_fill("indigo") },
	purple: { track: accent_track("purple"), fill: accent_fill("purple") },
	neutral: { track: accent_track("neutral"), fill: accent_fill("neutral") },
} as const

const spend = {
	labelBrand: accent_label("red"),
	labelOverhead: accent_label("neutral"),
	labelPerformance: accent_label("purple"),

	pillBrand: accent_pill("red"),
	pillOverhead: accent_pill("neutral"),
	pillPerformance: accent_pill("purple"),
} as const

const table = {
	red: join_classes(accent.red.bg, accent.red.fg, "[background-clip:padding-box]"),
	orange: join_classes(accent.orange.bg, accent.orange.fg, "[background-clip:padding-box]"),
	yellow: join_classes(accent.yellow.bg, accent.yellow.fg, "[background-clip:padding-box]"),
	green: join_classes(accent.green.bg, accent.green.fg, "[background-clip:padding-box]"),
	blue: join_classes(accent.blue.bg, accent.blue.fg, "[background-clip:padding-box]"),
	indigo: join_classes(accent.indigo.bg, accent.indigo.fg, "[background-clip:padding-box]"),
	purple: join_classes(accent.purple.bg, accent.purple.fg, "[background-clip:padding-box]"),
	neutral: join_classes(accent.neutral.bg, accent.neutral.fg, "[background-clip:padding-box]"),
} as const

/* -------------------------------------------------------------------------- */
/* Constants: intro                                                           */
/* -------------------------------------------------------------------------- */

const intro = {
	overlayPadX: "px-6 sm:px-10 lg:px-16",
	overlayMaxWidth: "max-w-4xl",
	overlayTitleColor: "text-[color:color-mix(in_oklch,var(--accent-indigo-fg)_82%,var(--surface-bg)_18%)]",
} as const

/* -------------------------------------------------------------------------- */
/* Export                                                                     */
/* -------------------------------------------------------------------------- */

export const ui = {
	size,

	spacing,
	gap,
	margin,

	typography,
	iconNude: icon_nude,
	iconFrame: icon_frame,
	iconCard: icon_card,
	copy,
	highlight,

	motion,

	surface,
	component,
	search,
	overlay,
	text: text_state,
	icon: icon_state,
	status,
	radius,
	control,

	button,

	nav,
	brand,

	frameworks,
	glow,
	metrics,
	rangeBar: range_bar,
	spend,
	table,
	intro,
} as const



