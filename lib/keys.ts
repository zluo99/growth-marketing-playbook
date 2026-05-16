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
