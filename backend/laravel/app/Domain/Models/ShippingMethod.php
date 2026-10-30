<?php

namespace App\Domain\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ShippingMethod extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = ['code', 'name', 'price', 'eta_days', 'active'];

    protected function casts(): array
    {
        return ['price' => 'decimal:2', 'active' => 'boolean'];
    }
}
