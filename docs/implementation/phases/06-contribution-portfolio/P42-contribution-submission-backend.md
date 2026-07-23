---
id: P42
title: 'Contribution submission backend'
stage: 06-contribution-portfolio
depends_on: [P41]
gate: automatic
next: P43
---

# P42: Contribution submission backend

## Outcome

Membuat draft, submit, dan resubmit actions authorized.

## Prerequisites

P41 selesai.

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

Implementasikan commands/form requests/routes/policies untuk draft, evidence
link, submit, revision response, audit, dan notifications boundary.

## Out of Scope

Mengizinkan self-approval atau mengubah version yang sudah direview.

## Verification

Ownership/team membership, missing evidence, repeated submit, revision
append, cross-tenant denial, Pest, Larastan, dan Pint.

## Exit Criteria

Student submission backend memenuhi provenance rules.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P43: Contribution submission UI](P43-contribution-submission-ui.md)
