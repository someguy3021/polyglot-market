<?php

namespace App\Http\Resources;

use App\Domain\Models\ShippingMethod;

class ShippingMethodResource extends ContractResource
{
    public function toArray($request): array
    {
        /** @var ShippingMethod $method */
        $method = $this->resource;

        return [
            'code' => $method->code,
            'name' => $method->name,
            'price' => (float) $method->price,
            'etaDays' => (int) $method->eta_days,
        ];
    }
}
