<?php

namespace App\Http\Controllers;

use App\Http\Resources\ContractResource;
use App\Http\Resources\PromoCodeResource;
use App\Http\Resources\UserResource;
use App\Domain\Models\Order;
use App\Domain\Models\PromoCode;
use App\Domain\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function __construct()
    {
        // Роль проверяем в каждом методе: admin only
    }

    private function requireAdmin(Request $request): void
    {
        abort_unless($request->user()?->role === 'admin', 403, 'Admin role required.');
    }

    public function orders(Request $request): JsonResponse
    {
        $this->requireAdmin($request);
        $data = $request->validate([
            'page' => 'integer|min:1',
            'perPage' => 'integer|min:1|max:100',
            'status' => 'in:new,paid,shipped,done,cancelled',
        ]);
        $query = Order::with('items', 'shippingMethod', 'promoCode')->orderByDesc('created_at');
        if (isset($data['status'])) {
            $query->where('status', $data['status']);
        }
        $page = $query->paginate($data['perPage'] ?? 20, page: $data['page'] ?? 1);

        return response()->json([
            'data' => array_map(fn ($o) => (new \App\Http\Resources\OrderResource($o))->resolve(), $page->items()),
            'meta' => [
                'currentPage' => $page->currentPage(),
                'lastPage' => $page->lastPage(),
                'perPage' => $page->perPage(),
                'total' => $page->total(),
            ],
        ]);
    }

    public function updateOrderStatus(Request $request, string $id): JsonResponse
    {
        $this->requireAdmin($request);
        $data = $request->validate(['status' => 'required|in:new,paid,shipped,done,cancelled']);
        $order = Order::with('items', 'shippingMethod', 'promoCode')->find($id);
        abort_unless($order, 404, 'Order not found.');

        $allowed = Order::TRANSITIONS[$order->status] ?? [];
        abort_unless(in_array($data['status'], $allowed, true), 409, "Invalid transition {$order->status} → {$data['status']}.");
        $order->update(['status' => $data['status']]);

        return response()->json((new \App\Http\Resources\OrderResource($order))->resolve());
    }

    public function users(Request $request): JsonResponse
    {
        $this->requireAdmin($request);
        $data = $request->validate([
            'page' => 'integer|min:1',
            'perPage' => 'integer|min:1|max:100',
            'role' => 'in:buyer,seller,moderator,admin',
        ]);
        $query = User::with('sellerProfile')->orderBy('created_at');
        if (isset($data['role'])) {
            $query->where('role', $data['role']);
        }
        $page = $query->paginate($data['perPage'] ?? 20, page: $data['page'] ?? 1);

        return response()->json(ContractResource::paginated($page, fn ($u) => (new UserResource($u))->resolve()));
    }

    public function updateUserRole(Request $request, string $id): JsonResponse
    {
        $this->requireAdmin($request);
        $data = $request->validate(['role' => 'required|in:buyer,seller,moderator,admin']);
        $user = User::with('sellerProfile')->find($id);
        abort_unless($user, 404, 'User not found.');
        $user->update(['role' => $data['role']]);

        return response()->json((new UserResource($user))->resolve());
    }

    public function promoCodes(Request $request): JsonResponse
    {
        $this->requireAdmin($request);

        return response()->json([
            'data' => PromoCodeResource::collectionArray(PromoCode::orderBy('code')->get()),
        ]);
    }

    public function createPromoCode(Request $request): JsonResponse
    {
        $this->requireAdmin($request);
        $data = $request->validate([
            'code' => 'required|string|regex:/^[A-Z0-9_-]{3,40}$/|unique:promo_codes,code',
            'type' => 'required|in:percent,fixed',
            'value' => 'required|numeric|min:0.01|max:1000000',
            'minSubtotal' => 'nullable|numeric|min:0',
            'maxUses' => 'nullable|integer|min:1',
            'expiresAt' => 'nullable|date',
        ]);
        abort_if(
            $data['type'] === 'percent' && $data['value'] > 100,
            422,
            'Percent discount cannot exceed 100.',
        );

        $promo = PromoCode::create([
            'code' => $data['code'],
            'type' => $data['type'],
            'value' => $data['value'],
            'min_subtotal' => $data['minSubtotal'] ?? 0,
            'max_uses' => $data['maxUses'] ?? null,
            'expires_at' => $data['expiresAt'] ?? null,
            'active' => true,
        ]);

        return response()->json((new PromoCodeResource($promo))->resolve(), 201);
    }

    public function deleteProduct(Request $request, string $id): JsonResponse
    {
        $this->requireAdmin($request);
        $product = Product::find($id);
        abort_unless($product, 404, 'Product not found.');
        try {
            $product->delete();
        } catch (\Illuminate\Database\QueryException $e) {
            // FK: товар участвует в заказах
            abort(409, 'Product is referenced by existing orders.');
        }

        return response()->noContent();
    }
}
