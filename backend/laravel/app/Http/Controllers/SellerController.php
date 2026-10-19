<?php

namespace App\Http\Controllers;

use App\Http\Resources\ContractResource;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;

class SellerController extends Controller
{
    public function products(Request $request): JsonResponse
    {
        $data = $request->validate([
            'page' => 'integer|min:1',
            'perPage' => 'integer|min:1|max:100',
        ]);
        $page = Product::where('seller_id', $request->user()->id)
            ->with('category', 'images')
            ->orderByDesc('created_at')
            ->paginate($data['perPage'] ?? 20, page: $data['page'] ?? 1);

        return response()->json(ContractResource::paginated($page, fn ($p) => (new ProductResource($p))->resolve()));
    }

    public function createProduct(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === 'seller', 403, 'Seller role required.');
        $data = $this->validateProduct($request);

        $product = Product::create([
            'seller_id' => $request->user()->id,
            'category_id' => $data['categoryId'],
            'title' => $data['title'],
            'description' => $data['description'],
            'price' => $data['price'],
            'stock' => $data['stock'],
            'slug' => $this->uniqueSlug($data['title']),
            'status' => 'draft',
        ]);

        return response()->json((new ProductResource($product))->resolve(), 201);
    }

    public function updateProduct(Request $request, string $id): JsonResponse
    {
        $product = $this->ownProduct($request, $id);
        $data = $this->validateProduct($request);

        $product->update([
            'title' => $data['title'],
            'description' => $data['description'],
            'price' => $data['price'],
            'stock' => $data['stock'],
            'category_id' => $data['categoryId'],
        ]);
        // Контракт: правка одобренного товара возвращает его на модерацию
        if ($product->status === 'approved') {
            $product->update(['status' => 'draft']);
        }

        return response()->json((new ProductResource($product->fresh()))->resolve());
    }

    public function submitProduct(Request $request, string $id): JsonResponse
    {
        $product = $this->ownProduct($request, $id);
        abort_unless(in_array($product->status, ['draft', 'rejected'], true), 409, 'Only draft or rejected products can be submitted.');
        $product->update(['status' => 'pending_moderation', 'rejection_reason' => null]);

        return response()->json((new ProductResource($product))->resolve());
    }

    public function uploadImage(Request $request, string $id): JsonResponse
    {
        $product = $this->ownProduct($request, $id);
        $data = $request->validate([
            'file' => 'required|file|mimes:jpeg,png,webp|max:'.(int) config('media.max_upload_mb', 5) * 1024,
        ]);

        $file = $data['file'];
        $uuid = (string) Str::uuid();
        $ext = strtolower($file->getClientOriginalExtension() ?: 'png');
        $key = "{$product->id}/{$uuid}.{$ext}";
        $thumbKey = "{$product->id}/{$uuid}-thumb.{$ext}";

        Storage::disk('s3')->put($key, $file->getContent());
        $thumb = ImageManager::gd()->read($file->getRealPath())->scaleDown(width: 320, height: 240);
        Storage::disk('s3')->put($thumbKey, (string) $thumb->toPng());

        $isPrimary = $product->images()->count() === 0;
        $image = ProductImage::create([
            'product_id' => $product->id,
            'key' => $key,
            'thumb_key' => $thumbKey,
            'is_primary' => $isPrimary,
            'sort' => $product->images()->count(),
        ]);

        return response()->json([
            'id' => $image->id,
            'url' => $image->url,
            'thumbUrl' => $image->thumb_url,
            'isPrimary' => (bool) $image->is_primary,
        ], 201);
    }

    public function deleteImage(Request $request, string $id, string $imageId): JsonResponse
    {
        $product = $this->ownProduct($request, $id);
        $image = $product->images()->find($imageId);
        abort_unless($image, 404, 'Image not found.');

        Storage::disk('s3')->delete(array_filter([$image->key, $image->thumb_key]));
        $image->delete();

        return response()->noContent();
    }

    public function orderItems(Request $request): JsonResponse
    {
        $data = $request->validate([
            'page' => 'integer|min:1',
            'perPage' => 'integer|min:1|max:100',
        ]);
        $page = \App\Models\OrderItem::query()
            ->where('seller_id', $request->user()->id)
            ->with('order')
            ->orderByDesc('id')
            ->paginate($data['perPage'] ?? 20, page: $data['page'] ?? 1);

        return response()->json([
            'data' => array_map(fn ($item) => [
                'id' => $item->id,
                'orderId' => $item->order_id,
                'orderStatus' => $item->order->status,
                'productTitle' => $item->title,
                'title' => $item->title,
                'price' => (float) $item->price,
                'quantity' => (int) $item->quantity,
                'createdAt' => $item->order->created_at?->toISOString(),
            ], $page->items()),
            'meta' => [
                'currentPage' => $page->currentPage(),
                'lastPage' => $page->lastPage(),
                'perPage' => $page->perPage(),
                'total' => $page->total(),
            ],
        ]);
    }

    private function ownProduct(Request $request, string $id): Product
    {
        $product = Product::with('images')->find($id);
        // Чужой товар не раскрываем: как не найденный
        abort_unless($product && $product->seller_id === $request->user()->id, 404, 'Product not found.');

        return $product;
    }

    private function validateProduct(Request $request): array
    {
        return $request->validate([
            'title' => 'required|string|min:2|max:200',
            'description' => 'nullable|string|max:5000',
            'price' => 'required|numeric|min:0.01',
            'stock' => 'nullable|integer|min:0',
            'categoryId' => 'required|uuid|exists:categories,id',
        ]) + ['description' => '', 'stock' => 0];
    }

    private function uniqueSlug(string $title): string
    {
        $base = Str::slug(Str::limit($title, 60));
        $slug = $base;
        $i = 2;
        while (Product::where('slug', $slug)->exists()) {
            $slug = $base.'-'.(++$i);
        }

        return $slug;
    }
}
