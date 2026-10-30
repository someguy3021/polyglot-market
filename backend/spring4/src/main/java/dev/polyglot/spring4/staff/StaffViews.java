package dev.polyglot.spring4.staff;

import java.math.BigDecimal;
import java.time.Instant;

/** Формы модерации/админки (PromoCode). */
public final class StaffViews {

    public record PromoCodeView(
            String id,
            String code,
            String type,
            BigDecimal value,
            BigDecimal minSubtotal,
            Integer maxUses,
            int usedCount,
            Instant expiresAt,
            boolean active) {
    }

    private StaffViews() {
    }
}
