<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ProductImage extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = ['product_id', 'key', 'thumb_key', 'is_primary', 'sort'];

    protected function casts(): array
    {
        return ['is_primary' => 'boolean'];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function getUrlAttribute(): string
    {
        return self::publicUrl($this->key);
    }

    public function getThumbUrlAttribute(): ?string
    {
        return $this->thumb_key ? self::publicUrl($this->thumb_key) : null;
    }

    /**
     * URL для клиента может отличаться от эндпоинта загрузки: в k8s-стенде (фича 18)
     * pod пишет в http://s3:9000, а браузер читает через проброшенный порт —
     * как S3_URL_BASE у NestJS (backend/nestjs/src/common/s3.ts).
     */
    public static function publicUrl(string $key): string
    {
        $base = config('filesystems.disks.s3.url_base');

        return $base ? rtrim($base, '/').'/'.$key : Storage::disk('s3')->url($key);
    }
}
