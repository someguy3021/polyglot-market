<?php

namespace App\Domain\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    use HasUuids;

    public $timestamps = false; // в общей схеме только created_at, его ставит БД

    protected $fillable = ['slug', 'name', 'parent_id'];

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
