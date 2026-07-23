---
id: P17
title: 'Skill taxonomy and profile schema'
stage: 03-profile-skills
depends_on: [P16]
gate: automatic
next: P18
---

# P17: Skill taxonomy and profile schema

## Outcome

Menyediakan data profile, skills, interests, dan availability yang konsisten.

## Prerequisites

P16 selesai.

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

## Deliverables

Tambahkan taxonomy, profile fields, proficiency/evidence metadata,
availability, relations, constraints, factories, dan migrations.

## Out of Scope

Membuat matching score atau menerima free-text sebagai official taxonomy.

## Verification

Unique taxonomy, tenant/global ownership decision, time/availability
constraints, migration, factories, Pest, Larastan, dan Pint.

## Exit Criteria

Schema memenuhi FR-02 tanpa memasukkan academic grades.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P18: Profile commands and authorization](P18-profile-commands-and-authorization.md)
