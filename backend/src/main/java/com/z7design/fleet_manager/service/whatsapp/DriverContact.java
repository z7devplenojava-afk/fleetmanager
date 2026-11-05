package com.z7design.fleet_manager.service.whatsapp;

/**
 * Contato de motorista resolvido para uma OS.
 *
 * @param name   nome de exibicao (pode ser nulo)
 * @param phone  telefone normalizado (DDI + DDD + numero)
 * @param source origem do dado (para auditoria/log)
 */
public record DriverContact(String name, String phone, String source) {
}
