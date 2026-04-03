"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

import { ui } from "@/components/tokens/design"
import { navMenuFadeVariants, useReducedMotionBool } from "@/components/tokens/motion"
import { cn } from "@/lib/utils"

import { PageCopy } from "@/features/playbook/copy/page"
import { SpendCopy } from "@/features/playbook/copy/plays-spend"
import { Renderer } from "@/features/playbook/components/ui/renderer"
import { getFocusViewportBounds } from "@/features/playbook/components/ui/ui"
import { TabById, type TabId } from "@/features/playbook/definitions/tabs"
import { PlaybookEvents, PlaybookStorage, write_preference } from "@/features/playbook/components/context/preferences"
import { definition_search_categories, is_definition_search_category, type Catalog, type DefinitionSearchCategory, type SearchCategory, type SearchEntry } from "@/features/playbook/search/schema"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type SearchProps = {
	onGoToTab: (id: TabId) => void
	onOpenChange?: (open: boolean) => void
}

type ResultContentProps = {
	result: SearchEntry
	description_node: React.ReactNode | null
	show_leading_ellipsis: boolean
	show_trailing_ellipsis: boolean
	hierarchy_node?: React.ReactNode
}

type InteractiveSearchEntry = SearchEntry

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const highlight_attr = "data-search-highlight"

const menu_outer_padding_class = "p-0"
const menu_inner_padding_class = cn("p-0", ui.search.menuScrollGutter)
const idle_catalog_timeout_ms = 1200

const search_row_class = cn(
	ui.nav.iconButton.chrome,
	"group relative flex w-full items-center",
	ui.text.interactive.all,
	"cursor-text",
	"focus-within:text-foreground",
	ui.search.focusRing,
	ui.search.border,
	ui.search.hoverBorderBlue,

	// baseline hover bg parity with Home button
	ui.search.controlHoverBg,

	// NEW: blue-tinted frosted hover overlay (symmetric light/dark)
	ui.search.controlHoverBlueTint,

	ui.component.hoverShadow,
	ui.motion.duration,
	ui.radius.base,
	"p-0",
	"overflow-hidden transition-[width,padding,box-shadow,border-color,background-color]",
	"active:scale-100",
	"isolate"
)

const search_input_class = cn(
	"flex-1 min-w-0 border-0 bg-transparent px-0 placeholder:text-muted-foreground focus:outline-none focus:ring-0 transition-[opacity] duration-150",
	ui.typography.body,
	"appearance-none",
	"placeholder:text-muted-foreground"
)

const result_row_class = cn(
	"flex w-full flex-col px-3 py-2 text-left transition-colors duration-150",
	ui.radius.control,
	ui.search.rowBorder,
	ui.search.rowBg,
	ui.surface.structure.shadowNone,
	ui.surface.state.hover.shadowSm
)

const definition_card_class = cn(
	"rounded-[var(--radius-control)] px-3 py-2 transition-colors duration-150",
	ui.typography.body,
	ui.search.definitionBorder,
	ui.search.definitionBg
)

const category_labels: Record<SearchCategory, string> = PageCopy.bodySearch.categoryLabels
const definition_group_labels = PageCopy.bodySearch.definitionGroupLabels

const spend_panel_ids = new Set<string>(SpendCopy.panels.map((panel) => panel.id))
const search_highlight_class = cn(
	"rounded-[0.2em] [-webkit-box-decoration-break:clone] [box-decoration-break:clone]",
	ui.highlight.search
)

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const escape_regexp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const to_dom_id = (value: string) => value.toLowerCase().replace(/[^a-z0-9_-]/g, "-")
const normalize_value = (value?: string) => (value ?? "").trim().toLowerCase()
const tokenize_search_query = (value: string) =>
	Array.from(new Set(normalize_value(value).split(/[^a-z0-9_:+.-]+/).map((token) => token.trim()).filter(Boolean)))
const build_query_regex = (query: string) => {
	const tokens = tokenize_search_query(query)
	if (!tokens.length) return null
	return new RegExp(`(${tokens.map(escape_regexp).join("|")})`, "gi")
}
const result_dom_id = (entry: SearchEntry) => `search-result-${to_dom_id(entry.id)}`
const is_text_input_target = (target: EventTarget | null) => {
	if (!target || !(target instanceof HTMLElement)) return false
	if (target.isContentEditable) return true
	const tag = target.tagName
	return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT"
}

const render_with_tooltips = (text: string | React.ReactNode) => {
	if (!text) return null
	if (typeof text !== "string") return text
	try {
		return Renderer.Copy.renderInlineMarkdown(text)
	} catch (error) {
		console.warn("Markdown render failed:", error)
		return text
	}
}

const is_result_actionable = (entry: SearchEntry) => Boolean(entry.tabId || entry.scrollTarget)
const is_definition_search_entry = (entry: SearchEntry): entry is SearchEntry & { category: DefinitionSearchCategory } =>
	is_definition_search_category(entry.category)
const create_definition_groups = (): Record<DefinitionSearchCategory, SearchEntry[]> => ({
	term: [],
	metric: [],
})

