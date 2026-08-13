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
        Schema::create('xp_ledger_entries', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id');
            $table->foreignId('institution_id');
            $table->string('semester', 100);
            $table->unsignedInteger('amount');
            $table->string('reason', 100);
            $table->string('source_type', 100);
            $table->unsignedBigInteger('source_id');
            $table->string('policy_version', 32);
            $table->timestamp('awarded_at');
            $table->unsignedBigInteger('reversal_reference_id')->nullable();
            $table->string('idempotency_key', 191);
            $table->timestamp('created_at');

            $table->foreign('user_id', 'xp_ledger_entries_user_fk')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
            $table->foreign('institution_id', 'xp_ledger_entries_institution_fk')
                ->references('id')
                ->on('institutions')
                ->restrictOnDelete();
            $table->foreign('reversal_reference_id', 'xp_ledger_entries_reversal_fk')
                ->references('id')
                ->on('xp_ledger_entries')
                ->restrictOnDelete();

            $table->unique('idempotency_key', 'xp_ledger_entries_idempotency_unique');
            $table->unique('reversal_reference_id', 'xp_ledger_entries_reversal_unique');
            $table->index(
                ['institution_id', 'semester', 'user_id'],
                'xp_ledger_entries_tenant_period_user_idx',
            );
            $table->index(
                ['source_type', 'source_id'],
                'xp_ledger_entries_source_idx',
            );
            $table->index(
                ['institution_id', 'semester', 'reversal_reference_id'],
                'xp_ledger_entries_net_period_idx',
            );
        });

        $this->installAmountIntegrityControl();
        $this->installAppendOnlyTriggers();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $this->dropAmountIntegrityControl();
        $this->dropAppendOnlyTriggers();
        Schema::dropIfExists('xp_ledger_entries');
    }

    private function installAmountIntegrityControl(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::unprepared(
                "CREATE TRIGGER xp_ledger_entries_validate_insert
                BEFORE INSERT ON xp_ledger_entries
                WHEN NEW.amount <= 0
                BEGIN
                    SELECT RAISE(ABORT, 'XP amount must be greater than zero');
                END",
            );

            return;
        }

        if (DB::getDriverName() === 'mysql') {
            DB::statement(
                'ALTER TABLE xp_ledger_entries
                ADD CONSTRAINT xp_ledger_entries_amount_check
                CHECK (amount > 0)',
            );
        }
    }

    private function dropAmountIntegrityControl(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::unprepared('DROP TRIGGER IF EXISTS xp_ledger_entries_validate_insert');

            return;
        }

        if (DB::getDriverName() === 'mysql') {
            DB::statement(
                'ALTER TABLE xp_ledger_entries DROP CHECK xp_ledger_entries_amount_check',
            );
        }
    }

    private function installAppendOnlyTriggers(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::unprepared(
                "CREATE TRIGGER xp_ledger_entries_prevent_update
                BEFORE UPDATE ON xp_ledger_entries
                BEGIN
                    SELECT RAISE(ABORT, 'xp_ledger_entries are append-only');
                END",
            );
            DB::unprepared(
                "CREATE TRIGGER xp_ledger_entries_prevent_delete
                BEFORE DELETE ON xp_ledger_entries
                BEGIN
                    SELECT RAISE(ABORT, 'xp_ledger_entries are append-only');
                END",
            );

            return;
        }

        if (DB::getDriverName() === 'mysql') {
            DB::unprepared(
                "CREATE TRIGGER xp_ledger_entries_prevent_update
                BEFORE UPDATE ON xp_ledger_entries
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'xp_ledger_entries are append-only'",
            );
            DB::unprepared(
                "CREATE TRIGGER xp_ledger_entries_prevent_delete
                BEFORE DELETE ON xp_ledger_entries
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'xp_ledger_entries are append-only'",
            );
        }
    }

    private function dropAppendOnlyTriggers(): void
    {
        if (in_array(DB::getDriverName(), ['sqlite', 'mysql'], true)) {
            DB::unprepared('DROP TRIGGER IF EXISTS xp_ledger_entries_prevent_update');
            DB::unprepared('DROP TRIGGER IF EXISTS xp_ledger_entries_prevent_delete');
        }
    }
};
