package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.MeasurementBulletinDTO;
import com.z7design.fleet_manager.dto.MeasurementItemDTO;
import com.z7design.fleet_manager.dto.CalculationMemoryDTO;
import com.z7design.fleet_manager.model.MeasurementBulletin;
import com.z7design.fleet_manager.model.MeasurementItem;
import com.z7design.fleet_manager.model.CalculationMemory;
import com.z7design.fleet_manager.model.enums.MeasurementStatus;
import com.z7design.fleet_manager.model.enums.MeasurementCategory;
import com.z7design.fleet_manager.repository.MeasurementBulletinRepository;
import com.z7design.fleet_manager.repository.MeasurementItemRepository;
import com.z7design.fleet_manager.repository.CalculationMemoryRepository;
import com.z7design.fleet_manager.repository.ClientRepository;
import com.z7design.fleet_manager.repository.ContractRepository;
import com.z7design.fleet_manager.repository.UnitRepository;
import com.z7design.fleet_manager.repository.CostCenterRepository;
import com.z7design.fleet_manager.repository.WorkPostRepository;
import com.z7design.fleet_manager.repository.AccountsReceivableRepository;
import com.z7design.fleet_manager.model.AccountsReceivable;
import com.z7design.fleet_manager.model.WorkPost;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageImpl;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.hibernate.Hibernate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class MeasurementService {

    private final MeasurementBulletinRepository bulletinRepository;
    private final MeasurementItemRepository itemRepository;
    private final CalculationMemoryRepository memoryRepository;
    private final ClientRepository clientRepository;
    private final ContractRepository contractRepository;
    private final UnitRepository unitRepository;
    private final CostCenterRepository costCenterRepository;
    private final WorkPostRepository workPostRepository;
    private final AccountsReceivableRepository accountsReceivableRepository;

    private void performBusinessCalculations(MeasurementBulletin bulletin) {
        if (bulletin.getItems() == null || bulletin.getItems().isEmpty()) {
            return;
        }

        long totalDaysInPeriod = 0;
        if (bulletin.getPeriodStart() != null && bulletin.getPeriodEnd() != null) {
            totalDaysInPeriod = java.time.temporal.ChronoUnit.DAYS.between(bulletin.getPeriodStart(),
                    bulletin.getPeriodEnd()) + 1;
        }

        BigDecimal subtotalBeforeRetention = BigDecimal.ZERO;

        // Primeira passada: calcular itens regulares e KM excedente
        for (MeasurementItem item : bulletin.getItems()) {
            // Lógica para Quilometragem Excedente
            if (item.getCategory() == MeasurementCategory.EXCESS_KM) {
                if (item.getFinalKm() != null && item.getInitialKm() != null) {
                    BigDecimal diff = item.getFinalKm().subtract(item.getInitialKm());
                    BigDecimal franchise = item.getFranchiseKm() != null ? item.getFranchiseKm() : BigDecimal.ZERO;
                    BigDecimal disregarded = item.getDisregardedKm() != null ? item.getDisregardedKm()
                            : BigDecimal.ZERO;

                    // KM considerado = diferença entre KM final e inicial
                    BigDecimal kmConsiderado = diff;

                    // KM excedido = KM considerado - franquia - desconsiderado
                    BigDecimal quantity = kmConsiderado.subtract(franchise).subtract(disregarded);
                    if (quantity.compareTo(BigDecimal.ZERO) < 0) {
                        quantity = BigDecimal.ZERO;
                    }

                    item.setKmConsiderado(kmConsiderado);
                    item.setKmExcedido(quantity);
                    item.setQuantity(quantity);

                    // Valor do KM excedido = KM excedido x preço unitário
                    if (item.getUnitPrice() != null) {
                        item.setValorKmExcedido(quantity.multiply(item.getUnitPrice()));
                    }

                    log.info("Cálculo de KM Excedente item {}: ({} - {}) - {} - {} = {}",
                            item.getItemNumber(), item.getFinalKm(), item.getInitialKm(), franchise, disregarded,
                            quantity);
                }
            }

            // Lógica para Dias Trabalhados (Proporcional)
            else if (item.getWorkingDays() != null && item.getWorkingDays() > 0 && totalDaysInPeriod > 0) {
                if (item.getUnit() != null && item.getUnit().toUpperCase().contains("MÊS")) {
                    BigDecimal proportion = BigDecimal.valueOf(item.getWorkingDays())
                            .divide(BigDecimal.valueOf(totalDaysInPeriod), 4, java.math.RoundingMode.HALF_UP);
                    item.setQuantity(proportion);
                    log.info("Cálculo proporcional item {}: {}/{} dias = {}",
                            item.getItemNumber(), item.getWorkingDays(), totalDaysInPeriod, proportion);
                }
            }

            // Lógica para Viagens Extras
            else if (item.getCategory() == MeasurementCategory.EXTRA_TRIP
                    || Boolean.TRUE.equals(item.getIsExtraTrip())) {
                if (item.getTripCount() != null && item.getTripCount() > 0) {
                    item.setQuantity(BigDecimal.valueOf(item.getTripCount()));
                }
            }

            // Recalcular valor total do item antes de somar ao subtotal
            if (item.getQuantity() != null && item.getUnitPrice() != null) {
                item.calculateTotalValue();

                // Acumular para retenção (exceto se for o próprio item de retenção)
                if (item.getCategory() != MeasurementCategory.RETENTION) {
                    subtotalBeforeRetention = subtotalBeforeRetention.add(item.getTotalValue());
                }
            }
        }

        // Segunda passada: calcular Retenção de Garantia (5%) se existir
        for (MeasurementItem item : bulletin.getItems()) {
            if (item.getCategory() == MeasurementCategory.RETENTION) {
                BigDecimal retentionValue = subtotalBeforeRetention.multiply(new BigDecimal("0.05"))
                        .multiply(new BigDecimal("-1")).setScale(2, java.math.RoundingMode.HALF_UP);
                item.setQuantity(BigDecimal.ONE);
                item.setUnitPrice(retentionValue);
                item.calculateTotalValue();
                log.info("Retenção de Garantia calculada para item {}: 5% de {} = {}",
                        item.getItemNumber(), subtotalBeforeRetention, retentionValue);
            }
        }

        // Recalcular subtotal do boletim
        bulletin.calculateSubtotal();
    }
    // ===== BOLETINS DE MEDIÃ‡ÃƒO =====

    public long getBulletinCount() {
        try {
            return bulletinRepository.count();
        } catch (Exception e) {
            log.error("Erro ao contar boletins: {}", e.getMessage(), e);
            return 0;
        }
    }

    public List<MeasurementBulletinDTO> getAllBulletins() {
        log.info("Buscando todos os boletins de mediÃ§Ã£o");
        try {
            // Verificar se a tabela existe e tem dados
            long count = bulletinRepository.count();
            log.info("Total de boletins na tabela: {}", count);

            if (count == 0) {
                log.info("Nenhum boletim encontrado, retornando lista vazia");
                return List.of();
            }

            List<MeasurementBulletin> bulletins;
            // Usar mÃ©todo mais simples para evitar problemas de mapeamento
            bulletins = bulletinRepository.findAllSimple();
            log.info("Encontrados {} boletins usando findAllSimple", bulletins.size());

            return bulletins.stream()
                    .map(bulletin -> {
                        try {
                            MeasurementBulletinDTO dto = MeasurementBulletinDTO.fromEntity(bulletin);

                            // Se o subtotal estiver zerado ou nulo, calcular a partir dos itens
                            if (dto.getSubtotal() == null || dto.getSubtotal().compareTo(BigDecimal.ZERO) == 0) {
                                if (dto.getItems() != null && !dto.getItems().isEmpty()) {
                                    BigDecimal calculatedSubtotal = dto.getItems().stream()
                                            .map(item -> {
                                                BigDecimal quantity = item.getQuantity() != null ? item.getQuantity()
                                                        : BigDecimal.ZERO;
                                                BigDecimal unitPrice = item.getUnitPrice() != null ? item.getUnitPrice()
                                                        : BigDecimal.ZERO;
                                                return quantity.multiply(unitPrice);
                                            })
                                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                                    dto.setSubtotal(calculatedSubtotal);
                                    log.debug("Subtotal calculado para boletim {}: {}", bulletin.getId(),
                                            calculatedSubtotal);
                                }
                            }

                            return dto;
                        } catch (Exception e) {
                            log.error("Erro ao converter boletim {}: {}", bulletin.getId(), e.getMessage());
                            // Retornar DTO bÃ¡sico em caso de erro
                            MeasurementBulletinDTO dto = new MeasurementBulletinDTO();
                            dto.setId(bulletin.getId());
                            dto.setCompanyName(bulletin.getCompanyName() != null ? bulletin.getCompanyName() : "N/A");
                            dto.setPeriodStart(bulletin.getPeriodStart());
                            dto.setPeriodEnd(bulletin.getPeriodEnd());
                            dto.setContractNumber(
                                    bulletin.getContractNumber() != null ? bulletin.getContractNumber() : "N/A");
                            dto.setStatus(bulletin.getStatus());
                            dto.setSubtotal(bulletin.getSubtotal() != null ? bulletin.getSubtotal() : BigDecimal.ZERO);
                            dto.setElaboratedBy(
                                    bulletin.getElaboratedBy() != null ? bulletin.getElaboratedBy() : "N/A");
                            dto.setMeasuredBy(bulletin.getMeasuredBy() != null ? bulletin.getMeasuredBy() : "N/A");
                            dto.setNfNumber(bulletin.getNfNumber());
                            dto.setValidatedBy(bulletin.getValidatedBy());
                            dto.setCheckedBy(bulletin.getCheckedBy());
                            dto.setCreatedAt(bulletin.getCreatedAt());
                            dto.setUpdatedAt(bulletin.getUpdatedAt());
                            dto.setNotes(bulletin.getNotes());

                            // Tratar entidades relacionadas com seguranÃ§a
                            try {
                                if (bulletin.getClient() != null) {
                                    dto.setClientId(bulletin.getClient().getId());
                                    dto.setClientName(bulletin.getClient().getName());
                                }
                            } catch (Exception clientError) {
                                log.warn("Erro ao acessar cliente do boletim {}: {}", bulletin.getId(),
                                        clientError.getMessage());
                            }

                            try {
                                if (bulletin.getContract() != null) {
                                    dto.setContractId(bulletin.getContract().getId());
                                }
                            } catch (Exception contractError) {
                                log.warn("Erro ao acessar contrato do boletim {}: {}", bulletin.getId(),
                                        contractError.getMessage());
                            }

                            try {
                                if (bulletin.getUnit() != null) {
                                    dto.setUnitId(bulletin.getUnit().getId());
                                    dto.setUnitName(bulletin.getUnit().getName());
                                }
                            } catch (Exception unitError) {
                                log.warn("Erro ao acessar unidade do boletim {}: {}", bulletin.getId(),
                                        unitError.getMessage());
                            }

                            return dto;
                        }
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Erro ao buscar boletins de mediÃ§Ã£o: {}", e.getMessage(), e);
            // Retornar lista vazia em caso de erro para evitar 500
            return List.of();
        }
    }

    public Page<MeasurementBulletinDTO> getBulletinsWithFilters(
            MeasurementStatus status,
            String contractNumber,
            UUID clientId,
            UUID unitId,
            LocalDate periodStart,
            LocalDate periodEnd,
            Pageable pageable) {

        log.info("Buscando boletins com filtros - Status: {}, Contrato: {}, Cliente: {}, Unidade: {}",
                status, contractNumber, clientId, unitId);

        try {
            // Usar consulta personalizada que evita entidades relacionadas problemÃ¡ticas
            List<MeasurementBulletin> allBulletins = bulletinRepository.findAllBasicData();

            // Aplicar filtros manualmente
            List<MeasurementBulletin> filteredBulletins = allBulletins.stream()
                    .filter(bulletin -> status == null || bulletin.getStatus() == status)
                    .filter(bulletin -> contractNumber == null || bulletin.getContractNumber().contains(contractNumber))
                    .filter(bulletin -> clientId == null
                            || (bulletin.getClient() != null && bulletin.getClient().getId().equals(clientId)))
                    .filter(bulletin -> unitId == null
                            || (bulletin.getUnit() != null && bulletin.getUnit().getId().equals(unitId)))
                    .filter(bulletin -> periodStart == null || !bulletin.getPeriodStart().isBefore(periodStart))
                    .filter(bulletin -> periodEnd == null || !bulletin.getPeriodEnd().isAfter(periodEnd))
                    .collect(Collectors.toList());

            // Aplicar paginaÃ§Ã£o manualmente
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), filteredBulletins.size());

            List<MeasurementBulletin> pagedBulletins = start < filteredBulletins.size()
                    ? filteredBulletins.subList(start, end)
                    : new ArrayList<>();

            Page<MeasurementBulletin> bulletinPage = new PageImpl<>(
                    pagedBulletins,
                    pageable,
                    filteredBulletins.size());

            return bulletinPage.map(bulletin -> {
                try {
                    return MeasurementBulletinDTO.fromEntity(bulletin);
                } catch (Exception e) {
                    log.error("Erro ao converter boletim {}: {}", bulletin.getId(), e.getMessage());
                    // Retornar DTO bÃ¡sico em caso de erro
                    MeasurementBulletinDTO dto = new MeasurementBulletinDTO();
                    dto.setId(bulletin.getId());
                    dto.setCompanyName(bulletin.getCompanyName());
                    dto.setPeriodStart(bulletin.getPeriodStart());
                    dto.setPeriodEnd(bulletin.getPeriodEnd());
                    dto.setContractNumber(bulletin.getContractNumber());
                    dto.setStatus(bulletin.getStatus());
                    dto.setSubtotal(bulletin.getSubtotal());
                    return dto;
                }
            });
        } catch (Exception e) {
            log.error("Erro ao buscar boletins com filtros: {}", e.getMessage(), e);
            return Page.empty(pageable);
        }
    }

    public List<MeasurementBulletinDTO> searchBulletins(String searchTerm) {
        log.info("Buscando boletins por termo: {}", searchTerm);
        return bulletinRepository.findBySearchTerm(searchTerm).stream()
                .map(MeasurementBulletinDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MeasurementBulletinDTO getBulletinById(UUID id) {
        log.info("Buscando boletim por ID: {}", id);
        MeasurementBulletin bulletin = bulletinRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Boletim de mediÃ§Ã£o nÃ£o encontrado: " + id));

        // Inicializar relacionamentos lazy dentro da transaÃ§Ã£o
        if (bulletin.getClient() != null) {
            Hibernate.initialize(bulletin.getClient());
        }
        if (bulletin.getContract() != null) {
            Hibernate.initialize(bulletin.getContract());
        }
        if (bulletin.getUnit() != null) {
            Hibernate.initialize(bulletin.getUnit());
        }
        if (bulletin.getItems() != null) {
            Hibernate.initialize(bulletin.getItems());
        }

        return MeasurementBulletinDTO.fromEntity(bulletin);
    }

    public MeasurementBulletinDTO createBulletin(MeasurementBulletinDTO dto) {
        log.info("Criando novo boletim de mediÃ§Ã£o para contrato: {}", dto.getContractNumber());

        MeasurementBulletin bulletin = MeasurementBulletinDTO.toEntity(dto);
        bulletin.setStatus(MeasurementStatus.DRAFT);

        // Associar entidades relacionadas (tolerante a erros)
        if (dto.getClientId() != null) {
            try {
                bulletin.setClient(clientRepository.findById(dto.getClientId())
                        .orElse(null));
            } catch (Exception e) {
                log.warn("Cliente nÃ£o encontrado: {}, continuando sem cliente", dto.getClientId());
            }
        }

        if (dto.getContractId() != null) {
            try {
                bulletin.setContract(contractRepository.findById(dto.getContractId())
                        .orElse(null));
            } catch (Exception e) {
                log.warn("Contrato nÃ£o encontrado: {}, continuando sem contrato", dto.getContractId());
            }
        }

        if (dto.getUnitId() != null) {
            try {
                bulletin.setUnit(unitRepository.findById(dto.getUnitId())
                        .orElse(null));
            } catch (Exception e) {
                log.warn("Unidade nÃ£o encontrada: {}, continuando sem unidade", dto.getUnitId());
            }
        }

        if (dto.getWorkPostId() != null) {
            try {
                bulletin.setWorkPost(workPostRepository.findById(dto.getWorkPostId())
                        .orElse(null));
            } catch (Exception e) {
                log.warn("Obra/Posto nÃ£o encontrado: {}, continuando sem obra", dto.getWorkPostId());
            }
        }

        // Salvar boletim primeiro
        bulletin = bulletinRepository.save(bulletin);

        // Processar itens se existirem
        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            for (MeasurementItemDTO itemDto : dto.getItems()) {
                MeasurementItem item = MeasurementItemDTO.toEntity(itemDto);
                item.setBulletin(bulletin);

                // Associar centro de custo se especificado
                if (itemDto.getCostCenterId() != null) {
                    item.setCostCenterId(itemDto.getCostCenterId());
                }

                bulletin.addItem(item);
            }
        }

        // Recalcular subtotal e salvar novamente
        performBusinessCalculations(bulletin);
        bulletin = bulletinRepository.save(bulletin);

        // Processar memÃ³ria de cÃ¡lculo se existir
        if (dto.getCalculationMemory() != null) {
            CalculationMemory memory = CalculationMemoryDTO.toEntity(dto.getCalculationMemory());
            memory.setBulletin(bulletin);
            memoryRepository.save(memory);
            log.info("MemÃ³ria de cÃ¡lculo salva para boletim: {}", bulletin.getId());
        }

        log.info("Boletim criado com sucesso - ID: {}, Subtotal: {}", bulletin.getId(), bulletin.getSubtotal());

        // Gerar automaticamente o Contas a Receber
        try {
            generateAccountsReceivableFromMeasurement(bulletin.getId(), null);
        } catch (Exception e) {
            log.warn("Não foi possível gerar Contas a Receber automaticamente na criação: {}", e.getMessage());
        }

        return MeasurementBulletinDTO.fromEntity(bulletin);
    }

    public MeasurementBulletinDTO updateBulletin(UUID id, MeasurementBulletinDTO dto) {
        log.info("Atualizando boletim de mediÃ§Ã£o: {}", id);

        MeasurementBulletin existingBulletin = bulletinRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Boletim de mediÃ§Ã£o nÃ£o encontrado: " + id));

        // Atualizar campos bÃ¡sicos (apenas se nÃ£o forem nulos)
        if (dto.getCompanyName() != null) {
            existingBulletin.setCompanyName(dto.getCompanyName());
        }
        if (dto.getPeriodStart() != null) {
            existingBulletin.setPeriodStart(dto.getPeriodStart());
        }
        if (dto.getPeriodEnd() != null) {
            existingBulletin.setPeriodEnd(dto.getPeriodEnd());
        }
        if (dto.getContractNumber() != null) {
            existingBulletin.setContractNumber(dto.getContractNumber());
        }
        if (dto.getContractStart() != null) {
            existingBulletin.setContractStart(dto.getContractStart());
        }
        if (dto.getContractEnd() != null) {
            existingBulletin.setContractEnd(dto.getContractEnd());
        }
        if (dto.getNfNumber() != null) {
            existingBulletin.setNfNumber(dto.getNfNumber());
        }
        if (dto.getElaboratedBy() != null) {
            existingBulletin.setElaboratedBy(dto.getElaboratedBy());
        }
        if (dto.getMeasuredBy() != null) {
            existingBulletin.setMeasuredBy(dto.getMeasuredBy());
        }
        if (dto.getNotes() != null) {
            existingBulletin.setNotes(dto.getNotes());
        }

        // Atualizar status se fornecido
        if (dto.getStatus() != null) {
            existingBulletin.setStatus(dto.getStatus());
        }

        // Atualizar entidades relacionadas
        if (dto.getClientId() != null) {
            try {
                existingBulletin.setClient(clientRepository.findById(dto.getClientId())
                        .orElseThrow(
                                () -> new ResourceNotFoundException("Cliente nÃ£o encontrado: " + dto.getClientId())));
            } catch (ResourceNotFoundException e) {
                log.warn(
                        "Cliente nÃ£o encontrado ao atualizar boletim: {}. Mantendo cliente atual ou removendo se necessÃ¡rio.",
                        dto.getClientId());
                // Se o cliente nÃ£o existe, manter o cliente atual ou definir como null
                // NÃ£o falhar a atualizaÃ§Ã£o por causa disso
                if (existingBulletin.getClient() == null
                        || !existingBulletin.getClient().getId().equals(dto.getClientId())) {
                    existingBulletin.setClient(null);
                }
            }
        }

        if (dto.getContractId() != null) {
            existingBulletin.setContract(contractRepository.findById(dto.getContractId())
                    .orElseThrow(
                            () -> new ResourceNotFoundException("Contrato nÃ£o encontrado: " + dto.getContractId())));
        }

        if (dto.getUnitId() != null) {
            existingBulletin.setUnit(unitRepository.findById(dto.getUnitId())
                    .orElseThrow(() -> new ResourceNotFoundException("Unidade nÃ£o encontrada: " + dto.getUnitId())));
        }

        if (dto.getWorkPostId() != null) {
            existingBulletin.setWorkPost(workPostRepository.findById(dto.getWorkPostId())
                    .orElse(null));
        }

        // Atualizar itens se fornecidos
        if (dto.getItems() != null) {
            // Remover itens existentes
            try {
                itemRepository.deleteByBulletinId(id);
                existingBulletin.getItems().clear();
            } catch (Exception e) {
                log.warn("Erro ao deletar itens existentes (pode nÃ£o existir): {}", e.getMessage());
                // Limpar lista mesmo se houver erro
                existingBulletin.getItems().clear();
            }

            // Adicionar novos itens se houver
            if (!dto.getItems().isEmpty()) {
                for (MeasurementItemDTO itemDto : dto.getItems()) {
                    try {
                        MeasurementItem item = MeasurementItemDTO.toEntity(itemDto);
                        item.setBulletin(existingBulletin);

                        // Calcular valor total do item
                        if (item.getQuantity() != null && item.getUnitPrice() != null) {
                            item.calculateTotalValue();
                        }

                        if (itemDto.getCostCenterId() != null) {
                            item.setCostCenterId(itemDto.getCostCenterId());
                        }

                        existingBulletin.addItem(item);
                    } catch (Exception e) {
                        log.error("Erro ao adicionar item ao boletim: {}", e.getMessage(), e);
                        throw new RuntimeException("Erro ao processar item: " + e.getMessage(), e);
                    }
                }
            }
        }

        // Atualizar subtotal se fornecido diretamente, senÃ£o recalcular
        if (dto.getSubtotal() != null && dto.getSubtotal().compareTo(BigDecimal.ZERO) > 0) {
            existingBulletin.setSubtotal(dto.getSubtotal());
        } else {
            // Recalcular subtotal a partir dos itens
            performBusinessCalculations(existingBulletin);
        }

        existingBulletin = bulletinRepository.save(existingBulletin);

        log.info("Boletim atualizado com sucesso - ID: {}, Subtotal: {}", existingBulletin.getId(),
                existingBulletin.getSubtotal());

        // Sincronizar automaticamente com Contas a Receber
        try {
            generateAccountsReceivableFromMeasurement(existingBulletin.getId(), null);
        } catch (Exception e) {
            log.warn("Não foi possível sincronizar Contas a Receber na atualização: {}", e.getMessage());
        }

        return MeasurementBulletinDTO.fromEntity(existingBulletin);
    }

    public MeasurementBulletinDTO validateBulletin(UUID id, String validatedBy, String checkedBy) {
        log.info("Validando boletim de mediÃ§Ã£o: {} por {}", id, validatedBy);

        MeasurementBulletin bulletin = bulletinRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Boletim de mediÃ§Ã£o nÃ£o encontrado: " + id));

        bulletin.setValidatedBy(validatedBy);
        bulletin.setCheckedBy(checkedBy);
        bulletin.setStatus(MeasurementStatus.VALIDATED);

        bulletin = bulletinRepository.save(bulletin);

        // Gerar automaticamente o título a receber no financeiro
        try {
            generateAccountsReceivableFromMeasurement(bulletin.getId(), null);
        } catch (Exception ex) {
            log.error("Erro ao gerar Contas a Receber na validação da medição: {}", ex.getMessage(), ex);
        }

        log.info("Boletim validado com sucesso: {}", id);
        return MeasurementBulletinDTO.fromEntity(bulletin);
    }

    public void generateAccountsReceivableFromMeasurement(UUID measurementId, LocalDate dueDateOverride) {
        MeasurementBulletin bulletin = bulletinRepository.findById(measurementId)
                .orElseThrow(() -> new ResourceNotFoundException("Boletim de medição não encontrado: " + measurementId));

        if (bulletin.getClient() == null) {
            log.warn("Boletim {} sem cliente associado. Não foi possível gerar Contas a Receber.", measurementId);
            return;
        }

        List<AccountsReceivable> existingReceivables = accountsReceivableRepository.findByMeasurementId(measurementId);
        AccountsReceivable ar;
        if (!existingReceivables.isEmpty()) {
            ar = existingReceivables.get(0);
        } else {
            ar = new AccountsReceivable();
            ar.setMeasurement(bulletin);
        }

        ar.setClient(bulletin.getClient());
        ar.setMeasurementNumber(bulletin.getContractNumber() != null ? bulletin.getContractNumber() : "MED-" + bulletin.getId().toString().substring(0, 8));
        ar.setInvoiceNumber(bulletin.getNfNumber() != null && !bulletin.getNfNumber().isBlank() 
                ? bulletin.getNfNumber() 
                : "MED-" + (bulletin.getContractNumber() != null ? bulletin.getContractNumber() : bulletin.getId().toString().substring(0, 6)));

        String workPostName = bulletin.getWorkPost() != null ? bulletin.getWorkPost().getName() : "";
        String desc = "Faturamento da Medição - Contrato: " + (bulletin.getContractNumber() != null ? bulletin.getContractNumber() : "N/A");
        if (!workPostName.isBlank()) {
            desc += " - Obra/Setor: " + workPostName;
        }
        ar.setDescription(desc);
        ar.setAmount(bulletin.getSubtotal() != null ? bulletin.getSubtotal() : BigDecimal.ZERO);
        
        LocalDate issueDate = LocalDate.now();
        ar.setIssueDate(issueDate);
        
        LocalDate dueDate = dueDateOverride != null 
                ? dueDateOverride 
                : (bulletin.getPeriodEnd() != null ? bulletin.getPeriodEnd().plusDays(30) : issueDate.plusDays(30));
        ar.setDueDate(dueDate);
        ar.setCategory(com.z7design.fleet_manager.model.enums.ReceivableCategory.SERVICE);
        ar.setPaymentMethod(com.z7design.fleet_manager.model.enums.PaymentMethod.TRANSFER);
        
        if (bulletin.getUnit() != null) {
            ar.setUnit(bulletin.getUnit());
        }

        accountsReceivableRepository.save(ar);
        log.info("Conta a Receber gerada/atualizada para medição {}: R$ {}", measurementId, ar.getAmount());
    }

    public void deleteBulletin(UUID id) {
        log.info("Excluindo boletim de mediÃ§Ã£o: {}", id);

        if (!bulletinRepository.existsById(id)) {
            throw new ResourceNotFoundException("Boletim de mediÃ§Ã£o nÃ£o encontrado: " + id);
        }

        bulletinRepository.deleteById(id);
        log.info("Boletim excluÃ­do com sucesso: {}", id);
    }

    // ===== MEMÃ“RIA DE CÃLCULO =====

    public CalculationMemoryDTO saveCalculationMemory(UUID bulletinId, CalculationMemoryDTO dto) {
        log.info("Salvando memÃ³ria de cÃ¡lculo para boletim: {}", bulletinId);

        MeasurementBulletin bulletin = bulletinRepository.findById(bulletinId)
                .orElseThrow(
                        () -> new ResourceNotFoundException("Boletim de mediÃ§Ã£o nÃ£o encontrado: " + bulletinId));

        CalculationMemory memory = memoryRepository.findByBulletinId(bulletinId)
                .orElse(new CalculationMemory());

        memory.setDetails(dto.getDetails());
        memory.setEvidencePath(dto.getEvidencePath());
        memory.setBulletin(bulletin);

        memory = memoryRepository.save(memory);

        log.info("MemÃ³ria de cÃ¡lculo salva com sucesso para boletim: {}", bulletinId);
        return CalculationMemoryDTO.fromEntity(memory);
    }

    // ===== RELATÃ“RIOS E ESTATÃSTICAS =====

    public Map<String, Object> getReport() {
        log.info("Gerando relatÃ³rio de mediÃ§Ãµes");

        List<MeasurementBulletin> allBulletins = bulletinRepository.findAll();

        long totalBulletins = allBulletins.size();
        BigDecimal totalValue = allBulletins.stream()
                .map(MeasurementBulletin::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal pendingValue = BigDecimal.ZERO; // TODO: Implementar mÃ©todo no repository
        BigDecimal validatedValue = BigDecimal.ZERO; // TODO: Implementar mÃ©todo no repository

        Map<MeasurementStatus, Long> byStatus = allBulletins.stream()
                .collect(Collectors.groupingBy(MeasurementBulletin::getStatus, Collectors.counting()));

        Map<String, Object> byContract = allBulletins.stream()
                .collect(Collectors.groupingBy(
                        MeasurementBulletin::getContractNumber,
                        Collectors.collectingAndThen(
                                Collectors.toList(),
                                bulletins -> Map.of(
                                        "count", bulletins.size(),
                                        "totalValue", bulletins.stream()
                                                .map(MeasurementBulletin::getSubtotal)
                                                .reduce(BigDecimal.ZERO, BigDecimal::add)))));

        return Map.of(
                "totalBulletins", totalBulletins,
                "totalValue", totalValue != null ? totalValue : BigDecimal.ZERO,
                "pendingValue", pendingValue != null ? pendingValue : BigDecimal.ZERO,
                "validatedValue", validatedValue != null ? validatedValue : BigDecimal.ZERO,
                "byStatus", byStatus,
                "byContract", byContract);
    }

    // ===== MÃ‰TODOS AUXILIARES E LÃ“GICA DE NEGÃ“CIO =====

    public List<MeasurementBulletinDTO> getBulletinsByStatus(MeasurementStatus status) {
        return bulletinRepository.findByStatus(status).stream()
                .map(MeasurementBulletinDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<MeasurementBulletinDTO> getBulletinsByClient(UUID clientId) {
        return bulletinRepository.findByClientId(clientId).stream()
                .map(MeasurementBulletinDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<MeasurementBulletinDTO> getBulletinsByContract(String contractNumber) {
        return bulletinRepository.findByContractNumber(contractNumber).stream()
                .map(MeasurementBulletinDTO::fromEntity)
                .collect(Collectors.toList());
    }
}
