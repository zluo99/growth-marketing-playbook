"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"
import { Check, Copy as CopyIcon, FlaskConical, Scale, Target } from "lucide-react"

import { ui } from "@/components/tokens/design"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { Renderer } from "@/features/playbook/components/ui/renderer"
import { CodeBlock } from "@/features/playbook/components/ui/code"
import { PbOverlay } from "@/features/playbook/components/ui/overlay"
import { useCopyToClipboard } from "@/features/playbook/components/ui/clipboard"
import {
	PbBulletList,
	PbCardContent,
	PbCardGlow,
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
	AnalystModuleIds,
	build_analyst_markdown,
	parse_ai_analyst_modules_preference,
	type AnalystModuleId,
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
	glowClassName,
}: {
	id: string
	title: string
	description: React.ReactNode
	children: React.ReactNode
	glowClassName?: string
}) {
	const rendered_title = <Renderer.Copy.InlineText text={title} keyPrefix={`${overview_key_prefix}-card-${id}-title`} />
	const rendered_description =
		typeof description === "string" ? <Renderer.Copy.InlineText text={description} keyPrefix={`${overview_key_prefix}-card-${id}-desc`} /> : description

	return (
		<PbTabCard hover shadow className="w-full">
			{glowClassName ? <PbCardGlow className={glowClassName} /> : null}
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

const overview_ai_modules = OverviewAICopy.analystModules
const overview_ai_all_module_ids = AnalystModuleIds

function AnalystCopyButton({ markdown }: { markdown: string }) {
	const { copied, copy } = useCopyToClipboard()
	return (
		<Button
			type="button"
			className={cn("min-w-[92px]", ui.surface.state.hover.shadowMd)}
			variant="success"
			size="sm"
			onClick={() => void copy(markdown)}
			aria-label={copied ? OverviewAICopy.ui.overlayCopyButtonAriaCopied : OverviewAICopy.ui.overlayCopyButtonAria}
		>
			{copied ? <Check className={ui.iconNude.lg} /> : <CopyIcon className={ui.iconNude.lg} />}
			<span>
				<Renderer.Copy.InlineText
					text={copied ? OverviewAICopy.ui.overlayCopyButtonLabelCopied : OverviewAICopy.ui.overlayCopyButtonLabel}
					keyPrefix={`${overview_key_prefix}-analyst-md-copy-button`}
				/>
			</span>
		</Button>
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
	const [is_analyst_modal_open, set_is_analyst_modal_open] = React.useState(false)
	const [enabled_module_ids, set_enabled_module_ids] = React.useState<readonly AnalystModuleId[]>(() =>
		parse_ai_analyst_modules_preference(read_preference(PlaybookStorage.overview.aiAnalystModules))
	)

	React.useEffect(() => {
		if (suppressReveal) set_reveal_locked(true)
	}, [suppressReveal])

	React.useEffect(() => {
		write_preference(PlaybookStorage.overview.aiAnalystModules, JSON.stringify(enabled_module_ids))
	}, [enabled_module_ids])

	const reveal_cards = !suppressReveal && !reveal_locked
	const tab = TabById["overview"]
	const enabled_module_set = React.useMemo(() => new Set(enabled_module_ids), [enabled_module_ids])
	const analyst_markdown = React.useMemo(() => build_analyst_markdown(enabled_module_ids), [enabled_module_ids])

	const toggle_analyst_module = React.useCallback((module_id: AnalystModuleId) => {
		set_enabled_module_ids((prev) => {
			const next = new Set(prev)
			if (next.has(module_id)) next.delete(module_id)
			else next.add(module_id)
			return overview_ai_all_module_ids.filter((id) => next.has(id))
		})
	}, [])

	const set_all_modules = React.useCallback(() => set_enabled_module_ids(overview_ai_all_module_ids), [])
	const clear_modules = React.useCallback(() => set_enabled_module_ids([]), [])

	const description = (
		<span className={cn("relative inline-block", ui.typography.title.lg)}>
			<span className="sr-only">
				<Renderer.Copy.InlineText text={tab.description ?? ""} keyPrefix={`${overview_key_prefix}-intro-description`} />
			</span>
			<span aria-hidden="true">
				<OverviewOverlayLetters
					role="target"
					layout="inline"
					includeSeparator
					keyPrefix={`${overview_key_prefix}-intro`}
					className={cn("whitespace-normal break-words")}
					titleClassName={cn("text-foreground")}
					separatorClassName={cn("text-foreground")}
					subtitleClassName={cn("text-foreground")}
				/>
			</span>
		</span>
	)
	const guide_sequence_text = (GuideCopy.panels[0]?.sequence ?? []).map((id) => `{${id}}`).join(" -> ")

	return (
		<PbTabShell tabId="overview" alias={tab.alias} description={description} keyPrefix={`${overview_key_prefix}-intro`}>
			<PbReveal enabled={reveal_cards} className="w-full" data-search-target={SearchTargets.overview.tenetsCard}>
				<OverviewCard id={TenetsCopy.id} title={TenetsCopy.title} description={TenetsCopy.body} glowClassName={ui.glow.orange}>
					<div className={cn("flex flex-col", ui.gap.sm)}>
						<div className={cn("grid items-stretch md:grid-cols-3", ui.gap.sm)}>
							{TenetsCopy.panels.map((t) => (
								<Kicker key={t.id} id={t.id} icon={tenet_icon(t.icon)} title={t.title} description={t.body} spendIds={t.spend_ids} />
							))}
						</div>

						<p className={cn("text-muted-foreground", ui.typography.caption)}>
							{render_inline_text(TenetsCopy.footer, `${overview_key_prefix}-tenets-footer`)}
						</p>
					</div>
				</OverviewCard>
			</PbReveal>

			<PbReveal enabled={reveal_cards} className="w-full" data-search-target={SearchTargets.overview.guideCard}>
				<OverviewCard id="guide" title={GuideCopy.title} description={GuideCopy.body}>
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
				<OverviewCard id={OverviewAICopy.id} title={OverviewAICopy.title} description={OverviewAICopy.body} glowClassName={ui.glow.rainbow}>
					<div className={cn("flex flex-col", ui.gap.sm)}>
						<div className={cn("grid items-stretch md:grid-cols-3", ui.gap.sm)}>
							{OverviewAICopy.panels.map((panel) => (
								<AiStep key={panel.id} panel={panel} />
							))}
						</div>

						<Button
							type="button"
							variant="blueOutline"
							size="lg"
							className="w-full"
							aria-label={OverviewAICopy.ui.openAnalystButtonAria}
							onClick={() => set_is_analyst_modal_open(true)}
						>
							<Renderer.Copy.InlineText
								text={OverviewAICopy.ui.openAnalystButtonLabel}
								keyPrefix={`${overview_key_prefix}-ai-open-analyst-md-button`}
							/>
						</Button>

						<p className={cn("text-muted-foreground", ui.typography.caption)}>
							{render_inline_text(OverviewAICopy.footer, `${overview_key_prefix}-ai-footer`)}
						</p>
					</div>
				</OverviewCard>
			</PbReveal>

			<PbOverlay
				open={is_analyst_modal_open}
				onClose={() => set_is_analyst_modal_open(false)}
				title={<Renderer.Copy.InlineText text={OverviewAICopy.ui.overlayTitle} keyPrefix={`${overview_key_prefix}-analyst-md-modal-title`} />}
				ariaLabel={OverviewAICopy.ui.overlayTitle}
				closeAriaLabel={OverviewAICopy.ui.overlayCloseAria}
				headerActions={<AnalystCopyButton markdown={analyst_markdown} />}
			>
				<div className={cn("flex flex-col", ui.gap.sm)}>
					<PbTabPanel size="sm" className={cn(ui.surface.structure.opaque)}>
						<div className={cn("flex flex-wrap items-start justify-between", ui.gap.sm)}>
							<div className="min-w-0">
								<div className={cn("text-foreground", ui.typography.title.md)}>
									<Renderer.Copy.InlineText text={OverviewAICopy.ui.overlayModulesLabel} keyPrefix={`${overview_key_prefix}-analyst-modules-title`} />
								</div>
								<p className={cn(ui.margin.topXs, "text-muted-foreground", ui.typography.caption)}>
									{render_inline_text(OverviewAICopy.ui.overlayModulesHelp, `${overview_key_prefix}-analyst-modules-help`)}
								</p>
							</div>
							<div className={cn("flex flex-wrap", ui.gap.sm)}>
								<Button type="button" size="sm" variant="outline" className="h-8 px-2.5" onClick={set_all_modules}>
									<Renderer.Copy.InlineText
										text={OverviewAICopy.ui.overlayModulesEnableAllLabel}
										keyPrefix={`${overview_key_prefix}-analyst-modules-enable-all`}
									/>
								</Button>
								<Button type="button" size="sm" variant="outline" className="h-8 px-2.5" onClick={clear_modules}>
									<Renderer.Copy.InlineText
										text={OverviewAICopy.ui.overlayModulesClearLabel}
										keyPrefix={`${overview_key_prefix}-analyst-modules-clear`}
									/>
								</Button>
							</div>
						</div>

						<div className={cn(ui.margin.topSm, "flex flex-wrap", ui.gap.sm)}>
							{overview_ai_modules.map((module) => {
								const active = enabled_module_set.has(module.id)
								return (
									<button
										key={module.id}
										type="button"
										className={cn(ui.overlay.moduleChip.base, active ? ui.overlay.moduleChip.active : ui.overlay.moduleChip.inactive)}
										title={module.description}
										aria-pressed={active}
										aria-label={OverviewAICopy.ui.overlayModuleToggleAria.replace("{title}", module.title)}
										onClick={() => toggle_analyst_module(module.id)}
									>
										{module.title}
									</button>
								)
							})}
						</div>
					</PbTabPanel>

					<PbTabPanel size="sm" className={cn("overflow-hidden p-0", ui.surface.structure.opaque)}>
						<CodeBlock code={analyst_markdown} language="markdown" className="text-foreground" style={{ maxHeight: `${ui.size.layout.lg}px` }} />
					</PbTabPanel>
				</div>
			</PbOverlay>
		</PbTabShell>
	)
}
