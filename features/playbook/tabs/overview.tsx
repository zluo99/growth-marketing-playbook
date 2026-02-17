"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"
import { FlaskConical, Scale, Target } from "lucide-react"

import { ui } from "@/components/tokens/design"
import { cn } from "@/lib/utils"

import { Renderer } from "@/features/playbook/components/ui/renderer"
import {
	PbCardContent,
	PbCardGlow,
	PbCardHeader,
	PbCardLayer,
	PbReveal,
	PbSubtleText,
	PbTabCard,
	PbTabPanel,
	PbTabShell,
} from "@/features/playbook/components/ui/ui"
import { OverviewOverlayLetters } from "@/features/playbook/tabs/overview-overlay"
import { usePbTabsNav } from "@/features/playbook/components/context/context"
import { GuideCopy } from "@/features/playbook/copy/overview-guide"
import { TabById } from "@/features/playbook/definitions/tabs"
import type { SpendId } from "@/features/playbook/definitions/spend"
import { TenetsCopy } from "@/features/playbook/copy/overview-tenets"

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

/* -------------------------------------------------------------------------- */
/* Default export                                                             */
/* -------------------------------------------------------------------------- */

export default function TabOverview() {
	const { goToTab, suppressReveal } = usePbTabsNav()
	const reveal_lock_ref = React.useRef(false)
	if (suppressReveal) reveal_lock_ref.current = true
	const reveal_cards = !suppressReveal && !reveal_lock_ref.current
	const tab = TabById["overview"]
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
			<PbReveal enabled={reveal_cards} className="w-full" data-search-target="tenets-card">
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

			<PbReveal enabled={reveal_cards} className="w-full" data-search-target="guide-card">
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
		</PbTabShell>
	)
}
