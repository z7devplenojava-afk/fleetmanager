package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.WorkJourneyConfig;
import com.z7design.fleet_manager.repository.WorkJourneyConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkJourneyConfigService {

    private final WorkJourneyConfigRepository repository;

    /**
     * List all configurations (SUPER_ADMIN only).
     */
    @Transactional(readOnly = true)
    public List<WorkJourneyConfig> findAll() {
        return repository.findAll();
    }

    /**
     * Get configuration by company ID. Creates default if none exists.
     */
    @Transactional
    public WorkJourneyConfig findByCompanyId(UUID companyId) {
        return repository.findByCompanyId(companyId)
                .orElseGet(() -> createDefault(companyId));
    }

    /**
     * Get only active configuration by company ID.
     */
    @Transactional(readOnly = true)
    public WorkJourneyConfig findActiveByCompanyId(UUID companyId) {
        return repository.findByCompanyIdAndAtivoTrue(companyId)
                .orElse(null);
    }

    /**
     * Create or update configuration for a company.
     */
    @Transactional
    public WorkJourneyConfig saveOrUpdate(UUID companyId, Map<String, Object> updates) {
        WorkJourneyConfig config = repository.findByCompanyId(companyId)
                .orElse(null);

        if (config == null) {
            config = WorkJourneyConfig.builder()
                    .companyId(companyId)
                    .build();
        }

        // Apply updates dynamically
        if (updates.containsKey("cargaHorariaDiaria")) {
            config.setCargaHorariaDiaria(new java.math.BigDecimal(
                    updates.get("cargaHorariaDiaria").toString()));
        }
        if (updates.containsKey("toleranciaAtrasoMin")) {
            config.setToleranciaAtrasoMin(Integer.parseInt(
                    updates.get("toleranciaAtrasoMin").toString()));
        }
        if (updates.containsKey("intervaloMin")) {
            config.setIntervaloMin(Integer.parseInt(
                    updates.get("intervaloMin").toString()));
        }
        if (updates.containsKey("percentualHENormal")) {
            config.setPercentualHENormal(new java.math.BigDecimal(
                    updates.get("percentualHENormal").toString()));
        }
        if (updates.containsKey("percentualHENoturna")) {
            config.setPercentualHENoturna(new java.math.BigDecimal(
                    updates.get("percentualHENoturna").toString()));
        }
        if (updates.containsKey("percentualHE100")) {
            config.setPercentualHE100(new java.math.BigDecimal(
                    updates.get("percentualHE100").toString()));
        }
        if (updates.containsKey("cargaHorariaSemanal")) {
            config.setCargaHorariaSemanal(new java.math.BigDecimal(
                    updates.get("cargaHorariaSemanal").toString()));
        }
        if (updates.containsKey("inicioJornadaNoturna")) {
            config.setInicioJornadaNoturna(Integer.parseInt(
                    updates.get("inicioJornadaNoturna").toString()));
        }
        if (updates.containsKey("fimJornadaNoturna")) {
            config.setFimJornadaNoturna(Integer.parseInt(
                    updates.get("fimJornadaNoturna").toString()));
        }
        if (updates.containsKey("bancoHorasAtivo")) {
            config.setBancoHorasAtivo(Boolean.parseBoolean(
                    updates.get("bancoHorasAtivo").toString()));
        }
        if (updates.containsKey("geoObrigatoria")) {
            config.setGeoObrigatoria(Boolean.parseBoolean(
                    updates.get("geoObrigatoria").toString()));
        }
        if (updates.containsKey("geoRaioMetros")) {
            config.setGeoRaioMetros(Integer.parseInt(
                    updates.get("geoRaioMetros").toString()));
        }
        if (updates.containsKey("ativo")) {
            config.setAtivo(Boolean.parseBoolean(
                    updates.get("ativo").toString()));
        }

        WorkJourneyConfig saved = repository.save(config);
        log.info("✅ Configuração de jornada salva para companyId: {}", companyId);
        return saved;
    }

    /**
     * Create default configuration for a company.
     */
    private WorkJourneyConfig createDefault(UUID companyId) {
        WorkJourneyConfig config = WorkJourneyConfig.builder()
                .companyId(companyId)
                .build();
        WorkJourneyConfig saved = repository.save(config);
        log.info("⚙️ Configuração padrão de jornada criada para companyId: {}", companyId);
        return saved;
    }

    /**
     * Delete configuration by ID.
     */
    @Transactional
    public void deleteById(UUID id) {
        repository.deleteById(id);
        log.info("🗑️ Configuração de jornada excluída: {}", id);
    }

    // Removed getConfigAsMap() - use the entity directly via findByCompanyId()
}
