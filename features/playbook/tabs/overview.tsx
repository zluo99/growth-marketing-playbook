"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"
import { Check, Copy as CopyIcon, FlaskConical, Scale, Target } from "lucide-react"

import { Dropdown } from "@/components/nav/dropdown"
import { ui } from "@/components/tokens/design"
import { Button } from "@/components/ui/button"
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
	PbNumberBadge,
	PbReveal,
	PbSubtleText,
	PbTabCard,
	PbTabPanel,
	PbTabShell,
} from "@/features/playbook/components/ui/ui"
import { OverviewOverlayLetters } from "@/features/playbook/tabs/overview-intro"
import { usePbTabsNav } from "@/features/playbook/components/context/tab-nav"
import { read_preference, write_preference, PlaybookStorage } from "@/features/playbook/components/context/preferences"
import { GuideCopy } from "@/features/playbook/copy/overview-guide"
import { TabById } from "@/features/playbook/definitions/tabs"
import type { SpendId } from "@/features/playbook/definitions/spend"
import { TenetsCopy } from "@/features/playbook/copy/overview-tenets"
import { OverviewAICopy } from "@/features/playbook/copy/overview-ai-copy"
import { SearchTargets } from "@/features/playbook/search/targets"
import {
	DbtFileDefinitions,
	build_dbt_file_content,
	parse_ai_dbt_file_preference,
	type DbtFileId,
} from "@/features/playbook/copy/overview-ai-md"

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function tenet_icon(k: (typeof TenetsCopy.panels)[number]["icon"]) {
	if (k === "scale") return <Scale className={ui.iconNude.lg} />
	if (k === "target") return <Target className={ui.iconNude.lg} />
	return <FlaskConical className={ui.iconNude.lg} />
}

const overview_key_prefix = "overview"

function render_inline_text(txt: string, key_prefix: string) {
	return Renderer.Copy.renderInlineText(txt, { keyPrefix: key_prefix })
}

function OverviewCard({
	id,
	title,
	description,
	children,
	glow,
}: {
	id: string
	title: string
	description: React.ReactNode
	children: React.ReactNode
	glow?: React.ComponentProps<typeof PbTabCard>["glow"]
}) {
	const rendered_title = <Renderer.Copy.InlineText text={title} keyPrefix={`${overview_key_prefix}-card-${id}-title`} />
	const rendered_description =
		typeof description === "string" ? <Renderer.Copy.InlineText text={description} keyPrefix={`${overview_key_prefix}-card-${id}-desc`} /> : description

	return (
		<PbTabCard hover shadow className="w-full" glow={glow}>
			<PbCardLayer>
				<PbCardHeader
					title={<span className={ui.typography.title.lg}>{rendered_title}</span>}
					description={<PbSubtleText size="body">{rendered_description}</PbSubtleText>}
				/>
				<PbCardContent className="relative">{children}</PbCardContent>
			</PbCardLayer>
		</PbTabCard>
	)
}

type KickerProps = { id: string; icon: React.ReactNode; title: string; description: string; spendIds?: readonly SpendId[] }

function Kicker({ id, icon, title, description, spendIds }: KickerProps) {
	return (
		<PbTabPanel>
			<div className={cn("flex items-center", ui.gap.sm)}>
				<span className={cn(ui.iconFrame.sm, "text-muted-foreground")}>{icon}</span>
				<span className={cn("text-foreground", ui.typography.title.md)}>
					<Renderer.Copy.InlineText text={title} keyPrefix={`${overview_key_prefix}-tenet-${id}-title`} />
				</span>
			</div>

			<p className={cn(ui.margin.topXs, "leading-relaxed text-muted-foreground", ui.typography.body)}>
				{render_inline_text(description, `${overview_key_prefix}-tenet-${id}-body`)}
			</p>

			{spendIds?.length ? (
				<div className={cn(ui.margin.topSm, "flex flex-wrap items-center", ui.gap.sm)}>
					{spendIds.map((id) => (
						<Renderer.Spend.Pill key={id} id={id} />
					))}
				</div>
			) : null}
		</PbTabPanel>
	)
}

