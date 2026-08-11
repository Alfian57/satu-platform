<?php

namespace App\Models;

use Database\Factories\InstitutionRosterRowFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $roster_id
 * @property string $nim
 * @property string $nama
 * @property string $program_studi
 * @property string|null $angkatan
 * @property string $semester
 * @property string $phone
 * @property bool $is_active
 * @property array<string, mixed>|null $validation_errors
 */
class InstitutionRosterRow extends Model
{
    /** @use HasFactory<InstitutionRosterRowFactory> */
    use HasFactory;

    protected $guarded = [];

    /**
     * @return BelongsTo<InstitutionRoster, $this>
     */
    public function roster(): BelongsTo
    {
        return $this->belongsTo(InstitutionRoster::class, 'roster_id');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'validation_errors' => 'array',
        ];
    }
}
