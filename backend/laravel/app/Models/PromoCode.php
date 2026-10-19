<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PromoCode extends Model
{
    use HasUuids;

    public $timestamps = false; // в общей схеме только created_at, его ставит БД

    protected $fillable = ['code', 'type', 'value', 'min_subtotal', 'max_uses', 'used_count', 'expires_at', 'active'];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'min_subtotal' => 'decimal:2',
            'expires_at' => 'datetime',
            'active' => 'boolean',
        ];
    }

    /** Причина неприменимости или null, если промокод можно применить к subtotal. */
    public function rejectionReason(float $subtotal): ?string
    {
        if (! $this->active) {
            return 'Promo code is inactive.';
        }
        if ($this->expires_at !== null && $this->expires_at->isPast()) {
            return 'Promo code has expired.';
        }
        if ($this->max_uses !== null && $this->used_count >= $this->max_uses) {
            return 'Promo code usage limit reached.';
        }
        if ($subtotal < (float) $this->min_subtotal) {
            return "Promo code requires a minimum subtotal of {$this->min_subtotal}.";
        }

        return null;
    }

    public function discountFor(float $subtotal): float
    {
        $discount = $this->type === 'percent'
            ? $subtotal * ((float) $this->value) / 100
            : (float) $this->value;

        return round(min($discount, $subtotal), 2);
    }
}
