<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('contributions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('institution_id');
            $table->foreignId('owner_id');
            $table->foreignId('project_id');
            $table->enum('status', [
                'draft',
                'pending',
                'revision',
                'approved',
                'rejected',
                'archived',
            ])->default('draft');
            $table->unsignedBigInteger('current_version_id')->nullable();
            $table->timestamps();

            $table->foreign('institution_id', 'contributions_institution_fk')
                ->references('id')
                ->on('institutions')
                ->restrictOnDelete();
            $table->foreign('owner_id', 'contributions_owner_fk')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
            $table->foreign('project_id', 'contributions_project_fk')
                ->references('id')
                ->on('projects')
                ->restrictOnDelete();
            $table->index(
                ['institution_id', 'owner_id', 'status'],
                'contributions_institution_owner_status_idx',
            );
            $table->index(
                ['project_id', 'status'],
                'contributions_project_status_idx',
            );
        });

        Schema::create('contribution_versions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('contribution_id');
            $table->foreignId('created_by_id');
            $table->foreignId('task_id');
            $table->unsignedInteger('version_number');
            $table->string('claim', 160);
            $table->text('summary');
            $table->text('declaration');
            $table->timestamp('created_at');

            $table->foreign('contribution_id', 'contribution_versions_contribution_fk')
                ->references('id')
                ->on('contributions')
                ->restrictOnDelete();
            $table->foreign('created_by_id', 'contribution_versions_creator_fk')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
            $table->foreign('task_id', 'contribution_versions_task_fk')
                ->references('id')
                ->on('tasks')
                ->restrictOnDelete();
            $table->unique(
                ['contribution_id', 'version_number'],
                'contribution_versions_number_unique',
            );
            $table->index(
                ['contribution_id', 'created_at'],
                'contribution_versions_history_idx',
            );
        });

        Schema::create('contribution_evidence', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('contribution_version_id');
            $table->foreignId('attachment_id');
            $table->string('source_label', 160);
            $table->text('notes')->nullable();
            $table->timestamp('created_at');

            $table->foreign('contribution_version_id', 'contribution_evidence_version_fk')
                ->references('id')
                ->on('contribution_versions')
                ->restrictOnDelete();
            $table->foreign('attachment_id', 'contribution_evidence_attachment_fk')
                ->references('id')
                ->on('attachments')
                ->restrictOnDelete();
            $table->unique(
                ['contribution_version_id', 'attachment_id'],
                'contribution_evidence_version_attachment_unique',
            );
            $table->index('attachment_id', 'contribution_evidence_attachment_idx');
        });

        Schema::create('contribution_reviews', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('contribution_version_id');
            $table->foreignId('reviewer_id');
            $table->enum('decision', ['approved', 'revision', 'rejected']);
            $table->text('reason')->nullable();
            $table->text('note')->nullable();
            $table->timestamp('reviewed_at');
            $table->timestamp('created_at');

            $table->foreign('contribution_version_id', 'contribution_reviews_version_fk')
                ->references('id')
                ->on('contribution_versions')
                ->restrictOnDelete();
            $table->foreign('reviewer_id', 'contribution_reviews_reviewer_fk')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
            $table->unique(
                'contribution_version_id',
                'contribution_reviews_version_unique',
            );
            $table->index(
                ['reviewer_id', 'reviewed_at'],
                'contribution_reviews_reviewer_reviewed_idx',
            );
        });

        Schema::table('contributions', function (Blueprint $table): void {
            $table->foreign('current_version_id', 'contributions_current_version_fk')
                ->references('id')
                ->on('contribution_versions')
                ->restrictOnDelete();
        });

        $this->installIntegrityControls();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $this->dropIntegrityControls();

        Schema::table('contributions', function (Blueprint $table): void {
            $table->dropForeign('contributions_current_version_fk');
        });

        Schema::dropIfExists('contribution_reviews');
        Schema::dropIfExists('contribution_evidence');
        Schema::dropIfExists('contribution_versions');
        Schema::dropIfExists('contributions');
    }

    private function installIntegrityControls(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::unprepared(
                "CREATE TRIGGER contribution_reviews_validate_insert
                BEFORE INSERT ON contribution_reviews
                WHEN NEW.decision <> 'approved'
                    AND (NEW.reason IS NULL OR length(trim(NEW.reason)) = 0)
                BEGIN
                    SELECT RAISE(ABORT, 'Contribution review reason is required for non-approved decisions');
                END",
            );
        }

        if (DB::getDriverName() === 'mysql') {
            DB::statement(
                'ALTER TABLE contribution_reviews
                ADD CONSTRAINT contribution_reviews_reason_check
                CHECK (
                    decision = \'approved\'
                    OR (reason IS NOT NULL AND CHAR_LENGTH(TRIM(reason)) > 0)
                )',
            );
        }

        foreach (['contribution_versions', 'contribution_evidence', 'contribution_reviews'] as $table) {
            $this->installAppendOnlyTriggers($table);
        }
    }

    private function installAppendOnlyTriggers(string $table): void
    {
        if (DB::getDriverName() === 'sqlite') {
            $this->installSqliteAppendOnlyTriggers($table);

            return;
        }

        if (DB::getDriverName() === 'mysql') {
            $this->installMysqlAppendOnlyTriggers($table);
        }
    }

    private function installSqliteAppendOnlyTriggers(string $table): void
    {
        if ($table === 'contribution_versions') {
            DB::unprepared(
                'CREATE TRIGGER contribution_versions_prevent_update
                BEFORE UPDATE ON contribution_versions
                BEGIN
                    SELECT RAISE(ABORT, \'contribution_versions are append-only\');
                END',
            );
            DB::unprepared(
                'CREATE TRIGGER contribution_versions_prevent_delete
                BEFORE DELETE ON contribution_versions
                BEGIN
                    SELECT RAISE(ABORT, \'contribution_versions are append-only\');
                END',
            );

            return;
        }

        if ($table === 'contribution_evidence') {
            DB::unprepared(
                'CREATE TRIGGER contribution_evidence_prevent_update
                BEFORE UPDATE ON contribution_evidence
                BEGIN
                    SELECT RAISE(ABORT, \'contribution_evidence are append-only\');
                END',
            );
            DB::unprepared(
                'CREATE TRIGGER contribution_evidence_prevent_delete
                BEFORE DELETE ON contribution_evidence
                BEGIN
                    SELECT RAISE(ABORT, \'contribution_evidence are append-only\');
                END',
            );

            return;
        }

        if ($table === 'contribution_reviews') {
            DB::unprepared(
                'CREATE TRIGGER contribution_reviews_prevent_update
                BEFORE UPDATE ON contribution_reviews
                BEGIN
                    SELECT RAISE(ABORT, \'contribution_reviews are append-only\');
                END',
            );
            DB::unprepared(
                'CREATE TRIGGER contribution_reviews_prevent_delete
                BEFORE DELETE ON contribution_reviews
                BEGIN
                    SELECT RAISE(ABORT, \'contribution_reviews are append-only\');
                END',
            );

            return;
        }

        throw new InvalidArgumentException('Unknown contribution append-only table.');
    }

    private function installMysqlAppendOnlyTriggers(string $table): void
    {
        if ($table === 'contribution_versions') {
            DB::unprepared(
                "CREATE TRIGGER contribution_versions_prevent_update
                BEFORE UPDATE ON contribution_versions
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'contribution_versions are append-only'",
            );
            DB::unprepared(
                "CREATE TRIGGER contribution_versions_prevent_delete
                BEFORE DELETE ON contribution_versions
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'contribution_versions are append-only'",
            );

            return;
        }

        if ($table === 'contribution_evidence') {
            DB::unprepared(
                "CREATE TRIGGER contribution_evidence_prevent_update
                BEFORE UPDATE ON contribution_evidence
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'contribution_evidence are append-only'",
            );
            DB::unprepared(
                "CREATE TRIGGER contribution_evidence_prevent_delete
                BEFORE DELETE ON contribution_evidence
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'contribution_evidence are append-only'",
            );

            return;
        }

        if ($table === 'contribution_reviews') {
            DB::unprepared(
                "CREATE TRIGGER contribution_reviews_prevent_update
                BEFORE UPDATE ON contribution_reviews
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'contribution_reviews are append-only'",
            );
            DB::unprepared(
                "CREATE TRIGGER contribution_reviews_prevent_delete
                BEFORE DELETE ON contribution_reviews
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'contribution_reviews are append-only'",
            );

            return;
        }

        throw new InvalidArgumentException('Unknown contribution append-only table.');
    }

    private function dropIntegrityControls(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::unprepared('DROP TRIGGER IF EXISTS contribution_reviews_validate_insert');
        }

        foreach (['contribution_versions', 'contribution_evidence', 'contribution_reviews'] as $table) {
            $this->dropAppendOnlyTriggers($table);
        }

        if (DB::getDriverName() === 'mysql') {
            DB::statement(
                'ALTER TABLE contribution_reviews DROP CHECK contribution_reviews_reason_check',
            );
        }
    }

    private function dropAppendOnlyTriggers(string $table): void
    {
        if (in_array(DB::getDriverName(), ['sqlite', 'mysql'], true)) {
            if ($table === 'contribution_versions') {
                DB::unprepared('DROP TRIGGER IF EXISTS contribution_versions_prevent_update');
                DB::unprepared('DROP TRIGGER IF EXISTS contribution_versions_prevent_delete');

                return;
            }

            if ($table === 'contribution_evidence') {
                DB::unprepared('DROP TRIGGER IF EXISTS contribution_evidence_prevent_update');
                DB::unprepared('DROP TRIGGER IF EXISTS contribution_evidence_prevent_delete');

                return;
            }

            if ($table === 'contribution_reviews') {
                DB::unprepared('DROP TRIGGER IF EXISTS contribution_reviews_prevent_update');
                DB::unprepared('DROP TRIGGER IF EXISTS contribution_reviews_prevent_delete');

                return;
            }

            throw new InvalidArgumentException('Unknown contribution append-only table.');
        }
    }
};
