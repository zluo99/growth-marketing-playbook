/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */

import { CopySearchDocuments, FrameworkSearchDocuments } from "@/features/playbook/search/documents/copy"
import { DefinitionSearchDocuments, TabSearchDocuments } from "@/features/playbook/search/documents/definitions"
import { create_copy_search_entry, create_search_entry, group_entries_by_category, type Catalog, type SearchEntry, type SearchEntryInput } from "@/features/playbook/search/schema"

/* -------------------------------------------------------------------------- */
/* Caches                                                                     */
/* -------------------------------------------------------------------------- */

let cached_catalog: Catalog | null = null
let cached_tabs: SearchEntry[] | null = null
let cached_frameworks: SearchEntry[] | null = null
let cached_definitions: SearchEntry[] | null = null
let cached_copy: SearchEntry[] | null = null

/* -------------------------------------------------------------------------- */
/* Builders                                                                   */
/* -------------------------------------------------------------------------- */

const build_entries = (documents: readonly SearchEntryInput[]) => documents.map(create_search_entry)
const build_copy_entries = () => CopySearchDocuments.map(create_copy_search_entry)

/* -------------------------------------------------------------------------- */
/* Export                                                                     */
/* -------------------------------------------------------------------------- */

export const buildCatalog = (): Catalog => {
	if (cached_catalog) return cached_catalog

	const tab_entries = cached_tabs ?? (cached_tabs = build_entries(TabSearchDocuments))
	const framework_entries = cached_frameworks ?? (cached_frameworks = build_entries(FrameworkSearchDocuments))
	const definition_entries = cached_definitions ?? (cached_definitions = build_entries(DefinitionSearchDocuments))
	const copy_entries = cached_copy ?? (cached_copy = build_copy_entries())

	const entries = [...tab_entries, ...framework_entries, ...definition_entries, ...copy_entries]
	const by_category = group_entries_by_category(entries)

	cached_catalog = {
		entries,
		byCategory: by_category,
		tabs: by_category.tab,
		frameworks: by_category.framework,
		terms: by_category.term,
		metrics: by_category.metric,
		definitions: definition_entries,
		copy: by_category.copy,
	}

	return cached_catalog
}
