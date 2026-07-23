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
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')
                ->nullable()
                ->constrained()
                ->restrictOnDelete();
            $table->foreignId('actor_id')
                ->nullable()
                ->constrained('users')
                ->restrictOnDelete();
            $table->string('operation', 100);
            $table->nullableMorphs('auditable');
            $table->json('before_summary')->nullable();
            $table->json('after_summary')->nullable();
            $table->string('reason', 1000)->nullable();
            $table->json('request_context')->nullable();
            $table->timestamp('created_at');

            $table->index(['institution_id', 'created_at']);
            $table->index(['actor_id', 'created_at']);
            $table->index(['operation', 'created_at']);
        });

        $this->installAppendOnlyTriggers();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $this->dropAppendOnlyTriggers();
        Schema::dropIfExists('audit_logs');
    }

    private function installAppendOnlyTriggers(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::unprepared(
                "CREATE TRIGGER audit_logs_validate_auditable
                BEFORE INSERT ON audit_logs
                WHEN (NEW.auditable_type IS NULL) <> (NEW.auditable_id IS NULL)
                BEGIN
                    SELECT RAISE(ABORT, 'audit_logs require a complete auditable reference');
                END",
            );
            DB::unprepared(
                "CREATE TRIGGER audit_logs_prevent_update
                BEFORE UPDATE ON audit_logs
                BEGIN
                    SELECT RAISE(ABORT, 'audit_logs are append-only');
                END",
            );
            DB::unprepared(
                "CREATE TRIGGER audit_logs_prevent_delete
                BEFORE DELETE ON audit_logs
                BEGIN
                    SELECT RAISE(ABORT, 'audit_logs are append-only');
                END",
            );

            return;
        }

        if (DB::getDriverName() === 'mysql') {
            DB::statement(
                'ALTER TABLE audit_logs
                ADD CONSTRAINT audit_logs_auditable_reference_check
                CHECK ((auditable_type IS NULL) = (auditable_id IS NULL))',
            );
            DB::unprepared(
                "CREATE TRIGGER audit_logs_prevent_update
                BEFORE UPDATE ON audit_logs
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'audit_logs are append-only'",
            );
            DB::unprepared(
                "CREATE TRIGGER audit_logs_prevent_delete
                BEFORE DELETE ON audit_logs
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'audit_logs are append-only'",
            );
        }
    }

    private function dropAppendOnlyTriggers(): void
    {
        if (in_array(DB::getDriverName(), ['sqlite', 'mysql'], true)) {
            DB::unprepared('DROP TRIGGER IF EXISTS audit_logs_validate_auditable');
            DB::unprepared('DROP TRIGGER IF EXISTS audit_logs_prevent_update');
            DB::unprepared('DROP TRIGGER IF EXISTS audit_logs_prevent_delete');
        }
    }
};
