# User Flows SATU

## 1. Student Activation

```mermaid
flowchart TD
    A[Register] --> B[Verify email]
    B --> C[Choose institution]
    C --> D{Domain approved?}
    D -->|Yes| E[Membership verified]
    D -->|No| F[Submit affiliation evidence]
    F --> G[Membership pending]
    E --> H[Add skills and availability]
    G --> H
    H --> I[Set portfolio and recruiter visibility]
    I --> J[Review consent summary]
    J --> K[Dashboard]
```

### Recovery

- Duplicate email mengarah ke login/reset password.
- Invalid domain tidak menyebut daftar internal domain secara berlebihan.
- Pending membership menjelaskan apa yang tetap dapat dilakukan.
- User dapat menyimpan onboarding progress.

## 2. Recommendation to Active Team

```mermaid
flowchart TD
    A[Open recommendation] --> B[Read match reasons]
    B --> C[View project detail]
    C --> D{Action}
    D -->|Request to join| E[Submit request]
    D -->|Accept invitation| F[Confirm availability]
    D -->|Not relevant| G[Give reason or hide]
    E --> H[Owner review]
    F --> I{Capacity available?}
    H -->|Accept| I
    H -->|Decline| J[Safe explanation]
    I -->|Yes| K[Active team membership]
    I -->|No| L[Waitlist or closed role]
    K --> M[Workspace orientation]
```

### Guardrails

- Tidak ada alasan yang menyebut student diprioritaskan karena “rentan”.
- Action menunjukkan commitment dan deadline.
- Capacity transition dilakukan atomic.

## 3. Realtime Task Flow

```mermaid
sequenceDiagram
    actor U as Team member
    participant UI as Inertia React UI
    participant L as Laravel
    participant DB as MySQL
    participant R as Reverb
    participant T as Team clients

    U->>UI: Update task
    UI->>L: Wayfinder command
    L->>L: Authorize and validate
    L->>DB: Commit task + audit
    DB-->>L: Success
    L-->>UI: Confirmed state
    L->>R: Broadcast after commit
    R-->>T: TaskUpdated
    T->>T: Merge by id/version
```

### Failure paths

- Validation error mempertahankan input.
- Authorization loss mengembalikan object ke server state.
- Reverb disconnect menampilkan connection state tanpa memblokir local reading.
- Reconnect memicu state reconciliation.
- Duplicate event diabaikan berdasarkan event/object version.

## 4. Contribution Validation

```mermaid
flowchart TD
    A[Select completed task] --> B[Describe contribution]
    B --> C[Attach evidence]
    C --> D[Review visibility and declaration]
    D --> E[Submit]
    E --> F[Pending review]
    F -->|Request revision| G[Show actionable feedback]
    G --> C
    F -->|Approve| H[Verified contribution]
    F -->|Reject| I[Closed with reason and appeal path]
    H --> J[Choose portfolio visibility]
```

## 5. Campus Validation Queue

```mermaid
flowchart TD
    A[Open queue] --> B[Filter by age, project, program]
    B --> C[Open review docket]
    C --> D[Inspect task, evidence, team context, policy]
    D --> E{Decision}
    E -->|Approve| F[Confirm outcome and credit]
    E -->|Revision| G[Write actionable request]
    E -->|Reject| H[Select reason and explanation]
    F --> I[Audit + notification]
    G --> I
    H --> I
    I --> J[Next queue item]
```

## 6. Inclusion Review

```mermaid
flowchart TD
    A[Restricted queue] --> B[Open signal explanation]
    B --> C[Review data sufficiency and recent context]
    C --> D{Human judgment}
    D -->|Artifact or irrelevant| E[Dismiss]
    D -->|Observe| F[Acknowledge]
    D -->|Offer opportunity| G[Choose non-stigmatizing action]
    G --> H[Send ordinary project/support invitation]
    E --> I[Record reason]
    F --> I
    H --> I
```

Student menerima opportunity atau support copy biasa, bukan risk label.

## 7. Recruiter Contact: Later

```mermaid
flowchart TD
    A[Search talent] --> B[Open redacted portfolio]
    B --> C[Inspect verified contribution]
    C --> D[Send contact request]
    D --> E[Student reviews company and opportunity]
    E -->|Accept| F[Approved contact exchange]
    E -->|Decline| G[Request closed]
    E -->|Ignore| H[Request expires]
```

## 8. Account and Data Rights

```mermaid
flowchart TD
    A[Privacy settings] --> B{Request}
    B -->|Correct profile| C[Edit and audit]
    B -->|Export data| D[Create secure export job]
    B -->|Delete account| E[Explain retention and consequences]
    B -->|Withdraw recruiter visibility| F[Hide from new recruiter search]
    D --> G[Notify when expiring download is ready]
    E --> H[Confirm identity]
    H --> I[Execute approved deletion/anonymization workflow]
```
