---
id: P34
title: 'Discussion backend'
stage: 05-realtime-workspace
depends_on: [P33]
gate: automatic
next: P35
---

# P34: Discussion backend

## Outcome

Menyediakan discussion tekstual yang authorized dan paginated.

## Prerequisites

P33 disetujui.

## Read Before Work

- [PRODUCT.md](../../../../PRODUCT.md)
- [PRD.md](../../../product/PRD.md)
- [DECISIONS.md](../../../governance/DECISIONS.md)
- [DESIGN.md](../../../../DESIGN.md)
- [User flows](../../../ux/USER_FLOWS.md)
- [Architecture](../../../engineering/ARCHITECTURE.md)
- [Data model](../../../engineering/DATA_MODEL.md)
- [Security and privacy](../../../engineering/SECURITY_PRIVACY.md)
- [Test strategy](../../TEST_STRATEGY.md)
- [Workspace surface brief](../../../../.impeccable/surfaces/route-projects-workspace.md)

## Deliverables

Tambahkan discussion records, create/edit rules bila diizinkan, pagination,
ordering, policies, safe serialization, factories, dan tests.

## Out of Scope

Menganalisis sentiment/message content atau menambahkan broadcast.

## Verification

Membership authorization, cross-team denial, pagination order, deletion/edit
policy, payload privacy, Pest, Larastan, dan Pint.

## Exit Criteria

Discussion benar melalui normal HTTP.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P35: Private attachment and evidence storage](P35-private-attachment-and-evidence-storage.md)
