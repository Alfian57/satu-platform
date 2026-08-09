---
timestamp: 2026-07-23T15-28-48Z
slug: resources-js-pages-dashboard-tsx
---

# Dashboard Mahasiswa: P07 Critique

**Target:** `resources/js/pages/dashboard.tsx`
**Mode:** Operate
**Reference:** Comp A: Docket-first
**Assessments:** Independent design review and detector/browser evidence

## Design Health Score

| #         | Heuristic                           |           Score | Main limitation                                                                         |
| --------- | ----------------------------------- | --------------: | --------------------------------------------------------------------------------------- |
| 1         | Visibility of system status         |               3 | State communication is strong; final actions remain demo-only in this phase.            |
| 2         | Match between system and real world |               4 | Domain language and task order are natural for a student workspace.                     |
| 3         | User control and freedom            |               3 | Primary and secondary paths are clear; accelerators are not yet available.              |
| 4         | Consistency and standards           |               4 | Ledger grammar, tokens, and interactions are cohesive.                                  |
| 5         | Error prevention                    |               3 | Deadline, reviewer, and correction note precede the action.                             |
| 6         | Recognition rather than recall      |               4 | Decision evidence is co-located and explicitly labelled.                                |
| 7         | Flexibility and efficiency          |               2 | Keyboard compatible, but without a power-user path.                                     |
| 8         | Aesthetic and minimalist design     |               3 | Strong hierarchy; narrow long-content states are laborious.                             |
| 9         | Error recognition and recovery      |               4 | Recovery is region-specific and preserves usable content.                               |
| 10        | Help and documentation              |               2 | First-run guidance exists; revision guidance remains contextual rather than procedural. |
| **Total** |                                     | **32/40: Good** | Local mobile and semantic polish remains.                                               |

## Design Specificity Verdict

The dashboard is authored for SATU rather than category-interchangeable. Its
docket, ruled ledger, provenance chain, restrained semantic color, typography,
and flat institutional shell express “Buku Besar Kolaborasi” without copying
the approved composition pixel-for-pixel. No conceptual redesign is required.

The deterministic detector returned zero findings. Browser evidence passed all
eight dashboard states, serious accessibility scanning, keyboard activation,
dark mode, recovery copy, mobile reading order, and overflow checks at
320×800, 768×1024, 1366×768, and 1672×941.

## Overall Impression

The desktop first viewport succeeds: corrective evidence, primary action, two
active projects, and recommendation rationale are visible together. The
emotional sequence remains non-stigmatizing and actionable. Dark mode preserves
the same hierarchy. The main weakness is not the visual concept, but the amount
of vertical scanning and the narrow value column at 320px.

## What Is Working

- Status, source, reviewer, deadline, and action form a readable evidence chain.
- Synthetic content is labelled and never presented as production data.
- Semantic headings, sections, definition lists, buttons, and time elements are
  used consistently.
- All dashboard colors come from semantic light/dark tokens and the tested text
  pairs exceed WCAG AA contrast.
- Loading, empty, error, stale, permission-limited, and long-content states have
  explicit behavior and recovery.

## Priority Issues

### P2: Unknown project totals are announced as zero

Loading and error regions currently render `0 project`, which turns unavailable
data into a factual claim. Show a count only when the total is known and retain
the existing live loading/error announcement.

### P2: Mobile shell controls miss the project 44px target

The sidebar trigger and account menu are 40px tall on mobile. Increase the
mobile hit areas to 44px while keeping their inner icon and avatar sizes.

### P2: Narrow ledger rows behave like a squeezed desktop table

The outer index gutter and fixed label column leave long values too narrow at
320px. Stack labels above values at the narrowest breakpoint while preserving
numbering, row order, and ledger rules.

### P2: Recommendation evidence resembles selectable checkboxes

The square bordered check marks communicate selection even though the reasons
are static evidence. Use a non-control verification mark.

### P2: Decision metadata falls below the established label token

Recorded-at metadata, desktop ledger headers, and some shell labels use 11px.
Promote decision-relevant metadata to the 12px label token.

### P3: Error notice has competing live-region priorities

`aria-live="polite"` remains present when an error notice uses `role="alert"`.
Make priority conditional so assistive technology receives one clear signal.

### P3: Mobile supporting context becomes a late scroll chapter

Preserve docket → ledger → context rail order. Compact local spacing and add a
clear section transition rather than duplicating or reordering information.

## Persona Red Flags

- **Alex, keyboard/power user:** Native buttons make the path fast, but no
  accelerator exists and mobile requires extra scrolling before action.
- **Sam, low-vision/keyboard user:** Structure and focus treatment are strong;
  sub-token metadata and the dense 320px ledger reduce readability.
- **Dira, returning student:** The heading immediately explains what needs
  attention and the recovery framing is non-punitive. Reviewer and provenance
  must remain visible through polish.

## Minor Observations

- The global reduced-motion fallback is aggressive but currently does not hide
  task state; dashboard transitions already opt out explicitly.
- Borders are intentionally quiet and are not the sole carrier of state or
  interaction.

## Questions to Consider

- As real data replaces fixtures, which provenance fields remain mandatory when
  space is constrained?
- Should keyboard accelerators be introduced globally after navigation and real
  routes exist, rather than as a dashboard-only exception?
