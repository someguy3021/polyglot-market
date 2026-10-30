<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Domain\Models\User;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'password' => $request->validated('password'), // маппится в password_hash (модель)
            'role' => 'buyer',
        ]);

        return response()->json($this->tokenPayload($user), 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->only('email', 'password');

        if (! $token = Auth::guard('api')->attempt($credentials)) {
            // Контракт: неверные креды — 401 unauthorized, не 422.
            return response()->json([
                'status' => 401,
                'error' => 'unauthorized',
                'message' => 'Invalid credentials.',
            ], 401);
        }

        return response()->json($this->tokenPayload(Auth::guard('api')->user()));
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json((new UserResource($request->user()))->resolve());
    }

    private function tokenPayload(User $user): array
    {
        return [
            'token' => Auth::guard('api')->login($user),
            'user' => (new UserResource($user))->resolve(),
        ];
    }
}
