<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * База ресурсов контракта: camelCase-поля и формат пагинации { data, meta }.
 * Ресурсы не используем как коллекции Laravel — собираем вручную (контракт строгий).
 */
abstract class ContractResource extends JsonResource
{
    public static function collectionArray($items): array
    {
        return array_map(fn ($item) => (new static($item))->resolve(), $items->all());
    }

    public static function paginated($paginator, callable $itemsOf): array
    {
        return [
            'data' => array_map(fn ($item) => $itemsOf($item), $paginator->items()),
            'meta' => [
                'currentPage' => $paginator->currentPage(),
                'lastPage' => $paginator->lastPage(),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }
}
