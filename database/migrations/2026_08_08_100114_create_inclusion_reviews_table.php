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
