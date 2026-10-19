<?php

namespace App\Services;

use App\Models\Cart;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Единое правило корзины (контракт /cart): авторизованный — аккаунтная корзина,
 * гость — по X-Cart-Token; нового гостя создаём с новым токеном.
 */
class CartResolver
{
    public function resolve(Request $request): Cart
    {
        if ($user = $request->user()) {
            return Cart::firstOrCreate(['user_id' => $user->id], ['converted' => false]);
        }

        $token = $request->header('X-Cart-Token');
        if ($token) {
            $cart = Cart::where('token', $token)->whereNull('user_id')->where('converted', false)->first();
            if ($cart) {
                return $cart;
            }
        }

        return Cart::create(['token' => (string) Str::uuid(), 'converted' => false]);
    }
}