const highlight_matches = (
	text: string,
	query: string,
	renderChunk: (chunk: string) => React.ReactNode = (chunk) => chunk
) => {
	const regex = build_query_regex(query)
	if (!regex) return <>{renderChunk(text)}</>

	const highlight_text = (value: string, keyPrefix: string) => {
		regex.lastIndex = 0
		const parts = value.split(regex)
		return parts.map((part, idx) =>
			idx % 2 === 1 ? (
				<span key={`${keyPrefix}-${idx}`} className={search_highlight_class}>
					{part}
				</span>
			) : (
				<React.Fragment key={`${keyPrefix}-${idx}`}>{part}</React.Fragment>
			)
		)
	}

	const highlight_node = (node: React.ReactNode, keyPrefix = "hl"): React.ReactNode => {
		if (node == null || typeof node === "boolean") return node
		if (typeof node === "string" || typeof node === "number") return highlight_text(String(node), keyPrefix)
		if (Array.isArray(node)) {
			return node.flatMap((child, idx) => {
				const next = highlight_node(child, `${keyPrefix}-${idx}`)
				return Array.isArray(next) ? next : [next]
			})
		}
		if (React.isValidElement(node)) {
			const type = node.type
			if (typeof type === "string" && type.toLowerCase() === "code") return node
			const nextChildren = highlight_node(node.props?.children, `${keyPrefix}-child`)
			return React.cloneElement(node, { ...node.props }, nextChildren)
		}
		return node
	}

	const rendered = renderChunk(text)
	return <>{highlight_node(rendered)}</>
}

const clear_search_highlights = () => {
	if (typeof document === "undefined") return
	const nodes = document.querySelectorAll(`[${highlight_attr}]`)
	nodes.forEach((node) => {
		const parent = node.parentNode
		if (!parent) return
		parent.replaceChild(document.createTextNode(node.textContent ?? ""), node)
		parent.normalize()
	})
}

