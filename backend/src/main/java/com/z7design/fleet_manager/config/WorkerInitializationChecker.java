package com.z7design.fleet_manager.config;

import com.z7design.fleet_manager.worker.*;
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
        boolean redisWorkersEnabled = Boolean.parseBoolean(
                applicationContext.getEnvironment().getProperty("fluxbus.redis.workers.enabled", "false")
        );

        log.info("═══════════════════════════════════════════════════════════");
        log.info("🔍 STATUS DOS WORKERS (fluxbus.redis.workers.enabled = {})", redisWorkersEnabled);
        log.info("═══════════════════════════════════════════════════════════");

        try {
            checkWorker("SplitterWorker", SplitterWorker.class, redisWorkersEnabled);
            checkWorker("OcrWorker", OcrWorker.class, redisWorkersEnabled);
            checkWorker("ParserWorker", ParserWorker.class, redisWorkersEnabled);
            checkWorker("UnificationWorker", UnificationWorker.class, true);
            checkWorker("UnmatchedPayslipWorker", UnmatchedPayslipWorker.class, redisWorkersEnabled);

            // Listar todos os beans com "Worker" no nome
            String[] workerBeans = applicationContext.getBeanNamesForType(Object.class);
            int workerCount = 0;
            for (String beanName : workerBeans) {
                if (beanName.toLowerCase().contains("worker")) {
                    log.info("🔎 Bean encontrado: {}", beanName);
                    workerCount++;
                }
            }
            log.info("📊 Total de beans com 'worker' no nome: {}", workerCount);

        } catch (Exception e) {
            log.error("❌ Erro ao verificar workers: {}", e.getMessage(), e);
        }

        log.info("═══════════════════════════════════════════════════════════");
    }

    private void checkWorker(String name, Class<?> clazz, boolean expectedActive) {
        try {
            Object worker = applicationContext.getBean(clazz);
            log.info("✅ {}: BEAN ENCONTRADO - {}", name, worker.getClass().getName());
        } catch (Exception e) {
            if (expectedActive) {
                log.error("❌ {}: BEAN NÃO ENCONTRADO - {}", name, e.getMessage());
            } else {
                log.info("⏸️ {}: DESATIVADO NESTE PERFIL (fluxbus.redis.workers.enabled=false). Ative com REDIS_WORKERS_ENABLED=true para fila Redis assíncrona.", name);
            }
        }
    }
}
