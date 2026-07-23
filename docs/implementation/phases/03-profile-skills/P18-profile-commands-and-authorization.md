---
id: P18
title: 'Profile commands and authorization'
stage: 03-profile-skills
depends_on: [P17]
gate: automatic
next: P19
---

# P18: Profile commands and authorization

## Outcome

Membuat profile dapat dikelola dengan validation dan consent boundaries.

## Prerequisites

P17 selesai.

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

Buat actions/form requests/routes/policies untuk bio, study metadata, skills,
interests, availability, portfolio visibility, dan recruiter discoverability.

## Out of Scope

Membuat recruiter access atau mengubah verified membership.

## Verification

Ownership, invalid taxonomy, visibility independence, audit/consent update,
feature tests, Larastan, dan Pint.

## Exit Criteria

Backend profile contract stabil dan explainable.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P19: Profile UI](P19-profile-ui.md)
