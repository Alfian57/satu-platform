<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InclusionSignalVersion extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'metrics' => 'array',
        'rules' => 'array',
    ];

    public function signals()
    {
        return $this->hasMany(InclusionSignal::class, 'version_id');
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
