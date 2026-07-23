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
        Schema::create('consent_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained()
                ->restrictOnDelete();
            $table->string('purpose', 100);
            $table->string('policy_version', 100);
            $table->string('source', 100);
            $table->timestamp('granted_at')->nullable();
            $table->timestamp('withdrawn_at')->nullable();
            $table->timestamp('occurred_at');
            $table->timestamp('created_at');

            $table->index(['user_id', 'purpose', 'occurred_at', 'id']);
        });

        $this->installIntegrityControls();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $this->dropIntegrityControls();
        Schema::dropIfExists('consent_records');
    }

    private function installIntegrityControls(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::unprepared(
                "CREATE TRIGGER consent_records_validate_insert
                BEFORE INSERT ON consent_records
                WHEN (NEW.granted_at IS NULL) = (NEW.withdrawn_at IS NULL)
                    OR NEW.occurred_at <> COALESCE(NEW.granted_at, NEW.withdrawn_at)
                BEGIN
                    SELECT RAISE(ABORT, 'consent_records require one matching event timestamp');
                END",
            );
            DB::unprepared(
                "CREATE TRIGGER consent_records_prevent_update
                BEFORE UPDATE ON consent_records
                BEGIN
                    SELECT RAISE(ABORT, 'consent_records are append-only');
                END",
            );
            DB::unprepared(
                "CREATE TRIGGER consent_records_prevent_delete
                BEFORE DELETE ON consent_records
                BEGIN
                    SELECT RAISE(ABORT, 'consent_records are append-only');
                END",
            );

            return;
        }

        if (DB::getDriverName() === 'mysql') {
            DB::statement(
                'ALTER TABLE consent_records
                ADD CONSTRAINT consent_records_event_timestamp_check
                CHECK (
                    ((granted_at IS NULL) <> (withdrawn_at IS NULL))
                    AND occurred_at = COALESCE(granted_at, withdrawn_at)
                )',
            );
            DB::unprepared(
                "CREATE TRIGGER consent_records_prevent_update
                BEFORE UPDATE ON consent_records
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'consent_records are append-only'",
            );
            DB::unprepared(
                "CREATE TRIGGER consent_records_prevent_delete
                BEFORE DELETE ON consent_records
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'consent_records are append-only'",
            );
        }
    }

    private function dropIntegrityControls(): void
    {
        if (in_array(DB::getDriverName(), ['sqlite', 'mysql'], true)) {
            DB::unprepared('DROP TRIGGER IF EXISTS consent_records_validate_insert');
            DB::unprepared('DROP TRIGGER IF EXISTS consent_records_prevent_update');
            DB::unprepared('DROP TRIGGER IF EXISTS consent_records_prevent_delete');
        }
    }
};
