<?php

namespace App\Domain\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SellerProfile extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = ['user_id', 'shop_name', 'description'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
