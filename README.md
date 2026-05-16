GROWTH MARKETING PLAYBOOK - ENGINEERING CONTRACT
===============================================

Deployment guide: `DEPLOYMENT.md`


Purpose
-------
Definition-driven Next.js (App Router) growth marketing playbook with a client-side SQL playground.
This document defines structure, boundaries, and conventions. It is the contract for the codebase.

Core principles
---------------
- Single source of truth
  - Definitions: features/playbook/definitions
  - Copy: features/playbook/copy
  - UI never invents ids, labels, or semantics

- Composition over ownership
  - Tabs compose primitives, registries, and copy
  - Registries + definitions are authoritative

- Design tokens first
  - Tokens define spacing, motion, surfaces, tone
  - Utility classes are glue only

- Keep the main thread light
  - SQL runs in Web Workers
  - Expensive work is lazy or deferred

Repository structure
--------------------
features/playbook/
+-- components/ui/     Playbook primitives only
+-- copy/              Copy-only modules (no UI, no logic)
+-- definitions/       Canonical ids, labels, descriptions, formulas
+-- sql/               Workers, execution, presets
+-- tabs/              Page-level composition

Token files
-----------
- app/globals.css                    — surface, brand, border, layout CSS custom properties
- components/tokens/primitives.css   — motion, shadow, and accent primitives (imported by globals.css)
- components/tokens/design.ts        — TypeScript ui object; AccentTone and AccentPalette exported
- components/tokens/motion.ts        — springs, transitions, useMotionPill, useRafThrottle

Utility files
-------------
- lib/cn.ts     — cn() utility (clsx + tailwind-merge)
- lib/keys.ts   — stableKeyFromText, stableKeyFromParts (stable hash keys for React lists)
- lib/dom.ts    — clamp_value, lerp_value, runWithViewportAnchor, scrollIntoHorizontalView

Invariants
----------
- Every surfaced metric/feature must have a definition.
- Definition ids are stable once shipped.
- UI never duplicates or rewrites definition labels/descriptions.
- Copy lives only in copy/ modules.

Canonical file anatomy
----------------------
Allowed section names (in order as needed):
- Imports
- Types
- Constants: <topic>
- Hooks
- Utils
- Helpers
- Components
- Default export
- Page
- Export
- Custom: <topic>
- Definition: <topic>

Rules:
- Types appear before constants they reference.
- One default export per file.
- Multiple Custom sections allowed; keep names specific.

Naming conventions
------------------
Components:
- PascalCase

Hooks:
- Shared: useFoo
- File-local: useFoo (camelCase, same as shared hooks; be consistent within the file)

Local helpers:
- lower_snake_case

Event handlers:
- Choose one style per file: on_* OR handle_*

Booleans / guards:
- is_*, has_*, can_*, did_*

Refs:
- *_ref

Constants:
- Avoid alias constants that only re-export other constants.
- Module-private: lower_snake_case
- Exported registries/configs: PascalCase
- Class constants end with _class / _classes / _styles
- Must not collide with component names.
- Avoid SCREAMING_SNAKE_CASE (env vars only).

Copy, definitions, tabs
--------------------------
Copy modules (features/playbook/copy):
- Copy only
- No UI imports
- No business logic

Definitions (features/playbook/definitions):
- Canonical ids, labels, descriptions, formulas
- Used by UI, tooltips, pills, and SQL
- ids align with surfaced column names where applicable

Tabs (features/playbook/tabs):
- Render copy via Renderer.Copy.* (InlineText / InlineMarkdown).
- Always pass a stable keyPrefix derived from the tab id (not index/order).
- Never duplicate definition text or labels.

UI composition rules
--------------------
- Prefer playbook primitives (PbCard, PbPanel, PbStack, etc.).
- Prefer design tokens:
  - ui.spacing.*
  - ui.surface.*
  - ui.radius.*
  - ui.motion.*
- cn() is glue only.
- Lift repeated class logic into *_class constants.
- Do not create file-local mini-registries (tone maps, typography maps) when tokens exist.

Motion & interaction
--------------------
- Respect reduced motion.
- Motion must add meaning (no decorative-only motion).
- All interactive elements must be keyboard accessible.

Tables & tooltips
-----------------
Tables:
- Support long copy:
  - whitespace-normal
  - break-words

Tooltips:
- Tooltip triggers wrap inline elements only (text or icon).
- Never wrap complex or absolute layouts in tooltips.

SQL conventions
---------------
- Preset SQL lives in copy/ or sql/.
- Formatting:
  - lower_case identifiers
  - leading commas
  - UPPER CASE keywords/functions
- Column names align with definition ids.
- Optional filename hint via first-line SQL comment:
  - -- file: <name>.sql

Worker rules
------------
- All SQL execution lives in features/playbook/sql.
- UI must:
  - lazily warm workers
  - show placeholders before execution
  - never block the main thread

Accessibility baseline
----------------------
- Non-button interactions must be keyboard reachable (role, tabIndex, key handling).
- Navigation landmarks use role="region" + aria-label; control groups use role="group" + aria-label.
- Disabled states must be explicit and meaningful.

PR checklist
------------
- No duplicated copy or labels in UI files.
- Definitions used wherever applicable; no new ids without definitions.
- Tokens + primitives preferred over raw classes.
- No unsafe casts; no naming collisions.
- Reduced motion respected; keyboard access verified.
- Heavy work stays off the main thread (SQL in workers).
- SQL follows formatting rules; output columns match definition ids.
