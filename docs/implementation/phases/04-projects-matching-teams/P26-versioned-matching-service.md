---
id: P26
title: 'Versioned matching service'
stage: 04-projects-matching-teams
depends_on: [P25]
gate: automatic
next: P27
---

# P26: Versioned matching service

## Outcome

Menghasilkan recommendation score deterministic dan dapat diaudit.

## Prerequisites

P25 selesai.

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
- Phase-specific context: matching/security decisions.

## Deliverables

Implementasikan pure scoring service untuk `skill_fit`, `project_need`,
`availability`, dan `connectivity_opportunity`; simpan version, components, input snapshot
minimum, dan human-readable reason candidates.

## Out of Scope

Memakai ML, message content, mental-health inference, hidden sensitive factor,
atau mengunci provisional weight tanpa configuration/version.

## Verification

Unit datasets, deterministic output, missing data, ties, boundaries,
version persistence, fairness sanity cases, Pest, Larastan, dan Pint.

## Exit Criteria

Recommendation dapat direproduksi dan dijelaskan.

## Gate and Next Phase

- **Gate:** Automatic dengan provisional weights tetap tercatat.
- **Next:** [P27: Recommendation queries and feedback backend](P27-recommendation-queries-and-feedback-backend.md)
