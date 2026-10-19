<?php

namespace App\Http\Resources;

use App\Models\Cart;

class CartResource extends ContractResource
{
    public function toArray($request): array
    {
        /** @var Cart $cart */
        $cart = $this->resource;
        $cart->loadMissing('items.product');

        $items = $cart->items->map(fn ($item) => [
            'id' => $item->id,
            'quantity' => (int) $item->quantity,
            'product' => (new ProductResource($item->product))->resolve(),
            'lineTotal' => (float) $item->product->price * (int) $item->quantity,
        ])->all();

        return [
            'id' => $cart->id,
            'items' => $items,
            'subtotal' => round(array_sum(array_column($items, 'lineTotal')), 2),
        ];
    }
}
