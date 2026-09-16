package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.CostSimulationDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Client;
import com.z7design.fleet_manager.model.CostSimulation;
import com.z7design.fleet_manager.model.enums.CostSimulationStatus;
import com.z7design.fleet_manager.model.enums.VehicleCategory;
import com.z7design.fleet_manager.repository.ClientRepository;
import com.z7design.fleet_manager.repository.ContractRepository;
import com.z7design.fleet_manager.repository.CostSimulationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * PRD 1.0 - MÓDULO 1: Engenharia de Custos, Orçamento & Precificação Paramétrica.
 *
 * Fórmulas implementadas (conforme PRD):
 * <pre>
 * CV/KM            = (Coef Diesel × Preço Litro) + Manutenção/KM + Pneus/KM + Lubrificantes/KM + Peças/KM
 * KM Franquia      = KM Produtiva × 1,10 (adição técnica de 10%)
 * CTM              = Custo Fixo Total + (KM Franquia × CV/KM)
 * Tarifa KM Exc.   = (CTM / KM Produtiva) × (1 + Mark-up de Impostos)
 * Diária           = CTM / dias operacionais
 * Viagem Extra     = Diária cheia × (1 + 15% margem operacional)
 * Preço Mensal     = CTM × (1 + margem lucro + BDI) / (1 - impostos)
 * </pre>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CostSimulationService {

    private final CostSimulationRepository costSimulationRepository;
    private final ClientRepository clientRepository;
    private final ContractRepository contractRepository;

    private static final int MONEY_SCALE = 2;
    private static final int RATE_SCALE = 4;

    // ===== CRUD =====

    @Transactional(readOnly = true)
    public List<CostSimulationDTO> getAll() {
        return costSimulationRepository.findAll().stream()
                .map(CostSimulationDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CostSimulationDTO getById(UUID id) {
        return CostSimulationDTO.fromEntity(findEntity(id));
    }

    @Transactional(readOnly = true)
    public List<CostSimulationDTO> getByClient(UUID clientId) {
        return costSimulationRepository.findByClientId(clientId).stream()
                .map(CostSimulationDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CostSimulationDTO> getByStatus(CostSimulationStatus status) {
        return costSimulationRepository.findByStatus(status).stream()
                .map(CostSimulationDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Cria a simulação e executa o motor de cálculo paramétrico.
     */
    @Transactional
    public CostSimulationDTO create(CostSimulationDTO dto) {
        log.info("Criando simulação de custos: {}", dto.getName());

        CostSimulation entity = new CostSimulation();
        applyDto(entity, dto);
        validateParameters(entity);

        // O motor de cálculo roda sempre na gravação: ficha paramétrica sempre consistente
        calculate(entity);

        CostSimulation saved = costSimulationRepository.save(entity);
        log.info("Simulação criada com ID {}: preço mensal sugerido {}", saved.getId(), saved.getMonthlyPrice());
        return CostSimulationDTO.fromEntity(saved);
    }

    @Transactional
    public CostSimulationDTO update(UUID id, CostSimulationDTO dto) {
        log.info("Atualizando simulação de custos: {}", id);
        CostSimulation entity = findEntity(id);
        applyDto(entity, dto);
        validateParameters(entity);
        calculate(entity);

        // Alterar parâmetros após aprovação devolve a simulação para rascunho
        if (entity.getStatus() == CostSimulationStatus.APPROVED) {
            entity.setStatus(CostSimulationStatus.DRAFT);
            entity.setApprovedBy(null);
            entity.setApprovedAt(null);
            entity.setApprovalNotes(null);
        }

        CostSimulation saved = costSimulationRepository.save(entity);
        return CostSimulationDTO.fromEntity(saved);
    }

    @Transactional
    public void delete(UUID id) {
        if (!costSimulationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Simulação de custos não encontrada com ID: " + id);
        }
        costSimulationRepository.deleteById(id);
    }

    /**
     * Diretoria valida margens mínimas de rentabilidade (PRD 1.2 - Atores).
     */
    @Transactional
    public CostSimulationDTO approve(UUID id, String approvedBy, String notes) {
        log.info("Aprovando simulação de custos: {} por {}", id, approvedBy);
        CostSimulation entity = findEntity(id);
        entity.setStatus(CostSimulationStatus.APPROVED);
        entity.setApprovedBy(approvedBy);
        entity.setApprovedAt(LocalDateTime.now());
        entity.setApprovalNotes(notes);
        CostSimulation saved = costSimulationRepository.save(entity);
        return CostSimulationDTO.fromEntity(saved);
    }

    @Transactional
    public CostSimulationDTO reject(UUID id, String approvedBy, String notes) {
        log.info("Reprovando simulação de custos: {} por {}", id, approvedBy);
        CostSimulation entity = findEntity(id);
        entity.setStatus(CostSimulationStatus.REJECTED);
        entity.setApprovedBy(approvedBy);
        entity.setApprovedAt(LocalDateTime.now());
        entity.setApprovalNotes(notes);
        CostSimulation saved = costSimulationRepository.save(entity);
        return CostSimulationDTO.fromEntity(saved);
    }

    /**
     * Envia para validação da Diretoria.
     */
    @Transactional
    public CostSimulationDTO submitForApproval(UUID id) {
        CostSimulation entity = findEntity(id);
        entity.setStatus(CostSimulationStatus.PENDING_APPROVAL);
        CostSimulation saved = costSimulationRepository.save(entity);
        return CostSimulationDTO.fromEntity(saved);
    }

    // ===== MOTOR DE CÁLCULO PARAMÉTRICO (PRD Módulo 1) =====

    /**
     * Executa o cálculo completo da ficha paramétrica e preenche os campos de resultado.
     */
    public void calculate(CostSimulation s) {
        VehicleCategory category = s.getVehicleCategory() != null ? s.getVehicleCategory() : VehicleCategory.BUS;

        // 1. Custo Variável por KM: (Coef Diesel × Preço Litro) + Man/KM + Pneus/KM + Lub/KM + Peças/KM
        BigDecimal dieselPerKm = category.getDieselCoefficient().multiply(s.getDieselPrice());
        BigDecimal cvPerKm = dieselPerKm
                .add(nvl(s.getMaintenancePerKm()))
                .add(nvl(s.getTiresPerKm()))
                .add(nvl(s.getLubricantsPerKm()))
                .add(nvl(s.getPartsPerKm()));
        s.setVariableCostPerKm(cvPerKm.setScale(RATE_SCALE, RoundingMode.HALF_UP));

        // 2. KM Produtivo mensal = KM diário × dias operacionais
        BigDecimal productiveKm = nvl(s.getDailyKm()).multiply(BigDecimal.valueOf(s.getOperatingDays()));

        // 3. KM Franquia Mensal = KM Produtiva × fator (padrão 1,10 - vazios e garagem)
        BigDecimal franchiseKm = productiveKm.multiply(
                s.getProductivityFactor() != null ? s.getProductivityFactor() : BigDecimal.ONE);
        s.setFranchiseKm(franchiseKm.setScale(MONEY_SCALE, RoundingMode.HALF_UP));

        // 4. Custo fixo: mão de obra (motoristas × custo total) + custos fixos adicionais
        BigDecimal driverCost = nvl(s.getBaseSalary())
                .multiply(BigDecimal.ONE.add(nvl(s.getPayrollChargesPct())))
                .add(nvl(s.getMealAllowance()))
                .add(nvl(s.getHealthPlanCost()));
        int drivers = s.getDriverCount() != null ? Math.max(1, Math.min(3, s.getDriverCount())) : 1;
        BigDecimal fixedDriverCost = driverCost.multiply(BigDecimal.valueOf(drivers));
        s.setFixedDriverCost(fixedDriverCost.setScale(MONEY_SCALE, RoundingMode.HALF_UP));

        BigDecimal totalFixedCost = fixedDriverCost.add(nvl(s.getFixedCosts()));
        s.setTotalFixedCost(totalFixedCost.setScale(MONEY_SCALE, RoundingMode.HALF_UP));

        // 5. Custo Total Mensal: CTM = Custo Fixo Total + (KM Franquia × CV/KM)
        BigDecimal ctm = totalFixedCost.add(franchiseKm.multiply(cvPerKm));
        s.setTotalMonthlyCost(ctm.setScale(MONEY_SCALE, RoundingMode.HALF_UP));

        // 6. Impostos totais (soma simples das alíquotas)
        BigDecimal taxes = nvl(s.getIssPct())
                .add(nvl(s.getIcmsPct()))
                .add(nvl(s.getPisPct()))
                .add(nvl(s.getCofinsPct()))
                .add(nvl(s.getIrpjPct()))
                .add(nvl(s.getCsllPct()));
        s.setTaxesTotalPct(taxes.setScale(RATE_SCALE, RoundingMode.HALF_UP));

        // 7. Preço mensal: mark-up para cobrir impostos + margem + BDI
        //    Preço = CTM × (1 + margem + BDI) / (1 - impostos)
        BigDecimal markup = nvl(s.getProfitMarginPct()).add(nvl(s.getBdiPct()));
        BigDecimal divisor = BigDecimal.ONE.subtract(taxes);
        BigDecimal monthlyPrice;
        if (divisor.compareTo(BigDecimal.ZERO) <= 0) {
            // Aliquotas somadas >= 100%: não há divisor válido, usa mark-up simples
            log.warn("Aliquotas somadas >= 100% na simulação {}: usando mark-up simples", s.getName());
            monthlyPrice = ctm.multiply(BigDecimal.ONE.add(markup));
        } else {
            monthlyPrice = ctm.multiply(BigDecimal.ONE.add(markup)).divide(divisor, MONEY_SCALE, RoundingMode.HALF_UP);
        }
        s.setMonthlyPrice(monthlyPrice);

        // 8. Valor da Diária = Preço Mensal / dias operacionais
        BigDecimal dailyRate = monthlyPrice.divide(BigDecimal.valueOf(s.getOperatingDays()), MONEY_SCALE, RoundingMode.HALF_UP);
        s.setDailyRate(dailyRate);

        // 9. Tarifa do KM Excedente = (CTM / KM Produtiva) × (1 + Mark-up de Impostos)
        BigDecimal excessKmRate;
        if (productiveKm.compareTo(BigDecimal.ZERO) > 0) {
            excessKmRate = ctm.divide(productiveKm, 6, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.ONE.add(taxes));
        } else {
            excessKmRate = BigDecimal.ZERO;
        }
        s.setExcessKmRate(excessKmRate.setScale(RATE_SCALE, RoundingMode.HALF_UP));

        // 10. Tarifa de Viagem Extra = Diária cheia × (1 + margem operacional, padrão 15%)
        BigDecimal extraTripRate = dailyRate.multiply(BigDecimal.ONE.add(nvl(s.getExtraTripMarginPct())));
        s.setExtraTripRate(extraTripRate.setScale(MONEY_SCALE, RoundingMode.HALF_UP));
    }

    // ===== Helpers =====

    private CostSimulation findEntity(UUID id) {
        return costSimulationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Simulação de custos não encontrada com ID: " + id));
    }

    private void applyDto(CostSimulation entity, CostSimulationDTO dto) {
        entity.setName(dto.getName());
        if (dto.getClientId() != null) {
            Client client = clientRepository.findById(dto.getClientId()).orElse(null);
            entity.setClient(client);
        } else {
            entity.setClient(null);
        }
        if (dto.getContractId() != null) {
            entity.setContract(contractRepository.findById(dto.getContractId()).orElse(null));
        } else {
            entity.setContract(null);
        }
        entity.setVehicleCategory(dto.getVehicleCategory() != null ? dto.getVehicleCategory() : VehicleCategory.BUS);
        entity.setDriverCount(dto.getDriverCount() != null ? dto.getDriverCount() : 1);
        entity.setOperatingDays(dto.getOperatingDays() != null ? dto.getOperatingDays() : 22);
        entity.setDieselPrice(dto.getDieselPrice());
        entity.setBaseSalary(dto.getBaseSalary());
        entity.setPayrollChargesPct(dto.getPayrollChargesPct() != null ? dto.getPayrollChargesPct() : new BigDecimal("0.7000"));
        entity.setMealAllowance(nvl(dto.getMealAllowance()));
        entity.setHealthPlanCost(nvl(dto.getHealthPlanCost()));
        entity.setDailyKm(dto.getDailyKm());
        entity.setProductivityFactor(dto.getProductivityFactor() != null ? dto.getProductivityFactor() : new BigDecimal("1.1000"));
        entity.setMaintenancePerKm(nvl(dto.getMaintenancePerKm()));
        entity.setTiresPerKm(nvl(dto.getTiresPerKm()));
        entity.setLubricantsPerKm(nvl(dto.getLubricantsPerKm()));
        entity.setPartsPerKm(nvl(dto.getPartsPerKm()));
        entity.setFixedCosts(nvl(dto.getFixedCosts()));
        entity.setIssPct(dto.getIssPct() != null ? dto.getIssPct() : new BigDecimal("0.0500"));
        entity.setIcmsPct(dto.getIcmsPct() != null ? dto.getIcmsPct() : new BigDecimal("0.1044"));
        entity.setPisPct(dto.getPisPct() != null ? dto.getPisPct() : new BigDecimal("0.0065"));
        entity.setCofinsPct(dto.getCofinsPct() != null ? dto.getCofinsPct() : new BigDecimal("0.0300"));
        entity.setIrpjPct(dto.getIrpjPct() != null ? dto.getIrpjPct() : new BigDecimal("0.0240"));
        entity.setCsllPct(dto.getCsllPct() != null ? dto.getCsllPct() : new BigDecimal("0.0108"));
        entity.setProfitMarginPct(dto.getProfitMarginPct() != null ? dto.getProfitMarginPct() : new BigDecimal("0.1000"));
        entity.setBdiPct(nvl(dto.getBdiPct()));
        entity.setExtraTripMarginPct(dto.getExtraTripMarginPct() != null ? dto.getExtraTripMarginPct() : new BigDecimal("0.1500"));
        entity.setNotes(dto.getNotes());
    }

    /**
     * Valida parâmetros críticos conforme PRD (encargos 60-85%, dias 22/26/30, turnos 1-3).
     */
    private void validateParameters(CostSimulation entity) {
        if (entity.getDieselPrice() == null || entity.getDieselPrice().signum() <= 0) {
            throw new IllegalArgumentException("Cotação do diesel é obrigatória e deve ser maior que zero");
        }
        if (entity.getBaseSalary() == null || entity.getBaseSalary().signum() < 0) {
            throw new IllegalArgumentException("Piso salarial é obrigatório");
        }
        if (entity.getDailyKm() == null || entity.getDailyKm().signum() <= 0) {
            throw new IllegalArgumentException("KM diário é obrigatório e deve ser maior que zero");
        }
        if (entity.getDriverCount() == null || entity.getDriverCount() < 1 || entity.getDriverCount() > 3) {
            throw new IllegalArgumentException("Regime de turnos deve ser de 1 a 3 motoristas");
        }
        if (entity.getOperatingDays() < 1 || entity.getOperatingDays() > 31) {
            throw new IllegalArgumentException("Dias operacionais deve estar entre 1 e 31 (PRD: 22, 26 ou 30)");
        }
        if (entity.getPayrollChargesPct() != null) {
            BigDecimal pct = entity.getPayrollChargesPct().multiply(BigDecimal.valueOf(100));
            if (pct.compareTo(BigDecimal.valueOf(60)) < 0 || pct.compareTo(BigDecimal.valueOf(85)) > 0) {
                log.warn("Encargos sociais fora da faixa PRD (60% a 85%): {}%", pct);
            }
        }
    }

    private static BigDecimal nvl(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }
}
