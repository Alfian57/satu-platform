<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recruiter_entitlements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recruiter_organization_id')->constrained()->cascadeOnDelete();
            $table->string('scope', 50);
            $table->string('status', 50)->default('active');
            $table->timestamp('starts_at');
            $table->timestamp('ends_at')->nullable();
            $table->foreignId('issuer_id')->constrained('users')->restrictOnDelete();
            $table->text('reason')->nullable();
            $table->timestamps();

            $table->index(['recruiter_organization_id', 'status'], 'recruiter_ent_org_status_idx');
        });

        Schema::create('recruiter_entitlement_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recruiter_entitlement_id')->constrained()->cascadeOnDelete();
            $table->foreignId('actor_id')->constrained('users')->restrictOnDelete();
            $table->string('event', 50);
            $table->text('reason')->nullable();
            $table->timestamp('created_at');

            $table->index(['recruiter_entitlement_id', 'created_at'], 'recruiter_ent_log_idx');
        });

        $this->installAppendOnlyTriggers();
    }

    public function down(): void
    {
        $this->dropAppendOnlyTriggers();
        Schema::dropIfExists('recruiter_entitlement_logs');
        Schema::dropIfExists('recruiter_entitlements');
    }

    private function installAppendOnlyTriggers(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::unprepared(
                "CREATE TRIGGER recruiter_entitlement_logs_prevent_update
                BEFORE UPDATE ON recruiter_entitlement_logs
                BEGIN
                    SELECT RAISE(ABORT, 'recruiter_entitlement_logs are append-only');
                END"
            );
            DB::unprepared(
                "CREATE TRIGGER recruiter_entitlement_logs_prevent_delete
                BEFORE DELETE ON recruiter_entitlement_logs
                BEGIN
                    SELECT RAISE(ABORT, 'recruiter_entitlement_logs are append-only');
                END"
            );

            return;
        }

        if (DB::getDriverName() === 'mysql') {
            DB::unprepared(
                "CREATE TRIGGER recruiter_entitlement_logs_prevent_update
                BEFORE UPDATE ON recruiter_entitlement_logs
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'recruiter_entitlement_logs are append-only'"
            );
            DB::unprepared(
                "CREATE TRIGGER recruiter_entitlement_logs_prevent_delete
                BEFORE DELETE ON recruiter_entitlement_logs
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'recruiter_entitlement_logs are append-only'"
            );
        }
    }

    private function dropAppendOnlyTriggers(): void
    {
        if (in_array(DB::getDriverName(), ['sqlite', 'mysql'], true)) {
            DB::unprepared('DROP TRIGGER IF EXISTS recruiter_entitlement_logs_prevent_update');
            DB::unprepared('DROP TRIGGER IF EXISTS recruiter_entitlement_logs_prevent_delete');
        }
    }
};
