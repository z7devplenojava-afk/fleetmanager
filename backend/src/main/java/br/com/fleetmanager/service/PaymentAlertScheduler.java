package br.com.fleetmanager.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentAlertScheduler {
    
    private final AccountsReceivableService accountsReceivableService;
    private final ScheduledPaymentService scheduledPaymentService;
    
    /**
     * Executar todos os dias às 08:00 para verificar pagamentos vencendo em 3 dias
     */
    @Scheduled(cron = "0 0 8 * * ?")
    public void checkPaymentsDueInThreeDays() {
        log.info("Iniciando verificação automática de pagamentos vencendo em 3 dias");
        
        try {
            // Verificar contas a receber vencendo em 3 dias
            log.info("Verificando contas a receber vencendo em 3 dias");
            accountsReceivableService.sendAlertsForAccountsDueInThreeDays();
            
            // Verificar pagamentos agendados vencendo em 3 dias
            log.info("Verificando pagamentos agendados vencendo em 3 dias");
            scheduledPaymentService.sendAlertsForPaymentsDueInThreeDays();
            
            log.info("Verificação automática de pagamentos concluída com sucesso");
            
        } catch (Exception e) {
            log.error("Erro durante verificação automática de pagamentos: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Executar todos os dias às 09:00 para atualizar status de contas vencidas
     */
    @Scheduled(cron = "0 0 9 * * ?")
    public void updateOverdueStatus() {
        log.info("Iniciando atualização de status de contas vencidas");
        
        try {
            accountsReceivableService.updateOverdueStatus();
            log.info("Atualização de status de contas vencidas concluída com sucesso");
            
        } catch (Exception e) {
            log.error("Erro durante atualização de status de contas vencidas: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Executar todos os dias às 10:00 para verificação geral de vencimentos
     */
    @Scheduled(cron = "0 0 10 * * ?")
    public void checkAllDuePayments() {
        log.info("Iniciando verificação geral de vencimentos");
        
        try {
            // Verificar contas vencidas
            log.info("Verificando contas a receber vencidas");
            accountsReceivableService.getOverdueAccounts();
            
            // Verificar pagamentos agendados vencidos
            log.info("Verificando pagamentos agendados vencidos");
            scheduledPaymentService.getOverduePayments();
            
            log.info("Verificação geral de vencimentos concluída com sucesso");
            
        } catch (Exception e) {
            log.error("Erro durante verificação geral de vencimentos: {}", e.getMessage(), e);
        }
    }
}
