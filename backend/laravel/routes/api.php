<?php

// API-роуты = пути контракта (apiPrefix пустой: /auth/*, /products… как в openapi.yaml).
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ModeratorController;
use App\Http\Controllers\OrdersController;
use App\Http\Controllers\SellerController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\ShopController;
use Illuminate\Support\Facades\Route;

Route::get('/health', ServiceController::class);

// auth
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/auth/me', [AuthController::class, 'me'])->middleware('auth:api');

// каталог
Route::get('/products', [ShopController::class, 'products']);
Route::get('/products/{id}', [ShopController::class, 'product']);
Route::get('/categories', [ShopController::class, 'categories']);

// корзина (гость по X-Cart-Token или авторизованный)
Route::get('/cart', [ShopController::class, 'cart'])->middleware('auth.optional:api');
Route::post('/cart/items', [ShopController::class, 'addCartItem'])->middleware('auth.optional:api');
Route::patch('/cart/items/{id}', [ShopController::class, 'updateCartItem'])->middleware('auth.optional:api');
Route::delete('/cart/items/{id}', [ShopController::class, 'deleteCartItem'])->middleware('auth.optional:api');
Route::post('/cart/merge', [ShopController::class, 'mergeCart'])->middleware('auth:api');

// оформление
Route::post('/promo/validate', [OrdersController::class, 'validatePromo']);
Route::get('/shipping-methods', [OrdersController::class, 'shippingMethods']);
Route::post('/orders', [OrdersController::class, 'create'])->middleware('auth:api');
Route::get('/orders', [OrdersController::class, 'myOrders'])->middleware('auth:api');
Route::get('/orders/{id}', [OrdersController::class, 'show'])->middleware('auth:api');

// продавец
Route::get('/seller/products', [SellerController::class, 'products'])->middleware('auth:api');
Route::post('/seller/products', [SellerController::class, 'createProduct'])->middleware('auth:api');
Route::put('/seller/products/{id}', [SellerController::class, 'updateProduct'])->middleware('auth:api');
Route::post('/seller/products/{id}/submit', [SellerController::class, 'submitProduct'])->middleware('auth:api');
Route::post('/seller/products/{id}/images', [SellerController::class, 'uploadImage'])->middleware('auth:api');
Route::delete('/seller/products/{id}/images/{imageId}', [SellerController::class, 'deleteImage'])->middleware('auth:api');
Route::get('/seller/order-items', [SellerController::class, 'orderItems'])->middleware('auth:api');

// модерация
Route::get('/moderator/queue', [ModeratorController::class, 'queue'])->middleware('auth:api');
Route::post('/moderator/products/{id}/approve', [ModeratorController::class, 'approve'])->middleware('auth:api');
Route::post('/moderator/products/{id}/reject', [ModeratorController::class, 'reject'])->middleware('auth:api');

// админ
Route::get('/admin/orders', [AdminController::class, 'orders'])->middleware('auth:api');
Route::put('/admin/orders/{id}/status', [AdminController::class, 'updateOrderStatus'])->middleware('auth:api');
Route::get('/admin/users', [AdminController::class, 'users'])->middleware('auth:api');
Route::put('/admin/users/{id}/role', [AdminController::class, 'updateUserRole'])->middleware('auth:api');
Route::get('/admin/promo-codes', [AdminController::class, 'promoCodes'])->middleware('auth:api');
Route::post('/admin/promo-codes', [AdminController::class, 'createPromoCode'])->middleware('auth:api');
Route::delete('/admin/products/{id}', [AdminController::class, 'deleteProduct'])->middleware('auth:api');
