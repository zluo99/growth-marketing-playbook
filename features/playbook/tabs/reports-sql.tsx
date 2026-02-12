"use client"

/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import * as React from "react"
import { Code2, Download, GripHorizontal, GripVertical, Play, Route, Sparkles } from "lucide-react"

import { ui } from "@/components/tokens/design"
import { uiMotion } from "@/components/tokens/motion"
import { Button, buttonVariants } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useMediaQuery } from "@/lib/hooks/use-media-query"
import { clamp_value, cn, stableKeyFromParts, stableKeyFromText } from "@/lib/utils"

import { Renderer } from "@/features/playbook/components/ui/renderer"
import { CodeTextarea } from "@/features/playbook/components/ui/code"
import { PlaybookStorage, read_preference, write_preference } from "@/features/playbook/components/context/preferences"
import { PbBullet, PbCard, PbCardContent, PbCardGlow, PbCardHeader, PbCardLayer, PbFocus, PbNumberBadge, PbPanel, PbReveal, PbStack, PbSubtleText, PbTabIntro, useLazyGate } from "@/features/playbook/components/ui/ui"
import { LoaderCardSkeleton } from "@/features/playbook/components/ui/loader"
import { DefinitionsCopy } from "@/features/playbook/copy/reports-sql-definitions"
import { FunnelCopy } from "@/features/playbook/copy/reports-sql-funnel"
import { PgCopy, PgDefaultSql, PgPresets } from "@/features/playbook/copy/reports-sql-pg"
import { MetricDefinitions, isMetricId, type MetricId } from "@/features/playbook/definitions/metrics"
import { TabById } from "@/features/playbook/definitions/tabs"
import { getTermByToken } from "@/features/playbook/definitions/terms"
import { type SqlQueryResult } from "@/features/playbook/sql/sql-types"
import { useSqlWorker } from "@/features/playbook/sql/use-sql-worker"
import { downloadCsv } from "@/lib/csv"

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type SqlRunStatus = "idle" | "running" | "success" | "error"

type SqlUiState = {
	query: string
	result: SqlQueryResult | null
	status: SqlRunStatus
	errorMsg: string
	paneHeight: number
}

type SqlUiAction =
	| { type: "setQuery"; value: string }
	| { type: "setPaneHeight"; value: number | ((prev: number) => number) }
	| { type: "runStart" }
	| { type: "runSuccess"; result: SqlQueryResult }
	| { type: "runError"; message: string }

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const pane_min = ui.size.layout.sm
const pane_max = ui.size.layout.lg
const pane_default = ui.size.layout.sm
const editor_width_min_pct = 30
const editor_width_max_pct = 60
const editor_width_default_pct = 40
const result_preview_row_limit = 300

const reports_sql_icon_map = {
	code: Code2,
	route: Route,
	sparkles: Sparkles,
} as const

type ReportsSqlIconKey = keyof typeof reports_sql_icon_map

const reports_sql_key_prefix = "reports-sql"
const panel_md_hover_class = cn(
	ui.surface.structure.panel,
	ui.surface.structure.border,
	ui.spacing.panelMd,
	ui.motion.duration,
	ui.radius.base,
	ui.surface.structure.shadowNone,
	"hover:border-[color:var(--border-hover)]"
)
const panel_sm_hover_class = cn(
	ui.surface.structure.shadowNone,
	ui.surface.structure.border,
	ui.spacing.panelSm,
	ui.motion.duration,
	ui.radius.base,
	"min-w-0 hover:border-[color:var(--border-hover)]"
)
const reports_sql_help_hover_class = "hover:decoration-foreground/60"
const error_panel_class = cn(ui.radius.base, ui.spacing.panelSm, ui.typography.body, "border border-destructive/30 bg-destructive/5 text-destructive")
const resize_tone_class = "text-[color:var(--color-muted-foreground-soft)] hover:text-[color:var(--border-hover)] focus-visible:text-[color:var(--border-hover)]"
const show_all_cta_transition_duration_ms = Math.round(uiMotion.tokens.durations.extended * 1000)
const show_all_cta_transition_ease = `cubic-bezier(${uiMotion.tokens.easing.emphasis.join(",")})`

/* -------------------------------------------------------------------------- */
/* Utils                                                                      */
/* -------------------------------------------------------------------------- */

function filename_from_sql_comment(sql: string) {
	const first = (sql ?? "").trimStart().split(/\r?\n/, 1)[0] ?? ""
	const file_hint_match = first.match(/^\s*--\s*file:\s*([a-z0-9][a-z0-9_\- ]{0,80})(?:\.sql)?\s*$/i)
	const legacy_match = first.match(/^\s*--\s*([a-z0-9][a-z0-9_\- ]{0,80})\s*$/i)
	const raw_name = file_hint_match?.[1] ?? legacy_match?.[1] ?? PgCopy.labels.download_default_name
	return raw_name
		.toLowerCase()
		.trim()
		.replaceAll(/[^a-z0-9]+/g, "_")
		.replaceAll(/^_+|_+$/g, "")
}

function as_metric_ids(ids: readonly unknown[] | undefined) {
	if (!ids?.length) return [] as readonly MetricId[]
	const out: MetricId[] = []
	for (const v of ids) if (typeof v === "string" && isMetricId(v)) out.push(v)
	return out as readonly MetricId[]
}

function render_metric_pill(id: MetricId) {
	return MetricDefinitions[id].type_l1 === "attribute" ? <Renderer.Metrics.AttributePill key={id} id={id} /> : <Renderer.Metrics.MeasurePill key={id} id={id} />
}

function icon_for(k: string) {
	return reports_sql_icon_map[k as ReportsSqlIconKey] ?? Sparkles
}

function placeholder_result(): SqlQueryResult {
	return { columns: [""], values: Array.from({ length: 30 }, () => [""]) }
}

function read_number_preference(key: string) {
	const raw = read_preference(key)
	if (raw == null || raw.trim() === "") return null
	const parsed = Number(raw)
	return Number.isFinite(parsed) ? parsed : null
}

function format_results_toggle_label(total_rows: string) {
	return PgCopy.ui.resultsToggle.showAllRows.replace("{n}", total_rows)
}

