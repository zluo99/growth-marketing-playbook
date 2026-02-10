"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"
import { AlertTriangle, Check, Copy as CopyIcon, Rocket } from "lucide-react"

import { ui } from "@/components/tokens/design"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { Renderer } from "@/features/playbook/components/ui/renderer"
import { CodeBlock } from "@/features/playbook/components/ui/code"
import {
	PbCard,
	PbCardContent,
	PbCardGlow,
	PbCardHeader,
	PbCardLayer,
	PbFocus,
	PbMetricList,
	PbNumberBadge,
	PbReveal,
	PbSubtleText,
	PbTabIntro,
	PbTabPanel,
	createUnknownMetricLogger,
} from "@/features/playbook/components/ui/ui"
import { AnalysisCopy, type AnalysisPanel } from "@/features/playbook/copy/journeys-analysis"
import { ProblemCopy } from "@/features/playbook/copy/journeys-problem"
import { RButton, RCopy, RCode } from "@/features/playbook/copy/journeys-r"
import { TabById } from "@/features/playbook/definitions/tabs"

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const journey_section_icons = {
	alert: AlertTriangle,
	rocket: Rocket,
} as const

const journeys_key_prefix = "journeys"

/* -------------------------------------------------------------------------- */
/* Hooks                                                                      */
/* -------------------------------------------------------------------------- */

