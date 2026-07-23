<?php

namespace App\Models;

use App\Concerns\InstitutionOwned;
use App\Enums\InstitutionDomainStatus;
use Database\Factories\InstitutionDomainFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use InvalidArgumentException;

/**
 * @property int $id
 * @property int $institution_id
 * @property string $domain
 * @property InstitutionDomainStatus $status
 * @property Carbon|null $verified_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['domain'])]
class InstitutionDomain extends Model implements InstitutionOwned
{
    /** @use HasFactory<InstitutionDomainFactory> */
    use HasFactory;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => InstitutionDomainStatus::Pending->value,
    ];

    /**
     * @return BelongsTo<Institution, $this>
     */
    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function institutionId(): int
    {
        return $this->institution_id;
    }

    /**
     * Scope the query to a single explicit institution.
     *
     * @param  Builder<InstitutionDomain>  $query
     */
    #[Scope]
    protected function forInstitution(Builder $query, Institution|int $institution): void
    {
        $query->where(
            'institution_id',
            $institution instanceof Institution ? $institution->getKey() : $institution,
        );
    }

    /**
     * Normalize approved domains before persistence.
     *
     * @return Attribute<string, string>
     */
    protected function domain(): Attribute
    {
        return Attribute::make(
            set: function (string $domain): string {
                $normalizedDomain = Str::of($domain)
                    ->trim()
                    ->lower()
                    ->toString();

                if (Str::endsWith($normalizedDomain, '.')) {
                    $normalizedDomain = Str::substr($normalizedDomain, 0, -1);
                }

                if (
                    Str::endsWith($normalizedDomain, '.')
                    || filter_var($normalizedDomain, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME) === false
                ) {
                    throw new InvalidArgumentException('Institution domain must be a bare hostname.');
                }

                return $normalizedDomain;
            },
        );
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => InstitutionDomainStatus::class,
            'verified_at' => 'datetime',
        ];
    }
}
