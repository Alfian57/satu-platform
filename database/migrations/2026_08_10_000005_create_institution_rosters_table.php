<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('institution_rosters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained('institutions')->restrictOnDelete();
            $table->string('semester');
            $table->string('source_filename');
            $table->string('checksum');
            $table->unsignedInteger('total_rows')->default(0);
            $table->unsignedInteger('valid_rows')->default(0);
            $table->unsignedInteger('error_rows')->default(0);
            $table->string('status')->default('imported');
            $table->foreignId('imported_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('institution_roster_rows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('roster_id')->constrained('institution_rosters')->cascadeOnDelete();
            $table->string('nim')->comment('normalized NIM');
            $table->string('nama')->comment('display name from roster');
            $table->string('program_studi');
            $table->string('angkatan')->nullable();
            $table->string('semester');
            $table->string('phone')->comment('normalized E.164');
            $table->boolean('is_active')->default(true);
            $table->json('validation_errors')->nullable();
            $table->timestamps();

            $table->index(['nim', 'roster_id']);
            $table->index(['phone', 'roster_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('institution_roster_rows');
        Schema::dropIfExists('institution_rosters');
    }
};
