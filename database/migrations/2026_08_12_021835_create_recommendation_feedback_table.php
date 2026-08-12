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
        Schema::create('recommendation_feedback', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('recommendation_id');
            $table->foreignId('institution_id');
            $table->foreignId('actor_id');
            $table->string('feedback_type', 30);
            $table->timestamp('created_at');

            $table->foreign('recommendation_id', 'recommendation_feedback_recommendation_fk')
                ->references('id')
                ->on('recommendations')
                ->restrictOnDelete();
            $table->foreign('institution_id', 'recommendation_feedback_institution_fk')
                ->references('id')
                ->on('institutions')
                ->restrictOnDelete();
            $table->foreign('actor_id', 'recommendation_feedback_actor_fk')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
            $table->unique(
                ['recommendation_id', 'actor_id'],
                'recommendation_feedback_recommendation_actor_uq',
            );
            $table->index(
                ['institution_id', 'actor_id', 'feedback_type'],
                'recommendation_feedback_tenant_actor_type_idx',
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
        Schema::dropIfExists('recommendation_feedback');
    }

    private function installAppendOnlyTriggers(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::unprepared(
                "CREATE TRIGGER recommendation_feedback_prevent_update
                BEFORE UPDATE ON recommendation_feedback
                BEGIN
                    SELECT RAISE(ABORT, 'recommendation_feedback is append-only');
                END",
            );
            DB::unprepared(
                "CREATE TRIGGER recommendation_feedback_prevent_delete
                BEFORE DELETE ON recommendation_feedback
                BEGIN
                    SELECT RAISE(ABORT, 'recommendation_feedback is append-only');
                END",
            );

            return;
        }

        if (DB::getDriverName() === 'mysql') {
            DB::unprepared(
                "CREATE TRIGGER recommendation_feedback_prevent_update
                BEFORE UPDATE ON recommendation_feedback
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'recommendation_feedback is append-only'",
            );
            DB::unprepared(
                "CREATE TRIGGER recommendation_feedback_prevent_delete
                BEFORE DELETE ON recommendation_feedback
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'recommendation_feedback is append-only'",
            );
        }
    }

    private function dropAppendOnlyTriggers(): void
    {
        if (in_array(DB::getDriverName(), ['sqlite', 'mysql'], true)) {
            DB::unprepared('DROP TRIGGER IF EXISTS recommendation_feedback_prevent_update');
            DB::unprepared('DROP TRIGGER IF EXISTS recommendation_feedback_prevent_delete');
        }
    }
};
