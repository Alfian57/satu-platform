---
id: P49
title: 'Contribution provenance and notifications'
stage: 06-contribution-portfolio
depends_on: [P48]
gate: automatic
next: P50
---

# P49: Contribution provenance and notifications

## Outcome

Menyatukan history, decision, portfolio outcome, dan user notification.

## Prerequisites

P48 selesai.

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

Lengkapi timeline provenance, reviewer-safe metadata, in-app/mail notification
intents, retry/idempotency boundary, unread behavior, dan tests.

## Out of Scope

Memasukkan private review reason ke public notification atau mengerjakan generic
notification center penuh.

## Verification

Event-to-notification mapping, duplicate prevention, privacy payload,
timeline ordering, Pest, lint/typecheck bila UI berubah.

## Exit Criteria

Student dapat menelusuri outcome dari task sampai portfolio.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P50: Contribution-to-portfolio quality gate](P50-contribution-to-portfolio-quality-gate.md)
