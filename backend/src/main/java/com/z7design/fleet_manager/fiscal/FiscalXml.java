package com.z7design.fleet_manager.fiscal;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class FiscalXml {

    private FiscalXml() {
    }

    public static String esc(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }

    public static String money(BigDecimal value) {
        BigDecimal safe = value == null ? BigDecimal.ZERO : value;
        return safe.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    public static String qty(BigDecimal value, int scale) {
        BigDecimal safe = value == null ? BigDecimal.ZERO : value;
        return safe.setScale(scale, RoundingMode.HALF_UP).toPlainString();
    }

    public static String tag(String name, String value) {
        return "<" + name + ">" + esc(value) + "</" + name + ">";
    }
}
