"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"

import { cn } from "@/lib/utils"

import { Renderer } from "@/features/playbook/components/ui/renderer"
import { overview_tab_separator, overview_tab_subtitle, overview_tab_title } from "@/features/playbook/definitions/tabs"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type OverviewLetterRole = "overlay" | "target"

type RenderLetter = (opts: {
	char: string
	index: number
	role: OverviewLetterRole
	props: OverviewLetterSpanProps
}) => React.ReactNode

type OverviewLetterSpanProps = React.HTMLAttributes<HTMLSpanElement> & {
	"data-overview-letter"?: number
	"data-overview-role"?: OverviewLetterRole
	"data-overview-separator"?: "true"
}

export type OverviewOverlayLayout = "stack" | "inline"

export type OverviewOverlayLettersProps = {
	role: OverviewLetterRole
	layout?: OverviewOverlayLayout
	includeSeparator?: boolean
	reserveSeparator?: boolean
	className?: string
	keyPrefix?: string
	titleClassName?: string
	subtitleClassName?: string
	separatorClassName?: string
	letterClassName?: string
	renderLetter?: RenderLetter
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function render_inline_letters({
	text,
	startIndex,
	role,
	letterClassName,
	renderLetter,
	markSeparator = false,
}: {
	text: string
	startIndex: number
	role: OverviewLetterRole
	letterClassName?: string
	renderLetter?: RenderLetter
	markSeparator?: boolean
}) {
	const nodes: React.ReactNode[] = []
	let current_word: Array<{ char: string; index: number }> = []
	let index = startIndex

	const flush_word = () => {
		if (!current_word.length) return
		nodes.push(
			<span key={`word-${current_word[0]?.index ?? index}`} className="inline-block">
				{current_word.map(({ char, index: letter_index }) => {
					const props: OverviewLetterSpanProps = {
						"data-overview-letter": letter_index,
						"data-overview-role": role,
						"data-overview-separator": markSeparator ? "true" : undefined,
						className: cn("inline-block", letterClassName),
					}
					if (renderLetter) return renderLetter({ char, index: letter_index, role, props })
					return (
						<span key={`letter-${letter_index}`} {...props}>
							{char}
						</span>
					)
				})}
			</span>
		)
		current_word = []
	}

	for (const char of Array.from(text)) {
		if (char === " ") {
			flush_word()
			const space_index = index
			const props: OverviewLetterSpanProps = {
				"data-overview-letter": space_index,
				"data-overview-role": role,
				"data-overview-separator": markSeparator ? "true" : undefined,
				className: cn("inline-block whitespace-pre", letterClassName),
			}
			nodes.push(
				renderLetter ? (
					renderLetter({ char, index: space_index, role, props })
				) : (
					<span key={`space-${space_index}`} {...props}>
						{char}
					</span>
				)
			)
			index += 1
			continue
		}

		current_word.push({ char, index })
		index += 1
	}

	flush_word()

	return { nodes, nextIndex: index }
}

function render_inline_copy_letters({
	text,
	startIndex,
	role,
	letterClassName,
	renderLetter,
	markSeparator = false,
	keyPrefix,
}: {
	text: string
	startIndex: number
	role: OverviewLetterRole
	letterClassName?: string
	renderLetter?: RenderLetter
	markSeparator?: boolean
	keyPrefix: string
}) {
	let index = startIndex

	const renderText = (part: string, key: string) => {
		const { nodes, nextIndex } = render_inline_letters({
			text: part,
			startIndex: index,
			role,
			letterClassName,
			renderLetter,
			markSeparator,
		})
		index = nextIndex
		return <React.Fragment key={key}>{nodes}</React.Fragment>
	}

	const nodes = Renderer.Copy.renderInlineText(text, { keyPrefix, renderText })
	return { nodes, nextIndex: index }
}

export function OverviewOverlayLetters({
	role,
	layout = "stack",
	includeSeparator = false,
	reserveSeparator = false,
	className,
	keyPrefix = "overview",
	titleClassName,
	subtitleClassName,
	separatorClassName,
	letterClassName,
	renderLetter,
}: OverviewOverlayLettersProps) {
	const { title_line, separator_line, subtitle_line } = React.useMemo(() => {
		let index = 0
		const title = render_inline_copy_letters({
			text: overview_tab_title,
			startIndex: index,
			role,
			letterClassName,
			renderLetter,
			keyPrefix: `${keyPrefix}-${role}-title`,
		})
		index = title.nextIndex

		let separator: React.ReactNode | null = null
		if (includeSeparator) {
			const rendered = render_inline_copy_letters({
				text: overview_tab_separator,
				startIndex: index,
				role,
				letterClassName,
				renderLetter,
				markSeparator: true,
				keyPrefix: `${keyPrefix}-${role}-separator`,
			})
			separator = rendered.nodes
			index = rendered.nextIndex
		} else if (reserveSeparator) {
			index += Array.from(overview_tab_separator).length
		}

		const subtitle = render_inline_copy_letters({
			text: overview_tab_subtitle,
			startIndex: index,
			role,
			letterClassName,
			renderLetter,
			keyPrefix: `${keyPrefix}-${role}-subtitle`,
		})

		return { title_line: title.nodes, separator_line: separator, subtitle_line: subtitle.nodes }
	}, [includeSeparator, keyPrefix, letterClassName, renderLetter, reserveSeparator, role])

	if (layout === "inline") {
		return (
			<span className={cn("relative inline-block whitespace-normal break-words", className)} data-overview-overlay={role}>
				<span className="relative z-10">
					<span className={cn("whitespace-pre-wrap", titleClassName)}>{title_line}</span>
					{separator_line ? (
						<span className={cn("whitespace-pre-wrap", separatorClassName ?? titleClassName ?? subtitleClassName)}>{separator_line}</span>
					) : null}
					<span className={cn("whitespace-pre-wrap", subtitleClassName)}>{subtitle_line}</span>
				</span>
			</span>
		)
	}

	return (
		<div className={cn("relative flex flex-col whitespace-normal break-words", className)} data-overview-overlay={role}>
			<span className="relative z-10">
				<span
					className={cn("block whitespace-pre-wrap", titleClassName)}
				>
					{title_line}
				</span>
				<span className={cn("block whitespace-pre-wrap", subtitleClassName)}>{subtitle_line}</span>
			</span>
		</div>
	)
}
