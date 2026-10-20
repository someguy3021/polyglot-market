<?php

namespace Tests\Unit;

use App\Models\Order;
use App\Models\PromoCode;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

/**
 * Чистая логика без БД: расчёт скидок и статусная машина заказа.
 * Паритет с NestJS-тестами (одинаковые правила из контракта).
 */
class ContractLogicTest extends BaseTestCase
{
    public function test_promo_percent_discount(): void
    {
        $promo = new PromoCode(['type' => 'percent', 'value' => '10']);
        $this->assertSame(10.0, $promo->discountFor(100.0));
    }

    public function test_promo_fixed_discount_capped_at_subtotal(): void
    {
        $promo = new PromoCode(['type' => 'fixed', 'value' => '20']);
        $this->assertSame(20.0, $promo->discountFor(100.0));
        // скидка не может превысить сумму корзины
        $this->assertSame(5.0, $promo->discountFor(5.0));
    }

    public function test_promo_expired_rejected(): void
    {
        $promo = new PromoCode([
            'type' => 'percent', 'value' => '10',
            'active' => true, 'expires_at' => now()->subDay(),
        ]);
        $this->assertNotNull($promo->rejectionReason(100.0));
        $this->assertSame('Promo code has expired.', $promo->rejectionReason(100.0));
    }

    public function test_promo_usage_limit_rejected(): void
    {
        $promo = new PromoCode([
            'type' => 'percent', 'value' => '15',
            'active' => true, 'max_uses' => 5, 'used_count' => 5,
        ]);
        $this->assertSame('Promo code usage limit reached.', $promo->rejectionReason(100.0));
    }

    public function test_promo_min_subtotal_enforced(): void
    {
        $promo = new PromoCode(['type' => 'fixed', 'value' => '20', 'min_subtotal' => '50', 'active' => true]);
        $this->assertNotNull($promo->rejectionReason(30.0));
        $this->assertNull($promo->rejectionReason(50.0));
    }

    public function test_order_transitions_map_matches_contract(): void
    {
        // Допустимые переходы из openapi.yaml (PUT /admin/orders/{id}/status)
        $this->assertSame(['paid', 'cancelled'], Order::TRANSITIONS['new']);
        $this->assertSame(['shipped', 'cancelled'], Order::TRANSITIONS['paid']);
        $this->assertSame(['done'], Order::TRANSITIONS['shipped']);
        $this->assertSame([], Order::TRANSITIONS['done']);
        $this->assertSame([], Order::TRANSITIONS['cancelled']);
    }

    public function test_cancelled_is_terminal(): void
    {
        $this->assertEmpty(Order::TRANSITIONS['cancelled']);
    }
}
