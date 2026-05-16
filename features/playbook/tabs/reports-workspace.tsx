"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"
import { ExternalLink, Mail, Presentation } from "lucide-react"

import { ui } from "@/components/tokens/design"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/cn"

import { Renderer } from "@/features/playbook/components/ui/renderer"
import { LoaderCardSkeleton } from "@/features/playbook/components/ui/loader"
import { PbCardContent, PbCardHeader, PbCardLayer, PbMetricList, PbNumberBadge, PbReveal, PbSubtleText, PbTabCard, PbTabPanel, PbTabShell, createUnknownMetricLogger, useLazyGate } from "@/features/playbook/components/ui/ui"
import { usePbTabsNav } from "@/features/playbook/components/context/tab-nav"
import { SheetsCopy, SlidesCopy, WorkspaceUiCopy } from "@/features/playbook/copy/reports-workspace-google"
import { ExampleCopy as WorkspaceExample } from "@/features/playbook/copy/reports-workspace-example"
import { TabById, type TabId } from "@/features/playbook/definitions/tabs"
import { SearchTargets } from "@/features/playbook/search/targets"

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

const warn_unknown_metric = createUnknownMetricLogger()
type WorkspaceEmbedId = "sheets" | "slides"
const reports_workspace_key_prefix = "reports-workspace"

const workspace_icon_map: Record<WorkspaceEmbedId, React.ComponentType<{ className?: string }>> = {
	sheets: Mail,
	slides: Presentation,
} as const

const workspace_glow_map: Record<WorkspaceEmbedId, React.ComponentProps<typeof PbTabCard>["glow"]> = {
	sheets: "green",
	slides: "yellow",
} as const

function OpenButton({ href, label, keyPrefix }: { href: string; label: string; keyPrefix: string }) {
	return (
		<Button asChild className={cn(buttonVariants({ variant: "outline", size: "sm" }), "group", ui.gap.sm, ui.control.base, "bg-transparent", ui.motion.duration, ui.surface.state.focus.ring)}>
			<a href={href} target="_blank" rel="noreferrer" aria-label={label} className="inline-flex">
				<span className={cn("inline-flex items-center", ui.gap.sm)}>
					<ExternalLink className={cn(ui.iconNude.md, "text-muted-foreground transition-colors", ui.motion.duration, "group-hover:text-current")} aria-hidden="true" />
					<span className={cn(ui.typography.body, "text-muted-foreground transition-colors", ui.motion.duration, "group-hover:text-current")}>
						<Renderer.Copy.InlineText text={label} keyPrefix={keyPrefix} />
					</span>
				</span>
			</a>
		</Button>
	)
}

function EmbedCard({
	id,
	copy,
	height,
	onTabClick,
}: {
	id: WorkspaceEmbedId
	copy: { title: string; body: string; embedUrl: string; openUrl: string; openLabel: string }
	height: number
	onTabClick?: (tabId: TabId) => void
}) {
	const Icon = workspace_icon_map[id]
	const glow = workspace_glow_map[id]
	return (
		<PbReveal className="w-full" data-search-target={`workspace-${id}`}>
			<PbTabCard hover glow={glow}>
				<PbCardLayer>
					<PbCardHeader
						title={
							<span className={cn("inline-flex items-center", ui.gap.sm)}>
								<span className={cn(ui.iconCard.frame, "text-muted-foreground")} aria-hidden="true">
									<Icon className={ui.iconCard.size} />
								</span>
								<span className={ui.typography.title.lg}>
									<Renderer.Copy.InlineText
										text={copy.title}
										keyPrefix={`${reports_workspace_key_prefix}-${id}-title`}
										onUnknownToken={warn_unknown_metric}
									/>
								</span>
							</span>
						}
						description={
							<PbSubtleText size="body">
								<Renderer.Tabs.InlineText
									text={copy.body}
									keyPrefix={`${reports_workspace_key_prefix}-${id}-desc`}
									onUnknownToken={warn_unknown_metric}
									onTabClick={onTabClick}
								/>
							</PbSubtleText>
						}
						action={<OpenButton href={copy.openUrl} label={copy.openLabel} keyPrefix={`${reports_workspace_key_prefix}-${id}-open`} />}
					/>
					<PbCardContent className={cn("flex flex-col", ui.gap.md)}>
						<div className={cn("overflow-hidden bg-background", ui.surface.structure.borderHover, ui.surface.structure.shadowNone, ui.motion.duration, ui.radius.base)} style={{ height }}>
							<iframe
								title={copy.title}
								src={copy.embedUrl}
								className="block h-full w-full"
								style={{ border: 0, background: "transparent" }}
								loading="eager"
								referrerPolicy="no-referrer"
								allowFullScreen
								scrolling="yes"
								sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
							/>
						</div>
					</PbCardContent>
				</PbCardLayer>
			</PbTabCard>
		</PbReveal>
	)
}

function PreloadIframes({
	sheetsSrc,
	slidesSrc,
	onSheets,
	onSlides,
	loadSlides,
}: {
	sheetsSrc: string
	slidesSrc: string
	onSheets: () => void
	onSlides: () => void
	loadSlides: boolean
}) {
	return (
		<div aria-hidden="true" className="pointer-events-none fixed -left-[99999px] -top-[99999px] h-px w-px overflow-hidden opacity-0">
			<iframe title={WorkspaceUiCopy.preloadSheetsTitle} src={sheetsSrc} loading="eager" tabIndex={-1} onLoad={onSheets} />
			{loadSlides ? <iframe title={WorkspaceUiCopy.preloadSlidesTitle} src={slidesSrc} loading="eager" tabIndex={-1} onLoad={onSlides} /> : null}
		</div>
	)
}

