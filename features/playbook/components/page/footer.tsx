"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"
import Image from "next/image"
import { Github, Linkedin, Mail, Laptop, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { ui } from "@/components/tokens/design"
import { uiMotion } from "@/components/tokens/motion"
import { Bar } from "@/components/nav/bar"
import { MotionPillIndicator, PillList, PillRoot, PillTrigger, useMotionPillRail } from "@/components/nav/pill"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useMounted } from "@/lib/hooks/use-mounted"
import { cn } from "@/lib/cn"
import { Renderer } from "@/features/playbook/components/ui/renderer"
import { PageCopy } from "../../copy/page"

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function ThemesBar() {
	const { theme, setTheme } = useTheme()
	const mounted = useMounted()
	const [ui_theme, set_ui_theme] = React.useState<"light" | "dark" | "system">("system")
	const theme_copy = PageCopy.footer

	const theme_preference = theme === "dark" || theme === "light" ? theme : "system"

	React.useEffect(() => {
		set_ui_theme(theme_preference)
	}, [theme_preference])

	const rail = useMotionPillRail<"light" | "system" | "dark">({
		activeKey: ui_theme,
		spring: uiMotion.nav.pillSpringCompact,
	})

	const on_change_theme = React.useCallback(
		(next: string) => {
			if (next === "light" || next === "dark" || next === "system") {
				set_ui_theme(next)
				setTheme(next)
			}
		},
		[setTheme]
	)

	if (!mounted) {
		return <div className={cn(ui.nav.shell.base, ui.nav.heights.md, ui.nav.pad, "w-max", "bg-muted/50")} />
	}

	return (
		<PillRoot value={ui_theme} onValueChange={on_change_theme} className="w-max">
			<Bar variant="shell" ariaLabel={theme_copy.themeLabel} className="w-max">
				{() => (
					<div className={cn("flex items-stretch", ui.nav.pad)}>
						<PillList
							ref={rail.listRef}
							aria-label={theme_copy.themeLabel}
							chrome={false}
							className={cn(ui.nav.rail.listChrome, ui.nav.control.height, "items-center")}
						>
							<MotionPillIndicator
								pill={rail.pill}
								transition={uiMotion.nav.pillTween}
								className={cn(ui.nav.rail.indicatorChrome, ui.nav.control.height, ui.radius.control)}
							/>

							{[
								{ id: "light", Icon: Sun, label: theme_copy.themeOptions.light },
								{ id: "system", Icon: Laptop, label: theme_copy.themeOptions.system },
								{ id: "dark", Icon: Moon, label: theme_copy.themeOptions.dark },
							].map((opt) => {
								const is_active = ui_theme === opt.id
								const icon_tone = is_active ? ui.icon.default.fg : ui.icon.interactive.all

								return (
									<PillTrigger
										key={opt.id}
										value={opt.id}
										ref={rail.getTriggerRef(opt.id as "light" | "system" | "dark")}
										standard={false}
										onPressPreview={() => rail.pill.measureRaf()}
										className={ui.nav.rail.iconTriggerChrome}
									>
										<span className="relative z-10 grid h-full w-full place-items-center">
											<opt.Icon className={cn(ui.iconNude.md, ui.motion.duration, icon_tone)} aria-hidden="true" />
										</span>
										<span className="sr-only">{opt.label}</span>
									</PillTrigger>
								)
							})}
						</PillList>
					</div>
				)}
			</Bar>
		</PillRoot>
	)
}

function FooterIconLink({
	href,
	label,
	icon,
	tooltip,
	openInNewTab = false,
}: {
	href: string
	label: string
	icon: React.ReactNode
	tooltip: string
	openInNewTab?: boolean
}) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<a
					href={href}
					aria-label={label}
					target={openInNewTab ? "_blank" : undefined}
					rel={openInNewTab ? "noopener noreferrer" : undefined}
					className={cn(ui.nav.iconButton.chrome, "bg-background")}
				>
					<span className={cn(ui.nav.iconButton.contentChrome, "h-full w-full")}>{icon}</span>
					<span className="sr-only">{label}</span>
				</a>
			</TooltipTrigger>

			<TooltipContent side="top" align="center" className={ui.typography.body}>
				{tooltip}
			</TooltipContent>
		</Tooltip>
	)
}

/* -------------------------------------------------------------------------- */
/* Default export                                                             */
/* -------------------------------------------------------------------------- */

export default function PbFooter() {
	const current_year = new Date().getFullYear()
	const disclaimer = PageCopy.footer.disclaimer.replace("{year}", String(current_year))
	const email = PageCopy.headerContent.email
	const linkedin_url = PageCopy.headerContent.linkedinUrl
	const github_url = PageCopy.headerContent.githubUrl
	const footer_copy = PageCopy.footer

	return (
		<footer
			className={cn(
				"relative mt-10 w-screen -mx-[calc((100vw-100%)/2)] px-[calc((100vw-100%)/2)]",
				ui.surface.structure.subtleGrey,
				ui.spacing.footerY,
				ui.typography.caption,
				ui.text.muted.fg
			)}
		>
			<div className={cn("relative flex w-full items-start", ui.gap.md)}>
				<div className={cn("flex min-w-0 flex-col", ui.gap.xs)}>
					<div className={cn("flex items-center", ui.gap.sm)}>
						<Image
							src="/favicon.ico"
							alt={footer_copy.brandMarkAlt}
							width={24}
							height={24}
							className={cn("h-6 w-6 shrink-0 brightness-0 dark:invert dark:brightness-0", ui.motion.duration)}
						/>
						<span className={cn("text-foreground", ui.typography.body)}>
							<Renderer.Copy.InlineText text={footer_copy.brandTitle} keyPrefix="footer-brand-title" />
						</span>
					</div>

					<span className={cn(ui.typography.caption, ui.text.muted.fg)}>
						<Renderer.Copy.InlineText text={disclaimer} keyPrefix="footer-disclaimer" />
					</span>
				</div>

				<div className={cn("ml-auto flex flex-col items-end sm:flex-row sm:items-stretch", ui.gap.xs)}>
					<div className={cn("flex items-stretch", ui.gap.xs)}>
						<FooterIconLink href={`mailto:${email}`} label={footer_copy.emailLabel} tooltip={email} icon={<Mail className={ui.iconNude.lg} aria-hidden="true" />} />
						<FooterIconLink
							href={linkedin_url}
							label={footer_copy.linkedinLabel}
							tooltip={footer_copy.linkedinLabel}
							icon={<Linkedin className={ui.iconNude.lg} aria-hidden="true" />}
							openInNewTab
						/>
						<FooterIconLink
							href={github_url}
							label={footer_copy.githubLabel}
							tooltip={footer_copy.githubLabel}
							icon={<Github className={ui.iconNude.lg} aria-hidden="true" />}
							openInNewTab
						/>
					</div>
					<ThemesBar />
				</div>
			</div>
		</footer>
	)
}
