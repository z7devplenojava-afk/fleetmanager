package com.z7design.fleet_manager.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class WhatsAppPhoneUtilsTest {

    @Test
    @DisplayName("normaliza celular com DDD para DDI 55")
    void normalizesLocalMobile() {
        assertEquals("5511999999999", WhatsAppPhoneUtils.normalizeBrazilian("(11) 99999-9999"));
    }

    @Test
    @DisplayName("normaliza telefone fixo com DDD")
    void normalizesLocalLandline() {
        assertEquals("551133334444", WhatsAppPhoneUtils.normalizeBrazilian("11 3333-4444"));
    }

    @Test
    @DisplayName("mantem numero que ja possui DDI")
    void keepsExistingCountryCode() {
        assertEquals("5511999999999", WhatsAppPhoneUtils.normalizeBrazilian("5511999999999"));
    }

    @Test
    @DisplayName("remove zeros de discagem")
    void removesLeadingZero() {
        assertEquals("5511999999999", WhatsAppPhoneUtils.normalizeBrazilian("011 99999-9999"));
    }

    @Test
    @DisplayName("rejeita numeros vazios ou invalidos")
    void rejectsInvalidNumbers() {
        assertNull(WhatsAppPhoneUtils.normalizeBrazilian(null));
        assertNull(WhatsAppPhoneUtils.normalizeBrazilian("   "));
        assertNull(WhatsAppPhoneUtils.normalizeBrazilian("abc"));
        assertNull(WhatsAppPhoneUtils.normalizeBrazilian("123"));
        assertFalse(WhatsAppPhoneUtils.isValidBrazilian("123"));
        assertTrue(WhatsAppPhoneUtils.isValidBrazilian("11999999999"));
    }
}
