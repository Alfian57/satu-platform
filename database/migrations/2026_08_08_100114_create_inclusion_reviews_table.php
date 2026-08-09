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
        Schema::create('inclusion_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inclusion_signal_id')->constrained()->cascadeOnDelete();
            $table->foreignId('reviewer_id')->constrained('users')->cascadeOnDelete();
            $table->string('human_conclusion');
            $table->string('support_action')->nullable();
            $table->text('reason')->nullable();
            $table->timestamps();
        });

        $this->installAppendOnlyTriggers();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $this->dropAppendOnlyTriggers();
        Schema::dropIfExists('inclusion_reviews');
    }

    private function installAppendOnlyTriggers(): void
    {
        if (\Illuminate\Support\Facades\DB::getDriverName() === 'sqlite') {
            \Illuminate\Support\Facades\DB::unprepared(
                "CREATE TRIGGER inclusion_reviews_prevent_update
                BEFORE UPDATE ON inclusion_reviews
                BEGIN
                    SELECT RAISE(ABORT, 'inclusion_reviews are append-only');
                END"
            );
            \Illuminate\Support\Facades\DB::unprepared(
                "CREATE TRIGGER inclusion_reviews_prevent_delete
                BEFORE DELETE ON inclusion_reviews
                BEGIN
                    SELECT RAISE(ABORT, 'inclusion_reviews are append-only');
                END"
            );
            return;
        }

        if (\Illuminate\Support\Facades\DB::getDriverName() === 'mysql') {
            \Illuminate\Support\Facades\DB::unprepared(
                "CREATE TRIGGER inclusion_reviews_prevent_update
                BEFORE UPDATE ON inclusion_reviews
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'inclusion_reviews are append-only'"
            );
            \Illuminate\Support\Facades\DB::unprepared(
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
        if (in_array(\Illuminate\Support\Facades\DB::getDriverName(), ['sqlite', 'mysql'], true)) {
            \Illuminate\Support\Facades\DB::unprepared('DROP TRIGGER IF EXISTS inclusion_reviews_prevent_update');
            \Illuminate\Support\Facades\DB::unprepared('DROP TRIGGER IF EXISTS inclusion_reviews_prevent_delete');
        }
    }
};
