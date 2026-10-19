<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Таблица без суррогатного PK: уникальность (key, user_id) + unique(order_id) — ADR-011.
class IdempotencyKey extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    protected $primaryKey = 'key';
    public $timestamps = false;

    protected $fillable = ['key', 'user_id', 'order_id'];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