function useCopyToClipboard(timeout_ms = 1200) {
	const [copied, set_copied] = React.useState(false)
	const timeout_ref = React.useRef<number | null>(null)

	const clear = React.useCallback(() => {
		if (timeout_ref.current != null) window.clearTimeout(timeout_ref.current)
		timeout_ref.current = null
	}, [])

	React.useEffect(() => clear, [clear])

	const copy = React.useCallback(
		async (text: string) => {
			if (!navigator?.clipboard?.writeText) return false
			try {
				await navigator.clipboard.writeText(text)
				set_copied(true)
				clear()
				timeout_ref.current = window.setTimeout(() => set_copied(false), timeout_ms)
				return true
			} catch {
				return false
			}
		},
		[clear, timeout_ms]
	)

	return { copied, copy }
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function CopyCodeButton({ code }: { code: string }) {
	const { copied, copy } = useCopyToClipboard()

	return (
		<Button
			type="button"
			className={cn(buttonVariants({ variant: "success", size: "sm" }), ui.surface.state.hover.shadowMd, "min-w-[92px]")}
			onClick={() => void copy(code)}
			aria-label={copied ? RButton.copyButton.ariaCopied : RButton.copyButton.ariaCopy}
		>
			{copied ? <Check className={ui.iconNude.lg} /> : <CopyIcon className={ui.iconNude.lg} />}
			<span>
				<Renderer.Copy.InlineText
					text={copied ? RButton.copyButton.labelCopied : RButton.copyButton.label}
					keyPrefix={`${journeys_key_prefix}-copy-button`}
				/>
			</span>
		</Button>
	)
}

function SectionCard({
	title,
	icon,
	glowKey,
	description,
	bullets,
	keyPrefix,
	onUnknownToken,
}: {
	title: string
	icon?: React.ReactNode
	glowKey?: "red" | "green"
	description?: string
	bullets: readonly string[]
	keyPrefix: string
	onUnknownToken: (token: string) => React.ReactNode
}) {
	const glow = glowKey === "red" ? ui.glow.red : glowKey === "green" ? ui.glow.green : null

	return (
		<PbTabPanel className="relative flex h-full flex-col overflow-hidden bg-transparent">
			{glow ? <PbCardGlow className={glow} /> : null}

			<PbCardLayer className="flex h-full flex-col">
				<div className={cn("flex items-center", ui.gap.sm)}>
					{icon ? (
						<span
							className={cn(
								"inline-flex h-8 w-8 items-center justify-center",
								ui.surface.structure.border,
								"bg-background text-muted-foreground",
								ui.radius.control
							)}
						>
							{icon}
						</span>
					) : null}
					<div className={cn("text-foreground", ui.typography.title.md)}>
						<Renderer.Copy.InlineText text={title} keyPrefix={`${keyPrefix}-title`} onUnknownToken={onUnknownToken} />
					</div>
				</div>

				{description ? (
					<p className={cn(ui.typography.body, "text-muted-foreground", ui.margin.topXs)}>
						<Renderer.Copy.InlineText text={description} keyPrefix={`${keyPrefix}-body`} onUnknownToken={onUnknownToken} />
					</p>
				) : null}

				<div className={cn(ui.margin.topSm, "flex-1")}>
					<PbMetricList items={bullets} size="body" onUnknownToken={onUnknownToken} />
				</div>
			</PbCardLayer>
		</PbTabPanel>
	)
}

function AnalysisBlock({
	panel,
	idx,
	onUnknownToken,
}: {
	panel: AnalysisPanel
	idx: number
	onUnknownToken: (token: string) => React.ReactNode
}) {
	return (
		<PbTabPanel>
			<div className={cn("flex items-start justify-between", ui.gap.sm)}>
				<div className="min-w-0">
					<div className={cn("text-foreground", ui.typography.title.md)}>
						<Renderer.Copy.InlineText
							text={panel.title}
							keyPrefix={`${journeys_key_prefix}-analysis-title-${panel.id}`}
							onUnknownToken={onUnknownToken}
						/>
					</div>

					<p className={cn(ui.margin.topXs, "text-muted-foreground", ui.typography.body)}>
						<Renderer.Copy.InlineText text={panel.body} keyPrefix={`${journeys_key_prefix}-analysis-body-${panel.id}`} onUnknownToken={onUnknownToken} />
					</p>
				</div>

				<PbNumberBadge number={idx + 1} ariaLabel={AnalysisCopy.ui.analysisItemLabel.replace("{n}", String(idx + 1))} />
			</div>

			<div className={ui.margin.topSm}>
				<PbMetricList items={panel.bullets} size="body" onUnknownToken={onUnknownToken} />
			</div>
		</PbTabPanel>
	)
}

/* -------------------------------------------------------------------------- */
/* Default export                                                             */
/* -------------------------------------------------------------------------- */

export default function TabJourneys() {
	const warn_unknown_metric = React.useMemo(() => createUnknownMetricLogger("Journeys"), [])
	const tab = TabById["journeys"]

	return (
		<div className={cn("flex flex-col", ui.gap.lg)} data-search-target="tab:journeys">
			<PbTabIntro alias={tab.alias} description={tab.description} keyPrefix={`${journeys_key_prefix}-intro`} />

			<PbFocus className={cn("flex flex-col", ui.gap.lg)}>
				<PbReveal className="w-full" data-search-target="problem-card">
				<PbCard hover className={ui.surface.structure.shadowNone}>
					<PbCardHeader
						title={
							<span className={cn(ui.typography.title.lg, ui.margin.allNone)}>
								<Renderer.Copy.InlineText text={ProblemCopy.title} keyPrefix={`${journeys_key_prefix}-problem-title`} onUnknownToken={warn_unknown_metric} />
							</span>
						}
						description={
							<PbSubtleText size="body" className={ui.margin.allNone}>
								<Renderer.Copy.InlineText text={ProblemCopy.body} keyPrefix={`${journeys_key_prefix}-problem-body`} onUnknownToken={warn_unknown_metric} />
							</PbSubtleText>
						}
					/>

					<PbCardContent>
						<div className={cn("grid items-stretch md:grid-cols-2", ui.gap.sm)}>
							{ProblemCopy.sections.map((s) => (
								<SectionCard
									key={s.id}
									title={s.title}
									bullets={s.bullets}
									onUnknownToken={warn_unknown_metric}
									keyPrefix={`${journeys_key_prefix}-section-${s.id}`}
									glowKey={s.glow}
									icon={journey_section_icons[s.icon] ? React.createElement(journey_section_icons[s.icon], { className: ui.iconNude.lg }) : undefined}
								/>
							))}
						</div>
					</PbCardContent>
				</PbCard>
			</PbReveal>

			<PbReveal className="w-full" data-search-target="analysis-card">
				<PbCard hover className={ui.surface.structure.shadowNone}>
					<PbCardHeader
						title={
							<span className={cn(ui.typography.title.lg, ui.margin.allNone)}>
								<Renderer.Copy.InlineText text={AnalysisCopy.title} keyPrefix={`${journeys_key_prefix}-analysis-title`} onUnknownToken={warn_unknown_metric} />
							</span>
						}
						description={
							<PbSubtleText size="body" className={ui.margin.allNone}>
								<Renderer.Copy.InlineText text={AnalysisCopy.body} keyPrefix={`${journeys_key_prefix}-analysis-body`} onUnknownToken={warn_unknown_metric} />
							</PbSubtleText>
						}
					/>

					<PbCardContent>
						<div className={cn("grid md:grid-cols-3", ui.gap.sm)}>
							{AnalysisCopy.panels.map((panel, idx) => (
								<AnalysisBlock key={panel.id} panel={panel} idx={idx} onUnknownToken={warn_unknown_metric} />
							))}
						</div>

						{AnalysisCopy.footer ? (
							<p className={cn(ui.margin.topMd, "text-muted-foreground", ui.typography.caption)}>
								<Renderer.Copy.InlineText text={AnalysisCopy.footer} keyPrefix={`${journeys_key_prefix}-analysis-footer`} onUnknownToken={warn_unknown_metric} />
							</p>
						) : null}
					</PbCardContent>
				</PbCard>
			</PbReveal>

			<PbReveal className="w-full">
				<PbCard hover className={cn("relative overflow-hidden", ui.surface.structure.shadowNone)}>
					<PbCardGlow className={ui.glow.green} />

					<PbCardLayer>
						<PbCardHeader
							title={
								<span className={cn(ui.typography.title.lg, ui.margin.allNone)}>
									<Renderer.Copy.InlineText text={RCode.title} keyPrefix={`${journeys_key_prefix}-rcode-title`} onUnknownToken={warn_unknown_metric} />
								</span>
							}
							description={
								<PbSubtleText size="body" className={ui.margin.allNone}>
									<Renderer.Copy.InlineText text={RCode.body} keyPrefix={`${journeys_key_prefix}-rcode-body`} onUnknownToken={warn_unknown_metric} />
								</PbSubtleText>
							}
							action={
								<div className={cn("flex shrink-0 items-center", ui.gap.sm)}>
									<CopyCodeButton code={RCopy} />
								</div>
							}
						/>

						<PbCardContent>
							<div className={cn("flex flex-col", ui.gap.sm)}>
								<PbTabPanel size="sm" className={cn("overflow-hidden p-0", ui.surface.structure.opaque)}>
									<CodeBlock code={RCopy} language="r" className={cn("text-foreground")} style={{ maxHeight: `${ui.size.layout.sm}px` }} />
								</PbTabPanel>

								<PbMetricList items={RCode.bullets} size="caption" onUnknownToken={warn_unknown_metric} />
							</div>
						</PbCardContent>
					</PbCardLayer>
				</PbCard>
			</PbReveal>
		</PbFocus>
		</div>
	)
}
