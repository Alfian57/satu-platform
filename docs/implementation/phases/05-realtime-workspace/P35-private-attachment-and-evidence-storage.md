---
id: P35
title: 'Private attachment and evidence storage'
stage: 05-realtime-workspace
depends_on: [P34]
gate: automatic
next: P36
---

# P35: Private attachment and evidence storage

## Outcome

Menangani file workspace secara private dan auditable.

## Prerequisites

P34 selesai.

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
- Phase-specific context: security storage rules.

## Deliverables

Tambahkan attachment metadata, validation, upload/download authorization,
private disk path strategy, lifecycle, cleanup policy boundary, factories, dan tests.

## Out of Scope

Menyimpan public URL permanen atau menerima executable/oversized file.

## Verification

MIME/size, unauthorized download, missing file, duplicate upload, storage
fake tests, Pest, Larastan, dan Pint.

## Exit Criteria

Authorized team member dapat mengunggah dan mengambil file dengan aman.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P36: Discussion and evidence UI](P36-discussion-and-evidence-ui.md)
