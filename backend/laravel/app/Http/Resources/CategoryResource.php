<?php

namespace App\Http\Resources;

use App\Models\Category;

class CategoryResource extends ContractResource
{
    public function toArray($request): array
    {
        /** @var Category $category */
        $category = $this->resource;

        return [
            'id' => $category->id,
            'slug' => $category->slug,
            'name' => $category->name,
            'parentId' => $category->parent_id,
        ];
    }
}
