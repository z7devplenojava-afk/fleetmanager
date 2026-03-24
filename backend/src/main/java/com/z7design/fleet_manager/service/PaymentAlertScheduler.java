package com.z7design.fleet_manager.service;

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
     * Executar todos os dias Ã s 08:00 para verificar pagamentos vencendo em 3 dias
     */
    @Scheduled(cron = "0 0 8 * * ?")
    public void checkPaymentsDueInThreeDays() {
        log.info("Iniciando verificaÃ§Ã£o automÃ¡tica de pagamentos vencendo em 3 dias");
        
        try {
            // Verificar contas a receber vencendo em 3 dias
            log.info("Verificando contas a receber vencendo em 3 dias");
            accountsReceivableService.sendAlertsForAccountsDueInThreeDays();
            
            // Verificar pagamentos agendados vencendo em 3 dias
            log.info("Verificando pagamentos agendados vencendo em 3 dias");
            scheduledPaymentService.sendAlertsForPaymentsDueInThreeDays();
            
            log.info("VerificaÃ§Ã£o automÃ¡tica de pagamentos concluÃ­da com sucesso");
            
        } catch (Exception e) {
            log.error("Erro durante verificaÃ§Ã£o automÃ¡tica de pagamentos: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Executar todos os dias Ã s 09:00 para atualizar status de contas vencidas
     */
    @Scheduled(cron = "0 0 9 * * ?")
    public void updateOverdueStatus() {
        log.info("Iniciando atualizaÃ§Ã£o de status de contas vencidas");
        
        try {
            accountsReceivableService.updateOverdueStatus();
            log.info("AtualizaÃ§Ã£o de status de contas vencidas concluÃ­da com sucesso");
            
        } catch (Exception e) {
            log.error("Erro durante atualizaÃ§Ã£o de status de contas vencidas: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Executar todos os dias Ã s 10:00 para verificaÃ§Ã£o geral de vencimentos
     */
    @Scheduled(cron = "0 0 10 * * ?")
    public void checkAllDuePayments() {
        log.info("Iniciando verificaÃ§Ã£o geral de vencimentos");
        
        try {
            // Verificar contas vencidas
            log.info("Verificando contas a receber vencidas");
            accountsReceivableService.getOverdueAccounts();
            
            // Verificar pagamentos agendados vencidos
            log.info("Verificando pagamentos agendados vencidos");
            scheduledPaymentService.getOverduePayments();
            
            log.info("VerificaÃ§Ã£o geral de vencimentos concluÃ­da com sucesso");
            
        } catch (Exception e) {
            log.error("Erro durante verificaÃ§Ã£o geral de vencimentos: {}", e.getMessage(), e);
        }
    }
}

