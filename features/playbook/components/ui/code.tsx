"use client"

import * as React from "react"

import { ui } from "@/components/tokens/design"
import { cn } from "@/lib/cn"

type CodeLanguage = "sql" | "r" | "markdown" | "text"
type CodeTokenKind = "plain" | "keyword" | "string" | "comment" | "number" | "function"
type CodeToken = { kind: CodeTokenKind; value: string }

type CodeBlockProps = {
	code: string
	language?: CodeLanguage
	className?: string
	style?: React.CSSProperties
	compactViewportOuterScroll?: boolean
}

type CodeTextareaProps = {
	value: string
	onChange: (next: string) => void
	onMouseEnter?: React.MouseEventHandler<HTMLTextAreaElement>
	onFocus?: React.FocusEventHandler<HTMLTextAreaElement>
	ariaLabel: string
	className?: string
}

const sql_keywords = new Set(
	[
		"select",
		"from",
		"where",
		"group",
		"by",
		"order",
		"limit",
		"offset",
		"having",
		"join",
		"left",
		"right",
		"inner",
		"outer",
		"cross",
		"on",
		"as",
		"with",
		"and",
		"or",
		"not",
		"null",
		"is",
		"in",
		"between",
		"like",
		"case",
		"when",
		"then",
		"else",
		"end",
		"distinct",
		"union",
		"all",
		"into",
		"create",
		"table",
		"view",
		"drop",
		"alter",
		"update",
		"set",
		"delete",
		"insert",
		"values",
		"count",
		"sum",
		"avg",
		"min",
		"max",
		"date",
		"strftime",
		"substr",
		"cast",
		"nullif",
		"coalesce",
		"over",
		"partition",
	].map((x) => x.toLowerCase())
)

const r_keywords = new Set(
	[
		"library",
		"function",
		"if",
		"else",
		"for",
		"while",
		"repeat",
		"in",
		"next",
		"break",
		"true",
		"false",
		"null",
		"na",
		"nan",
		"inf",
		"return",
		"stop",
	].map((x) => x.toLowerCase())
)

const shared_functions = new Set(["mutate", "filter", "summarise", "arrange", "group_by", "left_join", "count", "slice_head", "case_when", "mean", "n", "read_csv", "str_split", "str_squish", "str_replace_all", "tolower", "trimws", "as.character", "as.numeric", "gsub", "vapply", "setdiff"])

const token_class: Record<CodeTokenKind, string> = {
	plain: "text-foreground",
	keyword: "text-blue-700 dark:text-blue-300",
	string: "text-emerald-700 dark:text-emerald-300",
	comment: "text-zinc-500 dark:text-zinc-400",
	number: "text-amber-700 dark:text-amber-300",
	function: "text-purple-700 dark:text-purple-300",
}

const identifier_re = /^[A-Za-z_.][A-Za-z0-9_.]*$/
const number_re = /^[0-9]+(?:\.[0-9]+)?$/

function token_kind(value: string, language: CodeLanguage): CodeTokenKind {
	const lower = value.toLowerCase()
	if (number_re.test(value)) return "number"
	if (!identifier_re.test(value)) return "plain"
	if (language === "markdown") return "plain"
	if (language === "sql" && sql_keywords.has(lower)) return "keyword"
	if (language === "r" && r_keywords.has(lower)) return "keyword"
	if (shared_functions.has(lower)) return "function"
	return "plain"
}

