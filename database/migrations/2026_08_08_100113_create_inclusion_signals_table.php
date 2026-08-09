<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('inclusion_signals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('version_id')->constrained('inclusion_signal_versions')->cascadeOnDelete();
            $table->string('period'); // e.g. '2026-S1'
            $table->boolean('restricted_feature_state')->default(false); // Indicates restricted human-review candidate
            $table->boolean('data_sufficiency_met')->default(true);
            $table->json('evidence_summary');
            $table->timestamps();

            $table->index(['institution_id', 'subject_id', 'version_id', 'period'], 'inc_signal_idx');
        });

        $this->installAppendOnlyTriggers();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $this->dropAppendOnlyTriggers();
        Schema::dropIfExists('inclusion_signals');
    }

    private function installAppendOnlyTriggers(): void
    {
        if (\Illuminate\Support\Facades\DB::getDriverName() === 'sqlite') {
            \Illuminate\Support\Facades\DB::unprepared(
                "CREATE TRIGGER inclusion_signals_prevent_update
                BEFORE UPDATE ON inclusion_signals
                BEGIN
                    SELECT RAISE(ABORT, 'inclusion_signals are append-only');
                END"
            );
            \Illuminate\Support\Facades\DB::unprepared(
                "CREATE TRIGGER inclusion_signals_prevent_delete
                BEFORE DELETE ON inclusion_signals
                BEGIN
                    SELECT RAISE(ABORT, 'inclusion_signals are append-only');
                END"
            );
            return;
        }

        if (\Illuminate\Support\Facades\DB::getDriverName() === 'mysql') {
            \Illuminate\Support\Facades\DB::unprepared(
                "CREATE TRIGGER inclusion_signals_prevent_update
                BEFORE UPDATE ON inclusion_signals
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'inclusion_signals are append-only'"
            );
            \Illuminate\Support\Facades\DB::unprepared(
                "CREATE TRIGGER inclusion_signals_prevent_delete
                BEFORE DELETE ON inclusion_signals
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'inclusion_signals are append-only'"
            );
        }
    }

    private function dropAppendOnlyTriggers(): void
    {
        if (in_array(\Illuminate\Support\Facades\DB::getDriverName(), ['sqlite', 'mysql'], true)) {
            \Illuminate\Support\Facades\DB::unprepared('DROP TRIGGER IF EXISTS inclusion_signals_prevent_update');
            \Illuminate\Support\Facades\DB::unprepared('DROP TRIGGER IF EXISTS inclusion_signals_prevent_delete');
        }
    }
};