/* -------------------------------------------------------------------------- */
/* Default export                                                             */
/* -------------------------------------------------------------------------- */

export default function TabReportsWorkspace() {
	type LoadState = { sheets: boolean; slides: boolean; timeout: boolean }
	type LoadAction = { type: "mark"; key: "sheets" | "slides" } | { type: "timeout" }
	const [load_state, dispatch] = React.useReducer((state: LoadState, action: LoadAction): LoadState => {
		if (action.type === "mark") {
			if (state[action.key]) return state
			return { ...state, [action.key]: true }
		}
		if (action.type === "timeout") return state.timeout ? state : { ...state, timeout: true }
		return state
	}, { sheets: false, slides: false, timeout: false })

	const { ready: loadSlides, trigger: startSlidesLoading } = useLazyGate()
	const { goToTab } = usePbTabsNav()
	const workspace_visibility_ref = React.useRef<HTMLDivElement | null>(null)

	const mark = React.useCallback(
		(k: "sheets" | "slides") => {
			if (k === "sheets") startSlidesLoading()
			dispatch({ type: "mark", key: k })
		},
		[startSlidesLoading],
	)
	const rendered = (load_state.sheets && load_state.slides) || load_state.timeout
	const tab = TabById["reports-workspace"]

	React.useEffect(() => {
		if (rendered) return
		const id = window.setTimeout(() => dispatch({ type: "timeout" }), 2500)
		return () => window.clearTimeout(id)
	}, [rendered])

	React.useEffect(() => {
		const target = workspace_visibility_ref.current
		if (loadSlides || !target) return

		const io = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) return
				startSlidesLoading()
				io.disconnect()
			},
			{ threshold: 0.15 },
		)

		io.observe(target)
		return () => io.disconnect()
	}, [loadSlides, startSlidesLoading])

	if (!rendered) {
		return (
			<PbTabShell
				ref={workspace_visibility_ref}
				tabId="reports-workspace"
				alias={tab.alias}
				description={tab.description}
				keyPrefix={`${reports_workspace_key_prefix}-intro`}
				focus={false}
			>
				<PreloadIframes
					sheetsSrc={SheetsCopy.embedUrl}
					slidesSrc={SlidesCopy.embedUrl}
					onSheets={() => mark("sheets")}
					onSlides={() => mark("slides")}
					loadSlides={loadSlides}
				/>

				<LoaderCardSkeleton />
			</PbTabShell>
		)
	}

	return (
		<PbTabShell
			ref={workspace_visibility_ref}
			tabId="reports-workspace"
			alias={tab.alias}
			description={tab.description}
			keyPrefix={`${reports_workspace_key_prefix}-intro`}
		>
			<EmbedCard id="sheets" copy={SheetsCopy} height={ui.size.layout.lg} onTabClick={goToTab} />
			<EmbedCard id="slides" copy={SlidesCopy} height={ui.size.layout.md} onTabClick={goToTab} />
			<PbReveal className="w-full" data-search-target={SearchTargets.reportsWorkspace.exampleCard}>
				<PbTabCard hover>
					<PbCardLayer>
						<PbCardHeader
							title={
								<span className={ui.typography.title.lg}>
									<Renderer.Copy.InlineText
										text={WorkspaceExample.title}
										keyPrefix={`${reports_workspace_key_prefix}-example-title`}
										onUnknownToken={warn_unknown_metric}
									/>
								</span>
							}
							description={
								<PbSubtleText size="body">
									<Renderer.Copy.InlineText
										text={WorkspaceExample.body}
										keyPrefix={`${reports_workspace_key_prefix}-example-desc`}
										onUnknownToken={warn_unknown_metric}
									/>
								</PbSubtleText>
							}
							action={<Renderer.Metrics.Legend />}
						/>

						<PbCardContent className={cn("relative flex flex-col", ui.gap.md)}>
							<div className={cn("grid items-stretch md:grid-cols-3", ui.gap.sm)}>
								{WorkspaceExample.panels.slice(0, 3).map((panel, idx) => (
									<PbTabPanel key={panel.id} variant="opaque" className="relative flex h-full flex-col">
										<div className={cn("flex items-start justify-between", ui.gap.sm)}>
											<div className="min-w-0">
												<div className={cn("text-foreground", ui.typography.title.md)}>
													<Renderer.Copy.InlineText
														text={panel.title}
														keyPrefix={`${reports_workspace_key_prefix}-example-panel-${panel.id}-title`}
														onUnknownToken={warn_unknown_metric}
													/>
												</div>

												{panel.subtitle ? (
													<div className={cn(ui.margin.topXs, "leading-snug text-muted-foreground", ui.typography.caption)}>
														<Renderer.Copy.InlineText
															text={panel.subtitle}
															keyPrefix={`${reports_workspace_key_prefix}-example-panel-${panel.id}-subtitle`}
															onUnknownToken={warn_unknown_metric}
														/>
													</div>
												) : null}
											</div>

											<PbNumberBadge number={idx + 1} ariaLabel={WorkspaceExample.ui.exampleItemLabel.replace("{n}", String(idx + 1))} />
										</div>

										<PbMetricList items={panel.bullets} onUnknownToken={warn_unknown_metric} />
									</PbTabPanel>
								))}
							</div>

						</PbCardContent>
					</PbCardLayer>
				</PbTabCard>
			</PbReveal>
		</PbTabShell>
	)
}
