<?php

namespace Database\Seeders;

use App\Enums\AffiliationMatchResult;
use App\Enums\AffiliationRequestStatus;
use App\Enums\AttachmentPurpose;
use App\Enums\CollaborationEventType;
use App\Enums\ContributionReviewDecision;
use App\Enums\ContributionStatus;
use App\Enums\InclusionHumanConclusion;
use App\Enums\InstitutionDomainStatus;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionMembershipVerificationMethod;
use App\Enums\InstitutionRosterStatus;
use App\Enums\InstitutionStatus;
use App\Enums\MatchingDimension;
use App\Enums\PortfolioVerificationLevel;
use App\Enums\PortfolioVisibility;
use App\Enums\ProjectStatus;
use App\Enums\ProjectVisibility;
use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Enums\TeamMembershipEventType;
use App\Enums\TeamMembershipStatus;
use App\Models\AffiliationRequest;
use App\Models\Attachment;
use App\Models\AuditLog;
use App\Models\CollaborationEvent;
use App\Models\Contribution;
use App\Models\ContributionEvidence;
use App\Models\ContributionReview;
use App\Models\ContributionVersion;
use App\Models\InclusionReview;
use App\Models\InclusionSignal;
use App\Models\InclusionSignalVersion;
use App\Models\Institution;
use App\Models\InstitutionDomain;
use App\Models\InstitutionMembership;
use App\Models\InstitutionRoster;
use App\Models\InstitutionRosterRow;
use App\Models\MatchRun;
use App\Models\MatchScoreVersion;
use App\Models\Message;
use App\Models\PhoneNumber;
use App\Models\PortfolioEntry;
use App\Models\Project;
use App\Models\ProjectRole;
use App\Models\Recommendation;
use App\Models\StudentProfile;
use App\Models\Task;
use App\Models\TeamMembership;
use App\Models\TeamMembershipEvent;
use App\Models\User;
use App\Support\InstitutionalIdentifier;
use App\Support\PhoneIdentity;
use Faker\Factory as Faker;
use Faker\Generator;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DemoSeeder extends Seeder
{
    private const DATASET = 'synthetic_demo_v2';

    private const PERIOD = '2026-S1';

    public function run(): void
    {
        $state = (string) config('app.demo_state', 'typical');
        $this->command->info("Seeding truthful synthetic demo dataset for {$state} state...");

        $faker = Faker::create('id_ID');
        $faker->seed(12345);
        fake()->seed(12345);

        DB::transaction(function () use ($faker, $state): void {
            match ($state) {
                'minimum' => $this->seedMinimum($faker),
                'maximum' => $this->seedMaximum($faker),
                default => $this->seedTypical($faker),
            };
        });

        $this->command->info('Synthetic dataset seeded successfully.');
    }

    private function seedMinimum(Generator $faker): void
    {
        $this->createSyntheticInstitution(
            faker: $faker,
            name: 'Universitas Sintetik Minimum',
            studentCount: 10,
            projectCount: 1,
        );
    }

    private function seedTypical(Generator $faker): void
    {
        $this->createSyntheticInstitution(
            faker: $faker,
            name: 'Universitas Sintetik Alpha',
            studentCount: 50,
            projectCount: 2,
        );
        $this->createSyntheticInstitution(
            faker: $faker,
            name: 'Institut Teknologi Sintetik Beta',
            studentCount: 30,
            projectCount: 2,
        );
    }

    private function seedMaximum(Generator $faker): void
    {
        for ($institutionNumber = 1; $institutionNumber <= 10; $institutionNumber++) {
            $this->createSyntheticInstitution(
                faker: $faker,
                name: "Politeknik Sintetik {$institutionNumber}",
                studentCount: 100,
                projectCount: 4,
            );
        }
    }

    private function createSyntheticInstitution(
        Generator $faker,
        string $name,
        int $studentCount,
        int $projectCount,
    ): void {
        $slug = 'synthetic-'.Str::slug($name);
        $institution = $this->ensureInstitution($name, $slug);

        $this->ensureDomain($institution, "{$slug}.ac.id");

        $admin = $this->ensureUser(
            username: "{$slug}-admin",
            name: "Admin {$name}",
        );
        $this->ensureMembership(
            institution: $institution,
            user: $admin,
            role: InstitutionMembershipRole::CampusAdmin,
            status: InstitutionMembershipStatus::Verified,
            verificationMethod: InstitutionMembershipVerificationMethod::ApprovedDomain,
        );

        $students = [];

        for ($studentNumber = 1; $studentNumber <= $studentCount; $studentNumber++) {
            $student = $this->ensureUser(
                username: "{$slug}-student-{$studentNumber}",
                name: $faker->name(),
            );
            $this->ensureMembership(
                institution: $institution,
                user: $student,
                role: InstitutionMembershipRole::Student,
                status: InstitutionMembershipStatus::Verified,
                verificationMethod: InstitutionMembershipVerificationMethod::RosterExactMatch,
            );
            $this->ensureStudentProfile(
                institution: $institution,
                user: $student,
                program: $this->programFor($studentNumber),
                recruiterDiscoverable: $studentNumber % 3 === 1,
            );
            $students[] = $student;
        }

        $this->ensureCampusQueue($institution, $admin, $slug);

        $scoreVersion = $this->ensureMatchingVersion($admin);
        $inclusionVersion = $this->ensureInclusionVersion($admin);

        for ($projectNumber = 1; $projectNumber <= $projectCount; $projectNumber++) {
            $owner = $students[0];
            $project = $this->ensureProject($institution, $owner, $projectNumber);
            $roles = $this->ensureProjectRoles($project);

            $projectMembers = [
                [$owner, $roles[0]],
                [$students[min($studentCount - 1, 1)], $roles[1]],
                [$students[min($studentCount - 1, 2)], $roles[0]],
            ];

            foreach ($projectMembers as [$member, $role]) {
                $membership = $this->ensureTeamMembership($project, $member, $role);
                $this->ensureTeamMembershipEvent($membership, $member);
                $this->ensureCollaborationEvent(
                    institution: $institution,
                    actor: $member,
                    target: $member->is($owner) ? $students[min($studentCount - 1, 1)] : $owner,
                    project: $project,
                    eventType: CollaborationEventType::TeamJoined,
                    key: 'joined-'.$member->getKey(),
                );
            }

            $tasks = $this->ensureTasks($project, $owner);
            $message = $this->ensureWorkspaceMessage($project, $owner, $projectNumber);
            $this->ensureWorkspaceAttachment($project, $message, $owner, $projectNumber);

            $approvedContribution = $this->ensureContribution(
                project: $project,
                owner: $students[min($studentCount - 1, 1)],
                task: $tasks[0],
                status: ContributionStatus::Approved,
                reviewDecision: ContributionReviewDecision::Approved,
                contributionKey: 'approved',
                reviewer: $admin,
            );
            $this->ensurePortfolioEntry($approvedContribution);

            $revisionContribution = $this->ensureContribution(
                project: $project,
                owner: $students[min($studentCount - 1, 2)],
                task: $tasks[1],
                status: ContributionStatus::Revision,
                reviewDecision: ContributionReviewDecision::Revision,
                contributionKey: 'revision',
                reviewer: $admin,
            );

            $this->ensureCollaborationEvent(
                institution: $institution,
                actor: $students[min($studentCount - 1, 1)],
                target: $owner,
                project: $project,
                eventType: CollaborationEventType::TaskCompleted,
                key: 'task-completed-'.$tasks[0]->getKey(),
                contextId: $tasks[0]->getKey(),
                contextType: Task::class,
            );
            $this->ensureCollaborationEvent(
                institution: $institution,
                actor: $admin,
                target: $students[min($studentCount - 1, 2)],
                project: $project,
                eventType: CollaborationEventType::PeerReviewed,
                key: 'peer-reviewed-'.$revisionContribution->getKey(),
                contextId: $revisionContribution->getKey(),
                contextType: Contribution::class,
            );

            $this->ensureMatchRunAndRecommendation(
                institution: $institution,
                actor: $admin,
                project: $project,
                candidate: $students[min($studentCount - 1, 1)],
                version: $scoreVersion,
            );
        }

        $inclusionSubject = $students[min($studentCount - 1, 3)];
        $this->ensureInclusionScenario($institution, $admin, $inclusionSubject, $inclusionVersion);
        $this->ensureSeedAudit($institution, $admin, $studentCount, $projectCount);
    }

    private function ensureInstitution(string $name, string $slug): Institution
    {
        $institution = Institution::query()
            ->where('slug', $slug)
            ->orWhere('name', $name)
            ->first();

        if ($institution === null) {
            return Institution::factory()->create([
                'name' => $name,
                'slug' => $slug,
                'status' => InstitutionStatus::Active,
                'timezone' => 'Asia/Jakarta',
                'locale' => 'id',
                'settings' => [
                    'dataset' => self::DATASET,
                    'is_synthetic' => true,
                ],
            ]);
        }

        $institution->forceFill([
            'name' => $name,
            'slug' => $slug,
            'status' => InstitutionStatus::Active,
            'settings' => [
                'dataset' => self::DATASET,
                'is_synthetic' => true,
            ],
        ])->save();

        return $institution;
    }

    private function ensureDomain(Institution $institution, string $domain): InstitutionDomain
    {
        $institutionDomain = InstitutionDomain::query()->where('domain', $domain)->first();
        $attributes = [
            'institution_id' => $institution->getKey(),
            'domain' => $domain,
            'status' => InstitutionDomainStatus::Verified,
            'verified_at' => now(),
        ];

        if ($institutionDomain === null) {
            return InstitutionDomain::factory()->create($attributes);
        }

        $institutionDomain->forceFill($attributes)->save();

        return $institutionDomain;
    }

    private function ensureUser(string $username, string $name): User
    {
        $user = User::query()->where('username', $username)->first();

        if ($user === null) {
            return User::factory()->create([
                'username' => $username,
                'name' => $name,
            ]);
        }

        $user->forceFill(['name' => $name])->save();

        return $user;
    }

    private function ensureMembership(
        Institution $institution,
        User $user,
        InstitutionMembershipRole $role,
        InstitutionMembershipStatus $status,
        InstitutionMembershipVerificationMethod $verificationMethod,
    ): InstitutionMembership {
        $attributes = [
            'role' => $role,
            'status' => $status,
            'requested_at' => now()->subDays(7),
            'reviewed_at' => $role === InstitutionMembershipRole::CampusAdmin ? now()->subDays(6) : null,
            'reviewed_by_id' => $role === InstitutionMembershipRole::CampusAdmin ? $user->getKey() : null,
            'verified_at' => now()->subDays(5),
            'verification_method' => $verificationMethod,
            'last_review_outcome' => null,
        ];
        $membership = InstitutionMembership::query()
            ->where('institution_id', $institution->getKey())
            ->where('user_id', $user->getKey())
            ->where('role', $role->value)
            ->first();

        if ($membership === null) {
            return InstitutionMembership::factory()->create([
                'institution_id' => $institution->getKey(),
                'user_id' => $user->getKey(),
                ...$attributes,
            ]);
        }

        $membership->forceFill($attributes)->save();

        return $membership;
    }

    private function ensureStudentProfile(
        Institution $institution,
        User $user,
        string $program,
        bool $recruiterDiscoverable,
    ): StudentProfile {
        $attributes = [
            'institution_id' => $institution->getKey(),
            'user_id' => $user->getKey(),
            'bio' => 'Profil demo sintetis untuk kolaborasi lintas program.',
            'study_program' => $program,
            'study_year' => 3,
            'portfolio_visibility' => $recruiterDiscoverable
                ? PortfolioVisibility::Recruiter
                : PortfolioVisibility::Private,
            'recruiter_discoverable' => $recruiterDiscoverable,
        ];
        $profile = StudentProfile::query()
            ->where('institution_id', $institution->getKey())
            ->where('user_id', $user->getKey())
            ->first();

        if ($profile === null) {
            return StudentProfile::factory()->create($attributes);
        }

        $profile->forceFill($attributes)->save();

        return $profile;
    }

    private function ensureCampusQueue(Institution $institution, User $admin, string $slug): AffiliationRequest
    {
        $queueUser = $this->ensureUser(
            username: "{$slug}-queue-student",
            name: 'Mahasiswa Sintetik Menunggu Verifikasi',
        );
        $membership = $this->ensurePendingMembership($institution, $queueUser);
        $roster = $this->ensureRoster($institution, $admin, $slug);
        $nim = 'SYN-'.strtoupper(substr(md5($slug), 0, 8));
        $phoneSuffix = abs(crc32($slug)) % 1000000;
        $phone = '+6281234'.str_pad((string) $phoneSuffix, 6, '0', STR_PAD_LEFT);

        $this->ensurePhoneNumber($queueUser, $phone);
        $this->ensureRosterRow($roster, $slug, $phone);

        $attributes = [
            'institution_id' => $institution->getKey(),
            'user_id' => $queueUser->getKey(),
            'institution_membership_id' => $membership->getKey(),
            'roster_id' => $roster->getKey(),
            'roster_row_id' => null,
            'nim_hash' => InstitutionalIdentifier::hash($nim),
            'nim' => $nim,
            'match_result' => AffiliationMatchResult::NoMatch,
            'status' => AffiliationRequestStatus::PendingReview,
            'version' => 1,
            'submitted_at' => now()->subHours(4),
        ];
        $request = AffiliationRequest::query()
            ->where('institution_id', $institution->getKey())
            ->where('user_id', $queueUser->getKey())
            ->first();

        if ($request === null) {
            return AffiliationRequest::factory()->create($attributes);
        }

        $request->forceFill($attributes)->save();

        return $request;
    }

    private function ensurePendingMembership(Institution $institution, User $user): InstitutionMembership
    {
        $membership = InstitutionMembership::query()
            ->where('institution_id', $institution->getKey())
            ->where('user_id', $user->getKey())
            ->where('role', InstitutionMembershipRole::Student->value)
            ->first();
        $attributes = [
            'role' => InstitutionMembershipRole::Student,
            'status' => InstitutionMembershipStatus::Pending,
            'requested_at' => now()->subHours(5),
            'reviewed_at' => null,
            'reviewed_by_id' => null,
            'verified_at' => null,
            'verification_method' => null,
            'last_review_outcome' => null,
        ];

        if ($membership === null) {
            return InstitutionMembership::factory()->create([
                'institution_id' => $institution->getKey(),
                'user_id' => $user->getKey(),
                ...$attributes,
            ]);
        }

        $membership->forceFill($attributes)->save();

        return $membership;
    }

    private function ensureRoster(Institution $institution, User $admin, string $slug): InstitutionRoster
    {
        $checksum = hash('sha256', self::DATASET.':roster:'.$slug);
        $attributes = [
            'institution_id' => $institution->getKey(),
            'semester' => self::PERIOD,
            'source_filename' => 'synthetic-demo-roster.csv',
            'checksum' => $checksum,
            'total_rows' => 1,
            'valid_rows' => 1,
            'error_rows' => 0,
            'status' => InstitutionRosterStatus::Active,
            'imported_by' => $admin->getKey(),
            'activated_at' => now()->subDay(),
            'superseded_at' => null,
        ];
        $roster = InstitutionRoster::query()
            ->where('institution_id', $institution->getKey())
            ->where('checksum', $checksum)
            ->first();

        if ($roster === null) {
            return InstitutionRoster::factory()->create($attributes);
        }

        $roster->forceFill($attributes)->save();

        return $roster;
    }

    private function ensureRosterRow(InstitutionRoster $roster, string $slug, string $phone): InstitutionRosterRow
    {
        $nim = 'ROSTER-'.strtoupper(substr(md5($slug), 0, 8));
        $row = InstitutionRosterRow::query()
            ->where('roster_id', $roster->getKey())
            ->where('nim', $nim)
            ->first();
        $attributes = [
            'roster_id' => $roster->getKey(),
            'nim' => $nim,
            'nama' => 'Mahasiswa Roster Sintetik',
            'program_studi' => 'Informatika',
            'angkatan' => '2024',
            'semester' => self::PERIOD,
            'phone_hash' => PhoneIdentity::hash($phone),
            'phone_encrypted' => $phone,
            'is_active' => true,
            'validation_errors' => null,
        ];

        if ($row === null) {
            return InstitutionRosterRow::factory()->create($attributes);
        }

        $row->forceFill($attributes)->save();

        return $row;
    }

    private function ensurePhoneNumber(User $user, string $phone): PhoneNumber
    {
        $phoneNumber = PhoneNumber::query()->where('user_id', $user->getKey())->first();

        if ($phoneNumber === null) {
            return PhoneNumber::factory()->forNumber($phone)->create([
                'user_id' => $user->getKey(),
            ]);
        }

        return $phoneNumber;
    }

    private function ensureProject(Institution $institution, User $owner, int $projectNumber): Project
    {
        $title = "Synthetic Cross-Program Project {$projectNumber}";
        $attributes = [
            'institution_id' => $institution->getKey(),
            'owner_id' => $owner->getKey(),
            'title' => $title,
            'description' => 'Project demo sintetis yang mempertemukan mahasiswa Informatika dan Desain Komunikasi Visual.',
            'status' => ProjectStatus::Open,
            'visibility' => ProjectVisibility::Public,
            'capacity' => 5,
            'deadline' => now()->addWeeks(4),
        ];
        $project = Project::query()
            ->where('institution_id', $institution->getKey())
            ->where('title', $title)
            ->first();

        if ($project === null) {
            return Project::factory()->create($attributes);
        }

        $project->forceFill($attributes)->save();

        return $project;
    }

    /**
     * @return list<ProjectRole>
     */
    private function ensureProjectRoles(Project $project): array
    {
        $roleDefinitions = [
            ['title' => 'Pengembang Produk', 'capacity' => 2],
            ['title' => 'Perancang Pengalaman', 'capacity' => 2],
        ];
        $roles = [];

        foreach ($roleDefinitions as $definition) {
            $role = ProjectRole::query()
                ->where('project_id', $project->getKey())
                ->where('title', $definition['title'])
                ->first();
            $attributes = [
                'project_id' => $project->getKey(),
                'title' => $definition['title'],
                'description' => 'Peran sintetik untuk project lintas program.',
                'capacity' => $definition['capacity'],
            ];

            if ($role === null) {
                $role = ProjectRole::factory()->create($attributes);
            } else {
                $role->forceFill($attributes)->save();
            }

            $roles[] = $role;
        }

        return $roles;
    }

    private function ensureTeamMembership(Project $project, User $user, ProjectRole $role): TeamMembership
    {
        $membership = TeamMembership::query()
            ->where('project_id', $project->getKey())
            ->where('user_id', $user->getKey())
            ->first();
        $attributes = [
            'project_id' => $project->getKey(),
            'user_id' => $user->getKey(),
            'project_role_id' => $role->getKey(),
            'status' => TeamMembershipStatus::Active,
            'joined_at' => now()->subDays(3),
            'left_at' => null,
            'removed_at' => null,
            'removed_by_id' => null,
            'removal_reason' => null,
        ];

        if ($membership === null) {
            return TeamMembership::factory()->create($attributes);
        }

        $membership->forceFill($attributes)->save();

        return $membership;
    }

    private function ensureTeamMembershipEvent(TeamMembership $membership, User $actor): TeamMembershipEvent
    {
        $event = TeamMembershipEvent::query()
            ->where('team_membership_id', $membership->getKey())
            ->where('event', TeamMembershipEventType::Joined->value)
            ->first();

        if ($event !== null) {
            return $event;
        }

        return TeamMembershipEvent::factory()->create([
            'team_membership_id' => $membership->getKey(),
            'actor_id' => $actor->getKey(),
            'event' => TeamMembershipEventType::Joined,
            'reason' => 'Synthetic demo workspace history.',
            'metadata' => [
                'dataset' => self::DATASET,
                'is_synthetic' => true,
            ],
            'created_at' => now()->subDays(3),
        ]);
    }

    /**
     * @return list<Task>
     */
    private function ensureTasks(Project $project, User $owner): array
    {
        $definitions = [
            [
                'title' => 'Synthetic task: validasi kebutuhan',
                'status' => TaskStatus::Done,
                'priority' => TaskPriority::High,
                'due_at' => now()->subDay(),
            ],
            [
                'title' => 'Synthetic task: siapkan prototipe',
                'status' => TaskStatus::InProgress,
                'priority' => TaskPriority::Medium,
                'due_at' => now()->addDays(7),
            ],
        ];
        $tasks = [];

        foreach ($definitions as $definition) {
            $task = Task::query()
                ->where('project_id', $project->getKey())
                ->where('title', $definition['title'])
                ->first();
            $attributes = [
                'project_id' => $project->getKey(),
                'created_by_id' => $owner->getKey(),
                'title' => $definition['title'],
                'description' => 'Task demo sintetis tanpa data operasional nyata.',
                'status' => $definition['status'],
                'priority' => $definition['priority'],
                'due_at' => $definition['due_at'],
            ];

            if ($task === null) {
                $task = Task::factory()->create($attributes);
            } else {
                $task->forceFill($attributes)->save();
            }

            $tasks[] = $task;
        }

        return $tasks;
    }

    private function ensureWorkspaceMessage(Project $project, User $author, int $projectNumber): Message
    {
        $body = "Synthetic workspace note {$projectNumber}: koordinasi lintas program siap ditinjau.";
        $message = Message::query()
            ->where('project_id', $project->getKey())
            ->where('body', $body)
            ->first();

        if ($message !== null) {
            return $message;
        }

        return Message::factory()->create([
            'project_id' => $project->getKey(),
            'author_id' => $author->getKey(),
            'body' => $body,
        ]);
    }

    private function ensureWorkspaceAttachment(
        Project $project,
        Message $message,
        User $uploader,
        int $projectNumber,
    ): Attachment {
        $originalName = "synthetic-workspace-note-{$projectNumber}.txt";
        $attachment = Attachment::withTrashed()
            ->where('project_id', $project->getKey())
            ->where('original_name', $originalName)
            ->first();
        $checksum = hash('sha256', self::DATASET.':workspace:'.$project->getKey());
        $attributes = [
            'project_id' => $project->getKey(),
            'message_id' => $message->getKey(),
            'uploaded_by_id' => $uploader->getKey(),
            'purpose' => AttachmentPurpose::Attachment,
            'disk' => 'private',
            'path' => "synthetic-demo/projects/{$project->getKey()}/workspace-note.txt",
            'original_name' => $originalName,
            'mime_type' => 'text/plain',
            'size_bytes' => 256,
            'sha256' => $checksum,
            'deduplication_key' => hash('sha256', 'synthetic-demo:'.$checksum),
        ];

        if ($attachment === null) {
            return Attachment::factory()->forMessage($message)->create($attributes);
        }

        if ($attachment->trashed()) {
            $attachment->restore();
        }

        $attachment->forceFill($attributes)->save();

        return $attachment;
    }

    private function ensureContribution(
        Project $project,
        User $owner,
        Task $task,
        ContributionStatus $status,
        ContributionReviewDecision $reviewDecision,
        string $contributionKey,
        User $reviewer,
    ): Contribution {
        $contribution = Contribution::query()
            ->where('institution_id', $project->institution_id)
            ->where('project_id', $project->getKey())
            ->where('owner_id', $owner->getKey())
            ->first();
        $attributes = [
            'institution_id' => $project->institution_id,
            'owner_id' => $owner->getKey(),
            'project_id' => $project->getKey(),
            'status' => $status,
        ];

        if ($contribution === null) {
            $contribution = Contribution::factory()->create($attributes);
        } else {
            $contribution->forceFill($attributes)->save();
        }

        $version = ContributionVersion::query()
            ->where('contribution_id', $contribution->getKey())
            ->where('version_number', 1)
            ->first();
        $versionAttributes = [
            'contribution_id' => $contribution->getKey(),
            'created_by_id' => $owner->getKey(),
            'task_id' => $task->getKey(),
            'version_number' => 1,
            'claim' => "Synthetic {$contributionKey} contribution",
            'summary' => 'Ringkasan kontribusi demo sintetis untuk validasi alur review.',
            'declaration' => 'Saya menyatakan bahwa kontribusi ini adalah data demo sintetis.',
            'created_at' => now()->subDays(2),
        ];

        if ($version === null) {
            $version = ContributionVersion::factory()->create($versionAttributes);
        }

        $this->ensureContributionEvidence($project, $owner, $version, $contributionKey);
        $this->ensureContributionReview($version, $reviewer, $reviewDecision);

        $contribution->forceFill([
            'status' => $status,
            'current_version_id' => $version->getKey(),
        ])->save();

        return $contribution->refresh()->loadMissing(['project', 'owner', 'currentVersion', 'evidence']);
    }

    private function ensureContributionEvidence(
        Project $project,
        User $owner,
        ContributionVersion $version,
        string $contributionKey,
    ): ContributionEvidence {
        $originalName = "synthetic-contribution-{$contributionKey}-{$project->getKey()}.pdf";
        $attachment = Attachment::withTrashed()
            ->where('project_id', $project->getKey())
            ->where('original_name', $originalName)
            ->first();
        $checksum = hash('sha256', self::DATASET.':evidence:'.$version->getKey());
        $attachmentAttributes = [
            'project_id' => $project->getKey(),
            'message_id' => null,
            'uploaded_by_id' => $owner->getKey(),
            'purpose' => AttachmentPurpose::Evidence,
            'disk' => 'private',
            'path' => "synthetic-demo/projects/{$project->getKey()}/{$originalName}",
            'original_name' => $originalName,
            'mime_type' => 'application/pdf',
            'size_bytes' => 4096,
            'sha256' => $checksum,
            'deduplication_key' => hash('sha256', 'synthetic-demo:'.$checksum),
        ];

        if ($attachment === null) {
            $attachment = Attachment::factory()->evidence()->create($attachmentAttributes);
        } else {
            if ($attachment->trashed()) {
                $attachment->restore();
            }

            $attachment->forceFill($attachmentAttributes)->save();
        }

        $evidence = ContributionEvidence::query()
            ->where('contribution_version_id', $version->getKey())
            ->where('attachment_id', $attachment->getKey())
            ->first();

        if ($evidence !== null) {
            return $evidence;
        }

        return ContributionEvidence::factory()->create([
            'contribution_version_id' => $version->getKey(),
            'attachment_id' => $attachment->getKey(),
            'source_label' => 'Synthetic demo evidence',
            'notes' => 'Bukti sintetis, tidak berasal dari data mahasiswa nyata.',
            'created_at' => now()->subDays(2),
        ]);
    }

    private function ensureContributionReview(
        ContributionVersion $version,
        User $reviewer,
        ContributionReviewDecision $decision,
    ): ContributionReview {
        $review = ContributionReview::query()
            ->where('contribution_version_id', $version->getKey())
            ->first();

        if ($review !== null) {
            return $review;
        }

        return ContributionReview::factory()->create([
            'contribution_version_id' => $version->getKey(),
            'reviewer_id' => $reviewer->getKey(),
            'decision' => $decision,
            'policy_version' => 'synthetic-demo-contribution-review-v1',
            'reason' => $decision === ContributionReviewDecision::Approved
                ? null
                : 'Bukti demo sintetis perlu dilengkapi sebelum disetujui.',
            'note' => 'Review untuk dataset demo sintetis.',
            'reviewed_at' => now()->subDay(),
            'created_at' => now()->subDay(),
        ]);
    }

    private function ensurePortfolioEntry(Contribution $contribution): PortfolioEntry
    {
        $entry = PortfolioEntry::query()
            ->where('contribution_id', $contribution->getKey())
            ->first();
        $version = $contribution->currentVersion;
        $attributes = [
            'institution_id' => $contribution->institution_id,
            'user_id' => $contribution->owner_id,
            'contribution_id' => $contribution->getKey(),
            'contribution_version_id' => $version->getKey(),
            'title' => $contribution->project->title,
            'summary' => 'Portfolio demo sintetis dari kontribusi yang telah diverifikasi institusi.',
            'verification_level' => PortfolioVerificationLevel::InstitutionVerified,
            'visibility' => PortfolioVisibility::Recruiter,
            'published_at' => now()->subDay(),
            'withdrawn_at' => null,
            'withdrawal_reason' => null,
        ];

        if ($entry === null) {
            return PortfolioEntry::factory()->create($attributes);
        }

        $entry->forceFill($attributes)->save();

        return $entry;
    }

    private function ensureCollaborationEvent(
        Institution $institution,
        User $actor,
        ?User $target,
        Project $project,
        CollaborationEventType $eventType,
        string $key,
        ?int $contextId = null,
        ?string $contextType = null,
    ): CollaborationEvent {
        $contextType ??= Project::class;
        $contextId ??= $project->getKey();
        $event = CollaborationEvent::query()
            ->where('institution_id', $institution->getKey())
            ->where('actor_id', $actor->getKey())
            ->where('event_type', $eventType->value)
            ->where('context_type', $contextType)
            ->where('context_id', $contextId)
            ->where('is_synthetic', true)
            ->first();

        if ($event !== null) {
            return $event;
        }

        return CollaborationEvent::factory()->create([
            'institution_id' => $institution->getKey(),
            'actor_id' => $actor->getKey(),
            'target_id' => $target?->getKey(),
            'event_type' => $eventType,
            'context_type' => $contextType,
            'context_id' => $contextId,
            'occurred_at' => now()->subDays(2),
            'metadata' => [
                'dataset' => self::DATASET,
                'is_synthetic' => true,
                'scenario_key' => $key,
            ],
            'is_synthetic' => true,
            'created_at' => now()->subDays(2),
        ]);
    }

    private function ensureMatchRunAndRecommendation(
        Institution $institution,
        User $actor,
        Project $project,
        User $candidate,
        MatchScoreVersion $version,
    ): Recommendation {
        $run = MatchRun::query()
            ->where('institution_id', $institution->getKey())
            ->where('actor_id', $actor->getKey())
            ->where('project_id', $project->getKey())
            ->where('version_id', $version->getKey())
            ->first();

        if ($run === null) {
            $run = MatchRun::factory()->create([
                'institution_id' => $institution->getKey(),
                'actor_id' => $actor->getKey(),
                'project_id' => $project->getKey(),
                'version_id' => $version->getKey(),
                'input_snapshot' => [
                    'schema_version' => 'matching-input-v1',
                    'dataset' => self::DATASET,
                    'is_synthetic' => true,
                    'candidate_id' => $candidate->getKey(),
                ],
                'computed_at' => now()->subDay(),
            ]);
        }

        $recommendation = Recommendation::query()
            ->where('match_run_id', $run->getKey())
            ->first();

        if ($recommendation !== null) {
            return $recommendation;
        }

        $scores = [
            MatchingDimension::SkillFit->value => 0.86,
            MatchingDimension::ProjectNeed->value => 0.79,
            MatchingDimension::Availability->value => 0.72,
            MatchingDimension::ConnectivityOpportunity->value => 0.64,
        ];

        return Recommendation::factory()->create([
            'match_run_id' => $run->getKey(),
            'institution_id' => $institution->getKey(),
            'project_id' => $project->getKey(),
            'candidate_id' => $candidate->getKey(),
            'component_scores' => $scores,
            'total_score' => 0.79,
            'reason_candidates' => [
                [
                    'dimension' => MatchingDimension::SkillFit->value,
                    'score' => $scores[MatchingDimension::SkillFit->value],
                    'type' => 'positive',
                    'reason' => 'Profil kandidat memiliki kecocokan skill dengan kebutuhan project.',
                ],
                [
                    'dimension' => MatchingDimension::ProjectNeed->value,
                    'score' => $scores[MatchingDimension::ProjectNeed->value],
                    'type' => 'positive',
                    'reason' => 'Pengalaman kandidat relevan dengan kebutuhan lintas program.',
                ],
                [
                    'dimension' => MatchingDimension::Availability->value,
                    'score' => $scores[MatchingDimension::Availability->value],
                    'type' => 'positive',
                    'reason' => 'Ketersediaan kandidat sesuai dengan rentang waktu project.',
                ],
                [
                    'dimension' => MatchingDimension::ConnectivityOpportunity->value,
                    'score' => $scores[MatchingDimension::ConnectivityOpportunity->value],
                    'type' => 'positive',
                    'reason' => 'Kolaborasi ini membuka peluang koneksi lintas program.',
                ],
            ],
            'expires_at' => now()->addWeek(),
        ]);
    }

    private function ensureMatchingVersion(User $admin): MatchScoreVersion
    {
        $version = MatchScoreVersion::query()->where('version', 'synthetic-demo-matching-v1')->first();

        if ($version !== null) {
            return $version;
        }

        return MatchScoreVersion::factory()->create([
            'version' => 'synthetic-demo-matching-v1',
            'dimensions' => array_map(
                static fn (MatchingDimension $dimension): string => $dimension->value,
                MatchingDimension::cases(),
            ),
            'weights' => [
                MatchingDimension::SkillFit->value => 0.35,
                MatchingDimension::ProjectNeed->value => 0.30,
                MatchingDimension::Availability->value => 0.20,
                MatchingDimension::ConnectivityOpportunity->value => 0.15,
            ],
            'parameters' => [
                'availability_target_minutes' => 1200,
                'connectivity_cap' => 5,
            ],
            'activated_at' => now()->subDay(),
            'author_id' => $admin->getKey(),
            'notes' => 'Konfigurasi matching demo sintetis, bukan benchmark produksi.',
        ]);
    }

    private function ensureInclusionScenario(
        Institution $institution,
        User $admin,
        User $subject,
        InclusionSignalVersion $version,
    ): InclusionSignal {
        $signal = InclusionSignal::query()
            ->where('institution_id', $institution->getKey())
            ->where('subject_id', $subject->getKey())
            ->where('version_id', $version->getKey())
            ->where('period', self::PERIOD)
            ->first();
        $attributes = [
            'institution_id' => $institution->getKey(),
            'subject_id' => $subject->getKey(),
            'version_id' => $version->getKey(),
            'period' => self::PERIOD,
            'restricted_feature_state' => true,
            'data_sufficiency_met' => true,
            'evidence_summary' => [
                'dataset' => self::DATASET,
                'is_synthetic' => true,
                'review_gate' => 'campus_admin_only',
                'collaboration_event_count' => 0,
                'note' => 'Sinyal demo sintetis hanya untuk tinjauan manusia yang berwenang.',
            ],
        ];

        if ($signal === null) {
            $signal = InclusionSignal::factory()->create($attributes);
        }

        $review = InclusionReview::query()
            ->where('inclusion_signal_id', $signal->getKey())
            ->where('reviewer_id', $admin->getKey())
            ->first();

        if ($review === null) {
            InclusionReview::factory()->create([
                'inclusion_signal_id' => $signal->getKey(),
                'reviewer_id' => $admin->getKey(),
                'human_conclusion' => InclusionHumanConclusion::Acknowledged,
                'support_action' => 'Menawarkan pendampingan proyek',
                'reason' => 'Review manual untuk skenario demo sintetis, tanpa diagnosis atau inferensi psikologis.',
            ]);
        }

        return $signal;
    }

    private function ensureInclusionVersion(User $admin): InclusionSignalVersion
    {
        $version = InclusionSignalVersion::query()
            ->where('version', 'synthetic-demo-inclusion-v1')
            ->first();

        if ($version !== null) {
            return $version;
        }

        return InclusionSignalVersion::factory()->create([
            'version' => 'synthetic-demo-inclusion-v1',
            'metrics' => [
                'low_collaboration_threshold' => 1,
                'is_synthetic' => true,
            ],
            'rules' => [
                'min_collaboration_events' => 5,
                'review_gate' => 'campus_admin_only',
            ],
            'governance_status' => 'draft',
            'author_id' => $admin->getKey(),
            'notes' => 'Versi aturan demo sintetis untuk skenario gated inclusion.',
        ]);
    }

    private function ensureSeedAudit(
        Institution $institution,
        User $admin,
        int $studentCount,
        int $projectCount,
    ): AuditLog {
        $operation = 'demo.synthetic_dataset_seeded';
        $reason = 'Synthetic demo dataset, no real student data.';
        $audit = AuditLog::query()
            ->where('institution_id', $institution->getKey())
            ->where('operation', $operation)
            ->where('reason', $reason)
            ->first();

        if ($audit !== null) {
            return $audit;
        }

        return AuditLog::factory()->create([
            'institution_id' => $institution->getKey(),
            'actor_id' => $admin->getKey(),
            'operation' => $operation,
            'before_summary' => [],
            'after_summary' => [
                'dataset' => self::DATASET,
                'is_synthetic' => true,
                'student_count' => $studentCount,
                'project_count' => $projectCount,
            ],
            'reason' => $reason,
            'request_context' => [
                'source' => 'DemoSeeder',
                'dataset' => self::DATASET,
                'is_synthetic' => true,
            ],
            'created_at' => now(),
        ]);
    }

    private function programFor(int $studentNumber): string
    {
        return match ($studentNumber % 3) {
            0 => 'Desain Komunikasi Visual',
            1 => 'Informatika',
            default => 'Manajemen',
        };
    }
}
