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
        Schema::create('badge_definitions', function (Blueprint $table): void {
            $table->id();
            $table->string('key', 100);
            $table->string('category', 40);
            $table->unsignedTinyInteger('level');
            $table->string('public_name', 120);
            $table->text('public_description');
            $table->timestamps();

            $table->unique('key', 'badge_defs_key_unique');
            $table->index('category', 'badge_defs_category_idx');
        });

        Schema::create('badge_rule_versions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('badge_definition_id');
            $table->unsignedInteger('version');
            $table->string('rule_type', 64);
            $table->json('criteria');
            $table->string('policy_version', 32);
            $table->boolean('is_active')->default(false);
            $table->foreignId('created_by_id')->nullable();
            $table->timestamp('activated_at')->nullable();
            $table->timestamps();

            $table->foreign('badge_definition_id', 'badge_rules_definition_fk')
                ->references('id')
                ->on('badge_definitions')
                ->restrictOnDelete();
            $table->foreign('created_by_id', 'badge_rules_creator_fk')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
            $table->unique(
                ['badge_definition_id', 'version'],
                'badge_rules_def_ver_unique',
            );
            $table->index(
                ['badge_definition_id', 'is_active'],
                'badge_rules_active_idx',
            );
        });

        Schema::create('badge_awards', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id');
            $table->foreignId('institution_id');
            $table->foreignId('badge_definition_id');
            $table->foreignId('badge_rule_version_id');
            $table->string('source_type', 100);
            $table->unsignedBigInteger('source_id');
            $table->unsignedBigInteger('source_version_id')->nullable();
            $table->string('source_label', 160);
            $table->text('reason')->nullable();
            $table->string('idempotency_key', 191);
            $table->timestamp('awarded_at');
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();

            $table->foreign('user_id', 'badge_awards_user_fk')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
            $table->foreign('institution_id', 'badge_awards_institution_fk')
                ->references('id')
                ->on('institutions')
                ->restrictOnDelete();
            $table->foreign('badge_definition_id', 'badge_awards_definition_fk')
                ->references('id')
                ->on('badge_definitions')
                ->restrictOnDelete();
            $table->foreign('badge_rule_version_id', 'badge_awards_rule_fk')
                ->references('id')
                ->on('badge_rule_versions')
                ->restrictOnDelete();
            $table->foreign('source_version_id', 'badge_awards_source_version_fk')
                ->references('id')
                ->on('contribution_versions')
                ->restrictOnDelete();
            $table->unique('idempotency_key', 'badge_awards_idempotency_unique');
            $table->index(
                ['institution_id', 'user_id'],
                'badge_awards_tenant_user_idx',
            );
            $table->index(
                ['badge_definition_id', 'user_id'],
                'badge_awards_definition_user_idx',
            );
            $table->index(
                ['source_type', 'source_id'],
                'badge_awards_source_idx',
            );
            $table->index(
                ['institution_id', 'revoked_at'],
                'badge_awards_active_idx',
            );
        });

        Schema::create('badge_revocations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('badge_award_id');
            $table->foreignId('actor_id');
            $table->text('reason');
            $table->timestamp('revoked_at');
            $table->timestamp('created_at');

            $table->foreign('badge_award_id', 'badge_revocations_award_fk')
                ->references('id')
                ->on('badge_awards')
                ->restrictOnDelete();
            $table->foreign('actor_id', 'badge_revocations_actor_fk')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
            $table->unique('badge_award_id', 'badge_revocations_award_unique');
            $table->index(
                ['actor_id', 'revoked_at'],
                'badge_revocations_actor_idx',
            );
        });

        $this->installAppendOnlyTriggers();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $this->dropAppendOnlyTriggers();
        Schema::dropIfExists('badge_revocations');
        Schema::dropIfExists('badge_awards');
        Schema::dropIfExists('badge_rule_versions');
        Schema::dropIfExists('badge_definitions');
    }

    private function installAppendOnlyTriggers(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::unprepared(
                "CREATE TRIGGER badge_revocations_prevent_update
                BEFORE UPDATE ON badge_revocations
                BEGIN
                    SELECT RAISE(ABORT, 'badge_revocations are append-only');
                END",
            );
            DB::unprepared(
                "CREATE TRIGGER badge_revocations_prevent_delete
                BEFORE DELETE ON badge_revocations
                BEGIN
                    SELECT RAISE(ABORT, 'badge_revocations are append-only');
                END",
            );

            return;
        }

        if (DB::getDriverName() === 'mysql') {
            DB::unprepared(
                "CREATE TRIGGER badge_revocations_prevent_update
                BEFORE UPDATE ON badge_revocations
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'badge_revocations are append-only'",
            );
            DB::unprepared(
                "CREATE TRIGGER badge_revocations_prevent_delete
                BEFORE DELETE ON badge_revocations
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'badge_revocations are append-only'",
            );
        }
    }

    private function dropAppendOnlyTriggers(): void
    {
        if (in_array(DB::getDriverName(), ['sqlite', 'mysql'], true)) {
            DB::unprepared('DROP TRIGGER IF EXISTS badge_revocations_prevent_update');
            DB::unprepared('DROP TRIGGER IF EXISTS badge_revocations_prevent_delete');
        }
    }
};