const apply_search_highlights = (root: HTMLElement, query: string, className: string) => {
	const trimmed = query.trim()
	if (!trimmed) return 0

	const regex = build_query_regex(trimmed)
	if (!regex) return 0
	const nodes: Text[] = []
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
		acceptNode: (node) => {
			if (!(node instanceof Text)) return NodeFilter.FILTER_REJECT
			const parent = node.parentElement
			if (!parent) return NodeFilter.FILTER_REJECT
			if (!node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT
			if (parent.closest(`[${highlight_attr}]`)) return NodeFilter.FILTER_REJECT
			if (parent.closest("[data-search-ignore]")) return NodeFilter.FILTER_REJECT
			const tag = parent.tagName
			if (["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "SELECT", "OPTION", "CODE", "PRE"].includes(tag)) return NodeFilter.FILTER_REJECT
			return NodeFilter.FILTER_ACCEPT
		},
	})

	while (walker.nextNode()) {
		if (walker.currentNode instanceof Text) nodes.push(walker.currentNode)
	}

	let hitCount = 0
	nodes.forEach((textNode) => {
		const text = textNode.nodeValue ?? ""
		regex.lastIndex = 0
		if (!regex.test(text)) return
		regex.lastIndex = 0

		const parts = text.split(regex)
		if (parts.length < 2) return

		const frag = document.createDocumentFragment()
		parts.forEach((part, idx) => {
			if (!part) return
			if (idx % 2 === 1) {
				const span = document.createElement("span")
				span.className = className
				span.setAttribute(highlight_attr, "true")
				span.textContent = part
				hitCount += 1
				frag.appendChild(span)
			} else {
				frag.appendChild(document.createTextNode(part))
			}
		})
		textNode.parentNode?.replaceChild(frag, textNode)
	})

	return hitCount
}

const resolve_spend_panel_id = (entry: SearchEntry) => {
	const match = entry.id.match(/spend-panel-(\d+)$/)
	const candidate = match?.[1]
	if (candidate && spend_panel_ids.has(candidate)) return candidate
	if (entry.tabId !== "plays") return null
	const title_key = normalize_value(entry.title)
	if (!title_key) return null
	return SpendCopy.panels.find((panel) => normalize_value(panel.title) === title_key)?.id ?? null
}

const sync_frameworks_filter = (next: string) => {
	if (typeof window === "undefined") return
	write_preference(PlaybookStorage.frameworks.filter, next)
	window.dispatchEvent(new CustomEvent(PlaybookEvents.frameworksFilter, { detail: { filter: next } }))
}

const sync_frameworks_reveal = (framework_id: string, query: string) => {
	if (typeof window === "undefined") return
	const trimmed = query.trim()
	if (!trimmed) return
	const payload = { frameworkId: framework_id, query: trimmed }
	write_preference(PlaybookStorage.frameworks.reveal, JSON.stringify(payload))
	window.dispatchEvent(new CustomEvent(PlaybookEvents.frameworksReveal, { detail: payload }))
}

const sync_spend_view = (next: string) => {
	if (typeof window === "undefined") return
	write_preference(PlaybookStorage.plays.spendView, next)
	window.dispatchEvent(new CustomEvent(PlaybookEvents.spendView, { detail: { view: next } }))
}

const SearchIcon = ({ className }: { className?: string }) => (
	<svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
		<circle cx="10.5" cy="10.5" r="7.2" className="fill-none stroke-current stroke-[1.5]" />
		<line x1="15.8" y1="15.8" x2="21" y2="21" className="stroke-current stroke-[1.5]" strokeLinecap="round" />
	</svg>
)

const render_hierarchy_label = (entry: SearchEntry, query: string) => {
	const tab_meta = entry.tabId ? TabById[entry.tabId] : undefined
	const hierarchy_parts: { label: string; icon?: React.ComponentType<{ className?: string }> }[] = []

	const push_part = (value?: string | null, icon?: React.ComponentType<{ className?: string }>) => {
		const trimmed = value?.trim()
		if (!trimmed) return
		const last = hierarchy_parts[hierarchy_parts.length - 1]
		if (!last || last.label.toLowerCase() !== trimmed.toLowerCase()) {
			hierarchy_parts.push({ label: trimmed, icon })
		}
	}

	push_part(tab_meta?.alias ?? category_labels[entry.category], tab_meta?.icon)
	entry.breadcrumbs?.forEach((crumb) => push_part(crumb))
	push_part(entry.title)

	if (!hierarchy_parts.length) return null

	return (
		<span className="inline-flex items-center gap-1 min-w-0">
			{hierarchy_parts.map((part, idx) => {
				const Icon = part.icon
				return (
					<React.Fragment key={`${part.label}-${idx}`}>
						{idx > 0 ? <ArrowRight className={cn(ui.iconNude.sm, "opacity-60 shrink-0")} aria-hidden="true" /> : null}
						<span className="inline-flex items-center gap-1 min-w-0">
							{Icon ? <Icon className={cn(ui.iconNude.xs, "text-muted-foreground shrink-0")} aria-hidden="true" /> : null}
							<span className="min-w-0 truncate leading-tight">
								{highlight_matches(part.label, query, render_with_tooltips)}
							</span>
						</span>
					</React.Fragment>
				)
			})}
		</span>
	)
}

const resolve_description_source = (entry: SearchEntry, query: string) => {
	const base = entry.displayDescription ?? entry.description ?? ""
	if (!query) return base
	const normalized = query.trim().toLowerCase()
	if (!normalized) return base
	if (base.toLowerCase().includes(normalized)) return base
	const fallback = entry.searchChunks?.find((chunk) => chunk.toLowerCase().includes(normalized))
	return fallback ?? base
}

type DefinitionSectionProps = {
	label: string
	entries: SearchEntry[]
	query: string
	onSelect: (entry: SearchEntry) => void
	activeResultId?: string
	hoveredResultId?: string | null
	getResultIndex: (entry: InteractiveSearchEntry) => number
	onHoverResult: (entry: InteractiveSearchEntry | null) => void
	renderTitle?: (result: SearchEntry, title_node: React.ReactNode, query: string) => React.ReactNode
	renderFooter?: (result: SearchEntry) => React.ReactNode
}

function DefinitionSection({
	label,
	entries,
	query,
	onSelect,
	activeResultId,
	hoveredResultId,
	getResultIndex,
	onHoverResult,
	renderTitle,
	renderFooter,
}: DefinitionSectionProps) {
	if (!entries.length) return null
	return (
		<div className={cn("flex flex-col", ui.gap.xs)}>
			<div className={cn(ui.typography.caption, "font-semibold uppercase tracking-[0.2em] text-muted-foreground")} role="presentation">
				{label}
			</div>
			<div className={cn("flex flex-col", ui.gap.xs)}>
				{entries.map((result) => {
					const description_source = resolve_description_source(result, query)
					const description_node = description_source ? highlight_matches(description_source, query, render_with_tooltips) : null
					const title_node = highlight_matches(result.title, query, render_with_tooltips)
					const title_content = renderTitle ? renderTitle(result, title_node, query) : <div className={cn(ui.typography.body, "font-semibold")}>{title_node}</div>
					const actionable = is_result_actionable(result)
					const is_hovered = hoveredResultId === result.id
					const is_active_row = activeResultId === result.id || is_hovered
					const card_class = cn(
						definition_card_class,
						actionable && "w-full text-left cursor-pointer focus-visible:outline-none",
						!actionable && "cursor-default select-text",
						actionable && ui.search.focusRing,
						actionable && ui.component.outline.hover,
						actionable && ui.surface.state.hover.shadowSm,
						actionable && ui.search.rowHoverBorderBlue,
						actionable && ui.search.rowHoverBgBlue,
						is_active_row &&
							cn(
								ui.search.rowActiveShadow,
								"text-foreground",
								ui.search.rowActiveBorderBlue,
								ui.search.rowActiveBgBlue
							)
					)
					const footer_content = renderFooter ? renderFooter(result) : null

					const content = (
						<>
							{title_content}
							{description_node ? <p className={cn("mt-1 text-muted-foreground", ui.typography.caption)}>{description_node}</p> : null}
							{footer_content}
						</>
					)

					return actionable ? (
						<button
							key={result.id}
							type="button"
							id={result_dom_id(result)}
							role="option"
							aria-selected={is_active_row}
							className={card_class}
							onClick={() => onSelect(result)}
							onMouseEnter={() => {
								onHoverResult(result)
							}}
							onMouseLeave={() => onHoverResult(null)}
							data-search-result-index={getResultIndex(result)}
						>
							{content}
						</button>
					) : (
						<div key={result.id} className={card_class} role="presentation">
							{content}
						</div>
					)
				})}
			</div>
		</div>
	)
}

const CloseIcon = ({ className }: { className?: string }) => (
	<svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
		<line x1="5" y1="5" x2="19" y2="19" className="stroke-current stroke-[1.5]" strokeLinecap="round" />
		<line x1="19" y1="5" x2="5" y2="19" className="stroke-current stroke-[1.5]" strokeLinecap="round" />
	</svg>
)

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function Search({ onGoToTab, onOpenChange }: SearchProps) {
	const reduce_motion = useReducedMotionBool()

	const [isOpen, setIsOpen] = React.useState(false)
	const [query, setQuery] = React.useState("")
	const [cursor, setCursor] = React.useState(-1)
	const [hoveredResultId, setHoveredResultId] = React.useState<string | null>(null)
	const [catalog, setCatalog] = React.useState<Catalog | null>(null)
	const [catalogStatus, setCatalogStatus] = React.useState<"idle" | "loading" | "ready" | "error">("idle")
	const [isCoarsePointer, setIsCoarsePointer] = React.useState(false)

	const input_ref = React.useRef<HTMLInputElement | null>(null)
	const scroll_timeout_ref = React.useRef<number | null>(null)
	const wrapper_ref = React.useRef<HTMLDivElement | null>(null)
	const focus_token_ref = React.useRef(0)
	const has_highlight_ref = React.useRef(false)
	const catalog_promise_ref = React.useRef<Promise<Catalog> | null>(null)
	const listbox_id = React.useId()

	const normalized_query = query.trim().toLowerCase()

	React.useEffect(() => {
		if (typeof window === "undefined" || typeof window.matchMedia !== "function") return
		const media = window.matchMedia("(hover: none), (pointer: coarse)")
		const sync = () => setIsCoarsePointer(media.matches)
		sync()

		if (typeof media.addEventListener === "function") {
			media.addEventListener("change", sync)
			return () => media.removeEventListener("change", sync)
		}

		media.addListener(sync)
		return () => media.removeListener(sync)
	}, [])

	const load_catalog = React.useCallback(async () => {
		let should_run = true
		setCatalogStatus((prev) => {
			if (prev !== "idle") {
				should_run = false
				return prev
			}
			return "loading"
		})
		if (!should_run) return

		try {
			if (!catalog_promise_ref.current) {
				catalog_promise_ref.current = import("@/features/playbook/search/catalog").then((module) => module.buildCatalog())
			}

			const loaded_catalog = await catalog_promise_ref.current
			setCatalog(loaded_catalog)
			setCatalogStatus("ready")
		} catch (error) {
			console.warn("Search catalog load failed:", error)
			catalog_promise_ref.current = null
			setCatalogStatus("error")
		}
	}, [])

	const filtered_results = React.useMemo(() => {
		if (!normalized_query) return []
		if (!catalog) return []
		const query_tokens = tokenize_search_query(normalized_query)
		if (!query_tokens.length) return []

		const normalized_info = (value?: string) => (value ?? "").toLowerCase()
		const boundary_index = (text: string, token: string) => text.search(new RegExp(`\\b${escape_regexp(token)}`, "i"))
		const matches: { entry: SearchEntry; score: number }[] = []

		for (const entry of catalog.entries) {
			const title = normalized_info(entry.title)
			const description = normalized_info(entry.description)
			const meta = normalized_info(entry.meta)
			const keywords = (entry.keywords ?? []).map((value) => normalized_info(value))
			const chunks = (entry.searchChunks ?? []).map((value) => normalized_info(value))
			const field_pool = [entry.searchable, title, description, meta, ...keywords, ...chunks]
			if (!query_tokens.every((token) => field_pool.some((field) => field.includes(token)))) continue

			let score = entry.priority ?? 100
			const full_query_index = entry.searchable.indexOf(normalized_query)
			if (title === normalized_query) score -= 1200
			else if (title.startsWith(normalized_query)) score -= 900
			else if (keywords.some((keyword) => keyword === normalized_query)) score -= 820
			else if (keywords.some((keyword) => keyword.startsWith(normalized_query))) score -= 700
			else if (full_query_index >= 0) score -= Math.max(320 - Math.min(full_query_index, 320), 0)

			for (const token of query_tokens) {
				const title_index = title.indexOf(token)
				const keyword_exact = keywords.some((keyword) => keyword === token)
				const keyword_prefix = keywords.some((keyword) => keyword.startsWith(token))
				const keyword_match = keywords.some((keyword) => keyword.includes(token))
				const chunk_match = chunks.some((chunk) => chunk.includes(token))

				if (title_index === 0) score -= 160
				else if (title_index > 0 && boundary_index(title, token) >= 0) score -= 120
				else if (title_index > 0) score -= 80

				if (keyword_exact) score -= 110
				else if (keyword_prefix) score -= 75
				else if (keyword_match) score -= 45

				if (meta.includes(token)) score -= 35
				if (description.includes(token)) score -= 20
				if (chunk_match) score -= 12
			}

			matches.push({ entry, score })
		}

		matches.sort((a, b) => {
			if (a.score !== b.score) return a.score - b.score
			return a.entry.title.localeCompare(b.entry.title)
		})

		return matches.slice(0, 40).map((match) => match.entry)
	}, [catalog, normalized_query])

	const display_results = React.useMemo(() => (normalized_query ? filtered_results : []), [filtered_results, normalized_query])
	const { tab_results, definition_sections, has_definition_entries } = React.useMemo(() => {
		const tab_results = display_results.filter((entry) => !is_definition_search_entry(entry))
		const definition_results = display_results.filter(is_definition_search_entry)

		const definition_groups = definition_results.reduce(
			(acc, entry) => {
				acc[entry.category].push(entry)
				return acc
			},
			create_definition_groups()
		)

		const definition_section_overrides: Partial<
			Record<
				DefinitionSearchCategory,
				{
					renderTitle?: (result: SearchEntry, title_node: React.ReactNode, query: string) => React.ReactNode
					renderFooter?: (result: SearchEntry) => React.ReactNode
				}
			>
		> = {
			metric: {
				renderFooter: (result: SearchEntry) =>
					result.formula ? (
						<div className="mt-0.5">
							<Renderer.Formula.View formula={result.formula} />
						</div>
					) : null,
			},
		}

		const definition_sections = definition_search_categories.map((key) => ({
			key,
			label: definition_group_labels[key],
			entries: definition_groups[key],
			...(definition_section_overrides[key] ?? {}),
		}))

		const has_definition_entries = definition_sections.some((section) => section.entries.length)

		return { tab_results, definition_sections, has_definition_entries }
	}, [display_results])

	const interactive_results = React.useMemo(
		() => [...tab_results, ...definition_sections.flatMap((section) => section.entries)].filter(is_result_actionable),
		[definition_sections, tab_results]
	)
	const interactive_result_index_by_id = React.useMemo(() => {
		const index_by_id = new Map<string, number>()
		interactive_results.forEach((entry, index) => index_by_id.set(entry.id, index))
		return index_by_id
	}, [interactive_results])
	const get_result_index = React.useCallback((entry: InteractiveSearchEntry) => interactive_result_index_by_id.get(entry.id) ?? -1, [interactive_result_index_by_id])
	const active_result = cursor >= 0 ? interactive_results[cursor] : null
	const active_descendant = active_result ? result_dom_id(active_result) : undefined

	React.useEffect(() => {
		if (!isOpen) return
		input_ref.current?.focus()
	}, [isOpen])

	React.useEffect(() => {
		if (!isOpen) return
		void load_catalog()
	}, [isOpen, load_catalog])

	React.useEffect(() => {
		if (typeof window === "undefined") return
		if (catalogStatus !== "idle") return

		let cancelled = false
		const request_idle_callback = "requestIdleCallback" in window ? window.requestIdleCallback.bind(window) : null
		const cancel_idle_callback = "cancelIdleCallback" in window ? window.cancelIdleCallback.bind(window) : null

		const run = () => {
			if (cancelled) return
			void load_catalog()
		}

		const handle = request_idle_callback ? request_idle_callback(() => run(), { timeout: idle_catalog_timeout_ms }) : window.setTimeout(run, idle_catalog_timeout_ms)

		return () => {
			cancelled = true
			if (request_idle_callback && cancel_idle_callback) cancel_idle_callback(handle)
			else window.clearTimeout(handle)
		}
	}, [catalogStatus, load_catalog])

	React.useEffect(() => {
		setCursor((prev) => {
			if (!interactive_results.length) return -1
			if (prev >= interactive_results.length) return interactive_results.length - 1
			return prev
		})
	}, [interactive_results.length])

	React.useEffect(() => {
		if (!normalized_query) setHoveredResultId(null)
	}, [normalized_query])

	const clear_scroll_timeout = React.useCallback(() => {
		if (typeof window === "undefined" || scroll_timeout_ref.current == null) return
		window.clearTimeout(scroll_timeout_ref.current)
		scroll_timeout_ref.current = null
	}, [])

	React.useEffect(() => () => clear_scroll_timeout(), [clear_scroll_timeout])

	React.useEffect(() => {
		const handle_pointer_down = () => {
			if (!has_highlight_ref.current) return
			clear_search_highlights()
			has_highlight_ref.current = false
		}
		document.addEventListener("pointerdown", handle_pointer_down, true)
		return () => document.removeEventListener("pointerdown", handle_pointer_down, true)
	}, [])

	const find_target = React.useCallback((target?: string) => {
		if (!target || typeof document === "undefined") return null
		return document.querySelector<HTMLElement>(`[data-search-target="${target}"]`)
	}, [])

	const scroll_to_target_now = React.useCallback(
		(target?: string) => {
			if (!target || typeof window === "undefined") return null
			const anchor = find_target(target)
			if (!anchor) return null
			const align = anchor.dataset.searchAlign ?? "top"
			const { top: stickyOffset } = getFocusViewportBounds()
			let top = Math.max(0, window.scrollY + anchor.getBoundingClientRect().top - stickyOffset)

			if (align === "focus") {
				const vh = window.innerHeight || 0
				const focusRatio = 0.45
				const focusOffset = Number(anchor.dataset.searchFocusOffset ?? "0")
				const desired = vh * focusRatio + focusOffset
				const rect = anchor.getBoundingClientRect()
				const target_center = rect.top + rect.height / 2
				top = Math.max(0, window.scrollY + target_center - desired)
			}

			window.scrollTo({ top, behavior: reduce_motion ? "auto" : "smooth" })
			return anchor
		},
		[find_target, reduce_motion]
	)

	const focus_target = React.useCallback(
		(target?: string, highlight_query?: string, delay = 0) => {
			if (!target || typeof window === "undefined") return
			focus_token_ref.current += 1
			const token = focus_token_ref.current
			const trimmed = highlight_query?.trim() ?? ""

			const run = (attempt: number) => {
				if (focus_token_ref.current !== token) return
				const anchor = scroll_to_target_now(target)
				if (anchor) {
					if (trimmed) {
						clear_search_highlights()
						const hits = apply_search_highlights(anchor, trimmed, search_highlight_class)
						has_highlight_ref.current = hits > 0
					}
					return
				}
				if (attempt < 12) window.setTimeout(() => run(attempt + 1), 140)
			}

			const schedule = () => run(0)
			if (delay > 0) window.setTimeout(schedule, delay)
			else window.requestAnimationFrame(schedule)

			clear_scroll_timeout()
			scroll_timeout_ref.current = window.setTimeout(schedule, 220)
		},
		[clear_scroll_timeout, scroll_to_target_now]
	)

	const close = React.useCallback(
		({ preserveQuery = false }: { preserveQuery?: boolean } = {}) => {
			clear_scroll_timeout()
			setIsOpen(false)
			setHoveredResultId(null)
			setCursor(-1)
			input_ref.current?.blur()
			if (!preserveQuery) setQuery("")
		},
		[clear_scroll_timeout]
	)

	const scroll_after_tab = React.useCallback(
		(target?: string, highlight_query?: string, delay = 0) => {
			if (!target) return
			focus_target(target, highlight_query, delay)
		},
		[focus_target]
	)

	const handle_select = React.useCallback(
		(entry: SearchEntry) => {
			clear_search_highlights()
			has_highlight_ref.current = false
			close()

			const scroll_target = entry.scrollTarget
			const highlight_query = query.trim()
			const spend_panel_id = resolve_spend_panel_id(entry)

			if (entry.category === "framework") {
				sync_frameworks_filter("all")
				const framework_id = entry.id.startsWith("framework:") ? entry.id.slice("framework:".length) : entry.meta
				if (framework_id) sync_frameworks_reveal(String(framework_id), highlight_query)
			}

			if (spend_panel_id) {
				sync_spend_view(spend_panel_id)
				if (entry.tabId === "plays" && typeof window !== "undefined") {
					window.requestAnimationFrame(() => sync_spend_view(spend_panel_id))
					window.setTimeout(() => sync_spend_view(spend_panel_id), 220)
				}
			}

			if (entry.tabId) {
				onGoToTab(entry.tabId)
				scroll_after_tab(scroll_target, highlight_query, 180)
				return
			}

			scroll_after_tab(scroll_target, highlight_query)
		},
		[close, onGoToTab, query, scroll_after_tab]
	)

	const handle_input_key_down = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (!interactive_results.length) {
			if (event.key === "Escape") {
				event.preventDefault()
				close()
			}
			return
		}

		if (event.key === "ArrowDown") {
			event.preventDefault()
			setCursor((prev) => Math.min(prev + 1, interactive_results.length - 1))
			return
		}

		if (event.key === "ArrowUp") {
			event.preventDefault()
			setCursor((prev) => Math.max(prev - 1, -1))
			return
		}

		if (event.key === "Enter") {
			event.preventDefault()
			if (isCoarsePointer) {
				input_ref.current?.blur()
				return
			}
			const target_index = cursor >= 0 ? cursor : 0
			const entry = interactive_results[target_index]
			if (entry) handle_select(entry)
		}

		if (event.key === "Escape") {
			event.preventDefault()
			close()
		}
	}

	React.useEffect(() => {
		if (!isOpen) return
		const handle_pointer_down = (event: PointerEvent) => {
			const target = event.target instanceof Node ? event.target : null
			if (!target) return
			if (wrapper_ref.current?.contains(target)) return
			close({ preserveQuery: true })
		}
		document.addEventListener("pointerdown", handle_pointer_down, true)
		return () => document.removeEventListener("pointerdown", handle_pointer_down, true)
	}, [isOpen, close])

	React.useEffect(() => {
		if (!isOpen) return
		const can_dismiss_on_scroll = window.matchMedia("(hover: hover) and (pointer: fine)").matches
		if (!can_dismiss_on_scroll) return

		const handle_scroll = () => close({ preserveQuery: true })
		window.addEventListener("scroll", handle_scroll, { passive: true })
		return () => window.removeEventListener("scroll", handle_scroll)
	}, [isOpen, close])

	const open = React.useCallback(() => {
		setIsOpen(true)
	}, [])

	React.useEffect(() => {
		const handle_key_down = (event: KeyboardEvent) => {
			if (is_text_input_target(event.target)) return

			const key = event.key.toLowerCase()
			const noMods = !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey
			const isShortcut = (key === "k" && (event.metaKey || event.ctrlKey)) || (event.key === "/" && noMods)

			if (isShortcut) {
				event.preventDefault()
				open()
				window.requestAnimationFrame(() => input_ref.current?.focus())
				return
			}

			if (key === "escape" && isOpen) {
				event.preventDefault()
				close({ preserveQuery: true })
			}
		}

		window.addEventListener("keydown", handle_key_down)
		return () => window.removeEventListener("keydown", handle_key_down)
	}, [close, isOpen, open])

	React.useEffect(() => {
		onOpenChange?.(isOpen)
	}, [isOpen, onOpenChange])

	return (
		<div
			ref={wrapper_ref}
			className={cn(
				"relative transition-[flex-basis] self-stretch",
				isOpen ? "flex-[1_1_100%] min-w-0" : "flex-none min-w-[48px]"
			)}
			data-playbook-search-anchor
		>
			<motion.div
				variants={{ closed: { width: 48 }, open: { width: "100%" } }}
				initial="closed"
				animate={isOpen ? "open" : "closed"}
				className={cn(
					search_row_class,
					"justify-start w-full pl-1.5 pr-1.5",
					isOpen ? "gap-1.5" : "gap-0",
					isOpen && "pr-2",
					isOpen && ui.search.activeBorderBlue
				)}
				onClick={() => {
					if (!isOpen) open()
					input_ref.current?.focus()
				}}
			>
				<div className="grid place-items-center w-9 h-9 shrink-0">
					<SearchIcon className={cn(ui.iconNude.md, ui.text.muted.fg, "transition-colors duration-150", ui.search.iconColor, "shrink-0")} />
				</div>

				<input
					ref={input_ref}
					type="text"
					inputMode="search"
					enterKeyHint="search"
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					onFocus={() => open()}
					onKeyDown={handle_input_key_down}
					placeholder={PageCopy.bodySearch.placeholder}
					role="combobox"
					aria-expanded={Boolean(isOpen && normalized_query)}
					aria-controls={isOpen && normalized_query ? listbox_id : undefined}
					aria-autocomplete="list"
					aria-activedescendant={active_descendant}
					className={cn(
						search_input_class,
						isOpen ? "flex-1 opacity-100 text-foreground" : "flex-[0_0_0] opacity-0 pointer-events-none"
					)}
					autoComplete="off"
					autoCapitalize="none"
					autoCorrect="off"
					spellCheck={false}
					aria-label={PageCopy.bodySearch.ariaLabel}
				/>

				{isOpen ? (
					<button
						type="button"
						onClick={(event) => {
							event.stopPropagation()
							close()
						}}
						className={cn("rounded-full p-2 transition", ui.text.interactive.all, ui.search.focusRing)}
						aria-label={PageCopy.bodySearch.closeButtonAria}
					>
						<CloseIcon className={cn(ui.iconNude.md, ui.search.iconColor)} />
					</button>
				) : null}
			</motion.div>

			{isOpen && normalized_query ? (
				<motion.div
					initial="hidden"
					animate="visible"
					exit="hidden"
					variants={navMenuFadeVariants}
					className={cn(
						"absolute left-0 right-0 top-full mt-1 transition overflow-hidden",
						"z-50",
						ui.radius.base,
						ui.surface.structure.border,
						ui.nav.shell.blurBg,
						ui.search.menuBg,
						ui.search.menuShadow,
						ui.search.menuShadowHover,
						ui.search.menuHover,
						ui.search.menuFocusRing,
						menu_outer_padding_class,
						"group"
					)}
				>
					<div
						id={listbox_id}
						role="listbox"
						aria-label={PageCopy.bodySearch.resultsAriaLabel}
						className={cn("relative max-h-[60vh] overflow-auto", menu_inner_padding_class)}
					>
						<div className={ui.search.menuContentPadding}>
							{display_results.length ? (
								<>
									<div className={cn("flex flex-col md:flex-row", ui.gap.xs, "md:gap-1")}>
										<div className={cn("w-full md:flex-[2] md:min-w-0 flex flex-col", ui.gap.xs)}>
											<div className={cn(ui.typography.caption, "font-semibold uppercase tracking-wide text-muted-foreground")} role="presentation">
												{PageCopy.bodySearch.tabsLabel}
											</div>

											{tab_results.length ? (
												<div className={cn("flex flex-col", ui.gap.xs)}>
													{tab_results.map((result) => {
														const description_source = resolve_description_source(result, normalized_query)
														const description_node = description_source
															? highlight_matches(description_source, normalized_query, render_with_tooltips)
															: null
														const hierarchy_node = render_hierarchy_label(result, normalized_query)
														const result_index = get_result_index(result)

														const raw_description = result.description ?? ""
														const description_lower = raw_description.toLowerCase()
														const match_index =
															normalized_query && normalized_query.length ? description_lower.indexOf(normalized_query) : -1
														const show_leading_ellipsis = match_index > 0
														const show_trailing_ellipsis =
															match_index >= 0 && match_index + normalized_query.length < raw_description.length

														const is_hovered = hoveredResultId === result.id
														const is_active_row = is_hovered || active_result?.id === result.id

														const active_row_classes = is_active_row
															? cn(
																	ui.search.rowActiveShadow,
																	"text-foreground",
																	ui.search.rowActiveBorderBlue,
																	ui.search.rowActiveBgBlue
																)
															: undefined

														const className = cn(
															result_row_class,
															"cursor-pointer",
															ui.search.rowHoverBorderBlue,
															ui.search.rowHoverBgBlue,
															"focus-visible:outline-none",
															active_row_classes
														)

														return (
															<button
																key={result.id}
																type="button"
																id={result_dom_id(result)}
																role="option"
																aria-selected={is_active_row}
																onClick={() => handle_select(result)}
																onMouseEnter={() => {
																	setHoveredResultId(result.id)
																	setCursor(result_index)
																}}
																onMouseLeave={() => setHoveredResultId(null)}
																className={className}
															>
																<ResultContent
																	result={result}
																	description_node={description_node}
																	hierarchy_node={hierarchy_node}
																	show_leading_ellipsis={show_leading_ellipsis}
																	show_trailing_ellipsis={show_trailing_ellipsis}
																/>
															</button>
														)
													})}
												</div>
											) : (
												<div className={cn("rounded-[var(--radius-control)] bg-background/70 px-3 py-2 text-muted-foreground", ui.typography.body)} role="presentation">
													{PageCopy.bodySearch.noTabMatches}
												</div>
											)}
										</div>

										<div className={cn("w-full md:flex-[1] md:min-w-0 flex flex-col border-t border-border/30 pt-1 md:border-t-0 md:border-l md:pl-1", ui.gap.xs)}>
											<div className={cn(ui.typography.caption, "font-semibold uppercase tracking-wide text-muted-foreground")} role="presentation">
												{PageCopy.bodySearch.definitionsLabel}
											</div>

											<div className={cn("flex flex-col text-foreground", ui.typography.body, ui.gap.xs)}>
														{definition_sections.map((section) => (
													<DefinitionSection
														key={section.key}
														label={section.label}
														entries={section.entries}
														query={normalized_query}
														onSelect={handle_select}
														activeResultId={active_result?.id}
														hoveredResultId={hoveredResultId}
														getResultIndex={get_result_index}
														onHoverResult={(entry) => {
															if (!entry) {
																setHoveredResultId(null)
																return
															}
															setHoveredResultId(entry.id)
															setCursor(get_result_index(entry))
														}}
														renderTitle={section.renderTitle}
														renderFooter={section.renderFooter}
													/>
												))}

												{!has_definition_entries ? (
													<div className={cn("py-2 text-muted-foreground", ui.typography.body)} role="presentation">
														{PageCopy.bodySearch.noDefinitionMatches}
													</div>
												) : null}
											</div>
										</div>
									</div>
								</>
							) : (
								<div className={cn("py-6 text-center", ui.typography.body, ui.text.muted.fg)}>
									{catalogStatus === "loading"
										? PageCopy.bodySearch.loadingCatalog
										: catalogStatus === "error"
										? PageCopy.bodySearch.catalogError
										: PageCopy.bodySearch.emptyState}
								</div>
							)}
						</div>

						<div className="sr-only" aria-live="polite">
							{normalized_query ? PageCopy.bodySearch.resultsCountLabel.replace("{count}", String(display_results.length)) : ""}
						</div>
					</div>
				</motion.div>
			) : null}
		</div>
	)
}

function ResultContent({
	result,
	description_node,
	show_leading_ellipsis,
	show_trailing_ellipsis,
	hierarchy_node,
}: ResultContentProps) {
	return (
		<>
			{hierarchy_node ? (
				<div
					className={cn(
						"mb-0.5 font-semibold uppercase tracking-[0.02em]",
						ui.typography.caption,
						ui.text.muted.fg,
						"flex items-center gap-1 min-w-0"
					)}
				>
					{hierarchy_node}
				</div>
			) : (
				<div className={cn("mb-0.5 font-semibold", ui.typography.body, ui.text.default.fg)}>
					{render_with_tooltips(result.title)}
				</div>
			)}
			{description_node ? (
				<p className={cn(hierarchy_node ? "mt-0.5" : "mt-1", ui.typography.body, ui.text.muted.fg)}>
					{show_leading_ellipsis ? "..." : null}
					{description_node}
					{show_trailing_ellipsis ? "..." : null}
				</p>
			) : null}
		</>
	)
}



