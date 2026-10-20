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
        Schema::create('affiliation_profile_drafts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('affiliation_request_id')
                ->unique()
                ->constrained()
                ->cascadeOnDelete();
            $table->foreignId('institution_id')->constrained()->restrictOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->longText('academic_profile');
            $table->timestamps();

            $table->unique(['institution_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('affiliation_profile_drafts');
    }
};
