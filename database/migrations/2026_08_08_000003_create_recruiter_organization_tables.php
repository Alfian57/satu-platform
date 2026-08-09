<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recruiter_organizations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('industry')->nullable();
            $table->string('website')->nullable();
            $table->json('evidence_metadata')->nullable();
            $table->string('status', 50)->default('pending');
            $table->timestamps();

            $table->index('status');
        });

        Schema::create('recruiter_memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recruiter_organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role', 50);
            $table->string('status', 50)->default('pending');
            $table->timestamps();

            $table->unique(['recruiter_organization_id', 'user_id'], 'recruiter_membership_unique');
        });

        Schema::create('recruiter_verification_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recruiter_organization_id')->constrained()->restrictOnDelete();
            $table->foreignId('reviewer_id')->constrained('users')->restrictOnDelete();
            $table->string('conclusion', 50);
            $table->text('reason')->nullable();
            $table->timestamp('created_at');

            $table->index(['recruiter_organization_id', 'created_at'], 'recruiter_reviews_org_created_idx');
        });

        $this->installAppendOnlyTriggers();
    }

    public function down(): void
    {
        $this->dropAppendOnlyTriggers();
        Schema::dropIfExists('recruiter_verification_reviews');
        Schema::dropIfExists('recruiter_memberships');
        Schema::dropIfExists('recruiter_organizations');
    }

    private function installAppendOnlyTriggers(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::unprepared(
                "CREATE TRIGGER recruiter_verification_prevent_update
                BEFORE UPDATE ON recruiter_verification_reviews
                BEGIN
                    SELECT RAISE(ABORT, 'recruiter_verification_reviews are append-only');
                END"
            );
            DB::unprepared(
                "CREATE TRIGGER recruiter_verification_prevent_delete
                BEFORE DELETE ON recruiter_verification_reviews
                BEGIN
                    SELECT RAISE(ABORT, 'recruiter_verification_reviews are append-only');
                END"
            );

            return;
        }

        if (DB::getDriverName() === 'mysql') {
            DB::unprepared(
                "CREATE TRIGGER recruiter_verification_prevent_update
                BEFORE UPDATE ON recruiter_verification_reviews
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'recruiter_verification_reviews are append-only'"
            );
            DB::unprepared(
                "CREATE TRIGGER recruiter_verification_prevent_delete
                BEFORE DELETE ON recruiter_verification_reviews
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'recruiter_verification_reviews are append-only'"
            );
        }
    }

    private function dropAppendOnlyTriggers(): void
    {
        if (in_array(DB::getDriverName(), ['sqlite', 'mysql'], true)) {
            DB::unprepared('DROP TRIGGER IF EXISTS recruiter_verification_prevent_update');
            DB::unprepared('DROP TRIGGER IF EXISTS recruiter_verification_prevent_delete');
        }
    }
};
