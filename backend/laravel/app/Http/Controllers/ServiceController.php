<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class ServiceController extends Controller
{
    /** GET /health — живость сервиса (контракт: service). */
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'service' => 'laravel',
            'time' => Carbon::now('UTC')->toISOString(),
        ]);
    }
}