function tokenize_code(code: string, language: CodeLanguage): CodeToken[] {
	if (!code) return [{ kind: "plain", value: "" }]

	const out: CodeToken[] = []
	const push = (kind: CodeTokenKind, value: string) => {
		if (!value) return
		const prev = out[out.length - 1]
		if (prev && prev.kind === kind) prev.value += value
		else out.push({ kind, value })
	}

	let i = 0
	while (i < code.length) {
		const ch = code[i]
		const is_line_start = i === 0 || code[i - 1] === "\n"

		if (language === "markdown") {
			const remaining = code.slice(i)

			if (is_line_start) {
				const heading_match = remaining.match(/^#{1,6}[ \t]+[^\n]*/)
				if (heading_match?.[0]) {
					push("keyword", heading_match[0])
					i += heading_match[0].length
					continue
				}

				const quote_match = remaining.match(/^>[ \t]?[^\n]*/)
				if (quote_match?.[0]) {
					push("comment", quote_match[0])
					i += quote_match[0].length
					continue
				}

				const list_match = remaining.match(/^(\s*(?:[-*+]|\d+\.)\s+)/)
				if (list_match?.[1]) {
					push("keyword", list_match[1])
					i += list_match[1].length
					continue
				}
			}

			if (code.slice(i, i + 3) === "```") {
				const close_idx = code.indexOf("```", i + 3)
				if (close_idx === -1) {
					push("string", code.slice(i))
					break
				}
				push("string", code.slice(i, close_idx + 3))
				i = close_idx + 3
				continue
			}

			if (ch === "`") {
				let j = i + 1
				while (j < code.length && code[j] !== "`") j++
				if (j < code.length) j += 1
				push("string", code.slice(i, j))
				i = j
				continue
			}
		}

		if (language === "sql" && ch === "-" && code[i + 1] === "-") {
			let j = i + 2
			while (j < code.length && code[j] !== "\n") j++
			push("comment", code.slice(i, j))
			i = j
			continue
		}

		if (language === "r" && ch === "#") {
			let j = i + 1
			while (j < code.length && code[j] !== "\n") j++
			push("comment", code.slice(i, j))
			i = j
			continue
		}

		if (ch === "'" || ch === '"') {
			const quote = ch
			let j = i + 1
			while (j < code.length) {
				if (code[j] === "\\" && j + 1 < code.length) {
					j += 2
					continue
				}
				if (code[j] === quote) {
					j += 1
					break
				}
				j += 1
			}
			push("string", code.slice(i, j))
			i = j
			continue
		}

		if (/\s/.test(ch)) {
			let j = i + 1
			while (j < code.length && /\s/.test(code[j])) j++
			push("plain", code.slice(i, j))
			i = j
			continue
		}

		if (/[A-Za-z_.]/.test(ch)) {
			let j = i + 1
			while (j < code.length && /[A-Za-z0-9_.]/.test(code[j])) j++
			const ident = code.slice(i, j)
			const kind = token_kind(ident, language)
			push(kind, ident)
			i = j
			continue
		}

		if (/[0-9]/.test(ch)) {
			let j = i + 1
			while (j < code.length && /[0-9.]/.test(code[j])) j++
			push("number", code.slice(i, j))
			i = j
			continue
		}

		push("plain", ch)
		i += 1
	}

	return out
}

function HighlightedCode({ code, language }: { code: string; language: CodeLanguage }) {
	const tokens = React.useMemo(() => tokenize_code(code, language), [code, language])
	return (
		<>
			{tokens.map((t, idx) => (
				<span key={`${idx}-${t.kind}`} className={token_class[t.kind]}>
					{t.value}
				</span>
			))}
		</>
	)
}

const compact_viewport_outer_scroll_class =
	"[@media(max-height:48rem)]:h-auto [@media(max-height:48rem)]:max-h-none [@media(max-height:48rem)]:overflow-y-visible [@media(max-height:48rem)]:overflow-x-auto"

export function CodeBlock({ code, language = "text", className, style, compactViewportOuterScroll = false }: CodeBlockProps) {
	return (
		<pre
			className={cn(
				ui.margin.allNone,
				"min-w-0 w-full max-w-full overflow-x-auto overflow-y-auto font-mono leading-relaxed",
				ui.typography.caption,
				ui.spacing.panelMd,
				compactViewportOuterScroll && compact_viewport_outer_scroll_class,
				className
			)}
			style={style}
		>
			<code>
				<HighlightedCode code={code} language={language} />
			</code>
		</pre>
	)
}

export function CodeTextarea({ value, onChange, onMouseEnter, onFocus, ariaLabel, className }: CodeTextareaProps) {
	const textarea_ref = React.useRef<HTMLTextAreaElement | null>(null)
	const highlight_ref = React.useRef<HTMLPreElement | null>(null)

	const sync_scroll = React.useCallback(() => {
		const ta = textarea_ref.current
		const hl = highlight_ref.current
		if (!ta || !hl) return
		hl.scrollTop = ta.scrollTop
		hl.scrollLeft = ta.scrollLeft
	}, [])

	return (
		<div className={cn("relative h-full w-full overflow-hidden", className)}>
			<pre
				ref={highlight_ref}
				aria-hidden="true"
				className={cn(
					"pointer-events-none absolute inset-0 m-0 overflow-auto font-mono leading-relaxed",
					ui.typography.caption,
					ui.spacing.panelSm,
					"select-none"
				)}
			>
				<code>
					<HighlightedCode code={value.length ? value : " "} language="sql" />
				</code>
			</pre>

			<textarea
				ref={textarea_ref}
				value={value}
				onMouseEnter={onMouseEnter}
				onFocus={onFocus}
				onScroll={sync_scroll}
				onChange={(e) => onChange(e.target.value)}
				spellCheck={false}
				className={cn(
					"absolute inset-0 h-full w-full resize-none border-0 bg-transparent font-mono text-transparent outline-none",
					"selection:bg-sky-500/30 selection:text-transparent caret-foreground",
					ui.typography.caption,
					ui.spacing.panelSm,
					ui.surface.state.focus.ring
				)}
				aria-label={ariaLabel}
			/>
		</div>
	)
}
