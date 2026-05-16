"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"
import { AlertTriangle, Check, Copy as CopyIcon, Rocket } from "lucide-react"

import { ui } from "@/components/tokens/design"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/cn"

import { Renderer } from "@/features/playbook/components/ui/renderer"
import { CodeBlock } from "@/features/playbook/components/ui/code"
import { PbOverlay } from "@/features/playbook/components/ui/overlay"
import { useCopyToClipboard } from "@/features/playbook/components/ui/clipboard"
import {
	PbBulletList,
	PbCardContent,
	PbCardHeader,
	PbCardLayer,
	PbMetricList,
	PbNumberBadge,
	PbReveal,
	PbSubtleText,
	PbTabCard,
	PbTabPanel,
	PbTabShell,
	createUnknownMetricLogger,
} from "@/features/playbook/components/ui/ui"
import { AnalysisCopy, type AnalysisDiagram, type AnalysisPanel } from "@/features/playbook/copy/journeys-analysis"
import { ProblemCopy } from "@/features/playbook/copy/journeys-problem"
import { TabById } from "@/features/playbook/definitions/tabs"
import { SearchTargets } from "@/features/playbook/search/targets"

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const journey_section_icons = {
	alert: AlertTriangle,
	rocket: Rocket,
} as const

const journeys_key_prefix = "journeys"

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function CopyCodeButton({ code }: { code: string }) {
	const { copied, copy } = useCopyToClipboard()

	return (
		<>
			<Button
				type="button"
				className={cn(buttonVariants({ variant: "success", size: "sm" }), ui.surface.state.hover.shadowMd, "min-w-[92px]")}
				onClick={() => void copy(code)}
				aria-label={copied ? AnalysisCopy.ui.snippetCopyButtonAriaCopied : AnalysisCopy.ui.snippetCopyButtonAria}
			>
				{copied ? <Check className={ui.iconNude.lg} /> : <CopyIcon className={ui.iconNude.lg} />}
				<span>
					<Renderer.Copy.InlineText
						text={copied ? AnalysisCopy.ui.snippetCopyButtonLabelCopied : AnalysisCopy.ui.snippetCopyButtonLabel}
						keyPrefix={`${journeys_key_prefix}-copy-button`}
					/>
				</span>
			</Button>
			<span role="status" aria-live="polite" className="sr-only">
				{copied ? AnalysisCopy.ui.snippetCopyButtonAriaCopied : ""}
			</span>
		</>
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
	return (
		<PbTabPanel glow={glowKey} className="flex h-full flex-col bg-transparent">
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

const id_chip_class = cn(
	"inline-flex min-h-5 items-center whitespace-nowrap",
	"rounded-[var(--radius-control)] border border-[color:var(--border)] bg-background",
	"font-mono font-medium leading-none",
	ui.spacing.chipSm,
	ui.typography.caption
)

function AnalysisIdChip({ value }: { value: string }) {
	return <code className={id_chip_class}>{value}</code>
}

function AnalysisLinkBridge({ active = true, className }: { active?: boolean; className?: string }) {
	const line_color_class = "border-[color:var(--border)]/70"

	return (
		<div className={cn("flex items-center justify-center py-1 lg:px-2", className)} aria-hidden="true">
			{active ? (
				<>
					<span className="h-6 w-px bg-[color:var(--border)] lg:hidden" />
					<span className="hidden h-px w-full bg-[color:var(--border)] lg:block" />
				</>
			) : (
				<>
					<span className={cn("h-6 w-0 border-l border-dashed lg:hidden", line_color_class)} />
					<span className={cn("hidden h-0 w-full border-t border-dashed lg:block", line_color_class)} />
				</>
			)}
		</div>
	)
}

function AnalysisStepOneBlock({
	diagram,
	panel,
	onUnknownToken,
}: {
	diagram: AnalysisDiagram
	panel: AnalysisPanel
	onUnknownToken: (token: string) => React.ReactNode
}) {
	type DiagramObject = AnalysisDiagram["objects"][number]

	const format_object_label = React.useCallback((object: DiagramObject) => {
		const suffix = object.object_id.split("-")[1] ?? object.object_id
		return `${object.object_type.toLowerCase()}-${suffix}`
	}, [])

	const rules = panel.bullets.filter(Boolean)

	return (
		<PbTabPanel className="h-full overflow-hidden" data-search-target={SearchTargets.journeys.analysisStep1}>
			<div className={cn("flex items-start justify-between", ui.gap.sm)}>
				<div className="min-w-0">
					<div className={cn("text-foreground", ui.typography.title.md)}>
						<Renderer.Copy.InlineText text={panel.title} keyPrefix={`${journeys_key_prefix}-step1-title`} onUnknownToken={onUnknownToken} />
					</div>

					<p className={cn(ui.margin.topXs, "text-muted-foreground", ui.typography.body)}>
						<Renderer.Copy.InlineText text={panel.body} keyPrefix={`${journeys_key_prefix}-step1-body`} onUnknownToken={onUnknownToken} />
					</p>
				</div>

				<PbNumberBadge number="Step 1" className="min-w-[68px] px-2.5" ariaLabel={AnalysisCopy.ui.analysisItemLabel.replace("{n}", "1")} />
			</div>

			{rules.length ? (
				<PbBulletList
					className={ui.margin.topXs}
					items={rules}
					size="caption"
					tone="muted"
					keyPrefix={(_, idx) => `${journeys_key_prefix}-step1-rule-${idx}`}
					getKey={(_, idx) => `analysis-step1-rule-${idx}`}
					onUnknownToken={onUnknownToken}
				/>
			) : null}

			<div className={cn(ui.margin.topMd, "min-w-0")}>
				<div className={cn(ui.margin.topXs, "grid min-w-0 gap-2 lg:grid-cols-[minmax(0,0.34fr)_minmax(24px,0.08fr)_minmax(0,0.58fr)] lg:items-center")}>
					<div className="min-w-0">
						<div className={cn(ui.margin.topXs, "min-w-0 rounded-[var(--radius-control)] border border-[color:var(--border)] bg-background px-2 py-1.5")}>
							<div className={cn("flex flex-wrap items-center", ui.gap.sm)}>
								<Renderer.Metrics.AttributePill id="prospect_id" />
								<AnalysisIdChip value={diagram.prospect_id} />
							</div>
						</div>
					</div>

					<AnalysisLinkBridge active className="lg:min-h-[44px]" />

					<div className="min-w-0">
						<div className={cn(ui.margin.topXs, "min-w-0 overflow-hidden rounded-[var(--radius-control)] border border-[color:var(--border)] bg-background")}>
							{diagram.objects.map((object, idx) => (
								<div key={`analysis-step1-object-${object.object_id}`} className={cn("min-w-0 px-2 py-2", idx > 0 ? "border-t border-[color:var(--border)]/70" : null)}>
									<div className={cn("flex flex-wrap items-center", ui.gap.sm)}>
										<Renderer.Metrics.AttributePill id="object_id" />
										<AnalysisIdChip value={format_object_label(object)} />
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</PbTabPanel>
	)
}

function AnalysisStepTwoBlock({
	diagram,
	panel,
	onUnknownToken,
}: {
	diagram: AnalysisDiagram
	panel: AnalysisPanel
	onUnknownToken: (token: string) => React.ReactNode
}) {
	type DiagramObject = AnalysisDiagram["objects"][number]
	type DiagramTouch = AnalysisDiagram["touches"][number]
	type DiagramRow = { object: DiagramObject; touches: readonly DiagramTouch[] }

	const rows = React.useMemo<readonly DiagramRow[]>(
		() =>
			diagram.objects.map((object) => ({
				object,
				touches: diagram.touches.filter((touch) => touch.object_id === object.object_id),
			})),
		[diagram.objects, diagram.touches]
	)

	const format_object_label = React.useCallback((object: DiagramObject) => {
		const suffix = object.object_id.split("-")[1] ?? object.object_id
		return `${object.object_type.toLowerCase()}-${suffix}`
	}, [])

	const rules = panel.bullets.filter(Boolean)

	return (
		<PbTabPanel className="h-full overflow-hidden" data-search-target={SearchTargets.journeys.analysisStep2}>
			<div className={cn("flex items-start justify-between", ui.gap.sm)}>
				<div className="min-w-0">
					<div className={cn("text-foreground", ui.typography.title.md)}>
						<Renderer.Copy.InlineText text={panel.title} keyPrefix={`${journeys_key_prefix}-step2-title`} onUnknownToken={onUnknownToken} />
					</div>

					<p className={cn(ui.margin.topXs, "text-muted-foreground", ui.typography.body)}>
						<Renderer.Copy.InlineText text={panel.body} keyPrefix={`${journeys_key_prefix}-step2-body`} onUnknownToken={onUnknownToken} />
					</p>
				</div>

				<PbNumberBadge number="Step 2" className="min-w-[68px] px-2.5" ariaLabel={AnalysisCopy.ui.analysisItemLabel.replace("{n}", "2")} />
			</div>

			{rules.length ? (
				<PbBulletList
					className={ui.margin.topXs}
					items={rules}
					size="caption"
					tone="muted"
					keyPrefix={(_, idx) => `${journeys_key_prefix}-step2-rule-${idx}`}
					getKey={(_, idx) => `analysis-step2-rule-${idx}`}
					onUnknownToken={onUnknownToken}
				/>
			) : null}

			<div className={cn(ui.margin.topMd, "min-w-0")}>
				<div className={cn(ui.margin.topXs, "flex min-w-0 flex-col", ui.gap.sm)}>
					{rows.map((row) => (
						<div key={`analysis-touch-linkage-${row.object.object_id}`} className="grid min-w-0 gap-2 lg:grid-cols-[minmax(0,0.34fr)_minmax(24px,0.08fr)_minmax(0,0.58fr)] lg:items-center">
							<div className="min-w-0">
								<div className={cn(ui.margin.topXs, "min-w-0 rounded-[var(--radius-control)] border border-[color:var(--border)] bg-background px-2 py-2")}>
									<div className={cn("flex flex-wrap items-center", ui.gap.sm)}>
										<Renderer.Metrics.AttributePill id="object_id" />
										<AnalysisIdChip value={format_object_label(row.object)} />
									</div>
								</div>
							</div>

							<AnalysisLinkBridge active={row.touches.length > 0} />

							<div className="min-w-0">
								<div className={cn(ui.margin.topXs, "min-w-0")}>
									{row.touches.length ? (
										<div className={cn("min-w-0 overflow-hidden rounded-[var(--radius-control)] border border-[color:var(--border)] bg-background")}>
											{row.touches.map((touch, idx) => (
												<div key={`analysis-touch-row-${touch.touch_id}`} className={cn("min-w-0 px-2 py-1.5", idx > 0 ? "border-t border-[color:var(--border)]/70" : null)}>
													<div className={cn("flex flex-wrap items-center", ui.gap.sm)}>
														<Renderer.Metrics.AttributePill id="touch_id" />
														<AnalysisIdChip value={touch.touch_id} />
													</div>
												</div>
											))}
										</div>
									) : (
										<div className={cn("rounded-[var(--radius-control)] border border-dashed border-[color:var(--border)] bg-background px-2 py-2 text-muted-foreground", ui.typography.caption)}>
											No touches linked
										</div>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</PbTabPanel>
	)
}

function AnalysisStepThreeBlock({
	panel,
	onUnknownToken,
	onOpenSnippet,
}: {
	panel: AnalysisPanel
	onUnknownToken: (token: string) => React.ReactNode
	onOpenSnippet: () => void
}) {
	const rules = panel.bullets.filter(Boolean)

	return (
		<PbTabPanel className="overflow-hidden" data-search-target={SearchTargets.journeys.analysisStep3}>
			<div className={cn("flex items-start justify-between", ui.gap.sm)}>
				<div className="min-w-0">
					<div className={cn("text-foreground", ui.typography.title.md)}>
						<Renderer.Copy.InlineText text={panel.title} keyPrefix={`${journeys_key_prefix}-step3-title`} onUnknownToken={onUnknownToken} />
					</div>

					<p className={cn(ui.margin.topXs, "text-muted-foreground", ui.typography.body)}>
						<Renderer.Copy.InlineText text={panel.body} keyPrefix={`${journeys_key_prefix}-step3-body`} onUnknownToken={onUnknownToken} />
					</p>
				</div>

				<PbNumberBadge number="Step 3" className="min-w-[68px] px-2.5" ariaLabel={AnalysisCopy.ui.analysisItemLabel.replace("{n}", "3")} />
			</div>

			{rules.length ? (
				<PbBulletList
					className={ui.margin.topSm}
					items={rules}
					size="body"
					tone="default"
					keyPrefix={(_, idx) => `${journeys_key_prefix}-step3-rule-${idx}`}
					getKey={(_, idx) => `analysis-step3-rule-${idx}`}
					onUnknownToken={onUnknownToken}
				/>
			) : null}

			<div className={cn(ui.margin.topMd, "w-full")}>
				<Button
					type="button"
					variant="blueOutline"
					size="lg"
					className="w-full"
					onClick={onOpenSnippet}
					aria-label={AnalysisCopy.ui.snippetOpenButtonAria}
				>
					<Renderer.Copy.InlineText text={AnalysisCopy.ui.snippetOpenButtonLabel} keyPrefix={`${journeys_key_prefix}-open-r-snippet`} />
				</Button>
			</div>
		</PbTabPanel>
	)
}

/* -------------------------------------------------------------------------- */
/* Default export                                                             */
/* -------------------------------------------------------------------------- */

export default function TabJourneys() {
	const warn_unknown_metric = React.useMemo(() => createUnknownMetricLogger(), [])
	const [is_r_modal_open, set_is_r_modal_open] = React.useState(false)
	const tab = TabById["journeys"]
	const objects_panel = AnalysisCopy.panels[0]
	const touches_panel = AnalysisCopy.panels[1]
	const analysis_panel = AnalysisCopy.panels[2]

	return (
		<PbTabShell tabId="journeys" alias={tab.alias} description={tab.description} keyPrefix={`${journeys_key_prefix}-intro`}>
			<PbReveal className="w-full" data-search-target={SearchTargets.journeys.problemCard}>
				<PbTabCard hover>
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
				</PbTabCard>
			</PbReveal>

			<PbReveal className="w-full" data-search-target={SearchTargets.journeys.analysisCard}>
				<PbTabCard hover>
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

					<PbCardContent className={cn("flex flex-col", ui.gap.sm)}>
						{objects_panel || touches_panel ? (
							<div className={cn("grid items-stretch", ui.gap.sm, "lg:grid-cols-2")}>
								{objects_panel ? <AnalysisStepOneBlock diagram={AnalysisCopy.diagram} panel={objects_panel} onUnknownToken={warn_unknown_metric} /> : null}
								{touches_panel ? <AnalysisStepTwoBlock diagram={AnalysisCopy.diagram} panel={touches_panel} onUnknownToken={warn_unknown_metric} /> : null}
							</div>
						) : null}

						{analysis_panel ? (
							<AnalysisStepThreeBlock panel={analysis_panel} onUnknownToken={warn_unknown_metric} onOpenSnippet={() => set_is_r_modal_open(true)} />
						) : null}
					</PbCardContent>
				</PbTabCard>
			</PbReveal>

			<PbOverlay
				open={is_r_modal_open}
				onClose={() => set_is_r_modal_open(false)}
				title={<Renderer.Copy.InlineText text={AnalysisCopy.ui.snippetTitle} keyPrefix={`${journeys_key_prefix}-rcode-modal-title`} />}
				ariaLabel={AnalysisCopy.ui.snippetTitle}
				closeAriaLabel={AnalysisCopy.ui.snippetCloseButtonAria}
				headerActions={<CopyCodeButton code={AnalysisCopy.rSnippet} />}
			>
				<PbTabPanel
					size="sm"
					className={cn(
						"flex h-full min-h-0 min-w-0 overflow-hidden p-0",
						"[@media(max-height:48rem)]:h-auto [@media(max-height:48rem)]:overflow-visible",
						ui.surface.structure.opaque
					)}
				>
					<CodeBlock
						code={AnalysisCopy.rSnippet}
						language="r"
						compactViewportOuterScroll
						className={cn("min-h-0 h-full max-h-full text-foreground")}
					/>
				</PbTabPanel>
			</PbOverlay>
		</PbTabShell>
	)
}
