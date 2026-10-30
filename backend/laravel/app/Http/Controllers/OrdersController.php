<?php

namespace App\Http\Controllers;

use App\Http\Resources\OrderResource;
use App\Http\Resources\ShippingMethodResource;
use App\Domain\Models\IdempotencyKey;
use App\Domain\Models\Order;
use App\Domain\Models\OrderItem;
use App\Domain\Models\PromoCode;
use App\Domain\Models\ShippingMethod;
use App\Domain\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrdersController extends Controller
{
    public function shippingMethods(): JsonResponse
    {
        return response()->json([
            'data' => ShippingMethodResource::collectionArray(ShippingMethod::where('active', true)->orderBy('price')->get()),
        ]);
    }

    public function validatePromo(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => 'required|string|max:40',
            'subtotal' => 'required|numeric|min:0',
        ]);

        $promo = PromoCode::where('code', $data['code'])->first();
        $reason = $promo?->rejectionReason((float) $data['subtotal']);
        if (! $promo || $reason !== null) {
            throw ValidationException::withMessages([
                'code' => [$reason ?? 'Promo code not found.'],
            ]);
        }

        return response()->json([
            'code' => $promo->code,
            'valid' => true,
            'discount' => $promo->discountFor((float) $data['subtotal']),
            'reason' => null,
        ]);
    }

    public function create(Request $request): JsonResponse
    {
        $data = $request->validate([
            'shippingMethodCode' => 'required|string|max:50',
            'promoCode' => 'nullable|string|max:40',
            'shippingAddress' => 'required|array',
            'shippingAddress.line1' => 'required|string|max:200',
            'shippingAddress.line2' => 'nullable|string|max:200',
            'shippingAddress.city' => 'required|string|max:100',
            'shippingAddress.zip' => 'required|string|max:20',
            'shippingAddress.country' => 'required|string|size:2',
        ]);

        $key = $request->header('Idempotency-Key');
        if (! $key || ! preg_match('/^[0-9a-f-]{36}$/i', $key)) {
            throw ValidationException::withMessages([
                'Idempotency-Key' => ['A valid UUID Idempotency-Key header is required.'],
            ]);
        }

        // Идемпотентность (ADR-011): повтор тем же ключом возвращает исходный заказ
        $existing = IdempotencyKey::with('order')->where('key', $key)->where('user_id', $request->user()->id)->first();
        if ($existing) {
            return response()->json((new OrderResource($existing->order))->resolve(), 200);
        }

        $order = DB::transaction(function () use ($request, $data, $key) {
            $user = $request->user();
            $cart = $user->carts()->where('converted', false)->lockForUpdate()->first();
            $cart?->loadMissing('items.product');
            abort_if(! $cart || $cart->items->isEmpty(), 409, 'Cart is empty.');

            $subtotal = 0.0;
            foreach ($cart->items as $item) {
                $product = Product::whereKey($item->product_id)->lockForUpdate()->first();
                abort_unless($product && $product->status === 'approved', 409, "Product {$item->product->title} is not available.");
                abort_unless($product->stock >= $item->quantity, 409, "Insufficient stock for {$product->title}.");
                $subtotal += (float) $product->price * $item->quantity;
            }

            $promo = null;
            $discount = 0.0;
            if (! empty($data['promoCode'])) {
                $promo = PromoCode::where('code', $data['promoCode'])->first();
                $reason = $promo?->rejectionReason($subtotal);
                abort_unless($promo && $reason === null, 422, $reason ?? 'Promo code not found.');
                $discount = $promo->discountFor($subtotal);
            }

            $shipping = ShippingMethod::where('code', $data['shippingMethodCode'])->where('active', true)->first();
            abort_unless($shipping, 422, 'Unknown shipping method.');

            $total = round($subtotal - $discount + (float) $shipping->price, 2);
            $order = Order::create([
                'user_id' => $user->id,
                'status' => 'new',
                'subtotal' => $subtotal,
                'discount' => $discount,
                'shipping_price' => $shipping->price,
                'total' => $total,
                'promo_code_id' => $promo?->id,
                'shipping_method_id' => $shipping->id,
                'shipping_address' => $data['shippingAddress'],
            ]);

            foreach ($cart->items as $item) {
                $product = $item->product;
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'seller_id' => $product->seller_id,
                    'title' => $product->title,
                    'price' => $product->price,
                    'quantity' => $item->quantity,
                ]);
                $product->decrement('stock', $item->quantity);
            }

            if ($promo) {
                $promo->increment('used_count');
            }
            // корзина после оформления пуста: позиции списаны в заказ
            $cart->items()->delete();
            $cart->update(['converted' => true]);
            IdempotencyKey::create(['key' => $key, 'user_id' => $user->id, 'order_id' => $order->id]);

            return $order->fresh('items');
        });

        return response()->json((new OrderResource($order))->resolve(), 201);
    }

    public function myOrders(Request $request): JsonResponse
    {
        $data = $request->validate([
            'page' => 'integer|min:1',
            'perPage' => 'integer|min:1|max:100',
        ]);
        $page = $request->user()->orders()
            ->with('items', 'shippingMethod', 'promoCode')
            ->orderByDesc('created_at')
            ->paginate($data['perPage'] ?? 20, page: $data['page'] ?? 1);

        return response()->json([
            'data' => array_map(fn ($o) => (new OrderResource($o))->resolve(), $page->items()),
            'meta' => [
                'currentPage' => $page->currentPage(),
                'lastPage' => $page->lastPage(),
                'perPage' => $page->perPage(),
                'total' => $page->total(),
            ],
        ]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $order = Order::with('items', 'shippingMethod', 'promoCode')->find($id);
        abort_unless($order, 404, 'Order not found.');
        $role = $request->user()->role;
        abort_unless(
            $order->user_id === $request->user()->id || in_array($role, ['moderator', 'admin'], true),
            403,
            'Forbidden.',
        );

        return response()->json((new OrderResource($order))->resolve());
    }
}
