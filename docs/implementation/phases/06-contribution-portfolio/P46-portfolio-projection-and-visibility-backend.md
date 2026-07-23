---
id: P46
title: 'Portfolio projection and visibility backend'
stage: 06-contribution-portfolio
depends_on: [P45]
gate: automatic
next: P47
---

# P46: Portfolio projection and visibility backend

## Outcome

Membentuk portfolio hanya dari data dan visibility yang diizinkan.

## Prerequisites

P45 disetujui.

## Read Before Work

- [PRODUCT.md](../../../../PRODUCT.md)
- [PRD.md](../../../product/PRD.md)
- [DECISIONS.md](../../../governance/DECISIONS.md)
- [DESIGN.md](../../../../DESIGN.md)
- [User flows](../../../ux/USER_FLOWS.md)
- [Data model](../../../engineering/DATA_MODEL.md)
- [Security and privacy](../../../engineering/SECURITY_PRIVACY.md)
- [Test strategy](../../TEST_STRATEGY.md)
- [Contribution surface brief](../../../../.impeccable/surfaces/route-contributions.md)
- Phase-specific context: privacy projection rules.

## Deliverables

Tambahkan portfolio entry/projection, verification levels, visibility controls,
recruiter-discoverability separation, withdrawal behavior, policies, serializers, dan tests.

## Out of Scope

Mengekspos private evidence, discussion, inclusion signal, raw audit, atau admin
reason.

## Verification

Public/private projections, visibility withdrawal, approved/revised source,
field allowlist, cross-tenant denial, Pest, Larastan, dan Pint.

## Exit Criteria

Portfolio boundary memenuhi FR-08.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P47: Portfolio management UI](P47-portfolio-management-ui.md)
