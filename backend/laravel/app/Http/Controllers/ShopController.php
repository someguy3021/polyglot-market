<?php

namespace App\Http\Controllers;

use App\Http\Resources\CartResource;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\ContractResource;
use App\Http\Resources\ProductResource;
use App\Domain\Models\Category;
use App\Domain\Models\Cart;
use App\Domain\Models\CartItem;
use App\Domain\Models\Product;
use App\Application\Services\CartResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ShopController extends Controller
{
    public function __construct(private CartResolver $carts) {}

    // ---------- Каталог ----------

    public function products(Request $request): JsonResponse
    {
        $data = $request->validate([
            'page' => 'integer|min:1',
            'perPage' => 'integer|min:1|max:100',
            'category' => 'string|max:100',
            'seller' => 'string|max:100',
            'q' => 'string|min:2|max:100',
            'price_min' => 'numeric|min:0',
            'price_max' => 'numeric|min:0',
            'sort' => 'in:newest,oldest,price_asc,price_desc',
        ]);

        $query = Product::query()
            ->where('status', 'approved')
            ->with(['category', 'seller.sellerProfile', 'images']);

        if ($slug = $data['category'] ?? null) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $slug));
        }
        if ($shop = $data['seller'] ?? null) {
            $query->whereHas('seller.sellerProfile', fn ($q) => $q->where('shop_name', $shop));
        }
        if ($q = $data['q'] ?? null) {
            $query->where('title', 'ilike', '%'.$q.'%');
        }
        if (isset($data['price_min'])) {
            $query->where('price', '>=', $data['price_min']);
        }
        if (isset($data['price_max'])) {
            $query->where('price', '<=', $data['price_max']);
        }
        $query->orderBy(match ($data['sort'] ?? 'newest') {
            'oldest' => 'created_at',
            'price_asc' => 'price',
            'price_desc' => 'price',
            default => 'created_at',
        }, match ($data['sort'] ?? 'newest') {
            'price_asc' => 'asc',
            'price_desc' => 'desc',
            default => 'desc',
        });

        $page = $query->paginate($data['perPage'] ?? 20, page: $data['page'] ?? 1);

        return response()->json(ContractResource::paginated($page, fn ($p) => (new ProductResource($p))->resolve()));
    }

    public function product(string $id): JsonResponse
    {
        $product = Product::where('status', 'approved')
            ->with(['category', 'seller.sellerProfile', 'images'])
            ->find($id);
        abort_unless($product, 404, 'Product not found.');

        return response()->json((new ProductResource($product))->resolve());
    }

    public function categories(): JsonResponse
    {
        return response()->json([
            'data' => CategoryResource::collectionArray(Category::orderBy('name')->get()),
        ]);
    }

    // ---------- Корзина ----------

    public function cart(Request $request): JsonResponse
    {
        return response()->json((new CartResource($this->carts->resolve($request)))->resolve());
    }

    public function addCartItem(Request $request): JsonResponse
    {
        $data = $request->validate([
            'productId' => 'required|uuid',
            'quantity' => 'required|integer|min:1|max:99',
        ]);

        $product = Product::find($data['productId']);
        abort_unless($product, 404, 'Product not found.');
        abort_unless($product->status === 'approved', 409, 'Product is not available for purchase.');
        abort_unless($product->stock > 0, 409, 'Product is out of stock.');

        $cart = $this->carts->resolve($request);
        $existing = $cart->items()->where('product_id', $product->id)->first();
        $newQty = ($existing?->quantity ?? 0) + $data['quantity'];
        abort_unless($newQty <= $product->stock, 409, 'Requested quantity exceeds stock.');

        if ($existing) {
            $existing->update(['quantity' => $newQty]);
        } else {
            CartItem::create(['cart_id' => $cart->id, 'product_id' => $product->id, 'quantity' => $data['quantity']]);
        }

        return $this->cartResponse($request, $cart, 201);
    }

    public function updateCartItem(Request $request, string $id): JsonResponse
    {
        $data = $request->validate(['quantity' => 'required|integer|min:1|max:99']);
        $cart = $this->carts->resolve($request);
        $item = $cart->items()->find($id);
        abort_unless($item, 404, 'Cart item not found.');

        $product = $item->product;
        abort_unless($product->stock >= $data['quantity'], 409, 'Requested quantity exceeds stock.');
        $item->update(['quantity' => $data['quantity']]);

        return $this->cartResponse($request, $cart, 200);
    }

    public function deleteCartItem(Request $request, string $id): JsonResponse
    {
        $cart = $this->carts->resolve($request);
        $item = $cart->items()->find($id);
        abort_unless($item, 404, 'Cart item not found.');
        $item->delete();

        return $this->cartResponse($request, $cart, 200);
    }

    public function mergeCart(Request $request): JsonResponse
    {
        $data = $request->validate(['token' => 'required|uuid']);
        $user = $request->user();

        $accountCart = Cart::firstOrCreate(['user_id' => $user->id], ['converted' => false]);
        $guestCart = Cart::where('token', $data['token'])->whereNull('user_id')->where('converted', false)->first();

        if ($guestCart && $guestCart->id !== $accountCart->id) {
            foreach ($guestCart->items as $item) {
                $target = $accountCart->items()->where('product_id', $item->product_id)->first();
                if ($target) {
                    $target->update(['quantity' => min(99, $target->quantity + $item->quantity)]);
                } else {
                    CartItem::create([
                        'cart_id' => $accountCart->id,
                        'product_id' => $item->product_id,
                        'quantity' => $item->quantity,
                    ]);
                }
            }
            $guestCart->update(['converted' => true]);
        }

        return response()->json((new CartResource($accountCart))->resolve());
    }

    private function cartResponse(Request $request, Cart $cart, int $status): JsonResponse
    {
        $response = response()->json((new CartResource($cart->fresh('items.product')))->resolve(), $status);
        if (! $request->user() && $cart->token) {
            $response->header('X-Cart-Token', $cart->token);
        }

        return $response;
    }
}
