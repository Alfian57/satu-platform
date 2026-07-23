---
id: P24
title: 'Project discovery UI'
stage: 04-projects-matching-teams
depends_on: [P23]
gate: conditional
next: P25
---

# P24: Project discovery UI

## Outcome

Membuat student menemukan project dengan filter yang jelas.

## Prerequisites

P23 selesai.

## Read Before Work

- [PRODUCT.md](../../../../PRODUCT.md)
- [PRD.md](../../../product/PRD.md)
- [DECISIONS.md](../../../governance/DECISIONS.md)
- [DESIGN.md](../../../../DESIGN.md)
- [Information architecture](../../../ux/INFORMATION_ARCHITECTURE.md)
- [User flows](../../../ux/USER_FLOWS.md)
- [Architecture](../../../engineering/ARCHITECTURE.md)
- [Data model](../../../engineering/DATA_MODEL.md)
- [Security and privacy](../../../engineering/SECURITY_PRIVACY.md)
- [Test strategy](../../TEST_STRATEGY.md)
- [Project discovery surface brief](../../../../.impeccable/surfaces/route-projects.md)
- Phase-specific context: project surface brief.

## Deliverables

Implementasikan filter URL, result list, capacity/status, required skills,
pagination, empty/loading/error states, dan responsive behavior.

## Out of Scope

Menampilkan match score sebelum explanation tersedia atau memakai popularitas
sebagai quality proxy.

## Verification

Shareable URL, keyboard filters, long content, mobile/small laptop, no
console error, lint, typecheck, build, dan browser flow.

## Exit Criteria

Discovery acceptance tanpa recommendation telah lulus.

## Gate and Next Phase

- **Gate:** Human bila pattern filter/list belum diwariskan dari reference system.
- **Next:** [P25: Project detail and editor UI](P25-project-detail-and-editor-ui.md)
