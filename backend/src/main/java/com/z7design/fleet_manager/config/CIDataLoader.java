package com.z7design.fleet_manager.config;

import com.z7design.fleet_manager.model.PersonalProtectiveEquipment;
import com.z7design.fleet_manager.model.enums.EPICategory;
import com.z7design.fleet_manager.repository.PersonalProtectiveEquipmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DataLoader para popular o banco de dados com dados de teste no ambiente CI
 * Executa apenas no perfil "ci" e apenas se nÃ£o houver dados cadastrados
 */
@Configuration
public class CIDataLoader {
    private static final Logger log = LoggerFactory.getLogger(CIDataLoader.class);

    private final PersonalProtectiveEquipmentRepository epiRepository;

    public CIDataLoader(PersonalProtectiveEquipmentRepository epiRepository) {
        this.epiRepository = epiRepository;
    }

    @Bean
    @Profile("ci") // Executa apenas no ambiente CI
    public CommandLineRunner initCIData() {
        return args -> {
            log.info("ðŸŒ± Iniciando seed de dados para ambiente CI...");

            // Popular EPIs se nÃ£o existirem
            initEPIData();

            log.info("âœ… Seed de dados para CI concluÃ­do com sucesso!");
        };
    }

    /**
     * Inicializa dados de EPIs se nÃ£o existirem
     */
    private void initEPIData() {
        long count = epiRepository.count();
        if (count > 0) {
            log.info("âœ… JÃ¡ existem {} EPIs no banco de dados. Pulando inicializaÃ§Ã£o.", count);
            return;
        }

        log.info("ðŸ“¦ Inicializando dados de EPIs para CI...");

        // EPI 1: Capacete de SeguranÃ§a
        PersonalProtectiveEquipment capacete = PersonalProtectiveEquipment.builder()
                .name("Capacete de SeguranÃ§a")
                .description("Capacete de seguranÃ§a industrial com regulagem")
                .category(EPICategory.CABECA)
                .caNumber("ABNT NBR 8221")
                .caValidity(LocalDate.of(2027, 1, 15))
                .manufacturer("3M")
                .model("SecureFit Pro")
                .unitOfMeasurement("UNIDADE")
                .minimumStock(10)
                .currentStock(50)
                .unitCost(new BigDecimal("89.90"))
                .isActive(true)
                .build();

        // EPI 2: Luvas de ProteÃ§Ã£o
        PersonalProtectiveEquipment luvas = PersonalProtectiveEquipment.builder()
                .name("Luvas de ProteÃ§Ã£o")
                .description("Luvas resistentes a cortes e produtos quÃ­micos")
                .category(EPICategory.MAOS)
                .caNumber("EN 388")
                .caValidity(null)
                .manufacturer("Ansell")
                .model("HyFlex 11-800")
                .unitOfMeasurement("UNIDADE")
                .minimumStock(50)
                .currentStock(200)
                .unitCost(new BigDecimal("45.50"))
                .isActive(true)
                .build();

        // EPI 3: Ã“culos de ProteÃ§Ã£o
        PersonalProtectiveEquipment oculos = PersonalProtectiveEquipment.builder()
                .name("Ã“culos de ProteÃ§Ã£o")
                .description("Ã“culos de seguranÃ§a com proteÃ§Ã£o UV")
                .category(EPICategory.OLHOS)
                .caNumber("ANSI Z87.1")
                .caValidity(null)
                .manufacturer("Uvex")
                .model("Genesis XC")
                .unitOfMeasurement("UNIDADE")
                .minimumStock(20)
                .currentStock(100)
                .unitCost(new BigDecimal("32.80"))
                .isActive(true)
                .build();

        // EPI 4: CalÃ§ado de SeguranÃ§a
        PersonalProtectiveEquipment calcado = PersonalProtectiveEquipment.builder()
                .name("CalÃ§ado de SeguranÃ§a")
                .description("TÃªnis de seguranÃ§a com biqueira de aÃ§o")
                .category(EPICategory.PES)
                .caNumber("ABNT NBR 20345")
                .caValidity(null)
                .manufacturer("Safety")
                .model("Steel Toe Pro")
                .unitOfMeasurement("UNIDADE")
                .minimumStock(15)
                .currentStock(80)
                .unitCost(new BigDecimal("189.90"))
                .isActive(true)
                .build();

        // EPI 5: Uniforme de Trabalho
        PersonalProtectiveEquipment uniforme = PersonalProtectiveEquipment.builder()
                .name("Uniforme de Trabalho")
                .description("Uniforme corporativo com tecido resistente")
                .category(EPICategory.CORPO)
                .caNumber("ABNT NBR 15777")
                .caValidity(null)
                .manufacturer("WorkWear")
                .model("Corporate Pro")
                .unitOfMeasurement("UNIDADE")
                .minimumStock(30)
                .currentStock(120)
                .unitCost(new BigDecimal("75.00"))
                .isActive(true)
                .build();

        // Salvar todos os EPIs
        epiRepository.save(capacete);
        epiRepository.save(luvas);
        epiRepository.save(oculos);
        epiRepository.save(calcado);
        epiRepository.save(uniforme);

        log.info("âœ… {} EPIs criados com sucesso para ambiente CI!", 5);
    }
}
