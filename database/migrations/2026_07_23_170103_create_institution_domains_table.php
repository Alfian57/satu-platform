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
        Schema::create('institution_domains', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')
                ->constrained()
                ->restrictOnDelete();
            $table->string('domain', 253)->unique();
            $table->enum('status', ['pending', 'verified', 'rejected', 'suspended'])
                ->default('pending');
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->index(['institution_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('institution_domains');
    }
};
