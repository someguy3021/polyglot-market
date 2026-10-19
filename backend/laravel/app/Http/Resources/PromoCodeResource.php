<?php

namespace App\Http\Resources;

use App\Models\PromoCode;

class PromoCodeResource extends ContractResource
{
    public function toArray($request): array
    {
        /** @var PromoCode $promo */
        $promo = $this->resource;

        return [
            'id' => $promo->id,
            'code' => $promo->code,
            'type' => $promo->type,
            'value' => (float) $promo->value,
            'minSubtotal' => (float) $promo->min_subtotal,
            'maxUses' => $promo->max_uses,
            'usedCount' => (int) $promo->used_count,
            'expiresAt' => $promo->expires_at?->toISOString(),
            'active' => (bool) $promo->active,
        ];
    }
}
