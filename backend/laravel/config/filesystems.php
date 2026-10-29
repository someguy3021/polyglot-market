<?php

// S3-совместимое хранилище (MinIO из infra / dev-fallback s3rver, ADR-008).
return [
    'default' => env('FILESYSTEM_DISK', 'local'),
    'disks' => [
        'local' => [
            'driver' => 'local',
            'root' => storage_path('app'),
            'throw' => false,
        ],
        's3' => [
            'driver' => 's3',
            'key' => env('S3_ACCESS_KEY'),
            'secret' => env('S3_SECRET_KEY'),
            'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
            'bucket' => env('S3_BUCKET', 'products'),
            'endpoint' => env('S3_ENDPOINT'),
            'use_path_style_endpoint' => true,
            'throw' => true,
            // Не параметр SDK: база публичных URL для клиента, если отличается от
            // эндпоинта загрузки (k8s-стенд фичи 18, аналог S3_URL_BASE у NestJS).
            'url_base' => env('S3_URL_BASE'),
        ],
    ],
];
