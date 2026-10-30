// Паритет с Laravel ContractLogicTest: одинаковые правила из контракта.
import { describe, expect, it } from "vitest";
import { PromoCodeEntity } from "./domain/entities/shop.entities";
import { OrderEntity } from "./domain/entities/shop.entities";

function promo(fields: Partial<PromoCodeEntity>): PromoCodeEntity {
  return Object.assign(new PromoCodeEntity(), {
    type: "percent",
    value: "10",
    minSubtotal: "0",
    usedCount: 0,
    active: true,
    expiresAt: null,
    maxUses: null,
    ...fields,
  } as Partial<PromoCodeEntity>);
}

describe("PromoCode", () => {
  it("percent discount", () => {
    expect(promo({ type: "percent", value: "10" }).discountFor(100)).toBe(10);
  });

  it("fixed discount capped at subtotal", () => {
    const p = promo({ type: "fixed", value: "20" });
    expect(p.discountFor(100)).toBe(20);
    expect(p.discountFor(5)).toBe(5);
  });

  it("expired rejected", () => {
    const p = promo({ expiresAt: new Date(Date.now() - 86_400_000) });
    expect(p.rejectionReason(100)).toBe("Promo code has expired.");
  });

  it("usage limit rejected", () => {
    const p = promo({ maxUses: 5, usedCount: 5 });
    expect(p.rejectionReason(100)).toBe("Promo code usage limit reached.");
  });

  it("min subtotal enforced", () => {
    const p = promo({ type: "fixed", value: "20", minSubtotal: "50" });
    expect(p.rejectionReason(30)).toContain("minimum subtotal");
    expect(p.rejectionReason(50)).toBeNull();
  });
});

describe("Order transitions (контракт PUT /admin/orders/{id}/status)", () => {
  it("matches the contract map", () => {
    expect(OrderEntity.TRANSITIONS.new).toEqual(["paid", "cancelled"]);
    expect(OrderEntity.TRANSITIONS.paid).toEqual(["shipped", "cancelled"]);
    expect(OrderEntity.TRANSITIONS.shipped).toEqual(["done"]);
    expect(OrderEntity.TRANSITIONS.done).toEqual([]);
    expect(OrderEntity.TRANSITIONS.cancelled).toEqual([]);
  });

  it("cancelled is terminal", () => {
    expect(OrderEntity.TRANSITIONS.cancelled).toHaveLength(0);
  });
});
