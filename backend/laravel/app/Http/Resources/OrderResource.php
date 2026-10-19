<?php

namespace App\Http\Resources;

use App\Models\Order;

class OrderResource extends ContractResource
{
    public function toArray($request): array
    {
        /** @var Order $order */
        $order = $this->resource->loadMissing('items', 'shippingMethod', 'promoCode');

        return [
            'id' => $order->id,
            'userId' => $order->user_id,
            'status' => $order->status,
            'subtotal' => (float) $order->subtotal,
            'discount' => (float) $order->discount,
            'shippingPrice' => (float) $order->shipping_price,
            'total' => (float) $order->total,
            'promoCode' => $order->promoCode?->code,
            'shippingMethod' => [
                'code' => $order->shippingMethod->code,
                'name' => $order->shippingMethod->name,
                'price' => (float) $order->shippingMethod->price,
                'etaDays' => (int) $order->shippingMethod->eta_days,
            ],
            'shippingAddress' => $order->shipping_address,
            'items' => $order->items->map(fn ($item) => [
                'id' => $item->id,
                'productId' => $item->product_id,
                'title' => $item->title,
                'price' => (float) $item->price,
                'quantity' => (int) $item->quantity,
            ])->all(),
            'createdAt' => $order->created_at?->toISOString(),
            'updatedAt' => $order->updated_at?->toISOString(),
        ];
    }
}
