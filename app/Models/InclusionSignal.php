<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InclusionSignal extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'evidence_summary' => 'array',
        'restricted_feature_state' => 'boolean',
        'data_sufficiency_met' => 'boolean',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function subject()
    {
        return $this->belongsTo(User::class, 'subject_id');
    }

    public function version()
    {
        return $this->belongsTo(InclusionSignalVersion::class, 'version_id');
    }

    public function reviews()
    {
        return $this->hasMany(InclusionReview::class);
    }
}
