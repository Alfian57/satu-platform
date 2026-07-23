---
version: 1
slug: 'route-projects-workspace'
primary_target: 'route:/projects/workspace'
related_targets: ['route:/projects/{project}/workspace']
---

# Realtime Collaboration Workspace

## Job and Audience

Active team menyelesaikan project dengan task, discussion, evidence, dan deadline pada desktop maupun mobile. Mode: **Operate**.

## Outcome and Proof

Setiap anggota memahami task miliknya, perubahan terbaru, blocking issue, dan evidence yang dibutuhkan. Realtime mempercepat koordinasi tanpa menjadi source of truth.

## Selected Direction

Mewarisi **Buku Besar Kolaborasi** sebagai live work ledger. Task board dan discussion berbagi satu project context; status transition terasa seperti ledger insertion atau validation mark. Tidak meniru generic kanban bila list/timeline lebih efektif.

## Scope and Boundaries

Mencakup task CRUD sesuai permission, assignee, status, priority, due date, discussion, attachment, evidence handoff, member presence, activity history, reconnect, dan conflict. Tidak mencakup video call, document editor penuh, atau public chat.

## States and Ranges

- Empty project, 15–40 typical tasks, 250 filtered/paginated.
- 2–25 members.
- Upload progress/failure, offline/reconnecting, duplicate/stale event.
- Permission lost, task deleted by another user, concurrent update.
- Long discussion, long filename, overdue task.

## Interaction and Layout

Initial state berasal dari Inertia. Commands memakai Wayfinder; Reverb mengirim delta setelah commit. Focus tidak dipindah oleh event. Desktop dapat memakai split task/context; mobile memakai task list dengan detail sheet/page. Drag memiliki menu/button alternative.

## Constraints and Open Decisions

Private/presence channel harus tenant dan project authorized. Payload minimal dan tidak membawa sensitive data. Reconnect melakukan reconciliation. Reverb topology ditutup sebelum deployment.
