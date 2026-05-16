# Claude Code — growth-marketing-playbook

## Role of this app
This app owns the upstream design token system. app/globals.css and
components/tokens/ are the canonical source of truth. Do not change
variable names, color-mix formulas, or motion values without explicit
instruction.

## Token files — do not refactor internals
- app/globals.css                    — surface, brand, border, layout CSS custom properties
- components/tokens/primitives.css   — motion, shadow, and accent primitives (imported by globals.css)
- components/tokens/design.ts        — TypeScript ui object (AccentTone exported)
- components/tokens/motion.ts        — springs, transitions, useMotionPill

## Utility files
- lib/cn.ts    — cn() only
- lib/keys.ts  — stableKeyFromText, stableKeyFromParts
- lib/dom.ts   — clamp_value, lerp_value, runWithViewportAnchor,
                 scrollIntoHorizontalView

## File anatomy — enforce this order
Imports → Types → Constants → Hooks → Utils → Helpers → Components →
Default export

## Naming
- Components: PascalCase
- Hooks: useFoo
- Local helpers: lower_snake_case
- Booleans: is_*, has_*, can_*, did_*
- Refs: *_ref
- Class constants: end with _class / _classes / _styles

## PR checklist
- No duplicated copy or labels in UI files
- No new ids without a definition in features/playbook/definitions/
- Tokens and primitives preferred over raw Tailwind classes
- No unsafe casts; no naming collisions
- Reduced motion respected on all Framer Motion animations
- SQL stays in Web Workers — main thread never blocks
- SQL output columns must match definition ids
- tsc --noEmit passes with zero errors
