<?php

// CORS: список origins фронтов из окружения (CORS_ORIGINS через запятую).
return [
    'paths' => ['api/*', 'health'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_filter(explode(',', (string) env('CORS_ORIGINS', ''))),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Content-Type', 'Authorization', 'X-Cart-Token', 'Idempotency-Key'],
    'exposed_headers' => ['X-Cart-Token'],
    'max_age' => 3600,
    'supports_credentials' => false,
];