type OverviewAiPanel = (typeof OverviewAICopy.panels)[number]

function DbtCopyButton({ content }: { content: string }) {
	const { copied, copy } = useCopyToClipboard()
	return (
		<>
			<Button
				type="button"
				className={cn("min-w-[92px]", ui.surface.state.hover.shadowMd)}
				variant="success"
				size="sm"
				onClick={() => void copy(content)}
				aria-label={copied ? OverviewAICopy.ui.overlayCopyButtonAriaCopied : OverviewAICopy.ui.overlayCopyButtonAria}
			>
				{copied ? <Check className={ui.iconNude.lg} /> : <CopyIcon className={ui.iconNude.lg} />}
				<span>
					<Renderer.Copy.InlineText
						text={copied ? OverviewAICopy.ui.overlayCopyButtonLabelCopied : OverviewAICopy.ui.overlayCopyButtonLabel}
						keyPrefix={`${overview_key_prefix}-dbt-file-copy-button`}
					/>
				</span>
			</Button>
			<span role="status" aria-live="polite" className="sr-only">
				{copied ? OverviewAICopy.ui.overlayCopyButtonAriaCopied : ""}
			</span>
		</>
	)
}

function AiStep({ panel }: { panel: OverviewAiPanel }) {
	return (
		<PbTabPanel className="flex h-full flex-col">
			<div className={cn("flex items-start justify-between", ui.gap.sm)}>
				<div className="min-w-0">
					<div className={cn("text-foreground", ui.typography.title.md)}>
						<Renderer.Copy.InlineText text={panel.title} keyPrefix={`${overview_key_prefix}-ai-step-${panel.id}-title`} />
					</div>
					<p className={cn(ui.margin.topXs, "text-muted-foreground", ui.typography.body)}>
						{render_inline_text(panel.body, `${overview_key_prefix}-ai-step-${panel.id}-body`)}
					</p>
				</div>

				<PbNumberBadge
					number={`Step ${panel.id}`}
					className="min-w-[72px] px-2.5"
					tone="orange"
					ariaLabel={OverviewAICopy.ui.stepLabel.replace("{n}", panel.id)}
				/>
			</div>

			{panel.bullets.length ? (
				<PbBulletList
					className={ui.margin.topSm}
					items={panel.bullets}
					size="caption"
					tone="muted"
					keyPrefix={(_, idx) => `${overview_key_prefix}-ai-step-${panel.id}-bullet-${idx}`}
					getKey={(_, idx) => `overview-ai-step-${panel.id}-bullet-${idx}`}
				/>
			) : null}
		</PbTabPanel>
	)
}

/* -------------------------------------------------------------------------- */
/* Default export                                                             */
/* -------------------------------------------------------------------------- */

