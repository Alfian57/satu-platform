---
id: P65
title: 'Security, privacy, and tenant regression'
stage: 08-production-readiness
depends_on: [P64]
gate: automatic
next: P66
---

# P65: Security, privacy, and tenant regression

## Outcome

Menjalankan adversarial review terhadap seluruh access boundary.

## Prerequisites

P64 selesai.

## Read Before Work

- [PRODUCT.md](../../../../PRODUCT.md)
- [PRD.md](../../../product/PRD.md)
- [DECISIONS.md](../../../governance/DECISIONS.md)
- [DESIGN.md](../../../../DESIGN.md)
- [Architecture](../../../engineering/ARCHITECTURE.md)
- [Security and privacy](../../../engineering/SECURITY_PRIVACY.md)
- [Test strategy](../../TEST_STRATEGY.md)
- [Roadmap and release gates](../../ROADMAP.md)
- Runtime context: configuration, deployment, queue, broadcast, storage, mail, build, test, and environment files relevant to the phase.
- Phase-specific context: security/privacy requirements.

## Deliverables

Audit policy coverage, IDOR, tenant scope, role assignment, CSRF/session,
upload/download, mass assignment, serialization, logs, broadcasts, public portfolio,
inclusion, consent, audit, dan deletion/export boundaries.

## Out of Scope

Menganggap hidden UI sebagai authorization.

## Verification

Denial matrix, security feature tests, static analysis, dependency audit yang
tersedia, log/payload inspection, Pint, build.

## Exit Criteria

Tidak ada known critical/high security or privacy issue.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P66: Production service configuration and runbook](P66-production-service-configuration-and-runbook.md)
