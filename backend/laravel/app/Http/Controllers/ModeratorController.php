<?php

namespace App\Http\Controllers;

use App\Http\Resources\ContractResource;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ModeratorController extends Controller
{
    public function queue(Request $request): JsonResponse
    {
        $this->requireModerator($request);
        $data = $request->validate([
            'page' => 'integer|min:1',
            'perPage' => 'integer|min:1|max:100',
        ]);
        $page = Product::where('status', 'pending_moderation')
            ->with('category', 'seller.sellerProfile', 'images')
            ->orderBy('created_at')
            ->paginate($data['perPage'] ?? 20, page: $data['page'] ?? 1);

        return response()->json(ContractResource::paginated($page, fn ($p) => (new ProductResource($p))->resolve()));
    }

    public function approve(Request $request, string $id): JsonResponse
    {
        $this->requireModerator($request);
        $product = Product::with('category', 'seller.sellerProfile', 'images')->find($id);
        abort_unless($product, 404, 'Product not found.');
        abort_unless($product->status === 'pending_moderation', 409, 'Product is not in the moderation queue.');
        $product->update(['status' => 'approved', 'rejection_reason' => null]);

        return response()->json((new ProductResource($product))->resolve());
    }

    public function reject(Request $request, string $id): JsonResponse
    {
        $this->requireModerator($request);
        $data = $request->validate(['reason' => 'required|string|min:4|max:500']);
        $product = Product::with('category', 'seller.sellerProfile', 'images')->find($id);
        abort_unless($product, 404, 'Product not found.');
        abort_unless($product->status === 'pending_moderation', 409, 'Product is not in the moderation queue.');
        $product->update(['status' => 'rejected', 'rejection_reason' => $data['reason']]);

        return response()->json((new ProductResource($product))->resolve());
    }

    private function requireModerator(Request $request): void
    {
        abort_unless(in_array($request->user()?->role, ['moderator', 'admin'], true), 403, 'Moderator role required.');
    }
}
