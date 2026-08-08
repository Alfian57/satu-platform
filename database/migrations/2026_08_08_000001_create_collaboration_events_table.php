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
        Schema::create('collaboration_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')
                ->constrained()
                ->restrictOnDelete();
            $table->foreignId('actor_id')
                ->constrained('users')
                ->restrictOnDelete();
            $table->foreignId('target_id')
                ->nullable()
                ->constrained('users')
                ->restrictOnDelete();
            $table->string('event_type', 50);
            $table->nullableMorphs('context');
            $table->timestamp('occurred_at');
            $table->json('metadata')->nullable();
            $table->boolean('is_synthetic')->default(false);
            $table->timestamp('created_at');

            $table->index(['institution_id', 'occurred_at']);
            $table->index(['actor_id', 'occurred_at']);
            $table->index(['target_id', 'occurred_at']);
            $table->index(['event_type', 'occurred_at']);
        });

        $this->installAppendOnlyTriggers();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $this->dropAppendOnlyTriggers();
        Schema::dropIfExists('collaboration_events');
    }

    private function installAppendOnlyTriggers(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::unprepared(
                "CREATE TRIGGER collaboration_events_prevent_update
                BEFORE UPDATE ON collaboration_events
                BEGIN
                    SELECT RAISE(ABORT, 'collaboration_events are append-only');
                END",
            );
            DB::unprepared(
                "CREATE TRIGGER collaboration_events_prevent_delete
                BEFORE DELETE ON collaboration_events
                BEGIN
                    SELECT RAISE(ABORT, 'collaboration_events are append-only');
                END",
            );

            return;
        }

        if (DB::getDriverName() === 'mysql') {
            DB::unprepared(
                "CREATE TRIGGER collaboration_events_prevent_update
                BEFORE UPDATE ON collaboration_events
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'collaboration_events are append-only'",
            );
            DB::unprepared(
                "CREATE TRIGGER collaboration_events_prevent_delete
                BEFORE DELETE ON collaboration_events
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'collaboration_events are append-only'",
            );
        }
    }

    private function dropAppendOnlyTriggers(): void
    {
        if (in_array(DB::getDriverName(), ['sqlite', 'mysql'], true)) {
            DB::unprepared('DROP TRIGGER IF EXISTS collaboration_events_prevent_update');
            DB::unprepared('DROP TRIGGER IF EXISTS collaboration_events_prevent_delete');
        }
    }
};
