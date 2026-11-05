package com.z7design.fleet_manager.event;

import java.util.UUID;

/**
 * Evento publicado quando uma OS de frota passa para COMPLETED.
 *
 * <p>O {@code companyId} viaja no evento porque o processamento assincrono
 * nao herda o {@code TenantContext} da requisicao.</p>
 */
public record WorkOrderCompletedEvent(UUID workOrderId, UUID companyId) {
}
