/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function stableKeyFromText(text: string, prefix: string) {
	const normalized = text.trim().toLowerCase()
	let hash = 0
	for (let i = 0; i < normalized.length; i++) {
		hash = (hash * 31 + normalized.charCodeAt(i)) | 0
	}
	return `${prefix}-${(hash >>> 0).toString(36)}`
}

export function stableKeyFromParts(parts: readonly string[], prefix: string) {
	return stableKeyFromText(parts.join("|"), prefix)
}

export function clamp_value(value: number, min: number, max: number) {
	return Math.max(min, Math.min(max, value))
}

export function lerp_value(start: number, end: number, t: number) {
	return start + (end - start) * t
}
