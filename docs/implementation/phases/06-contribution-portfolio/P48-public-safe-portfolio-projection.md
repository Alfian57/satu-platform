---
id: P48
title: 'Public-safe portfolio projection'
stage: 06-contribution-portfolio
depends_on: [P47]
gate: conditional
next: P49
---

# P48: Public-safe portfolio projection

## Outcome

Menyediakan shareable view yang hanya memuat field yang dipilih.

## Prerequisites

P47 selesai.

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
- Phase-specific context: public privacy rules.

## Deliverables

Implementasikan public identifier/route, allowlisted projection, unavailable
state, opt-out, provenance presentation, crawl/index decision, dan tests.

## Out of Scope

Membuat recruiter search, contact flow, atau membuka raw evidence.

## Verification

Hidden/off/public states, no private props, revoked link behavior, responsive
and accessibility inspection, feature/browser tests, build.

## Exit Criteria

Public portfolio aman dan jujur terhadap verification level.

## Gate and Next Phase

- **Gate:** Human bila menggunakan `Experience` mode baru.
- **Next:** [P49: Contribution provenance and notifications](P49-contribution-provenance-and-notifications.md)
