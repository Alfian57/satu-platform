---
id: P20
title: 'Profile quality gate'
stage: 03-profile-skills
depends_on: [P19]
gate: conditional
next: P21
---

# P20: Profile quality gate

## Outcome

Menjadikan profile flow siap menjadi input matching.

## Prerequisites

P19 selesai.

## Read Before Work

- [PRODUCT.md](../../../../PRODUCT.md)
- [PRD.md](../../../product/PRD.md)
- [DECISIONS.md](../../../governance/DECISIONS.md)
- [DESIGN.md](../../../../DESIGN.md)
- [User flows](../../../ux/USER_FLOWS.md)
- [Content and accessibility](../../../ux/CONTENT_ACCESSIBILITY.md)
- [Data model](../../../engineering/DATA_MODEL.md)
- [Security and privacy](../../../engineering/SECURITY_PRIVACY.md)
- Runtime context: existing settings pages, profile actions, shared types, routes, and tests.
- Phase-specific context: test strategy.

## Deliverables

Browser-test create/update/resume/visibility flows; harden stale form,
concurrent update, network failure, accessible errors, and realistic data ranges; polish
pola baru bila ada.

## Out of Scope

Mengimplementasikan recommendation.

## Verification

Browser, authorization, accessibility, Pint, lint, typecheck, dan build.

## Exit Criteria

FR-02 dan profile acceptance lulus.

## Gate and Next Phase

- **Gate:** Human hanya bila UI memperkenalkan pattern baru; selain itu automatic.
- **Next:** [P21: Project schema and lifecycle](../04-projects-matching-teams/P21-project-schema-and-lifecycle.md)
