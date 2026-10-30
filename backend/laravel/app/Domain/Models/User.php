<?php

namespace App\Domain\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

/**
 * Пользователь маппит общую таблицу users (ADR-002): схема живёт в общих SQL-миграциях,
 * поле пароля здесь — password_hash.
 */
class User extends Authenticatable implements JWTSubject
{
    use HasUuids;

    protected $fillable = ['email', 'password', 'name', 'role'];

    /** Контракт отдаёт только эти поля. */
    protected $hidden = ['password', 'password_hash', 'remember_token'];

    protected function casts(): array
    {
        return [
            'blocked' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    /** Eloquent-провайдер читает `password`, схема хранит `password_hash` (ADR-002). */
    protected function password(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->password_hash,
            set: fn (string $value) => ['password_hash' => password_hash($value, PASSWORD_BCRYPT)],
        );
    }

    public function sellerProfile(): HasOne
    {
        return $this->hasOne(SellerProfile::class, 'user_id');
    }

    public function carts(): HasMany
    {
        return $this->hasMany(\App\Domain\Models\Cart::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(\App\Domain\Models\Order::class);
    }

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [];
    }
}
