---
id: P43
title: 'Contribution submission UI'
stage: 06-contribution-portfolio
depends_on: [P42]
gate: automatic
next: P44
---

# P43: Contribution submission UI

## Outcome

Membuat student menyusun, mengirim, dan memperbaiki contribution.

## Prerequisites

P42 selesai.

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

Implementasikan contribution list/detail, draft form, task/evidence selection,
verification level, revision feedback, history, loading/error/forbidden states.

## Out of Scope

Menjanjikan approval atau credit sebelum review.

## Verification

Long evidence, missing file, revision flow, keyboard, mobile, browser tests,
lint, typecheck, build.

## Exit Criteria

Student dapat submit dan merespons revision end-to-end.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P44: Campus validation commands](P44-campus-validation-commands.md)
