---
id: P63
title: 'Accessibility audit'
stage: 08-production-readiness
depends_on: [P62]
gate: automatic
next: P64
---

# P63: Accessibility audit

## Outcome

Memenuhi WCAG 2.2 AA pada seluruh critical flow.

## Prerequisites

P62 selesai.

## Read Before Work

- [PRODUCT.md](../../../../PRODUCT.md)
- [PRD.md](../../../product/PRD.md)
- [DECISIONS.md](../../../governance/DECISIONS.md)
- [DESIGN.md](../../../../DESIGN.md)
- [Architecture](../../../engineering/ARCHITECTURE.md)
- [Security and privacy](../../../engineering/SECURITY_PRIVACY.md)
- [Test strategy](../../TEST_STRATEGY.md)
- [Roadmap and release gates](../../ROADMAP.md)
- Runtime context: configuration, deployment, queue, broadcast, storage, mail, build, test, and environment files relevant to the phase.
- Phase-specific context: content/accessibility guidelines, dan Impeccable audit guidance.

## Deliverables

Audit auth, onboarding, profile, projects, workspace, contribution, portfolio,
campus, dan inclusion untuk semantics, focus, keyboard, contrast, status, errors, dialog,
upload, realtime announcements, dan reduced motion; perbaiki semua material findings.

## Out of Scope

Menutup finding hanya dengan suppression atau color-only workaround.

## Verification

Automated accessibility checks, manual keyboard flow, screen-reader spot
checks, browser tests, lint, typecheck, build.

## Exit Criteria

Tidak ada known critical/high accessibility issue.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P64: Responsive and browser matrix](P64-responsive-and-browser-matrix.md)
