---
id: P27
title: 'Recommendation queries and feedback backend'
stage: 04-projects-matching-teams
depends_on: [P26]
gate: automatic
next: P28
---

# P27: Recommendation queries and feedback backend

## Outcome

Menyediakan recommendation, explanation, hide, dan not-relevant actions.

## Prerequisites

P26 selesai.

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

## Deliverables

Buat generation/query boundary, top reasons, hide/not-relevant/profile-fix
actions, policies, audit/feedback records, queue strategy bila perlu, dan feature tests.

## Out of Scope

Mengekspos raw connectivity score atau ranking popularitas.

## Verification

Authorization, stale score version, hidden recommendation, feedback,
cross-tenant denial, Pest, Larastan, dan Pint.

## Exit Criteria

Explainable recommendation backend memenuhi FR-04.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P28: Recommendation UI and real dashboard props](P28-recommendation-ui-and-real-dashboard-props.md)
