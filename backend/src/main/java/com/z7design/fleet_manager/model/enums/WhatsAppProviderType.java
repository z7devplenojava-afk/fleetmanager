package com.z7design.fleet_manager.model.enums;

/**
 * Provedor de WhatsApp usado para um determinado tenant.
 *
 * <p>ASTRACALLS e EVOLUTION podem coexistir; a escolha e feita por empresa
 * em {@code company_whatsapp_configs} e, na ausencia de configuracao,
 * pela propriedade global {@code whatsapp.notifications.provider}.</p>
 */
public enum WhatsAppProviderType {
    ASTRACALLS,
    EVOLUTION
}
