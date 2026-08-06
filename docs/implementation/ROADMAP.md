# Delivery Roadmap: SATU

## Strategy

Delivery memakai ten GitHub milestones. Milestone menyatakan urutan outcome, sedangkan GitHub issues tetap atomic unit. Work dapat paralel jika hard dependency tidak dilanggar atau consumer memakai stacked workflow setelah contract checkpoint upstream tersedia. Detailnya ada pada [DEPENDENCY_WORKFLOW.md](./DEPENDENCY_WORKFLOW.md).

## Milestones

| Milestone                                    | Outcome                                                                                             |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| M0 Governance dan Delivery                   | Product truth, issue workflow, repository controls, serta external decisions siap                   |
| M1 Visual Authority                          | Buku Besar Kolaborasi, app shell, reference dashboard, dan surface direction disetujui              |
| M2 Identity, WhatsApp, Tenancy, dan Roster   | No-email auth, provisioning, roster verification, tenant policy, dan notification foundation        |
| M3 Profile, Skill, dan Notification          | Profile/skill/availability lengkap serta notification center operasional                            |
| M4 Project, Matching, dan Team               | Discovery, explainable matching, project lifecycle, dan atomic team formation                       |
| M5 Realtime Workspace                        | Task, discussion, evidence, Reverb/Echo, reconnect, dan reconciliation                              |
| M6 Contribution, Portfolio, dan Gamification | Campus validation, recruiter-safe portfolio foundation, XP, badge, dan hybrid leaderboard           |
| M7 Campus dan Inclusion                      | Campus operations serta governed SNA engine/UI di balik feature flag                                |
| M8 Talent, Academic, dan Landing             | Talent Portal, internal entitlement, academic sandbox, dan public interactive landing               |
| M9 Production Readiness dan UAT              | Reliability, MySQL, performance, accessibility, security, operations, synthetic demo, dan final UAT |

## Delivery Sequence

```text
M0 -> M1 -> M2 -> M3 -> M4 -> M5 -> M6 -> M7 -> M8 -> M9
```

UX shaping dalam M0/M1 dapat berjalan paralel dengan approved governance work. Talent projection bergantung pada contribution/portfolio. Gamification bergantung pada contribution validation. Inclusion activation dan real academic provider tetap gated walau implementation dapat selesai dengan synthetic/sandbox data. Stacked branch hanya mempercepat development dan review, bukan merge atau release gate.

## Release Definition

Competition release mencakup target PRD untuk satu institution tenant. Multi-institution production rollout, billing provider, pricing, real campus API, dan Bab 4.2 proposal tidak menjadi syarat release.

## Release Gates

- M0: repository workflow and decision ownership.
- M1: human approval visual reference.
- M2: identity threat model, OTP abuse test, roster and invitation recovery.
- M4: explainable/versioned matching and cross-tenant denial.
- M5: channel authorization and reconnect recovery.
- M6: contribution integrity and gamification fairness.
- M7: DPIA/governance before real inclusion activation.
- M8: recruiter projection/privacy and sandbox truth.
- M9: UAT, accessibility, security, backup/restore, provider degradation, and truthful demo.

Status setiap milestone dan issue hanya dilihat di GitHub. Dokumen roadmap tidak menyimpan persentase atau current task.
