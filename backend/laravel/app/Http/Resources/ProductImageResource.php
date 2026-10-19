<?php

namespace App\Http\Resources;

use App\Models\ProductImage;

class ProductImageResource extends ContractResource
{
    public function toArray($request): array
    {
        /** @var ProductImage $image */
        $image = $this->resource;

        return [
            'id' => $image->id,
            'url' => $image->url,
            'thumbUrl' => $image->thumb_url,
            'isPrimary' => (bool) $image->is_primary,
        ];
    }
}
