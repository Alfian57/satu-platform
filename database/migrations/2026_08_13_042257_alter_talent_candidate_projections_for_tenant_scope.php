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
        Schema::table('talent_candidate_projections', function (Blueprint $table): void {
            $table->index('user_id', 'talent_proj_user_idx');
            $table->dropUnique('talent_candidate_projections_user_id_unique');
            $table->unique(
                ['institution_id', 'user_id'],
                'talent_proj_institution_user_unique',
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('talent_candidate_projections', function (Blueprint $table): void {
            $table->dropUnique('talent_proj_institution_user_unique');
            $table->unique('user_id', 'talent_candidate_projections_user_id_unique');
            $table->dropIndex('talent_proj_user_idx');
        });
    }
};
