package com.z7design.fleet_manager.service.whatsapp;

import com.z7design.fleet_manager.event.WorkOrderCompletedEvent;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.UUID;

/**
 * Dispara o enfileiramento do aviso de OS concluida somente depois do commit
 * da transacao da OS.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WorkOrderCompletedWhatsAppListener {

    private final WorkOrderCompletedOutboxService outboxService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onWorkOrderCompleted(WorkOrderCompletedEvent event) {
        if (event == null || event.workOrderId() == null) {
            return;
        }

        UUID previousTenant = TenantContext.get();
        boolean tenantChanged = false;
        try {
            if (event.companyId() != null) {
                TenantContext.set(event.companyId());
                tenantChanged = true;
            }
            outboxService.enqueueForCompletedWorkOrder(event);
        } catch (Exception e) {
            // A OS ja foi commitada; nao relancar para nao poluir o fluxo.
            log.error("Erro ao enfileirar aviso de conclusao da OS {}: {}",
                    event.workOrderId(), e.getMessage(), e);
        } finally {
            if (tenantChanged) {
                if (previousTenant != null) {
                    TenantContext.set(previousTenant);
                } else {
                    TenantContext.clear();
                }
            }
        }
    }
}
