<?php

namespace App\Http\Resources;

use App\Models\Product;

class ProductResource extends ContractResource
{
    public function toArray($request): array
    {
        /** @var Product $product */
        $product = $this->resource->loadMissing('seller.sellerProfile', 'category', 'images');

        return [
            'id' => $product->id,
            'title' => $product->title,
            'slug' => $product->slug,
            'description' => $product->description,
            'price' => (float) $product->price,
            'stock' => (int) $product->stock,
            'status' => $product->status,
            'rejectionReason' => $product->rejection_reason,
            'categoryId' => $product->category_id,
            'category' => [
                'id' => $product->category->id,
                'slug' => $product->category->slug,
                'name' => $product->category->name,
                'parentId' => $product->category->parent_id,
            ],
            'seller' => [
                'id' => $product->seller_id,
                'shopName' => $product->seller->sellerProfile?->shop_name ?? $product->seller->name,
            ],
            'images' => array_map(
                fn ($image) => (new ProductImageResource($image))->resolve(),
                $product->images->all(),
            ),
            'createdAt' => $product->created_at?->toISOString(),
            'updatedAt' => $product->updated_at?->toISOString(),
        ];
    }
}
