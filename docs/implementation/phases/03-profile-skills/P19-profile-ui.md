---
id: P19
title: 'Profile UI'
stage: 03-profile-skills
depends_on: [P18]
gate: automatic
next: P20
---

# P19: Profile UI

## Outcome

Membuat student dapat melengkapi dan memperbaiki profile.

## Prerequisites

P18 selesai.

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
- Phase-specific context: established `DESIGN.md`.

## Deliverables

Implementasikan profile sections, taxonomy selection, proficiency/evidence,
availability, completeness explanation, consent, visibility controls, dan Wayfinder forms.

## Out of Scope

Menggunakan gamified completion pressure atau mengunci semua fitur saat profile
belum lengkap.

## Verification

Keyboard, field errors, long taxonomy, empty search, mobile layout, lint,
typecheck, build, dan feature props.

## Exit Criteria

Student dapat menyimpan profile minimum dan memahami kekurangannya.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P20: Profile quality gate](P20-profile-quality-gate.md)
