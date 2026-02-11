import { NextResponse } from "next/server"

const probe_status_map: Record<string, string> = {
	health: "ok",
	ready: "ready",
}

export function GET(_request: Request, { params }: { params: { probe: string } }) {
	const status = probe_status_map[params.probe]
	if (!status) return NextResponse.json({ error: "Not found" }, { status: 404 })
	return NextResponse.json({ status }, { status: 200 })
}
