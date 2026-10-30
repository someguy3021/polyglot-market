<?php

namespace App\Http\Resources;

use App\Domain\Models\User;

class UserResource extends ContractResource
{
    public function toArray($request): array
    {
        /** @var User $user */
        $user = $this->resource;

        return [
            'id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'role' => $user->role,
            'blocked' => (bool) $user->blocked,
            'shopName' => $user->sellerProfile?->shop_name,
            'createdAt' => $user->created_at?->toISOString(),
        ];
    }
}
