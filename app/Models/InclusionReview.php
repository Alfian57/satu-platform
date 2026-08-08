<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InclusionReview extends Model
{
    use HasFactory;

    protected $guarded = [];

    public function signal()
    {
        return $this->belongsTo(InclusionSignal::class, 'inclusion_signal_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
