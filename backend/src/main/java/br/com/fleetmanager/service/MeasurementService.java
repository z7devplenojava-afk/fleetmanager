package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.MeasurementBulletinDTO;
import br.com.fleetmanager.dto.MeasurementItemDTO;
import br.com.fleetmanager.dto.CalculationMemoryDTO;
import br.com.fleetmanager.model.MeasurementBulletin;
import br.com.fleetmanager.model.MeasurementItem;
import br.com.fleetmanager.model.CalculationMemory;
import br.com.fleetmanager.model.enums.MeasurementStatus;
import br.com.fleetmanager.repository.MeasurementBulletinRepository;
import br.com.fleetmanager.repository.MeasurementItemRepository;
import br.com.fleetmanager.repository.CalculationMemoryRepository;
import br.com.fleetmanager.repository.ClientRepository;
import br.com.fleetmanager.repository.ContractRepository;
import br.com.fleetmanager.repository.UnitRepository;
import br.com.fleetmanager.repository.CostCenterRepository;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageImpl;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    // ===== BOLETINS DE MEDIÇÃO =====

    public long getBulletinCount() {
        try {
            return bulletinRepository.count();
        } catch (Exception e) {
            log.error("Erro ao contar boletins: {}", e.getMessage(), e);
            return 0;
        }
    }

    public List<MeasurementBulletinDTO> getAllBulletins() {
        log.info("Buscando todos os boletins de medição");
        try {
            // Verificar se a tabela existe e tem dados
            long count = bulletinRepository.count();
            log.info("Total de boletins na tabela: {}", count);
            
            if (count == 0) {
                log.info("Nenhum boletim encontrado, retornando lista vazia");
                return List.of();
            }
            
            List<MeasurementBulletin> bulletins;
            // Usar método mais simples para evitar problemas de mapeamento
            bulletins = bulletinRepository.findAllSimple();
            log.info("Encontrados {} boletins usando findAllSimple", bulletins.size());
            
            return bulletins.stream()
                    .map(bulletin -> {
                        try {
                            return MeasurementBulletinDTO.fromEntity(bulletin);
                        } catch (Exception e) {
                            log.error("Erro ao converter boletim {}: {}", bulletin.getId(), e.getMessage());
                            // Retornar DTO básico em caso de erro
                            MeasurementBulletinDTO dto = new MeasurementBulletinDTO();
                            dto.setId(bulletin.getId());
                            dto.setCompanyName(bulletin.getCompanyName() != null ? bulletin.getCompanyName() : "N/A");
                            dto.setPeriodStart(bulletin.getPeriodStart());
                            dto.setPeriodEnd(bulletin.getPeriodEnd());
                            dto.setContractNumber(bulletin.getContractNumber() != null ? bulletin.getContractNumber() : "N/A");
                            dto.setStatus(bulletin.getStatus());
                            dto.setSubtotal(bulletin.getSubtotal() != null ? bulletin.getSubtotal() : BigDecimal.ZERO);
                            dto.setElaboratedBy(bulletin.getElaboratedBy() != null ? bulletin.getElaboratedBy() : "N/A");
                            dto.setMeasuredBy(bulletin.getMeasuredBy() != null ? bulletin.getMeasuredBy() : "N/A");
                            dto.setNfNumber(bulletin.getNfNumber());
                            dto.setValidatedBy(bulletin.getValidatedBy());
                            dto.setCheckedBy(bulletin.getCheckedBy());
                            dto.setCreatedAt(bulletin.getCreatedAt());
                            dto.setUpdatedAt(bulletin.getUpdatedAt());
                            dto.setNotes(bulletin.getNotes());
                            
                            // Tratar entidades relacionadas com segurança
                            try {
                                if (bulletin.getClient() != null) {
                                    dto.setClientId(bulletin.getClient().getId());
                                    dto.setClientName(bulletin.getClient().getName());
                                }
                            } catch (Exception clientError) {
                                log.warn("Erro ao acessar cliente do boletim {}: {}", bulletin.getId(), clientError.getMessage());
                            }
                            
                            try {
                                if (bulletin.getContract() != null) {
                                    dto.setContractId(bulletin.getContract().getId());
                                }
                            } catch (Exception contractError) {
                                log.warn("Erro ao acessar contrato do boletim {}: {}", bulletin.getId(), contractError.getMessage());
                            }
                            
                            try {
                                if (bulletin.getUnit() != null) {
                                    dto.setUnitId(bulletin.getUnit().getId());
                                    dto.setUnitName(bulletin.getUnit().getName());
                                }
                            } catch (Exception unitError) {
                                log.warn("Erro ao acessar unidade do boletim {}: {}", bulletin.getId(), unitError.getMessage());
                            }
                            
                            return dto;
                        }
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Erro ao buscar boletins de medição: {}", e.getMessage(), e);
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
            // Usar consulta personalizada que evita entidades relacionadas problemáticas
            List<MeasurementBulletin> allBulletins = bulletinRepository.findAllBasicData();
            
            // Aplicar filtros manualmente
            List<MeasurementBulletin> filteredBulletins = allBulletins.stream()
                    .filter(bulletin -> status == null || bulletin.getStatus() == status)
                    .filter(bulletin -> contractNumber == null || bulletin.getContractNumber().contains(contractNumber))
                    .filter(bulletin -> clientId == null || (bulletin.getClient() != null && bulletin.getClient().getId().equals(clientId)))
                    .filter(bulletin -> unitId == null || (bulletin.getUnit() != null && bulletin.getUnit().getId().equals(unitId)))
                    .filter(bulletin -> periodStart == null || !bulletin.getPeriodStart().isBefore(periodStart))
                    .filter(bulletin -> periodEnd == null || !bulletin.getPeriodEnd().isAfter(periodEnd))
                    .collect(Collectors.toList());
            
            // Aplicar paginação manualmente
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), filteredBulletins.size());
            
            List<MeasurementBulletin> pagedBulletins = start < filteredBulletins.size() 
                ? filteredBulletins.subList(start, end) 
                : new ArrayList<>();
            
            Page<MeasurementBulletin> bulletinPage = new PageImpl<>(
                pagedBulletins, 
                pageable, 
                filteredBulletins.size()
            );
            
            return bulletinPage.map(bulletin -> {
                try {
                    return MeasurementBulletinDTO.fromEntity(bulletin);
                } catch (Exception e) {
                    log.error("Erro ao converter boletim {}: {}", bulletin.getId(), e.getMessage());
                    // Retornar DTO básico em caso de erro
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

    public MeasurementBulletinDTO getBulletinById(UUID id) {
        log.info("Buscando boletim por ID: {}", id);
        MeasurementBulletin bulletin = bulletinRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Boletim de medição não encontrado: " + id));
        return MeasurementBulletinDTO.fromEntity(bulletin);
    }

    public MeasurementBulletinDTO createBulletin(MeasurementBulletinDTO dto) {
        log.info("Criando novo boletim de medição para contrato: {}", dto.getContractNumber());
        
        MeasurementBulletin bulletin = MeasurementBulletinDTO.toEntity(dto);
        bulletin.setStatus(MeasurementStatus.DRAFT);
        
        // Associar entidades relacionadas (tolerante a erros)
        if (dto.getClientId() != null) {
            try {
                bulletin.setClient(clientRepository.findById(dto.getClientId())
                        .orElse(null));
            } catch (Exception e) {
                log.warn("Cliente não encontrado: {}, continuando sem cliente", dto.getClientId());
            }
        }
        
        if (dto.getContractId() != null) {
            try {
                bulletin.setContract(contractRepository.findById(dto.getContractId())
                        .orElse(null));
            } catch (Exception e) {
                log.warn("Contrato não encontrado: {}, continuando sem contrato", dto.getContractId());
            }
        }
        
        if (dto.getUnitId() != null) {
            try {
                bulletin.setUnit(unitRepository.findById(dto.getUnitId())
                        .orElse(null));
            } catch (Exception e) {
                log.warn("Unidade não encontrada: {}, continuando sem unidade", dto.getUnitId());
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
        bulletin.calculateSubtotal();
        bulletin = bulletinRepository.save(bulletin);
        
        // Processar memória de cálculo se existir
        if (dto.getCalculationMemory() != null) {
            CalculationMemory memory = CalculationMemoryDTO.toEntity(dto.getCalculationMemory());
            memory.setBulletin(bulletin);
            memoryRepository.save(memory);
            log.info("Memória de cálculo salva para boletim: {}", bulletin.getId());
        }
        
        log.info("Boletim criado com sucesso - ID: {}, Subtotal: {}", bulletin.getId(), bulletin.getSubtotal());
        return MeasurementBulletinDTO.fromEntity(bulletin);
    }

    public MeasurementBulletinDTO updateBulletin(UUID id, MeasurementBulletinDTO dto) {
        log.info("Atualizando boletim de medição: {}", id);
        
        MeasurementBulletin existingBulletin = bulletinRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Boletim de medição não encontrado: " + id));

        // Atualizar campos básicos
        existingBulletin.setCompanyName(dto.getCompanyName());
        existingBulletin.setPeriodStart(dto.getPeriodStart());
        existingBulletin.setPeriodEnd(dto.getPeriodEnd());
        existingBulletin.setContractNumber(dto.getContractNumber());
        existingBulletin.setContractStart(dto.getContractStart());
        existingBulletin.setContractEnd(dto.getContractEnd());
        existingBulletin.setNfNumber(dto.getNfNumber());
        existingBulletin.setElaboratedBy(dto.getElaboratedBy());
        existingBulletin.setMeasuredBy(dto.getMeasuredBy());
        existingBulletin.setNotes(dto.getNotes());

        // Atualizar entidades relacionadas
        if (dto.getClientId() != null) {
            existingBulletin.setClient(clientRepository.findById(dto.getClientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado: " + dto.getClientId())));
        }

        if (dto.getUnitId() != null) {
            existingBulletin.setUnit(unitRepository.findById(dto.getUnitId())
                    .orElseThrow(() -> new ResourceNotFoundException("Unidade não encontrada: " + dto.getUnitId())));
        }

        // Atualizar itens se fornecidos
        if (dto.getItems() != null) {
            // Remover itens existentes
            itemRepository.deleteByBulletinId(id);
            existingBulletin.getItems().clear();
            
            // Adicionar novos itens
            for (MeasurementItemDTO itemDto : dto.getItems()) {
                MeasurementItem item = MeasurementItemDTO.toEntity(itemDto);
                item.setBulletin(existingBulletin);
                
                if (itemDto.getCostCenterId() != null) {
                    item.setCostCenterId(itemDto.getCostCenterId());
                }
                
                existingBulletin.addItem(item);
            }
        }

        // Recalcular subtotal
        existingBulletin.calculateSubtotal();
        existingBulletin = bulletinRepository.save(existingBulletin);
        
        log.info("Boletim atualizado com sucesso - ID: {}, Subtotal: {}", existingBulletin.getId(), existingBulletin.getSubtotal());
        return MeasurementBulletinDTO.fromEntity(existingBulletin);
    }

    public MeasurementBulletinDTO validateBulletin(UUID id, String validatedBy, String checkedBy) {
        log.info("Validando boletim de medição: {} por {}", id, validatedBy);
        
        MeasurementBulletin bulletin = bulletinRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Boletim de medição não encontrado: " + id));

        bulletin.setValidatedBy(validatedBy);
        bulletin.setCheckedBy(checkedBy);
        bulletin.setStatus(MeasurementStatus.VALIDATED);
        
        bulletin = bulletinRepository.save(bulletin);
        
        log.info("Boletim validado com sucesso: {}", id);
        return MeasurementBulletinDTO.fromEntity(bulletin);
    }

    public void deleteBulletin(UUID id) {
        log.info("Excluindo boletim de medição: {}", id);
        
        if (!bulletinRepository.existsById(id)) {
            throw new ResourceNotFoundException("Boletim de medição não encontrado: " + id);
        }
        
        bulletinRepository.deleteById(id);
        log.info("Boletim excluído com sucesso: {}", id);
    }

    // ===== MEMÓRIA DE CÁLCULO =====

    public CalculationMemoryDTO saveCalculationMemory(UUID bulletinId, CalculationMemoryDTO dto) {
        log.info("Salvando memória de cálculo para boletim: {}", bulletinId);
        
        MeasurementBulletin bulletin = bulletinRepository.findById(bulletinId)
                .orElseThrow(() -> new ResourceNotFoundException("Boletim de medição não encontrado: " + bulletinId));

        CalculationMemory memory = memoryRepository.findByBulletinId(bulletinId)
                .orElse(new CalculationMemory());
        
        memory.setDetails(dto.getDetails());
        memory.setEvidencePath(dto.getEvidencePath());
        memory.setBulletin(bulletin);
        
        memory = memoryRepository.save(memory);
        
        log.info("Memória de cálculo salva com sucesso para boletim: {}", bulletinId);
        return CalculationMemoryDTO.fromEntity(memory);
    }

    // ===== RELATÓRIOS E ESTATÍSTICAS =====

    public Map<String, Object> getReport() {
        log.info("Gerando relatório de medições");
        
        List<MeasurementBulletin> allBulletins = bulletinRepository.findAll();
        
        long totalBulletins = allBulletins.size();
        BigDecimal totalValue = allBulletins.stream()
                .map(MeasurementBulletin::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal pendingValue = BigDecimal.ZERO; // TODO: Implementar método no repository
        BigDecimal validatedValue = BigDecimal.ZERO; // TODO: Implementar método no repository
        
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
                                .reduce(BigDecimal.ZERO, BigDecimal::add)
                        )
                    )
                ));

        return Map.of(
            "totalBulletins", totalBulletins,
            "totalValue", totalValue != null ? totalValue : BigDecimal.ZERO,
            "pendingValue", pendingValue != null ? pendingValue : BigDecimal.ZERO,
            "validatedValue", validatedValue != null ? validatedValue : BigDecimal.ZERO,
            "byStatus", byStatus,
            "byContract", byContract
        );
    }

    // ===== MÉTODOS AUXILIARES =====

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