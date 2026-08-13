<?php

declare(strict_types=1);

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
        Schema::create('portfolio_entries', function (Blueprint $table) {
            $table->id();

            $table->foreignId('institution_id');
            $table->foreignId('user_id');
            $table->foreignId('contribution_id');
            $table->foreignId('contribution_version_id');

            $table->string('title', 160);
            $table->text('summary');
            $table->enum('verification_level', [
                'self_reported',
                'team_confirmed',
                'institution_verified',
            ])->default('institution_verified');
            $table->enum('visibility', [
                'private',
                'institution',
                'recruiter',
                'public',
            ])->default('private');
            $table->timestamp('published_at')->nullable();
            $table->timestamp('withdrawn_at')->nullable();
            $table->string('withdrawal_reason', 1000)->nullable();
            $table->timestamps();

            $table->foreign('institution_id', 'portfolio_entries_institution_fk')
                ->references('id')
                ->on('institutions')
                ->restrictOnDelete();
            $table->foreign('user_id', 'portfolio_entries_user_fk')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
            $table->foreign('contribution_id', 'portfolio_entries_contribution_fk')
                ->references('id')
                ->on('contributions')
                ->restrictOnDelete();
            $table->foreign('contribution_version_id', 'portfolio_entries_version_fk')
                ->references('id')
                ->on('contribution_versions')
                ->restrictOnDelete();

            $table->unique('contribution_id', 'portfolio_entries_contribution_unique');
            $table->index(
                ['institution_id', 'user_id', 'visibility', 'withdrawn_at'],
                'portfolio_entries_owner_visibility_idx',
            );
            $table->index(
                ['institution_id', 'visibility', 'withdrawn_at'],
                'portfolio_entries_audience_idx',
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('portfolio_entries');
    }
};
