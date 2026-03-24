package com.z7design.fleet_manager.config;

import com.z7design.fleet_manager.worker.*;
import com.z7design.fleet_manager.worker.UnificationWorker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationContext;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class WorkerInitializationChecker {
    private static final Logger log = LoggerFactory.getLogger(WorkerInitializationChecker.class);

    private final ApplicationContext applicationContext;

    public WorkerInitializationChecker(ApplicationContext applicationContext) {
        this.applicationContext = applicationContext;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void checkWorkersAfterStartup() {
        log.info(
                "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
        log.info("ðŸ” VERIFICANDO WORKERS APÃ“S INICIALIZAÃ‡ÃƒO DA APLICAÃ‡ÃƒO");
        log.info(
                "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");

        try {
            // Verificar SplitterWorker
            try {
                SplitterWorker splitterWorker = applicationContext.getBean(SplitterWorker.class);
                log.info("âœ… SplitterWorker: BEAN ENCONTRADO - {}", splitterWorker.getClass().getName());
            } catch (Exception e) {
                log.error("âŒ SplitterWorker: BEAN NÃƒO ENCONTRADO - {}", e.getMessage());
            }

            // Verificar OcrWorker
            try {
                OcrWorker ocrWorker = applicationContext.getBean(OcrWorker.class);
                log.info("âœ… OcrWorker: BEAN ENCONTRADO - {}", ocrWorker.getClass().getName());
            } catch (Exception e) {
                log.error("âŒ OcrWorker: BEAN NÃƒO ENCONTRADO - {}", e.getMessage());
            }

            // Verificar ParserWorker
            try {
                ParserWorker parserWorker = applicationContext.getBean(ParserWorker.class);
                log.info("âœ… ParserWorker: BEAN ENCONTRADO - {}", parserWorker.getClass().getName());
            } catch (Exception e) {
                log.error("âŒ ParserWorker: BEAN NÃƒO ENCONTRADO - {}", e.getMessage());
            }

            // Verificar UnificationWorker
            try {
                UnificationWorker unificationWorker = applicationContext.getBean(UnificationWorker.class);
                log.info("âœ… UnificationWorker: BEAN ENCONTRADO - {}", unificationWorker.getClass().getName());
            } catch (Exception e) {
                log.error("â Œ UnificationWorker: BEAN NÃƒO ENCONTRADO - {}", e.getMessage());
            }

            // Verificar UnmatchedPayslipWorker
            try {
                UnmatchedPayslipWorker unmatchedWorker = applicationContext.getBean(UnmatchedPayslipWorker.class);
                log.info("âœ… UnmatchedPayslipWorker: BEAN ENCONTRADO - {}", unmatchedWorker.getClass().getName());
            } catch (Exception e) {
                log.error("âŒ UnmatchedPayslipWorker: BEAN NÃƒO ENCONTRADO - {}", e.getMessage());
            }

            // Listar todos os beans com "Worker" no nome
            String[] workerBeans = applicationContext.getBeanNamesForType(Object.class);
            int workerCount = 0;
            for (String beanName : workerBeans) {
                if (beanName.toLowerCase().contains("worker")) {
                    log.info("ðŸ” Bean encontrado: {}", beanName);
                    workerCount++;
                }
            }
            log.info("ðŸ“Š Total de beans com 'worker' no nome: {}", workerCount);

        } catch (Exception e) {
            log.error("âŒ Erro ao verificar workers: {}", e.getMessage(), e);
        }

        log.info(
                "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
    }
}
