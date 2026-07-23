---
id: P47
title: 'Portfolio management UI'
stage: 06-contribution-portfolio
depends_on: [P46]
gate: automatic
next: P48
---

# P47: Portfolio management UI

## Outcome

Memberi student kendali nyata atas portfolio dan visibility.

## Prerequisites

P46 selesai.

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

## Deliverables

Implementasikan portfolio list/detail, provenance labels, verification levels,
visibility controls, recruiter discoverability explanation, empty/loading/error states.

## Out of Scope

Menggabungkan recruiter portal atau menyamarkan self-reported sebagai verified.

## Verification

Visibility independence, keyboard controls, mobile, accessible status,
browser tests, lint, typecheck, build.

## Exit Criteria

Student dapat memahami dan mengelola data portfolio.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P48: Public-safe portfolio projection](P48-public-safe-portfolio-projection.md)
