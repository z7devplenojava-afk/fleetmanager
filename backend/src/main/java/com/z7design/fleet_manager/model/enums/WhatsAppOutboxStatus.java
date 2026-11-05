package com.z7design.fleet_manager.model.enums;

/** Ciclo de vida de uma mensagem da outbox de WhatsApp. */
public enum WhatsAppOutboxStatus {
    PENDING,
    PROCESSING,
    SENT,
    FAILED,
    SKIPPED
}
