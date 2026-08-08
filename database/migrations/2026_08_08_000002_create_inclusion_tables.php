<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inclusion_signals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->restrictOnDelete();
            $table->foreignId('subject_id')->constrained('users')->restrictOnDelete();
            $table->string('version', 50);
            $table->timestamp('period_start');
            $table->timestamp('period_end');
            $table->json('evidence_summary');
            $table->string('status', 50);
            $table->boolean('is_synthetic')->default(false);
            $table->timestamps();

            $table->index(['institution_id', 'status']);
            $table->index(['subject_id', 'period_start', 'period_end']);
        });

        Schema::create('inclusion_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inclusion_signal_id')->constrained()->restrictOnDelete();
            $table->foreignId('reviewer_id')->constrained('users')->restrictOnDelete();
            $table->string('conclusion', 50);
            $table->string('support_action', 255)->nullable();
            $table->text('reason')->nullable();
            $table->timestamp('created_at');

            $table->index(['inclusion_signal_id', 'created_at']);
        });

        $this->installAppendOnlyTriggers();
    }

    public function down(): void
    {
        $this->dropAppendOnlyTriggers();
        Schema::dropIfExists('inclusion_reviews');
        Schema::dropIfExists('inclusion_signals');
    }

    private function installAppendOnlyTriggers(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::unprepared(
                "CREATE TRIGGER inclusion_reviews_prevent_update
                BEFORE UPDATE ON inclusion_reviews
                BEGIN
                    SELECT RAISE(ABORT, 'inclusion_reviews are append-only');
                END"
            );
            DB::unprepared(
                "CREATE TRIGGER inclusion_reviews_prevent_delete
                BEFORE DELETE ON inclusion_reviews
                BEGIN
                    SELECT RAISE(ABORT, 'inclusion_reviews are append-only');
                END"
            );

            return;
        }

        if (DB::getDriverName() === 'mysql') {
            DB::unprepared(
                "CREATE TRIGGER inclusion_reviews_prevent_update
                BEFORE UPDATE ON inclusion_reviews
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'inclusion_reviews are append-only'"
            );
            DB::unprepared(
                "CREATE TRIGGER inclusion_reviews_prevent_delete
                BEFORE DELETE ON inclusion_reviews
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'inclusion_reviews are append-only'"
            );
        }
    }

    private function dropAppendOnlyTriggers(): void
    {
        if (in_array(DB::getDriverName(), ['sqlite', 'mysql'], true)) {
            DB::unprepared('DROP TRIGGER IF EXISTS inclusion_reviews_prevent_update');
            DB::unprepared('DROP TRIGGER IF EXISTS inclusion_reviews_prevent_delete');
        }
    }
};
