package com.z7design.fleet_manager.tenant;

import java.util.UUID;

/**
 * Contexto do tenant (empresa) para a requisição atual.
 * Armazena o empresaId extraído do JWT para isolamento de dados.
 *
 * SEGURANÇA: O empresaId deve SEMPRE vir do JWT (via JwtTenantFilter), nunca do cliente.
 * Services devem usar TenantContext.get() para obter o companyId - nunca aceitar do DTO/request.
 */
public final class TenantContext {

    private static final ThreadLocal<UUID> EMPRESA = new ThreadLocal<>();

    private TenantContext() {
    }

    public static void set(UUID empresaId) {
        EMPRESA.set(empresaId);
    }

    public static void setCurrentTenant(UUID empresaId) {
        set(empresaId);
    }

    public static UUID get() {
        return EMPRESA.get();
    }

    public static UUID getCurrentTenant() {
        return get();
    }

    public static void clear() {
        EMPRESA.remove();
    }
}
