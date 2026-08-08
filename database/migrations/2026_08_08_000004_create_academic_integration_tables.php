<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('integration_connections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->restrictOnDelete();
            $table->string('provider_key');
            $table->string('mode', 50)->default('sandbox');
            $table->text('encrypted_config')->nullable();
            $table->string('status', 50)->default('disconnected');
            $table->timestamps();

            $table->unique(['institution_id', 'provider_key']);
        });

        Schema::create('integration_syncs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('integration_connection_id')->constrained()->restrictOnDelete();
            $table->string('source');
            $table->string('mapping_version');
            $table->string('idempotency_key')->unique();
            $table->string('payload_digest');
            $table->string('status', 50)->default('queued');
            $table->string('external_reference')->nullable();
            $table->unsignedInteger('attempts')->default(0);
            $table->timestamp('last_attempt_at')->nullable();
            $table->timestamps();

            $table->index(['integration_connection_id', 'status']);
        });

        Schema::create('integration_sync_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('integration_sync_id')->constrained()->restrictOnDelete();
            $table->string('status', 50);
            $table->text('reason')->nullable();
            $table->json('payload_snapshot')->nullable();
            $table->timestamp('created_at');

            $table->index(['integration_sync_id', 'created_at']);
        });

        $this->installAppendOnlyTriggers();
    }

    public function down(): void
    {
        $this->dropAppendOnlyTriggers();
        Schema::dropIfExists('integration_sync_events');
        Schema::dropIfExists('integration_syncs');
        Schema::dropIfExists('integration_connections');
    }

    private function installAppendOnlyTriggers(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::unprepared(
                "CREATE TRIGGER integration_events_prevent_update
                BEFORE UPDATE ON integration_sync_events
                BEGIN
                    SELECT RAISE(ABORT, 'integration_sync_events are append-only');
                END"
            );
            DB::unprepared(
                "CREATE TRIGGER integration_events_prevent_delete
                BEFORE DELETE ON integration_sync_events
                BEGIN
                    SELECT RAISE(ABORT, 'integration_sync_events are append-only');
                END"
            );

            return;
        }

        if (DB::getDriverName() === 'mysql') {
            DB::unprepared(
                "CREATE TRIGGER integration_events_prevent_update
                BEFORE UPDATE ON integration_sync_events
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'integration_sync_events are append-only'"
            );
            DB::unprepared(
                "CREATE TRIGGER integration_events_prevent_delete
                BEFORE DELETE ON integration_sync_events
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'integration_sync_events are append-only'"
            );
        }
    }

    private function dropAppendOnlyTriggers(): void
    {
        if (in_array(DB::getDriverName(), ['sqlite', 'mysql'], true)) {
            DB::unprepared('DROP TRIGGER IF EXISTS integration_events_prevent_update');
            DB::unprepared('DROP TRIGGER IF EXISTS integration_events_prevent_delete');
        }
    }
};
