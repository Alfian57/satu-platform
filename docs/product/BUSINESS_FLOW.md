# Business Flow SATU

## 1. Actor Map

```mermaid
flowchart LR
    Student[Student]
    Campus[Campus admin]
    Platform[Platform admin]
    Recruiter[Recruiter]
    Academic[Academic system]

    Student -->|project, task, evidence| SATU[SATU]
    Campus -->|verification, validation, review| SATU
    Platform -->|institution and abuse operations| SATU
    Recruiter -->|search and contact request| SATU
    SATU -. planned adapter .-> Academic
```

## 2. Open Registration dan Campus Verification

```mermaid
flowchart TD
    A[User registers] --> B[Verify email]
    B --> C[Select institution]
    C --> D{Approved email domain?}
    D -->|Yes| E[Membership verified]
    D -->|No| F[Membership pending]
    F --> G[Campus admin reviews evidence]
    G -->|Approve| E
    G -->|Request correction| H[User updates request]
    G -->|Reject| I[Membership unverified]
    E --> J[Verified credit features enabled]
    I --> K[General profile and allowed discovery remain available]
```

## 3. Project Discovery dan Team Formation

```mermaid
sequenceDiagram
    actor S as Student
    participant M as Matching engine
    participant P as Project
    actor O as Project owner

    S->>M: Request recommendations
    M->>M: Score skill, need, availability, connectivity
    M-->>S: Ranked matches + explanations + version
    S->>P: View project and open roles
    S->>O: Request to join
    O->>P: Review fit and capacity
    alt Accepted
        P-->>S: Active team membership
    else Revision needed
        O-->>S: Safe, actionable reason
    else Declined
        O-->>S: Decline without sensitive inference
    end
```

## 4. Realtime Workspace dan Contribution

```mermaid
flowchart TD
    A[Team member changes task] --> B[Authorize command]
    B --> C[Commit state to MySQL]
    C --> D[Create audit/event record]
    D --> E[Broadcast through Reverb]
    E --> F[Authorized team clients update]
    C --> G[Student attaches evidence]
    G --> H[Submit contribution]
    H --> I[Campus review queue]
    I -->|Approve| J[Verified contribution]
    I -->|Request revision| K[Student revises]
    I -->|Reject| L[Closed with reason]
    J --> M[Portfolio entry]
    J -. planned .-> N[Academic credit adapter]
```

## 5. Inclusion Review

```mermaid
flowchart TD
    A[Collaboration metadata reaches minimum sample] --> B[Versioned graph calculation]
    B --> C{Connectivity opportunity threshold}
    C -->|Not met| D[No signal]
    C -->|Met| E[Restricted inclusion signal]
    E --> F[Campus human review]
    F -->|Data artifact| G[Dismiss with reason]
    F -->|Needs observation| H[Acknowledge and monitor]
    F -->|Useful outreach| I[Record non-stigmatizing outreach]
    I --> J[Offer relevant opportunity or support]
    G --> K[Audit outcome]
    H --> K
    J --> K
```

Inclusion flow tidak memberi diagnosis, tidak mengirim label risiko kepada student, dan tidak tersedia bagi recruiter.

## 6. Recruiter Flow: Fase Lanjutan

```mermaid
flowchart TD
    A[Recruiter organization applies] --> B[Platform verification]
    B -->|Approved| C[Entitlement active]
    C --> D[Search recruiter-visible portfolio]
    D --> E[View redacted candidate profile]
    E --> F[Save candidate]
    E --> G[Send contact request]
    G --> H{Student response}
    H -->|Accept| I[Share approved contact channel]
    H -->|Decline| J[Close request]
    H -->|No response| K[Expire request]
```

## 7. Academic Integration: Fase Lanjutan

```mermaid
sequenceDiagram
    participant S as SATU
    participant Q as Queue
    participant A as Academic adapter
    participant U as University system

    S->>Q: Enqueue verified credit sync
    Q->>A: Send idempotent sync command
    A->>U: Map and submit activity record
    alt Success
        U-->>A: External reference
        A-->>S: Mark synced
    else Retryable failure
        A-->>Q: Retry with backoff
    else Permanent failure
        A-->>S: Mark failed and require review
    end
```

## 8. Business Control Points

- Campus verification mengontrol klaim afiliasi.
- Validation policy mengontrol verified contribution.
- Consent dan visibility mengontrol recruiter exposure.
- Human review mengontrol inclusion action.
- Entitlement mengontrol Talent Portal.
- Idempotency mengontrol academic sync.
- Audit log menghubungkan setiap keputusan sensitif dengan aktor dan alasan.