/* -------------------------------------------------------------------------- */
/* Hooks                                                                      */
/* -------------------------------------------------------------------------- */

function useWarmupOnVisible<T extends HTMLElement>(ref: React.RefObject<T | null>, trigger: () => void) {
	const did = React.useRef(false)

	React.useEffect(() => {
		const el = ref.current
		if (!el) return

		const io = new IntersectionObserver(
			(entries) => {
				if (did.current || !entries.some((e) => e.isIntersecting)) return
				did.current = true
				trigger()
				io.disconnect()
			},
			{ threshold: 0.15 },
		)

		io.observe(el)
		return () => io.disconnect()
	}, [ref, trigger])
}

function useDragHeight({ height, set_height, min = 260, max = 720 }: { height: number; set_height: React.Dispatch<React.SetStateAction<number>>; min?: number; max?: number }) {
	const drag_ref = React.useRef<{ pid: number | null; start_y: number; start_h: number }>({ pid: null, start_y: 0, start_h: height })
	const clamp_h = React.useCallback((v: number) => clamp_value(v, min, max), [min, max])
	const stop = React.useCallback(() => {
		drag_ref.current.pid = null
	}, [])

	const on_pointer_down = React.useCallback(
		(handle: HTMLDivElement | null, e: React.PointerEvent<HTMLDivElement>) => {
			if (!handle) return
			e.preventDefault()
			drag_ref.current = { pid: e.pointerId, start_y: e.clientY, start_h: height }
			handle.setPointerCapture?.(e.pointerId)
		},
		[height],
	)

	React.useEffect(() => {
		const on_move = (e: PointerEvent) => {
			const d = drag_ref.current
			if (d.pid === null || e.pointerId !== d.pid) return
			set_height(clamp_h(d.start_h + (e.clientY - d.start_y)))
		}

		const on_up = (e: PointerEvent) => {
			const d = drag_ref.current
			if (d.pid === null || e.pointerId !== d.pid) return
			stop()
		}

		window.addEventListener("pointermove", on_move)
		window.addEventListener("pointerup", on_up)
		window.addEventListener("pointercancel", on_up)
		return () => {
			window.removeEventListener("pointermove", on_move)
			window.removeEventListener("pointerup", on_up)
			window.removeEventListener("pointercancel", on_up)
		}
	}, [clamp_h, set_height, stop])

	const keydown = React.useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (e.key === "ArrowUp") return e.preventDefault(), set_height((h) => clamp_h(h - 20))
			if (e.key === "ArrowDown") return e.preventDefault(), set_height((h) => clamp_h(h + 20))
			if (e.key === "Home") return e.preventDefault(), set_height(min)
			if (e.key === "End") return e.preventDefault(), set_height(max)
		},
		[clamp_h, max, min, set_height],
	)

	return { on_pointer_down, keydown, stop, clamp_h }
}