export default function TabOverview() {
	const { goToTab, suppressReveal } = usePbTabsNav()
	const [reveal_locked, set_reveal_locked] = React.useState(false)
	const [is_dbt_modal_open, set_is_dbt_modal_open] = React.useState(false)
	const [selected_dbt_file_id, set_selected_dbt_file_id] = React.useState<DbtFileId>(() =>
		parse_ai_dbt_file_preference(read_preference(PlaybookStorage.overview.aiDbtFile))
	)

	React.useEffect(() => {
		if (suppressReveal) set_reveal_locked(true)
	}, [suppressReveal])

	React.useEffect(() => {
		write_preference(PlaybookStorage.overview.aiDbtFile, selected_dbt_file_id)
	}, [selected_dbt_file_id])

	const reveal_cards = !suppressReveal && !reveal_locked
	const tab = TabById["overview"]
	const active_dbt_file = React.useMemo(
		() => DbtFileDefinitions.find((file) => file.id === selected_dbt_file_id) ?? DbtFileDefinitions[0],
		[selected_dbt_file_id]
	)
	const active_dbt_content = React.useMemo(() => build_dbt_file_content(selected_dbt_file_id), [selected_dbt_file_id])
	const dbt_dropdown_items = React.useMemo(
		() =>
			DbtFileDefinitions.map((file) => ({
				value: file.id,
				label: file.fileName,
			})),
		[]
	)

	const description = (
		<div className="relative flex w-full min-w-0 max-w-full flex-col items-start">
			<span className="sr-only">
				<Renderer.Copy.InlineText text={tab.description ?? ""} keyPrefix={`${overview_key_prefix}-intro-description`} />
			</span>
			<span aria-hidden="true">
				<OverviewOverlayLetters
					role="target"
					layout="inline"
					includeSeparator
					keyPrefix={`${overview_key_prefix}-intro`}
					className="w-full min-w-0 max-w-full whitespace-normal break-words"
					subtitleClassName={ui.intro.overviewInlineSupportingCopy}
					separatorClassName={ui.intro.overviewInlineSupportingCopy}
				/>
			</span>
		</div>
	)
	const guide_sequence_text = (GuideCopy.panels[0]?.sequence ?? []).map((id) => `{${id}}`).join(" -> ")

	return (
		<PbTabShell tabId="overview" alias={tab.alias} description={description} keyPrefix={`${overview_key_prefix}-intro`}>
			<PbReveal enabled={reveal_cards} className="w-full" data-search-target={SearchTargets.overview.tenetsCard}>
				<OverviewCard id={TenetsCopy.id} title={TenetsCopy.title} description={TenetsCopy.body} glow="indigo">
					<div className={cn("flex flex-col", ui.gap.sm)}>
						<div className={cn("grid items-stretch md:grid-cols-3", ui.gap.sm)}>
							{TenetsCopy.panels.map((t) => (
								<Kicker key={t.id} id={t.id} icon={tenet_icon(t.icon)} title={t.title} description={t.body} spendIds={t.spend_ids} />
							))}
						</div>
					</div>
				</OverviewCard>
			</PbReveal>

			<PbReveal enabled={reveal_cards} className="w-full" data-search-target={SearchTargets.overview.guideCard}>
				<OverviewCard id="guide" title={GuideCopy.title} description={GuideCopy.body} glow="orange">
					<div className={cn("flex flex-col", ui.gap.sm)}>
						<div className={cn("grid items-stretch md:grid-cols-2", ui.gap.sm)}>
							<PbTabPanel>
								<div className={cn("text-foreground", ui.typography.title.md)}>
									<Renderer.Copy.InlineText text={GuideCopy.panels[0]?.title ?? ""} keyPrefix={`${overview_key_prefix}-guide-panel-1-title`} />
								</div>

								{guide_sequence_text ? (
									<div className={cn(ui.margin.topSm, "flex flex-wrap items-center text-muted-foreground", ui.gap.sm)}>
										<Renderer.Tabs.InlineText text={guide_sequence_text} keyPrefix={`${overview_key_prefix}-guide-flow`} onTabClick={goToTab} />
									</div>
								) : null}

								<p className={cn(ui.margin.topSm, "leading-snug text-muted-foreground", ui.typography.body)}>
									{render_inline_text(GuideCopy.panels[0]?.body ?? "", "overview-guide-sequence")}
								</p>
							</PbTabPanel>

							<PbTabPanel>
								<div className={cn("text-foreground", ui.typography.title.md)}>
									<Renderer.Copy.InlineText text={GuideCopy.panels[1]?.title ?? ""} keyPrefix={`${overview_key_prefix}-guide-panel-2-title`} />
								</div>
								<p className={cn(ui.margin.topSm, "leading-snug text-muted-foreground", ui.typography.body)}>
									{render_inline_text(GuideCopy.panels[1]?.body ?? "", "overview-guide-journey")}
								</p>
							</PbTabPanel>
						</div>
					</div>
				</OverviewCard>
			</PbReveal>

			<PbReveal enabled={reveal_cards} className="w-full" data-search-target={SearchTargets.overview.aiAnalystCard}>
				<OverviewCard id={OverviewAICopy.id} title={OverviewAICopy.title} description={OverviewAICopy.body} glow="ai">
					<div className={cn("flex flex-col", ui.gap.sm)}>
						<div className={cn("grid items-stretch md:grid-cols-3", ui.gap.sm)}>
							{OverviewAICopy.panels.map((panel) => (
								<AiStep key={panel.id} panel={panel} />
							))}
						</div>

						<Button
							type="button"
							variant="aiOutline"
							size="lg"
							className="w-full"
							aria-label={OverviewAICopy.ui.openDbtFilesButtonAria}
							onClick={() => set_is_dbt_modal_open(true)}
						>
							<Renderer.Copy.InlineText
								text={OverviewAICopy.ui.openDbtFilesButtonLabel}
								keyPrefix={`${overview_key_prefix}-ai-open-dbt-files-button`}
							/>
						</Button>
					</div>
				</OverviewCard>
			</PbReveal>

			<PbOverlay
				open={is_dbt_modal_open}
				onClose={() => set_is_dbt_modal_open(false)}
				title={<Renderer.Copy.InlineText text={OverviewAICopy.ui.overlayTitle} keyPrefix={`${overview_key_prefix}-dbt-files-modal-title`} />}
				ariaLabel={OverviewAICopy.ui.overlayTitle}
				closeAriaLabel={OverviewAICopy.ui.overlayCloseAria}
				headerActions={<DbtCopyButton content={active_dbt_content} />}
				maxWidthClassName="max-w-6xl"
			>
				<div className={cn("flex h-full min-h-0 min-w-0 flex-col [@media(max-height:48rem)]:h-auto", ui.gap.sm)}>
					<PbTabPanel size="sm" className={cn("shrink-0", ui.surface.structure.opaque)}>
						<div className={cn("flex flex-wrap items-start", ui.gap.sm)}>
							<div className="min-w-0 flex-1">
								<div className={cn("text-foreground", ui.typography.title.md)}>
									<Renderer.Copy.InlineText text={OverviewAICopy.ui.overlayFilesLabel} keyPrefix={`${overview_key_prefix}-dbt-files-title`} />
								</div>
							</div>
						</div>

						<div className={cn(ui.margin.topSm, "w-full")}>
							<div className="w-full">
								<Dropdown
									value={selected_dbt_file_id}
									onChange={set_selected_dbt_file_id}
									items={dbt_dropdown_items}
									align="stretch"
									widthClassName="w-full"
									triggerClassName="h-auto min-h-12 py-2"
									menuMaxHeightClassName="max-h-[176px]"
									renderTriggerLabel={() => (
										<div className="flex min-w-0 flex-col items-start gap-0.5">
											<span className={cn("text-foreground leading-tight", ui.typography.title.md)}>{active_dbt_file.fileName}</span>
											<span className={cn("min-w-0 whitespace-normal text-left text-muted-foreground", ui.typography.caption)}>
												{active_dbt_file.description}
											</span>
										</div>
									)}
									triggerLabel={active_dbt_file.fileName}
									ariaLabel={OverviewAICopy.ui.overlayFileDropdownAria}
								/>
							</div>
						</div>
					</PbTabPanel>

					<PbTabPanel
						size="sm"
						className={cn(
							"min-h-0 min-w-0 flex-1 overflow-hidden p-0",
							"[@media(max-height:48rem)]:h-auto [@media(max-height:48rem)]:flex-none [@media(max-height:48rem)]:overflow-visible",
							ui.surface.structure.opaque
						)}
					>
						<CodeBlock
							code={active_dbt_content}
							language={active_dbt_file.language}
							compactViewportOuterScroll
							className={cn("min-h-0 h-full max-h-full text-foreground")}
						/>
					</PbTabPanel>
				</div>
			</PbOverlay>
		</PbTabShell>
	)
}
