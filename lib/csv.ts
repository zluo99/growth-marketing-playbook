/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export function escapeCsvValue(value: unknown) {
	const str = value === null || value === undefined ? "" : String(value)
	return /[",\n]/.test(str) ? `"${str.replace(/"/g, `""`)}"` : str
}

export function toCsv(headers: readonly string[], rows: readonly (readonly unknown[])[]) {
	return [headers.map(escapeCsvValue).join(","), ...rows.map((row) => row.map(escapeCsvValue).join(","))].join("\n")
}

export function toCsvFromRecords<T extends Record<string, unknown>>(headers: readonly (keyof T)[], rows: readonly T[]) {
	const headerStrings = headers.map(String)
	const matrix = rows.map((row) => headers.map((key) => row[key]))
	return toCsv(headerStrings, matrix)
}

export function downloadText(filename: string, text: string, type = "text/plain;charset=utf-8") {
	const blob = new Blob([text], { type })
	const url = URL.createObjectURL(blob)
	const anchor = document.createElement("a")
	anchor.href = url
	anchor.download = filename
	anchor.rel = "noreferrer"
	document.body.appendChild(anchor)
	anchor.click()
	anchor.remove()
	URL.revokeObjectURL(url)
}

export function downloadCsv(filename: string, headers: readonly string[], rows: readonly (readonly unknown[])[]) {
	downloadText(filename, toCsv(headers, rows), "text/csv;charset=utf-8")
}

export function downloadCsvFromRecords<T extends Record<string, unknown>>(
	filename: string,
	headers: readonly (keyof T)[],
	rows: readonly T[]
) {
	downloadText(filename, toCsvFromRecords(headers, rows), "text/csv;charset=utf-8")
}
