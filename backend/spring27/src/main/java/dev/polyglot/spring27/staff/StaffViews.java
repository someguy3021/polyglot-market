package dev.polyglot.spring27.staff;

import java.math.BigDecimal;
import java.time.Instant;

/** Формы модерации/админки (PromoCode). */
public final class StaffViews {

    public static class PromoCodeView {
        public final String id;
        public final String code;
        public final String type;
        public final BigDecimal value;
        public final BigDecimal minSubtotal;
        public final Integer maxUses;
        public final int usedCount;
        public final Instant expiresAt;
        public final boolean active;

        public PromoCodeView(String id, String code, String type, BigDecimal value, BigDecimal minSubtotal,
                Integer maxUses, int usedCount, Instant expiresAt, boolean active) {
            this.id = id;
            this.code = code;
            this.type = type;
            this.value = value;
            this.minSubtotal = minSubtotal;
            this.maxUses = maxUses;
            this.usedCount = usedCount;
            this.expiresAt = expiresAt;
            this.active = active;
        }
    }

    private StaffViews() {
    }
}
