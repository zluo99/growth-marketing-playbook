"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"
import { createPortal } from "react-dom"
import { motion } from "framer-motion"
import { ChevronDown } from "lucide-react"

import { ui } from "@/components/tokens/design"
import { navMenuFadeVariants, uiMotion, useReducedMotionBool } from "@/components/tokens/motion"
import { useMounted } from "@/lib/hooks/use-mounted"
import { cn, runWithViewportAnchor } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type DropdownAlign = "start" | "stretch"

export type DropdownItem<V extends string> = {
	value: V
	label: React.ReactNode
	inlineChoices?: readonly { label: React.ReactNode; value: V }[]
	inlineChoicesOnly?: boolean
	icon?: React.ComponentType<{ className?: string }>
	disabled?: boolean
}

export type DropdownProps<V extends string> = {
	value: V
	onChange: (v: V) => void
	onItemSelect?: (v: V) => "close" | "keep-open"
	onOpenChange?: (open: boolean) => void
	items: readonly DropdownItem<V>[]

	renderTriggerLabel?: (active: DropdownItem<V> | undefined) => React.ReactNode
	triggerLabel: React.ReactNode

	widthClassName?: string
	align?: DropdownAlign

	triggerClassName?: string
	menuClassName?: string
	itemClassName?: string

	itemLabelClassName?: string

	menuMaxHeightClassName?: string
	menuOffsetPx?: number
	suspendTooltipsWhenOpen?: boolean

	ariaLabel: string
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const trigger_chrome = cn(ui.nav.chrome.md, ui.nav.heights.md, "w-full", "inline-flex items-stretch")
const trigger_inner = cn("flex h-full w-full min-w-0 items-center justify-between", "pl-4 pr-2")
const chevron_chrome = cn(ui.iconNude.lg, "shrink-0", ui.icon.interactive.all, ui.motion.durationFast, "transition-transform")

const menu_chrome = cn(
	ui.nav.shell.base,
	ui.nav.shell.blurBg,
	"!shadow-[0_12px_32px_rgba(0,0,0,0.15)]",
	"dark:!shadow-[0_12px_32px_rgba(0,0,0,0.6)]",
	"transition-shadow",
	"hover:!shadow-[0_18px_45px_rgba(0,0,0,0.25)]",
	"dark:hover:!shadow-[0_18px_45px_rgba(0,0,0,0.75)]",
	"p-1"
)
const item_chrome = cn(
	"w-full text-left",
	"flex items-center",
	ui.radius.control,
	ui.nav.control.height,
	ui.nav.control.padX,
	ui.typography.body,
	ui.motion.duration,
	ui.component.outline.focus,
	ui.surface.state.hover.bg,
	ui.component.outline.hover,
	ui.surface.state.press.shadow,
	ui.surface.state.press.scaleSm,
	ui.component.outline.base,
	ui.component.hoverShadow,
	"bg-transparent"
)
const inline_segment_chrome = cn(
	ui.radius.control,
	ui.motion.duration,
	ui.component.outline.focus,
	ui.component.outline.base,
	ui.component.outline.hover,
	ui.surface.state.hover.bg,
	ui.surface.state.press.shadow,
	ui.surface.state.press.scaleSm,
	"bg-background"
)

/* -------------------------------------------------------------------------- */
/* Hooks                                                                      */
/* -------------------------------------------------------------------------- */

function useDropdownSuspendTooltips(open: boolean, enabled = true) {
	React.useEffect(() => {
		if (!enabled) return
		if (!open) return

		const prev = read_suspend_count()
		set_suspend_count(prev + 1)

		return () => {
			const next = read_suspend_count() - 1
			set_suspend_count(next)
		}
	}, [enabled, open])
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function read_suspend_count() {
	if (typeof document === "undefined") return 0
	const raw = document.body.getAttribute("data-tooltip-suspended-count")
	const n = raw ? Number.parseInt(raw, 10) : 0
	return Number.isFinite(n) && n > 0 ? n : 0
}

function set_suspend_count(n: number) {
	if (typeof document === "undefined") return
	if (n <= 0) {
		document.body.removeAttribute("data-tooltip-suspended")
		document.body.removeAttribute("data-tooltip-suspended-count")
		return
	}
	document.body.setAttribute("data-tooltip-suspended", "true")
	document.body.setAttribute("data-tooltip-suspended-count", String(n))
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function Dropdown<V extends string>({
	value,
	onChange,
	onItemSelect,
	onOpenChange,
	items,
	renderTriggerLabel,
	triggerLabel,
	ariaLabel,

	widthClassName = "w-[180px]",
	align = "start",

	triggerClassName,
	menuClassName,
	itemClassName,

	itemLabelClassName,

	menuMaxHeightClassName = "max-h-[360px]",
	menuOffsetPx = 0,
	suspendTooltipsWhenOpen = true,

}: DropdownProps<V>) {
	const mounted = useMounted()
	const reduce_motion = useReducedMotionBool()
	const listbox_id = React.useId()

	const shell_ref = React.useRef<HTMLDivElement | null>(null)
	const trigger_ref = React.useRef<HTMLButtonElement | null>(null)
	const menu_ref = React.useRef<HTMLDivElement | null>(null)
	const item_refs = React.useRef<Array<HTMLButtonElement | null>>([])
	const should_focus_menu_on_open_ref = React.useRef(false)

	const [open, set_open] = React.useState(false)
	const [active_index, set_active_index] = React.useState(-1)

	React.useEffect(() => {
		onOpenChange?.(open)
	}, [onOpenChange, open])

	const close = React.useCallback(() => {
		set_open(false)
		set_active_index(-1)
	}, [])
	const toggle = React.useCallback(() => {
		should_focus_menu_on_open_ref.current = false
		set_open((v) => {
			const next = !v
			if (next) {
				// Pointer/touch open should not keep trigger focus, which can cause viewport jumps on mobile.
				requestAnimationFrame(() => trigger_ref.current?.blur())
			}
			return next
		})
	}, [])

	useDropdownSuspendTooltips(open, suspendTooltipsWhenOpen)

	const active = React.useMemo(() => items.find((x) => x.value === value), [items, value])
	const trigger_label = renderTriggerLabel ? renderTriggerLabel(active) : triggerLabel

	const [pos, set_pos] = React.useState<{ left: number; top: number; width: number } | null>(null)

	const measure = React.useCallback(() => {
		const el = trigger_ref.current
		if (!el) return
		const r = el.getBoundingClientRect()
		set_pos({ left: r.left, top: r.bottom + 4, width: r.width })
	}, [])

	const find_first_enabled = React.useCallback(() => items.findIndex((item) => !item.disabled), [items])
	const find_last_enabled = React.useCallback(() => {
		for (let idx = items.length - 1; idx >= 0; idx -= 1) {
			if (!items[idx]?.disabled) return idx
		}
		return -1
	}, [items])

	const resolve_active_index = React.useCallback(() => {
		const value_index = items.findIndex((item) => item.value === value && !item.disabled)
		if (value_index >= 0) return value_index
		return find_first_enabled()
	}, [find_first_enabled, items, value])

	const focus_item = React.useCallback((idx: number) => {
		if (idx < 0) return
		item_refs.current[idx]?.focus({ preventScroll: true })
	}, [])

	const move_active = React.useCallback(
		(dir: -1 | 1) => {
			if (!items.length) return
			let next = active_index
			for (let step = 0; step < items.length; step += 1) {
				next = (next + dir + items.length) % items.length
				if (!items[next]?.disabled) {
					set_active_index(next)
					focus_item(next)
					break
				}
			}
		},
		[active_index, focus_item, items]
	)

	React.useEffect(() => {
		if (!open) return

		measure()

		const on_key = (e: KeyboardEvent) => {
			if (e.key !== "Escape") return
			e.preventDefault()
			close()
			trigger_ref.current?.focus?.()
		}

		const on_pointer = (e: PointerEvent) => {
			const target = e.target as Node | null
			if (!target) return
			if (shell_ref.current?.contains(target)) return
			if (menu_ref.current?.contains(target)) return
			close()
		}

		const on_resize = () => measure()
		// Keep the menu anchored during scroll instead of force-closing.
		const on_scroll = () => measure()

		document.addEventListener("keydown", on_key)
		document.addEventListener("pointerdown", on_pointer, { capture: true })
		window.addEventListener("resize", on_resize, { passive: true })
		window.addEventListener("scroll", on_scroll, { passive: true, capture: true })

		const ro = trigger_ref.current ? new ResizeObserver(() => measure()) : null
		if (trigger_ref.current) ro?.observe(trigger_ref.current)

		return () => {
			document.removeEventListener("keydown", on_key)
			document.removeEventListener("pointerdown", on_pointer, true)
			window.removeEventListener("resize", on_resize)
			window.removeEventListener("scroll", on_scroll, true)
			ro?.disconnect()
		}
	}, [close, measure, open])

	React.useEffect(() => {
		if (!open) return
		const next_index = resolve_active_index()
		set_active_index(next_index)
		const should_focus = should_focus_menu_on_open_ref.current
		should_focus_menu_on_open_ref.current = false
		if (should_focus) requestAnimationFrame(() => focus_item(next_index))
	}, [focus_item, open, resolve_active_index])

	const on_menu_key_down = React.useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (e.key === "ArrowDown") {
				e.preventDefault()
				move_active(1)
				return
			}

			if (e.key === "ArrowUp") {
				e.preventDefault()
				move_active(-1)
				return
			}

			if (e.key === "Home") {
				e.preventDefault()
				const next = find_first_enabled()
				set_active_index(next)
				focus_item(next)
				return
			}

			if (e.key === "End") {
				e.preventDefault()
				const next = find_last_enabled()
				set_active_index(next)
				focus_item(next)
				return
			}

			if (e.key === "Enter" || e.key === " ") {
				const item = items[active_index]
				if (!item || item.disabled) return
				e.preventDefault()
				onChange(item.value)
				const behavior = onItemSelect?.(item.value) ?? "close"
				if (behavior === "close") {
					close()
					trigger_ref.current?.focus?.()
				}
				return
			}

			if (e.key === "Escape") {
				e.preventDefault()
				close()
				trigger_ref.current?.focus?.()
			}
		},
		[active_index, close, find_first_enabled, find_last_enabled, focus_item, items, move_active, onChange, onItemSelect]
	)

	const on_key_down = React.useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
		if (e.key !== "ArrowDown" && e.key !== "Enter" && e.key !== " ") return
		e.preventDefault()
		should_focus_menu_on_open_ref.current = true
		set_open(true)
	}, [])

	const trigger_width = align === "stretch" ? "w-full" : widthClassName
	const menu_offset = align === "stretch" ? menuOffsetPx : 0
	const inline_reveal_transition = reduce_motion ? uiMotion.frameworks.dropdownInline.reduced : uiMotion.frameworks.dropdownInline.reveal
	const inline_shrink_transition = reduce_motion ? uiMotion.frameworks.dropdownInline.reduced : uiMotion.frameworks.dropdownInline.shrink
	const inline_reveal_delay = reduce_motion ? 0 : uiMotion.frameworks.dropdownInline.revealDelay

	return (
		<div ref={shell_ref} className={cn("relative", align === "stretch" ? "w-full" : "w-auto")}>
			<button
				ref={trigger_ref}
				type="button"
				className={cn(trigger_chrome, open ? ui.surface.structure.borderHover : null, trigger_width, triggerClassName)}
				onClick={toggle}
				onKeyDown={on_key_down}
				aria-expanded={open}
				aria-haspopup="listbox"
				aria-controls={open ? listbox_id : undefined}
				aria-label={ariaLabel}
			>
				<div className={trigger_inner}>
					<span className="min-w-0 flex-1 flex items-center h-full">
						<span className="min-w-0 flex-1 flex items-center h-full">{trigger_label}</span>
					</span>

					<ChevronDown className={cn(chevron_chrome, open ? "rotate-180" : "rotate-0")} aria-hidden="true" />
				</div>
			</button>

			{open && mounted && pos
				? createPortal(
						<div className="fixed inset-0 z-[2147483647] pointer-events-none" aria-hidden="true">
							<motion.div
								ref={menu_ref}
								id={listbox_id}
								role="listbox"
								aria-label={ariaLabel}
								aria-activedescendant={active_index >= 0 ? `${listbox_id}-option-${active_index}` : undefined}
								initial="hidden"
								animate="visible"
								variants={navMenuFadeVariants}
								className={cn("fixed pointer-events-auto", menu_chrome, menuMaxHeightClassName, menuClassName)}
								style={{
									left: pos.left - menu_offset,
									top: pos.top,
									width: align === "stretch" ? pos.width + menu_offset * 2 : undefined,
								}}
								tabIndex={-1}
								onKeyDown={on_menu_key_down}
							>
								<div className="flex flex-col gap-1">
									{items.map((item, index) => {
										const is_active = item.value === value
										const Icon = item.icon
										const run_select = (next: V) => {
											runWithViewportAnchor(trigger_ref.current, () => {
												onChange(next)
												const behavior = onItemSelect?.(next) ?? "close"
												if (behavior === "close") close()
											})
										}
										const inline_choices = item.inlineChoices ?? []
										const inline_choices_only = item.inlineChoicesOnly === true
										const inline_choice_width_px = 92
										const inline_choice_gap_px = 4
										const inline_right_pad_px = 4
										const inline_group_width_px =
											inline_choices.length * inline_choice_width_px + Math.max(0, inline_choices.length - 1) * inline_choice_gap_px
										const inline_group_slot_px = inline_group_width_px + inline_right_pad_px

										if (inline_choices.length > 0 && inline_choices_only) {
											return (
												<div
													key={item.value}
													className={cn("group flex w-full items-stretch gap-1", ui.nav.control.height, itemClassName, item.disabled ? "pointer-events-none opacity-50" : null)}
													role="option"
													aria-selected={is_active}
													id={`${listbox_id}-option-${index}`}
													tabIndex={-1}
													onMouseEnter={() => {
														if (!item.disabled) set_active_index(index)
													}}
												>
													<motion.div
														initial={reduce_motion ? false : { opacity: 0, x: 8 }}
														animate={{ opacity: 1, x: 0 }}
														transition={inline_reveal_transition}
														className="inline-flex h-full w-full items-stretch gap-1"
													>
														{inline_choices.map((choice, choice_idx) => (
															<motion.button
																key={`${item.value}__${String(choice.value)}`}
																type="button"
																initial={reduce_motion ? false : { opacity: 0, x: 10 }}
																animate={{ opacity: 1, x: 0 }}
																transition={
																	reduce_motion
																		? inline_reveal_transition
																		: {
																				...inline_reveal_transition,
																				delay: choice_idx * uiMotion.frameworks.dropdownInline.stagger,
																			}
																}
																className={cn(
																	"inline-flex h-full min-w-0 flex-1 items-center justify-center",
																	ui.nav.control.padX,
																	inline_segment_chrome,
																	ui.typography.label,
																	choice.value === value ? ui.component.outline.activeStatic : null
																)}
																onMouseDown={(e) => {
																	e.preventDefault()
																	e.stopPropagation()
																}}
																onPointerDown={(e) => {
																	e.preventDefault()
																	e.stopPropagation()
																}}
																onClick={(e) => {
																	e.preventDefault()
																	e.stopPropagation()
																	run_select(choice.value)
																}}
															>
																{choice.label}
															</motion.button>
														))}
													</motion.div>
												</div>
											)
										}

										if (inline_choices.length > 0) {
											return (
												<div
													key={item.value}
													className={cn("group flex w-full items-stretch gap-1", ui.nav.control.height, itemClassName, item.disabled ? "pointer-events-none opacity-50" : null)}
													role="option"
													aria-selected={is_active}
													id={`${listbox_id}-option-${index}`}
													tabIndex={-1}
													onMouseEnter={() => {
														if (!item.disabled) set_active_index(index)
													}}
												>
													<motion.button
														ref={(node) => {
															item_refs.current[index] = node
														}}
														type="button"
														disabled={!!item.disabled}
														initial={reduce_motion ? false : { opacity: 0, width: `calc(100% - ${inline_group_slot_px - 10}px)` }}
														animate={{ opacity: 1, width: `calc(100% - ${inline_group_slot_px}px)` }}
														transition={inline_shrink_transition}
														onClick={() => {
															run_select(item.value)
														}}
														onMouseDown={(e) => {
															e.preventDefault()
														}}
														onPointerDown={(e) => {
															e.preventDefault()
														}}
														className={cn(
															"min-w-0 flex-none overflow-hidden text-left",
															ui.nav.control.padX,
															inline_segment_chrome,
															is_active ? ui.component.outline.activeStatic : null
														)}
														tabIndex={active_index === index ? 0 : -1}
													>
														<span className={cn("inline-flex w-full min-w-0 items-center", ui.gap.sm)}>
															{Icon ? <Icon className={cn(ui.iconNude.md, "shrink-0", is_active ? ui.icon.default.fg : ui.icon.interactive.all)} aria-hidden="true" /> : null}
															<motion.span
																initial={reduce_motion ? false : { opacity: 0, x: -6 }}
																animate={{ opacity: 1, x: 0 }}
																transition={inline_reveal_transition}
																className={cn("min-w-0 flex-1 truncate", ui.typography.label, itemLabelClassName, is_active ? ui.text.default.fg : ui.text.interactive.all)}
															>
																{item.label}
															</motion.span>
														</span>
													</motion.button>
													<motion.div
														initial={reduce_motion ? false : { opacity: 0, x: 14 }}
														animate={{ opacity: 1, x: 0 }}
														transition={
															reduce_motion
																? inline_reveal_transition
																: { ...inline_reveal_transition, delay: inline_reveal_delay }
														}
														className="ml-auto mr-1 inline-flex h-full shrink-0 items-stretch gap-1"
													>
														{inline_choices.map((choice, choice_idx) => (
															<motion.button
																key={`${item.value}__${String(choice.value)}`}
																type="button"
																initial={reduce_motion ? false : { opacity: 0, x: 10 }}
																animate={{ opacity: 1, x: 0 }}
																transition={
																	reduce_motion
																		? inline_reveal_transition
																		: {
																				...inline_reveal_transition,
																				delay: inline_reveal_delay + choice_idx * uiMotion.frameworks.dropdownInline.stagger,
																			}
																}
																className={cn(
																	"inline-flex h-full w-[92px] items-center justify-center",
																	ui.nav.control.padX,
																	inline_segment_chrome,
																	ui.typography.label,
																	choice.value === value ? ui.component.outline.activeStatic : null
																)}
																onMouseDown={(e) => {
																	e.preventDefault()
																	e.stopPropagation()
																}}
																onPointerDown={(e) => {
																	e.preventDefault()
																	e.stopPropagation()
																}}
																onClick={(e) => {
																	e.preventDefault()
																	e.stopPropagation()
																	run_select(choice.value)
																}}
															>
																{choice.label}
															</motion.button>
														))}
													</motion.div>
												</div>
											)
										}

										return (
											<button
												key={item.value}
												ref={(node) => {
													item_refs.current[index] = node
												}}
												type="button"
												disabled={!!item.disabled}
												onClick={() => {
													run_select(item.value)
												}}
												onMouseDown={(e) => {
													e.preventDefault()
												}}
												onPointerDown={(e) => {
													e.preventDefault()
												}}
												onMouseEnter={() => {
													if (!item.disabled) set_active_index(index)
												}}
												className={cn(
													"group",
													item_chrome,
													itemClassName,
													is_active ? "bg-background text-foreground" : null,
													is_active ? ui.component.outline.activeStatic : null,
													item.disabled ? "pointer-events-none opacity-50" : null
												)}
												role="option"
												aria-selected={is_active}
												id={`${listbox_id}-option-${index}`}
												tabIndex={active_index === index ? 0 : -1}
											>
												<span className={cn("inline-flex w-full min-w-0 items-center", ui.gap.sm)}>
													{Icon ? <Icon className={cn(ui.iconNude.md, "shrink-0", is_active ? ui.icon.default.fg : ui.icon.interactive.all)} aria-hidden="true" /> : null}
													<span className={cn("min-w-0 flex-1 truncate", ui.typography.label, itemLabelClassName, is_active ? ui.text.default.fg : ui.text.interactive.all)}>
														{item.label}
													</span>
												</span>
											</button>
										)
									})}
								</div>
							</motion.div>
						</div>,
						document.body
				  )
				: null}
		</div>
	)
}
