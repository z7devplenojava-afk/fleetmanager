package com.z7design.fleet_manager.config;

import com.z7design.fleet_manager.model.KanbanStatus;
import com.z7design.fleet_manager.repository.KanbanStatusRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

import java.util.Arrays;
import java.util.List;

@Configuration
public class KanbanStatusDataLoader {
    private static final Logger log = LoggerFactory.getLogger(KanbanStatusDataLoader.class);

    private final KanbanStatusRepository kanbanStatusRepository;

    public KanbanStatusDataLoader(KanbanStatusRepository kanbanStatusRepository) {
        this.kanbanStatusRepository = kanbanStatusRepository;
    }

    @Bean
    @Order(1)
    public CommandLineRunner initKanbanStatuses() {
        return args -> {
            if (kanbanStatusRepository.count() == 0) {
                log.info("ðŸ“‹ Inicializando status padrÃ£o do Kanban...");

                List<KanbanStatus> defaultStatuses = Arrays.asList(
                        createStatus("Novos Leads", 1),
                        createStatus("Em Contato", 2),
                        createStatus("Proposta Enviada", 3),
                        createStatus("Em NegociaÃ§Ã£o", 4),
                        createStatus("Fechado", 5));

                kanbanStatusRepository.saveAll(defaultStatuses);
                log.info("âœ… {} status padrÃ£o do Kanban criados com sucesso!", defaultStatuses.size());
            } else {
                log.info("ðŸ“‹ JÃ¡ existem {} status do Kanban no banco de dados. Pulando inicializaÃ§Ã£o.",
                        kanbanStatusRepository.count());
            }
        };
    }

    private KanbanStatus createStatus(String name, Integer orderIndex) {
        KanbanStatus status = new KanbanStatus();
        status.setName(name);
        status.setOrderIndex(orderIndex);
        return status;
    }
}