function useDragWidth({
	width_pct,
	set_width_pct,
	container_ref,
	min = editor_width_min_pct,
	max = editor_width_max_pct,
	enabled = true,
}: {
	width_pct: number
	set_width_pct: React.Dispatch<React.SetStateAction<number>>
	container_ref: React.RefObject<HTMLElement | null>
	min?: number
	max?: number
	enabled?: boolean
}) {
	const drag_ref = React.useRef<{ pid: number | null; start_x: number; start_pct: number; container_w: number }>({
		pid: null,
		start_x: 0,
		start_pct: width_pct,
		container_w: 1,
	})

	const clamp_pct = React.useCallback((v: number) => clamp_value(v, min, max), [max, min])
	const stop = React.useCallback(() => {
		drag_ref.current.pid = null
	}, [])

	const on_pointer_down = React.useCallback(
		(handle: HTMLDivElement | null, e: React.PointerEvent<HTMLDivElement>) => {
			if (!enabled || !handle || !container_ref.current) return
			e.preventDefault()

			const rect = container_ref.current.getBoundingClientRect()
			drag_ref.current = {
				pid: e.pointerId,
				start_x: e.clientX,
				start_pct: width_pct,
				container_w: Math.max(rect.width, 1),
			}
			handle.setPointerCapture?.(e.pointerId)
		},
		[container_ref, enabled, width_pct],
	)

	React.useEffect(() => {
		const on_move = (e: PointerEvent) => {
			const d = drag_ref.current
			if (d.pid === null || e.pointerId !== d.pid || !enabled) return
			const delta_pct = ((e.clientX - d.start_x) / d.container_w) * 100
			set_width_pct(clamp_pct(d.start_pct + delta_pct))
		}

		const on_up = (e: PointerEvent) => {
			const d = drag_ref.current
			if (d.pid === null || e.pointerId !== d.pid) return
			stop()
		}

		window.addEventListener("pointermove", on_move)
		window.addEventListener("pointerup", on_up)
		window.addEventListener("pointercancel", on_up)
		return () => {
			window.removeEventListener("pointermove", on_move)
			window.removeEventListener("pointerup", on_up)
			window.removeEventListener("pointercancel", on_up)
		}
	}, [clamp_pct, enabled, set_width_pct, stop])

	const keydown = React.useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (!enabled) return
			if (e.key === "ArrowLeft") return e.preventDefault(), set_width_pct((v) => clamp_pct(v - 2))
			if (e.key === "ArrowRight") return e.preventDefault(), set_width_pct((v) => clamp_pct(v + 2))
			if (e.key === "Home") return e.preventDefault(), set_width_pct(min)
			if (e.key === "End") return e.preventDefault(), set_width_pct(max)
		},
		[clamp_pct, enabled, max, min, set_width_pct],
	)

	return { on_pointer_down, keydown, stop, clamp_pct }
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
function sql_ui_reducer(state: SqlUiState, action: SqlUiAction): SqlUiState {
	switch (action.type) {
		case "setQuery":
			return { ...state, query: action.value }
		case "setPaneHeight": {
			const next = typeof action.value === "function" ? action.value(state.paneHeight) : action.value
			return { ...state, paneHeight: clamp_value(next, pane_min, pane_max) }
		}
		case "runStart":
			return { ...state, status: "running", errorMsg: "" }
		case "runSuccess":
			return { ...state, status: "success", result: action.result, errorMsg: "" }
		case "runError":
			return { ...state, status: "error", result: null, errorMsg: action.message }
		default:
			return state
	}
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function PbTitleWithIcon({ icon, text }: { icon: React.ComponentType<{ className?: string }>; text: React.ReactNode }) {
	return (
		<span className={cn("inline-flex items-center", ui.gap.sm)}>
			<span className={cn(ui.iconCard.frame, "text-muted-foreground")} aria-hidden="true">
				{React.createElement(icon, { className: ui.iconCard.size })}
			</span>
			<span className={cn("text-foreground", ui.typography.title.lg)}>{text}</span>
		</span>
	)
}

function ColumnLabel({ col }: { col: string }) {
	const k = col.trim()
	if (!isMetricId(k)) return <span>{k}</span>

	const def = MetricDefinitions[k]
	const formula = "formula" in def ? def.formula : undefined

	return (
		<Renderer.Help.Text
			label={k}
			description={
				<>
					<div>{def.description}</div>
					<Renderer.Formula.View formula={formula} />
				</>
			}
		/>
	)
}

function ColumnsWrap({ columns }: { columns: string }) {
	const parts = React.useMemo(() => columns.split(",").map((x) => x.trim()).filter(Boolean), [columns])

	return (
		<div className={cn("whitespace-normal break-words font-mono leading-relaxed text-muted-foreground", ui.typography.caption)}>
			{parts.map((p, i) => (
				<span key={`${p}-${i}`}>
					<ColumnLabel col={p} />
					{i < parts.length - 1 ? (
						<>
							<span>,</span>
							<wbr />{" "}
						</>
					) : null}
				</span>
			))}
		</div>
	)
}

const AvailableTableRow = React.memo(function AvailableTableRow({ name, description, columns }: { name: string; description: string; columns: string }) {
	return (
		<TableRow>
			<TableCell className="align-top">
				<div className={cn("whitespace-normal break-words font-mono text-foreground", ui.typography.caption)}>{name}</div>
			</TableCell>
			<TableCell className="align-top">
				<div className={cn("whitespace-normal break-words leading-relaxed text-foreground/90", ui.typography.caption)}>
					<Renderer.Copy.InlineText text={description} keyPrefix={`${reports_sql_key_prefix}-table-desc-${name}`} />
				</div>
			</TableCell>
			<TableCell className="align-top">
				<ColumnsWrap columns={columns} />
			</TableCell>
		</TableRow>
	)
})

function AvailableTables() {
	const sql_definitions_columns = DefinitionsCopy.panels.find((p) => p.id === "3")?.columns

	return (
		<Table
			headerTone="blue"
			className="w-full min-w-[640px] table-fixed"
			containerClassName={cn("overflow-x-auto overflow-y-hidden", ui.radius.base, ui.surface.structure.border)}
		>
			<colgroup>
				<col className="w-1/3" />
				<col className="w-1/3" />
				<col className="w-1/3" />
			</colgroup>

			{sql_definitions_columns ? (
				<TableHeader>
					<TableRow>
						<TableHead className={cn("whitespace-nowrap", ui.typography.body)}>
							<Renderer.Copy.InlineText text={sql_definitions_columns.table} keyPrefix={`${reports_sql_key_prefix}-tables-head-table`} />
						</TableHead>
						<TableHead className={cn("whitespace-nowrap", ui.typography.body)}>
							<Renderer.Copy.InlineText text={sql_definitions_columns.description} keyPrefix={`${reports_sql_key_prefix}-tables-head-description`} />
						</TableHead>
						<TableHead className={cn("whitespace-nowrap", ui.typography.body)}>
							<Renderer.Copy.InlineText text={sql_definitions_columns.columns} keyPrefix={`${reports_sql_key_prefix}-tables-head-columns`} />
						</TableHead>
					</TableRow>
				</TableHeader>
			) : null}

			<TableBody>
				{DefinitionsCopy.tables.map((t) => (
					<AvailableTableRow key={t.name} name={t.name} description={t.description} columns={t.columns} />
				))}
			</TableBody>
		</Table>
	)
}

function StageBody({ body }: { body: string }) {
	const items = React.useMemo(() => body.split(/\n{2,}/g).map((s) => s.trim()).filter(Boolean), [body])

	return (
		<PbStack asList gap="sm" className={ui.margin.allNone}>
			{items.map((txt) => {
				const key = stableKeyFromText(txt, `${reports_sql_key_prefix}-stage`)
				return (
					<PbBullet key={key} asListItem marker="dot" size="caption" className={cn("items-start text-muted-foreground [&>span:first-child]:mt-[0.2em]", ui.typography.caption)}>
						<Renderer.Copy.InlineText text={txt} keyPrefix={key} />
					</PbBullet>
				)
			})}
		</PbStack>
	)
}

function FunnelMetricPills({ metrics }: { metrics?: readonly unknown[] }) {
	const ids = React.useMemo(() => as_metric_ids(metrics), [metrics])
	if (!ids.length) return null
	return <>{ids.map(render_metric_pill)}</>
}

function FunnelNotePills({ alias, items }: { alias: string; items: readonly unknown[] }) {
	const ids = React.useMemo(() => as_metric_ids(items), [items])
	if (!ids.length) return null

	return (
		<div className={cn(ui.surface.structure.border, ui.spacing.panelSm, ui.radius.base, "bg-muted/10")}>
			<div className={cn("text-foreground/85 font-medium", ui.typography.caption)}>{alias}</div>
			<div className={cn(ui.margin.topSm, "flex min-w-0 flex-wrap", ui.gap.sm)}>{ids.map(render_metric_pill)}</div>
		</div>
	)
}

function FunnelStagePanel({ title, body, metrics, extra, stage_n }: { title: string; body: React.ReactNode; metrics?: React.ReactNode; extra?: React.ReactNode; stage_n: 1 | 2 | 3 | 4 | 5 }) {
	return (
		<PbPanel className={cn(ui.surface.structure.panel, ui.surface.structure.border, ui.spacing.panelSm, ui.motion.duration, ui.radius.base, ui.surface.structure.shadowNone, "flex h-full min-w-0 flex-col overflow-hidden hover:border-[color:var(--border-hover)]")}>
			<div className={cn("flex items-center", ui.gap.sm)}>
				<PbNumberBadge number={stage_n} ariaLabel={FunnelCopy.labels.stageLabel.replace("{n}", String(stage_n))} />
				<div className={cn("text-foreground", ui.typography.title.md)}>
					<Renderer.Copy.InlineText text={title} keyPrefix={`${reports_sql_key_prefix}-funnel-stage-${stage_n}`} />
				</div>
			</div>

			{metrics ? (
				<div className={cn(ui.margin.topSm, ui.surface.structure.border, ui.spacing.panelSm, ui.radius.base, "bg-muted/10")}>
				<div className={cn("font-medium text-foreground/85", ui.typography.caption)}>
					<Renderer.Copy.InlineText text={FunnelCopy.labels.commonMetrics} keyPrefix={`${reports_sql_key_prefix}-funnel-common-metrics`} />
				</div>
					<div className={cn(ui.margin.topSm, "flex min-w-0 flex-wrap", ui.gap.sm)}>{metrics}</div>
				</div>
			) : null}

			{extra ? <div className={ui.margin.topSm}>{extra}</div> : null}
			<div className={cn(ui.margin.topSm, "min-h-0 flex-1 leading-snug text-muted-foreground", ui.typography.caption)}>{body}</div>
		</PbPanel>
	)
}

function TypicalFunnel() {
	return (
		<div className={cn("flex flex-col", ui.gap.sm)}>
			<div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5", ui.gap.sm)}>
				{FunnelCopy.panels.map((s, idx) => (
					<FunnelStagePanel
						key={s.id}
						title={s.title}
						stage_n={(idx + 1) as 1 | 2 | 3 | 4 | 5}
						body={<StageBody body={s.body} />}
						metrics={<FunnelMetricPills metrics={s.common_metrics as readonly unknown[] | undefined} />}
						extra={s.note ? <FunnelNotePills alias={s.note.title} items={s.note.items as readonly unknown[]} /> : null}
					/>
				))}
			</div>

			<PbPanel className={cn("bg-background/40", ui.spacing.panelSm, ui.radius.base, ui.surface.structure.shadowNone)}>
				<div className={cn("text-foreground", ui.typography.title.md)}>
					<Renderer.Copy.InlineText text={FunnelCopy.notes.title} keyPrefix={`${reports_sql_key_prefix}-funnel-notes-title`} />
				</div>

				<PbStack asList className={ui.margin.topSm} gap="sm">
					{FunnelCopy.notes.bullets.map((b) => {
						const key = stableKeyFromText(b, `${reports_sql_key_prefix}-note`)
						return (
							<PbBullet key={key} className={cn("text-muted-foreground", ui.typography.caption)}>
								<Renderer.Copy.InlineText text={b} keyPrefix={key} />
							</PbBullet>
						)
					})}
				</PbStack>
			</PbPanel>
		</div>
	)
}

/* -------------------------------------------------------------------------- */
/* Default export                                                             */
/* -------------------------------------------------------------------------- */

export default function TabReportsSql() {
	const { ready, error: worker_error, exec, warmup } = useSqlWorker()

	const reveal_cards = true
	const tab = TabById["reports-sql"]

	const [state, dispatch] = React.useReducer(sql_ui_reducer, {
		query: PgDefaultSql,
		result: null,
		status: "idle",
		errorMsg: "",
		paneHeight: pane_default,
	})
	const [show_all_rows, set_show_all_rows] = React.useState(false)
	const [editor_width_pct, set_editor_width_pct] = React.useState(editor_width_default_pct)
	const result_cache_ref = React.useRef<Map<string, SqlQueryResult>>(new Map())
	const did_hydrate_layout_ref = React.useRef(false)
	const set_pane_height = React.useCallback<React.Dispatch<React.SetStateAction<number>>>((value) => dispatch({ type: "setPaneHeight", value }), [])

	const query = state.query
	const result = state.result
	const pane_height = state.paneHeight
	const is_running = state.status === "running"
	const error = state.errorMsg

	const playground_root_ref = React.useRef<HTMLDivElement | null>(null)
	const { ready: warmupReady, trigger: startWarmup } = useLazyGate()
	useWarmupOnVisible(playground_root_ref, startWarmup)

	const warmupInitiatedRef = React.useRef(false)
	const safeWarmup = React.useCallback(() => {
		if (warmupInitiatedRef.current) return
		warmupInitiatedRef.current = true
		void warmup()
	}, [warmup])

	React.useEffect(() => {
		if (!warmupReady) return
		safeWarmup()
	}, [warmupReady, safeWarmup])
	React.useEffect(() => {
		const timeout_id = window.setTimeout(safeWarmup, 0)
		return () => window.clearTimeout(timeout_id)
	}, [safeWarmup])
	React.useEffect(() => {
		if (did_hydrate_layout_ref.current) return
		did_hydrate_layout_ref.current = true

		const stored_height = read_number_preference(PlaybookStorage.reportsSql.paneHeight)
		if (stored_height != null) {
			set_pane_height(clamp_value(stored_height, pane_min, pane_max))
		}

		const stored_width = read_number_preference(PlaybookStorage.reportsSql.editorWidthPct)
		if (stored_width != null) {
			set_editor_width_pct(clamp_value(stored_width, editor_width_min_pct, editor_width_max_pct))
		}
	}, [set_pane_height])
	React.useEffect(() => {
		const timeout_id = window.setTimeout(() => {
			write_preference(PlaybookStorage.reportsSql.paneHeight, String(pane_height))
		}, 120)
		return () => window.clearTimeout(timeout_id)
	}, [pane_height])
	React.useEffect(() => {
		const timeout_id = window.setTimeout(() => {
			write_preference(PlaybookStorage.reportsSql.editorWidthPct, String(editor_width_pct))
		}, 120)
		return () => window.clearTimeout(timeout_id)
	}, [editor_width_pct])

	const drag_handle_ref = React.useRef<HTMLDivElement | null>(null)
	const width_drag_handle_ref = React.useRef<HTMLDivElement | null>(null)
	const split_layout_ref = React.useRef<HTMLDivElement | null>(null)
	const is_desktop_playground = useMediaQuery("(min-width: 1024px)")
	const drag = useDragHeight({
		height: pane_height,
		set_height: set_pane_height,
		min: pane_min,
		max: pane_max,
	})
	const width_drag = useDragWidth({
		width_pct: editor_width_pct,
		set_width_pct: set_editor_width_pct,
		container_ref: split_layout_ref,
		enabled: is_desktop_playground,
	})

	const run_query = React.useCallback(
		async (next?: string) => {
			const q = (next ?? query).trim()
			const cached = result_cache_ref.current.get(q)
			dispatch({ type: "runStart" })
			set_show_all_rows(false)
			if (cached) {
				dispatch({ type: "runSuccess", result: cached })
				return
			}
			try {
				const res = await exec(q)
				result_cache_ref.current.set(q, res)
				dispatch({ type: "runSuccess", result: res })
			} catch (e: unknown) {
				dispatch({ type: "runError", message: e instanceof Error ? e.message : PgCopy.labels.run_error_generic })
			}
		},
		[exec, query],
	)

	const set_and_run = React.useCallback(
		(sql: string) => {
			dispatch({ type: "setQuery", value: sql })
			void run_query(sql)
		},
		[run_query],
	)

	const effective = React.useMemo<SqlQueryResult>(() => (result?.columns?.length ? result : placeholder_result()), [result])
	const total_row_count = result?.values.length ?? 0
	const has_large_result = total_row_count > result_preview_row_limit
	const has_query_result = result !== null
	const shown_row_count = has_large_result && !show_all_rows ? result_preview_row_limit : total_row_count
	const total_row_count_label = React.useMemo(() => new Intl.NumberFormat("en-US").format(total_row_count), [total_row_count])
	const shown_row_count_label = React.useMemo(() => new Intl.NumberFormat("en-US").format(shown_row_count), [shown_row_count])
	const clamped_pane_height = drag.clamp_h(pane_height)
	const editor_pane_height = is_desktop_playground ? pane_height : clamp_value(pane_height, 240, 320)
	const viewer_pane_style: React.CSSProperties = is_desktop_playground
		? { height: `${clamped_pane_height}px`, maxHeight: `${clamped_pane_height}px` }
		: { minHeight: "18rem", maxHeight: "55svh" }
	const results_table_container_class = is_desktop_playground
		? "min-h-0 flex-1 max-w-full overflow-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
		: "min-h-0 flex-1 max-w-full overflow-x-auto overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
	const results_table_class = cn(ui.typography.caption, is_desktop_playground ? "min-w-max" : "w-max min-w-full")
	const viewer_status_copy = has_query_result
		? `Showing ${shown_row_count_label} of ${total_row_count_label} rows in the viewer. CSV download still includes all rows.`
		: PgCopy.labels.viewer_help
	const values_for_display = React.useMemo(
		() => (!show_all_rows && has_large_result ? effective.values.slice(0, result_preview_row_limit) : effective.values),
		[effective.values, has_large_result, show_all_rows],
	)
	const download_name = React.useMemo(() => `${filename_from_sql_comment(query)}.csv`, [query])
	const can_download = !!result?.columns.length && !!result?.values.length
	const metric_alias_to_id = React.useMemo(() => {
		const map = new Map<string, MetricId>()
		for (const [id, def] of Object.entries(MetricDefinitions)) {
			map.set(def.alias.trim().toLowerCase(), id as MetricId)
		}
		return map
	}, [])

	const describe_column = React.useCallback(
		(col: string) => {
			const token = String(col ?? "")
			const norm = token.trim().toLowerCase()
			const term = getTermByToken(token)
			const metric_id = isMetricId(token) ? token : metric_alias_to_id.get(norm)
			const metric = metric_id ? MetricDefinitions[metric_id] : undefined
			const tooltip = (term?.description ?? metric?.description ?? "").trim()
			const label = term?.alias ?? metric?.alias ?? token
			return { label, tooltip }
		},
		[metric_alias_to_id],
	)

	const render_column_header = React.useCallback(
		(col: string) => {
			const { label, tooltip } = describe_column(col)
			if (!tooltip) return label
			return (
				<Renderer.Help.Text label={label} description={tooltip} className={reports_sql_help_hover_class} />
			)
		},
		[describe_column],
	)

	type DisplayRow = {
		key: string
		cells: SqlQueryResult["values"][number]
		divider?: "strong" | "medium" | "dotted"
		repeatMuted?: Record<number, boolean>
	}

	const group_column_mask = React.useMemo(() => {
		const cols = effective.columns.length
		const mask: boolean[] = Array.from({ length: cols }, () => false)
		if (!cols || !values_for_display.length) return mask

		const isNumericLike = (val: unknown) => {
			if (val == null) return false
			const t = String(val).trim()
			if (!t) return false
			const cleaned = t.replace(/,/g, "")
			const numericPattern = /^[+-]?\d+(\.\d+)?%?$/
			const num = Number(cleaned.replace(/%$/, ""))
			return numericPattern.test(cleaned) && Number.isFinite(num)
		}

		for (let c = 0; c < cols; c++) {
			let numeric = 0
			let nonNumeric = 0
			for (const row of values_for_display) {
				const v = row?.[c]
				if (v == null || String(v).trim() === "") continue
				if (isNumericLike(v)) numeric += 1
				else nonNumeric += 1
			}
			if (nonNumeric >= numeric) mask[c] = true
		}
		return mask
	}, [effective.columns.length, values_for_display])

	const display_rows = React.useMemo<DisplayRow[]>(() => {
		if (!values_for_display.length) return []

		const hasGrouping = effective.columns.length >= 3
		let prev_l1 = "", prev_l2 = ""
		let prev_values: string[] = []
		const key_counts = new Map<string, number>()

		return values_for_display.map((cells) => {
			const values = cells.map((cell) => (cell == null ? "" : String(cell)))
			const base_key = stableKeyFromParts(values, `${reports_sql_key_prefix}-row`)
			const key_count = key_counts.get(base_key) ?? 0
			key_counts.set(base_key, key_count + 1)
			const row_key = key_count ? `${base_key}-${key_count}` : base_key

			let divider: DisplayRow["divider"]
			if (hasGrouping) {
				const s1 = values[0] ?? ""
				const s2 = values[1] ?? ""
				const isNewL1 = s1 !== prev_l1
				const isNewL2 = isNewL1 || s2 !== prev_l2
				prev_l1 = s1
				prev_l2 = s2

				divider = isNewL1 ? "strong" : isNewL2 ? "medium" : "dotted"
			}

			const repeatMuted: Record<number, boolean> = {}
			for (let idx = 0; idx < values.length; idx++) {
				if (!group_column_mask[idx]) continue
				if (prev_values[idx] !== undefined && prev_values[idx] === values[idx] && values[idx] !== "") {
					repeatMuted[idx] = true
				}
			}
			prev_values = values

			return { cells, repeatMuted, divider, key: row_key }
		})
	}, [effective.columns.length, group_column_mask, values_for_display])

	const on_download = React.useCallback(() => {
		if (!can_download || !result) return
		downloadCsv(download_name, result.columns, result.values)
	}, [can_download, download_name, result])

	const run_label = is_running ? PgCopy.labels.run_btn_running : ready ? PgCopy.labels.run_btn_ready : PgCopy.labels.run_btn_not_ready
	const tab_intro = <PbTabIntro alias={tab.alias} description={tab.description} keyPrefix={`${reports_sql_key_prefix}-intro`} />
	const error_messages = [error, worker_error].filter(Boolean) as string[]
	if (!ready && !worker_error)
		return (
			<div className={cn("flex flex-col", ui.gap.lg)} data-search-target="tab:reports-sql">
				{tab_intro}
				<LoaderCardSkeleton />
			</div>
		)

	return (
		<div className={cn("flex flex-col", ui.gap.lg)} data-search-target="tab:reports-sql">
			{tab_intro}

			<PbFocus className={cn("flex flex-col", ui.gap.lg)}>
				<PbReveal enabled={reveal_cards} className="w-full" data-search-target="funnel-card">
					<PbCard hover className={cn("relative overflow-hidden", ui.surface.structure.shadowNone)}>
						<PbCardGlow className={ui.glow.yellow} />
						<PbCardLayer>
							<PbCardHeader
								title={<PbTitleWithIcon icon={icon_for(FunnelCopy.icon)} text={<Renderer.Copy.InlineText text={FunnelCopy.title} keyPrefix={`${reports_sql_key_prefix}-funnel-title`} />} />}
								description={
									<PbSubtleText size="body">
										<Renderer.Copy.InlineText text={FunnelCopy.body} keyPrefix={`${reports_sql_key_prefix}-funnel-body`} />
									</PbSubtleText>
								}
								action={<Renderer.Metrics.Legend />}
							/>
							<PbCardContent className="relative">
								<TypicalFunnel />
							</PbCardContent>
						</PbCardLayer>
					</PbCard>
				</PbReveal>

				<PbReveal enabled={reveal_cards} className="w-full" data-search-target="definitions-card">
					<PbCard hover className={cn("relative overflow-hidden", ui.surface.structure.shadowNone)}>
						<PbCardHeader
							title={<PbTitleWithIcon icon={icon_for(DefinitionsCopy.icon)} text={<Renderer.Copy.InlineText text={DefinitionsCopy.title} keyPrefix={`${reports_sql_key_prefix}-defs-title`} />} />}
							description={
								<PbSubtleText size="body">
									<Renderer.Copy.InlineText text={DefinitionsCopy.body} keyPrefix={`${reports_sql_key_prefix}-defs-desc`} />
								</PbSubtleText>
							}
							action={<Renderer.Metrics.Legend />}
						/>
						<PbCardContent className="relative">
							<div className={cn("grid grid-cols-1", ui.gap.sm)}>
								<PbPanel className={panel_md_hover_class}>
									<div className={cn("text-foreground", ui.typography.title.md)}>
										<Renderer.Copy.InlineText text={DefinitionsCopy.panels[0]?.title ?? ""} keyPrefix={`${reports_sql_key_prefix}-defs-panel-1-title`} />
									</div>
									<p className={cn(ui.margin.topXs, "leading-snug text-muted-foreground", ui.typography.caption)}>
										<Renderer.Copy.InlineText text={DefinitionsCopy.panels[0]?.body ?? ""} keyPrefix={`${reports_sql_key_prefix}-defs-dim-desc`} />
									</p>
									<div className={cn(ui.margin.topMd, "flex flex-wrap", ui.gap.sm)}>
										{as_metric_ids(DefinitionsCopy.dimensions as readonly unknown[]).map((id) => (
											<Renderer.Metrics.AttributePill key={id} id={id} />
										))}
									</div>
								</PbPanel>

								<PbPanel className={panel_md_hover_class}>
									<div className={cn("text-foreground", ui.typography.title.md)}>
										<Renderer.Copy.InlineText text={DefinitionsCopy.panels[1]?.title ?? ""} keyPrefix={`${reports_sql_key_prefix}-defs-panel-2-title`} />
									</div>
									<p className={cn(ui.margin.topXs, "leading-snug text-muted-foreground", ui.typography.caption)}>
										<Renderer.Copy.InlineText text={DefinitionsCopy.panels[1]?.body ?? ""} keyPrefix={`${reports_sql_key_prefix}-defs-measures-desc`} />
									</p>
									<div className={cn(ui.margin.topMd, "flex flex-wrap", ui.gap.sm)}>
										{as_metric_ids(DefinitionsCopy.measures as readonly unknown[]).map((id) => (
											<Renderer.Metrics.MeasurePill key={id} id={id} />
										))}
									</div>
								</PbPanel>

								<PbPanel className={panel_md_hover_class}>
									<div className={cn("text-foreground", ui.typography.title.md)}>
										<Renderer.Copy.InlineText text={DefinitionsCopy.panels[2]?.title ?? ""} keyPrefix={`${reports_sql_key_prefix}-defs-panel-3-title`} />
									</div>
									<p className={cn(ui.margin.topXs, "text-muted-foreground", ui.typography.caption)}>
										<Renderer.Copy.InlineText text={DefinitionsCopy.panels[2]?.body ?? ""} keyPrefix={`${reports_sql_key_prefix}-defs-tables-desc`} />
									</p>
									<div className={ui.margin.topSm}>
										<AvailableTables />
									</div>
								</PbPanel>
							</div>
						</PbCardContent>
					</PbCard>
				</PbReveal>

				<div ref={playground_root_ref} data-slot="sql-playground">
					<PbReveal enabled={reveal_cards} className="w-full" data-search-target="pg-card">
						<PbCard hover className={cn("relative overflow-hidden", ui.surface.structure.shadowNone)}>
							<PbCardHeader
								className="flex flex-col md:flex-row md:items-start md:justify-between"
								title={<PbTitleWithIcon icon={icon_for(PgCopy.icon)} text={<Renderer.Copy.InlineText text={PgCopy.title} keyPrefix={`${reports_sql_key_prefix}-pg-title`} />} />}
								description={
									<PbSubtleText size="body">
										<Renderer.Copy.InlineText text={PgCopy.body} keyPrefix={`${reports_sql_key_prefix}-playground-desc`} />
									</PbSubtleText>
								}
								action={
									<div className={cn("flex shrink-0 flex-wrap items-center md:justify-end", ui.gap.sm)}>
										<Button
											className={cn(buttonVariants({ variant: "success", size: "sm" }))}
											type="button"
											onMouseEnter={safeWarmup}
											onFocus={safeWarmup}
											onClick={() => void run_query()}
											disabled={is_running}
										>
											<Play className={ui.iconNude.lg} />
											<Renderer.Copy.InlineText text={run_label} keyPrefix={`${reports_sql_key_prefix}-pg-run-label`} />
										</Button>

										<Button
											className={cn(buttonVariants({ variant: "success", size: "sm" }), ui.surface.state.hover.shadowMd)}
											type="button"
											onClick={on_download}
											disabled={!can_download}
										>
											<Download className={ui.iconNude.lg} />
											<Renderer.Copy.InlineText text={PgCopy.labels.download_btn} keyPrefix={`${reports_sql_key_prefix}-pg-download-label`} />
										</Button>
									</div>
								}
							/>

							<PbCardContent className="relative">
								<div className={cn("flex flex-col", ui.gap.sm)}>
									<div className={cn("flex flex-wrap justify-start", ui.gap.sm)}>
										{PgPresets.map((p) => (
											<Button
												key={p.id}
												className={cn(
													buttonVariants({ variant: "outline", size: "sm" }),
													"inline-flex select-none items-center whitespace-nowrap border border-transparent bg-transparent font-mono text-foreground hover:bg-transparent hover:text-foreground hover:border-[color:var(--border-hover)]",
													ui.radius.control,
													ui.surface.state.focus.ring,
													ui.motion.duration,
													ui.typography.caption,
													ui.surface.structure.shadowNone
												)}
												type="button"
												onMouseEnter={safeWarmup}
												onFocus={safeWarmup}
												onClick={() => set_and_run(p.code)}
												disabled={is_running}
											>
												<Renderer.Help.Text
													label={p.id}
													description={<Renderer.Copy.InlineText text={p.description} keyPrefix={`${reports_sql_key_prefix}-preset-${p.id}`} />}
													side="top"
													align="start"
												/>
											</Button>
										))}
									</div>

									<div
										ref={split_layout_ref}
										className={cn("grid min-w-0 grid-cols-1", ui.gap.sm, "lg:gap-0")}
										style={is_desktop_playground ? { gridTemplateColumns: `minmax(300px, ${width_drag.clamp_pct(editor_width_pct)}%) 24px minmax(420px, 1fr)` } : undefined}
									>
										<PbPanel className={panel_sm_hover_class}>
											<div className="min-w-0">
												<div className={cn("font-medium text-foreground", ui.typography.body)}>
													<Renderer.Copy.InlineText text={PgCopy.labels.editor_title} keyPrefix={`${reports_sql_key_prefix}-pg-editor-title`} />
												</div>
												<p className={cn(ui.margin.topXs, "leading-snug text-muted-foreground", ui.typography.caption)}>
													<Renderer.Copy.InlineText text={PgCopy.labels.editor_help} keyPrefix={`${reports_sql_key_prefix}-pg-editor-help`} />
												</p>
											</div>

											<div
												className={cn(ui.margin.topMd, "min-w-0 overflow-hidden bg-background", ui.surface.structure.border, ui.surface.structure.shadowNone, ui.radius.base)}
												style={{ height: `${editor_pane_height}px` }}
											>
												<CodeTextarea
													value={query}
													onMouseEnter={safeWarmup}
													onFocus={safeWarmup}
													onChange={(next) => dispatch({ type: "setQuery", value: next })}
													ariaLabel={PgCopy.labels.editor_title}
												/>
											</div>
										</PbPanel>

										{is_desktop_playground ? (
											<div
												ref={width_drag_handle_ref}
												className={cn(
													"group hidden lg:flex h-full min-h-0 select-none items-center justify-center",
													"relative w-full shrink-0",
													resize_tone_class,
													ui.motion.duration,
													ui.surface.state.focus.ring
												)}
												role="separator"
												aria-orientation="vertical"
												tabIndex={0}
												style={{ cursor: "col-resize" }}
										aria-label={PgCopy.ui.resize.widthsLabel}
												aria-valuemin={editor_width_min_pct}
												aria-valuemax={editor_width_max_pct}
												aria-valuenow={Math.round(editor_width_pct)}
												onPointerDown={(e) => width_drag.on_pointer_down(width_drag_handle_ref.current, e)}
												onPointerUp={(e) => (width_drag_handle_ref.current?.releasePointerCapture?.(e.pointerId), width_drag.stop())}
												onKeyDown={width_drag.keydown}
											>
												<span className="pointer-events-none absolute inset-y-0 left-0 right-0 z-0 mx-auto w-px bg-[color:var(--border)] transition-colors group-hover:bg-[color:var(--border-hover)] group-focus-visible:bg-[color:var(--border-hover)]" />
												<span className="pointer-events-none relative z-10 inline-flex h-12 w-3 items-center justify-center rounded-full border border-border/70 bg-background text-current transition-colors group-hover:border-[color:var(--border-hover)] group-focus-visible:border-[color:var(--border-hover)]">
													<GripVertical className="h-4 w-4 text-current" />
												</span>
											</div>
										) : null}

										<PbPanel className={cn(panel_sm_hover_class, "flex flex-col")}>
											<div className={cn("font-medium text-foreground", ui.typography.body)}>
												<Renderer.Copy.InlineText text={PgCopy.labels.viewer_title} keyPrefix={`${reports_sql_key_prefix}-pg-viewer-title`} />
											</div>
											<p className={cn(ui.margin.topXs, "leading-snug text-muted-foreground", ui.typography.caption)}>
												{viewer_status_copy}
											</p>

											<div className="mt-3 flex min-h-0 min-w-0 flex-1 flex-col" style={viewer_pane_style}>
												<div className={cn("min-h-0 flex-1 overflow-hidden bg-background flex flex-col", ui.radius.base, ui.surface.structure.shadowNone, ui.surface.structure.border)}>
													<div className="relative flex min-h-0 flex-1 flex-col">
														<Table
															stickyHeader={is_desktop_playground}
															headerTone="green"
															groupedDividers
															containerClassName={results_table_container_class}
															className={results_table_class}
														>
															<TableHeader>
																<TableRow>
																	{effective.columns.map((col, idx) => (
																		<TableHead key={`${col}-${idx}`} className={cn(ui.typography.caption, "leading-[1.35]")}>
																			{render_column_header(col)}
																		</TableHead>
																	))}
																</TableRow>
															</TableHeader>

															<TableBody className={cn(ui.typography.caption, "leading-[1.35]")}>
																{display_rows.map((row) => (
																	<TableRow key={row.key} divider={row.divider}>
																		{row.cells.map((cell, j) => {
																			const text = cell === null ? "" : String(cell)
																			const muted = row.repeatMuted?.[j]
																			return (
																				<TableCell key={j} muted={muted}>
																					{text}
																				</TableCell>
																			)
																		})}
																	</TableRow>
																))}
															</TableBody>
														</Table>

														{has_large_result ? (
															<div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-3 pb-4">
																<Button
																	type="button"
																	size="sm"
																	variant="outline"
																	onClick={() => set_show_all_rows((v) => !v)}
																	aria-label={
																		show_all_rows
																			? PgCopy.ui.resultsToggle.showPreviewOnly
																			: format_results_toggle_label(total_row_count_label)
																	}
																	className={cn(
																		"pointer-events-auto group relative h-9 w-9 origin-center overflow-hidden px-0",
																		"hover:w-52 hover:px-3 focus-visible:w-52 focus-visible:px-3 active:w-52 active:px-3",
																		ui.typography.caption,
																		"transition-[width,padding,background-color,color,border-color,box-shadow]",
																		ui.surface.structure.border,
																		"backdrop-blur supports-[backdrop-filter]:bg-background/70",
																		"bg-background/90 text-foreground hover:bg-muted hover:text-muted-foreground active:bg-muted active:text-muted-foreground",
																		ui.surface.state.hover.bg,
																		ui.surface.state.hover.border,
																		ui.surface.state.hover.shadowMd
																	)}
																	style={{ transitionDuration: `${show_all_cta_transition_duration_ms}ms`, transitionTimingFunction: show_all_cta_transition_ease }}
																>
																	<span
																		className="absolute inset-0 flex items-center justify-center text-sm leading-none transition-opacity group-hover:opacity-0 group-focus-visible:opacity-0 group-active:opacity-0"
																		style={{ transitionDuration: `${show_all_cta_transition_duration_ms}ms`, transitionTimingFunction: show_all_cta_transition_ease }}
																	>
																		{show_all_rows ? "-" : "+"}
																	</span>
																	<span
																		className="origin-center whitespace-nowrap text-center opacity-0 transition-[opacity,transform] [transform:scaleX(0.92)] group-hover:opacity-100 group-hover:[transform:scaleX(1)] group-focus-visible:opacity-100 group-focus-visible:[transform:scaleX(1)] group-active:opacity-100 group-active:[transform:scaleX(1)]"
																		style={{ transitionDuration: `${show_all_cta_transition_duration_ms}ms`, transitionTimingFunction: show_all_cta_transition_ease }}
																	>
																		{show_all_rows
																			? PgCopy.ui.resultsToggle.showPreviewOnly
																			: format_results_toggle_label(total_row_count_label)}
																	</span>
																</Button>
															</div>
														) : null}
													</div>
												</div>
											</div>
										</PbPanel>
									</div>

									{is_desktop_playground ? (
										<div
											ref={drag_handle_ref}
											className={cn(
												"group flex h-3 select-none items-center justify-center",
												"relative",
												resize_tone_class,
												ui.motion.duration,
												ui.surface.state.focus.ring
											)}
											role="separator"
											aria-orientation="horizontal"
											tabIndex={0}
											style={{ cursor: "row-resize" }}
											aria-label={PgCopy.ui.resize.label}
											aria-valuemin={pane_min}
											aria-valuemax={pane_max}
											aria-valuenow={pane_height}
											onPointerDown={(e) => drag.on_pointer_down(drag_handle_ref.current, e)}
											onPointerUp={(e) => (drag_handle_ref.current?.releasePointerCapture?.(e.pointerId), drag.stop())}
											onKeyDown={drag.keydown}
										>
											<span className="pointer-events-none absolute inset-x-0 top-1/2 z-0 h-px -translate-y-1/2 bg-[color:var(--border)] transition-colors group-hover:bg-[color:var(--border-hover)] group-focus-visible:bg-[color:var(--border-hover)]" />
											<span className="pointer-events-none relative z-10 inline-flex h-3 w-14 items-center justify-center rounded-full border border-border/70 bg-background px-1 text-current transition-colors group-hover:border-[color:var(--border-hover)] group-focus-visible:border-[color:var(--border-hover)]">
												<GripHorizontal className="h-4 w-4 text-current" />
											</span>
										</div>
									) : null}

									{error_messages.map((message, idx) => (
										<div key={`${reports_sql_key_prefix}-error-${idx}`} className={error_panel_class}>
											{message}
										</div>
									))}
								</div>
							</PbCardContent>
						</PbCard>
					</PbReveal>
				</div>
			</PbFocus>
		</div>
	)
}
