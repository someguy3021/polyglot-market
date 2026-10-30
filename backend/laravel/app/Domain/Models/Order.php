<?php

namespace App\Domain\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id', 'status', 'subtotal', 'discount', 'shipping_price', 'total',
        'promo_code_id', 'shipping_method_id', 'shipping_address',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'discount' => 'decimal:2',
            'shipping_price' => 'decimal:2',
            'total' => 'decimal:2',
            'shipping_address' => 'array',
            'created_at' => 'datetime',
        ];
    }

    /** Допустимые переходы статуса (описаны в контракте, PUT /admin/orders/{id}/status). */
    public const TRANSITIONS = [
        'new' => ['paid', 'cancelled'],
        'paid' => ['shipped', 'cancelled'],
        'shipped' => ['done'],
        'done' => [],
        'cancelled' => [],
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function shippingMethod(): BelongsTo
    {
        return $this->belongsTo(ShippingMethod::class);
    }

    public function promoCode(): BelongsTo
    {
        return $this->belongsTo(PromoCode::class);
    }
}
