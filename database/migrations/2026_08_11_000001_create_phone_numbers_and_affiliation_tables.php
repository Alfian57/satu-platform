<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('phone_numbers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->restrictOnDelete();
            $table->text('number');
            $table->char('number_hash', 64)->unique();
            $table->string('masked', 32);
            $table->string('status')->default('pending');
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'verified_at']);
        });

        Schema::create('affiliation_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->restrictOnDelete();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('institution_membership_id')
                ->unique()
                ->constrained('institution_memberships')
                ->restrictOnDelete();
            $table->foreignId('roster_id')
                ->nullable()
                ->constrained('institution_rosters')
                ->restrictOnDelete();
            $table->foreignId('roster_row_id')
                ->nullable()
                ->constrained('institution_roster_rows')
                ->restrictOnDelete();
            $table->char('nim_hash', 64);
            $table->text('nim');
            $table->string('match_result');
            $table->string('status')->default('pending_review');
            $table->unsignedInteger('version')->default(1);
            $table->foreignId('review_locked_by_id')
                ->nullable()
                ->constrained('users')
                ->restrictOnDelete();
            $table->timestamp('review_locked_at')->nullable();
            $table->timestamp('review_lock_expires_at')->nullable();
            $table->timestamp('submitted_at');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'institution_id']);
            $table->index(['institution_id', 'status', 'submitted_at']);
            $table->index(['roster_id', 'status']);
            $table->index(['institution_id', 'nim_hash']);
        });

        Schema::create('affiliation_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('affiliation_request_id')
                ->constrained('affiliation_requests')
                ->restrictOnDelete();
            $table->foreignId('institution_id')->constrained()->restrictOnDelete();
            $table->foreignId('reviewer_id')->constrained('users')->restrictOnDelete();
            $table->string('decision');
            $table->string('reason_code');
            $table->string('note', 1000)->nullable();
            $table->string('policy_version');
            $table->string('previous_status');
            $table->string('new_status');
            $table->unsignedInteger('request_version');
            $table->timestamp('created_at');

            $table->index(['institution_id', 'created_at']);
            $table->index(['affiliation_request_id', 'created_at']);
        });

        $this->installAppendOnlyReviewTriggers();
    }

    public function down(): void
    {
        $this->dropAppendOnlyReviewTriggers();
        Schema::dropIfExists('affiliation_reviews');
        Schema::dropIfExists('affiliation_requests');
        Schema::dropIfExists('phone_numbers');
    }

    private function installAppendOnlyReviewTriggers(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::unprepared(
                "CREATE TRIGGER affiliation_reviews_prevent_update
                BEFORE UPDATE ON affiliation_reviews
                BEGIN
                    SELECT RAISE(ABORT, 'affiliation_reviews are append-only');
                END",
            );
            DB::unprepared(
                "CREATE TRIGGER affiliation_reviews_prevent_delete
                BEFORE DELETE ON affiliation_reviews
                BEGIN
                    SELECT RAISE(ABORT, 'affiliation_reviews are append-only');
                END",
            );

            return;
        }

        if (DB::getDriverName() === 'mysql') {
            DB::unprepared(
                "CREATE TRIGGER affiliation_reviews_prevent_update
                BEFORE UPDATE ON affiliation_reviews
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'affiliation_reviews are append-only'",
            );
            DB::unprepared(
                "CREATE TRIGGER affiliation_reviews_prevent_delete
                BEFORE DELETE ON affiliation_reviews
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'affiliation_reviews are append-only'",
            );
        }
    }

    private function dropAppendOnlyReviewTriggers(): void
    {
        if (in_array(DB::getDriverName(), ['sqlite', 'mysql'], true)) {
            DB::unprepared('DROP TRIGGER IF EXISTS affiliation_reviews_prevent_update');
            DB::unprepared('DROP TRIGGER IF EXISTS affiliation_reviews_prevent_delete');
        }
    }
};
