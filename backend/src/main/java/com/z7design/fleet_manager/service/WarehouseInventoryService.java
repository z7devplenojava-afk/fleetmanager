package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.warehouse.*;
import com.z7design.fleet_manager.exception.BusinessException;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.model.enums.*;
import com.z7design.fleet_manager.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class WarehouseInventoryService {

    private final WarehouseInventoryAuditRepository auditRepository;
    private final WarehouseInventoryAuditItemRepository auditItemRepository;
    private final WarehouseInventoryScannedSerialRepository scannedSerialRepository;
    private final WarehouseStockLevelRepository stockLevelRepository;
    private final WarehouseProductRepository productRepository;
    private final WarehouseCategoryRepository categoryRepository;
    private final WarehouseLocationRepository locationRepository;
    private final WarehouseMovementRepository movementRepository;
    private final TireRepository tireRepository;
    private final VehicleBatteryRepository batteryRepository;

    // =========================================================================
    // 1. ABERTURA DE INVENTÁRIO COM ESCOPO PARAMETRIZÁVEL
    // =========================================================================

    @Transactional
    public WarehouseInventoryAuditDTO createAudit(WarehouseInventoryCreateDTO dto, User user) {
        UUID companyId = user.getCompanyId();

        // Validar unicidade do código
        auditRepository.findByCompanyIdAndCode(companyId, dto.getCode()).ifPresent(existing -> {
            throw new BusinessException("Já existe um inventário cadastrado com o código: " + dto.getCode());
        });

        WarehouseCategory targetCategory = null;
        if (dto.getTargetCategoryId() != null) {
            targetCategory = categoryRepository.findById(dto.getTargetCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada com ID: " + dto.getTargetCategoryId()));
        }

        WarehouseLocation targetLocation = null;
        if (dto.getTargetLocationId() != null) {
            targetLocation = locationRepository.findById(dto.getTargetLocationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Localização não encontrada com ID: " + dto.getTargetLocationId()));
        }

        WarehouseInventoryAudit audit = WarehouseInventoryAudit.builder()
                .companyId(companyId)
                .code(dto.getCode())
                .description(dto.getDescription())
                .scopeType(dto.getScopeType() != null ? dto.getScopeType() : WarehouseInventoryScope.ALL)
                .targetCategory(targetCategory)
                .targetLocation(targetLocation)
                .freezeMovements(Boolean.TRUE.equals(dto.getFreezeMovements()))
                .status(WarehouseInventoryStatus.CRIADO)
                .openedByUserId(user.getId())
                .openedAt(LocalDateTime.now())
                .notes(dto.getNotes())
                .build();

        WarehouseInventoryAudit savedAudit = auditRepository.save(audit);

        // Buscar níveis de estoque conforme escopo
        List<WarehouseStockLevel> stockLevels;
        switch (audit.getScopeType()) {
            case CATEGORY:
                if (targetCategory == null) throw new BusinessException("Categoria alvo obrigatória para escopo CATEGORIA");
                stockLevels = stockLevelRepository.findByCompanyIdAndProductCategoryId(companyId, targetCategory.getId());
                break;
            case LOCATION:
                if (targetLocation == null) throw new BusinessException("Localização alvo obrigatória para escopo LOCALIZACAO");
                stockLevels = stockLevelRepository.findByCompanyIdAndLocationId(companyId, targetLocation.getId());
                break;
            case ALL:
            case PRODUCT:
            default:
                stockLevels = stockLevelRepository.findByCompanyId(companyId);
                break;
        }

        List<WarehouseInventoryAuditItem> items = new ArrayList<>();
        for (WarehouseStockLevel sl : stockLevels) {
            WarehouseProduct product = sl.getProduct();
            WarehouseLocation location = sl.getLocation();

            BigDecimal unitCost = (product.getUnitCostAverage() != null && product.getUnitCostAverage().compareTo(BigDecimal.ZERO) > 0)
                    ? product.getUnitCostAverage()
                    : (product.getLastPurchasePrice() != null ? product.getLastPurchasePrice() : BigDecimal.ZERO);

            WarehouseInventoryAuditItem item = WarehouseInventoryAuditItem.builder()
                    .audit(savedAudit)
                    .product(product)
                    .location(location)
                    .quantitySystem(sl.getQuantityPhysical() != null ? sl.getQuantityPhysical() : BigDecimal.ZERO)
                    .unitCost(unitCost)
                    .status("PENDENTE")
                    .build();

            items.add(item);
        }

        if (!items.isEmpty()) {
            auditItemRepository.saveAll(items);
            savedAudit.setItems(items);
        }

        log.info("Inventário físico criado: id={}, código={}, escopo={}, itens={}",
                savedAudit.getId(), savedAudit.getCode(), savedAudit.getScopeType(), items.size());

        return WarehouseInventoryAuditDTO.fromEntity(savedAudit, false);
    }

    // =========================================================================
    // 2. INÍCIO DA CONTAGEM
    // =========================================================================

    @Transactional
    public WarehouseInventoryAuditDTO startCount(UUID auditId, User user) {
        WarehouseInventoryAudit audit = findScoped(auditId, user.getCompanyId());
        if (audit.getStatus() != WarehouseInventoryStatus.CRIADO) {
            throw new BusinessException("Inventário não pode ser iniciado no status: " + audit.getStatus());
        }

        audit.setStatus(WarehouseInventoryStatus.EM_CONTAGEM);
        WarehouseInventoryAudit saved = auditRepository.save(audit);
        log.info("Inventário {} em contagem física.", audit.getCode());
        return WarehouseInventoryAuditDTO.fromEntity(saved, true);
    }

    // =========================================================================
    // 3. REGISTRO DE CONTAGEM CEGA / BIPAGEM DE SERIAIS
    // =========================================================================

    @Transactional
    public WarehouseInventoryAuditDTO submitCount(UUID auditId, WarehouseInventorySubmitCountDTO dto, User user) {
        WarehouseInventoryAudit audit = findScoped(auditId, user.getCompanyId());

        if (audit.getStatus() != WarehouseInventoryStatus.EM_CONTAGEM && audit.getStatus() != WarehouseInventoryStatus.CONFERENCIA) {
            throw new BusinessException("Inventário não está em fase de contagem (status atual: " + audit.getStatus() + ")");
        }

        boolean hasDivergence = false;
        Map<UUID, WarehouseInventoryCountItemDTO> countMap = new HashMap<>();
        if (dto.getItems() != null) {
            for (WarehouseInventoryCountItemDTO countItem : dto.getItems()) {
                countMap.put(countItem.getItemId(), countItem);
            }
        }

        for (WarehouseInventoryAuditItem item : audit.getItems()) {
            WarehouseInventoryCountItemDTO cDto = countMap.get(item.getId());
            if (cDto == null) continue;

            BigDecimal counted;
            // Se itens rastreáveis foram informados via bipagem de seriais
            if (cDto.getScannedSerials() != null && !cDto.getScannedSerials().isEmpty()) {
                counted = BigDecimal.valueOf(cDto.getScannedSerials().size());
                // Registrar seriais bipados
                for (String serial : cDto.getScannedSerials()) {
                    boolean foundInSystem = verifySerialInSystem(serial, item.getProduct(), user.getCompanyId());
                    WarehouseInventoryScannedSerial scanned = WarehouseInventoryScannedSerial.builder()
                            .audit(audit)
                            .product(item.getProduct())
                            .serialOrDot(serial)
                            .foundInSystem(foundInSystem)
                            .build();
                    scannedSerialRepository.save(scanned);
                }
            } else {
                counted = cDto.getCountedQuantity() != null ? cDto.getCountedQuantity() : BigDecimal.ZERO;
            }

            if (dto.getCountRound() == 1) {
                item.setQuantityCount1(counted);
                item.setQuantityFinal(counted);
            } else {
                item.setQuantityCount2(counted);
                item.setQuantityFinal(counted);
            }

            BigDecimal diff = item.getQuantityFinal().subtract(item.getQuantitySystem());
            item.setDifference(diff);
            item.setDivergenceValue(diff.multiply(item.getUnitCost()));

            if (diff.compareTo(BigDecimal.ZERO) == 0) {
                item.setStatus("OK");
            } else {
                item.setStatus("DIVERGENTE");
                hasDivergence = true;
            }

            auditItemRepository.save(item);
        }

        if (dto.getCountRound() == 1) {
            if (hasDivergence) {
                audit.setStatus(WarehouseInventoryStatus.CONFERENCIA);
            } else {
                audit.setStatus(WarehouseInventoryStatus.AGUARDANDO_APROVACAO);
            }
        } else {
            audit.setStatus(WarehouseInventoryStatus.AGUARDANDO_APROVACAO);
        }

        WarehouseInventoryAudit saved = auditRepository.save(audit);
        log.info("Contagem registrada no inventário {}. Round={}, Novo status={}",
                saved.getCode(), dto.getCountRound(), saved.getStatus());

        return WarehouseInventoryAuditDTO.fromEntity(saved, false);
    }

    // =========================================================================
    // 4. APROVAÇÃO E EFETIVAÇÃO DE AJUSTES DE INVENTÁRIO
    // =========================================================================

    @Transactional
    public WarehouseInventoryAuditDTO approveAndApplyAdjustments(UUID auditId, WarehouseInventoryApproveDTO dto, User user) {
        WarehouseInventoryAudit audit = findScoped(auditId, user.getCompanyId());

        if (audit.getStatus() != WarehouseInventoryStatus.AGUARDANDO_APROVACAO && audit.getStatus() != WarehouseInventoryStatus.CONFERENCIA) {
            throw new BusinessException("Inventário não pode ser aprovado no status atual: " + audit.getStatus());
        }

        log.info("Aprovando inventário {} por usuário {}. Justificativa: {}",
                audit.getCode(), user.getEmail(), dto.getJustification());

        for (WarehouseInventoryAuditItem item : audit.getItems()) {
            BigDecimal diff = item.getDifference();
            if (diff == null || diff.compareTo(BigDecimal.ZERO) == 0) {
                continue;
            }

            WarehouseProduct product = item.getProduct();
            WarehouseLocation location = item.getLocation();

            WarehouseStockLevel stockLevel = stockLevelRepository
                    .findByCompanyIdAndProductIdAndLocationId(user.getCompanyId(), product.getId(), location.getId())
                    .orElseGet(() -> {
                        WarehouseStockLevel newLevel = WarehouseStockLevel.builder()
                                .companyId(user.getCompanyId())
                                .product(product)
                                .location(location)
                                .quantityPhysical(BigDecimal.ZERO)
                                .quantityReserved(BigDecimal.ZERO)
                                .build();
                        return stockLevelRepository.save(newLevel);
                    });

            if (diff.compareTo(BigDecimal.ZERO) > 0) {
                // SOBRA FÍSICA -> AJUSTE_INVENTARIO_ENTRADA
                BigDecimal balanceAfter = stockLevel.getQuantityPhysical().add(diff);

                WarehouseMovement movement = WarehouseMovement.builder()
                        .companyId(user.getCompanyId())
                        .product(product)
                        .location(location)
                        .movementType(WarehouseMovementType.AJUSTE_INVENTARIO_ENTRADA)
                        .quantity(diff)
                        .unitCost(item.getUnitCost())
                        .totalCost(diff.multiply(item.getUnitCost()))
                        .notes("Sobra física - Inventário: " + audit.getCode() + " - " + dto.getJustification())
                        .movementDate(LocalDateTime.now())
                        .performedByUserId(user.getId())
                        .build();

                movementRepository.save(movement);
                stockLevel.setQuantityPhysical(balanceAfter);
                stockLevelRepository.save(stockLevel);

            } else {
                // FALTA FÍSICA / EXTRAVIO -> AJUSTE_INVENTARIO_SAIDA
                BigDecimal lossQty = diff.abs();
                BigDecimal balanceAfter = stockLevel.getQuantityPhysical().subtract(lossQty);
                if (balanceAfter.compareTo(BigDecimal.ZERO) < 0) {
                    balanceAfter = BigDecimal.ZERO;
                }

                WarehouseMovement movement = WarehouseMovement.builder()
                        .companyId(user.getCompanyId())
                        .product(product)
                        .location(location)
                        .movementType(WarehouseMovementType.AJUSTE_INVENTARIO_SAIDA)
                        .quantity(lossQty)
                        .unitCost(item.getUnitCost())
                        .totalCost(lossQty.multiply(item.getUnitCost()))
                        .notes("Falta física / Extravio - Inventário: " + audit.getCode() + " - " + dto.getJustification())
                        .movementDate(LocalDateTime.now())
                        .performedByUserId(user.getId())
                        .build();

                movementRepository.save(movement);
                stockLevel.setQuantityPhysical(balanceAfter);
                stockLevelRepository.save(stockLevel);

                // Tratamento especial para Itens Rastreáveis (Pneus e Baterias)
                handleMissingTrackableItems(audit, product, lossQty.intValue(), user.getCompanyId());
            }

            item.setStatus("AJUSTADO");
            auditItemRepository.save(item);
        }

        audit.setStatus(WarehouseInventoryStatus.FINALIZADO);
        audit.setClosedAt(LocalDateTime.now());
        audit.setApprovedByUserId(user.getId());
        audit.setClosedByUserId(user.getId());
        String currentNotes = audit.getNotes() != null ? audit.getNotes() : "";
        audit.setNotes(currentNotes + "\n[APROVADO]: " + dto.getJustification());

        WarehouseInventoryAudit saved = auditRepository.save(audit);
        log.info("Inventário {} FINALIZADO com sucesso.", saved.getCode());

        return WarehouseInventoryAuditDTO.fromEntity(saved, false);
    }

    // =========================================================================
    // 5. CANCELAMENTO DE AUDITORIA
    // =========================================================================

    @Transactional
    public WarehouseInventoryAuditDTO cancelAudit(UUID auditId, String reason, User user) {
        WarehouseInventoryAudit audit = findScoped(auditId, user.getCompanyId());
        if (audit.getStatus() == WarehouseInventoryStatus.FINALIZADO) {
            throw new BusinessException("Inventário já finalizado não pode ser cancelado.");
        }

        audit.setStatus(WarehouseInventoryStatus.CANCELADO);
        audit.setClosedAt(LocalDateTime.now());
        audit.setClosedByUserId(user.getId());
        String currentNotes = audit.getNotes() != null ? audit.getNotes() : "";
        audit.setNotes(currentNotes + "\n[CANCELADO]: " + (reason != null ? reason : "Sem motivo informado"));

        WarehouseInventoryAudit saved = auditRepository.save(audit);
        log.info("Inventário {} CANCELADO.", saved.getCode());
        return WarehouseInventoryAuditDTO.fromEntity(saved, false);
    }

    // =========================================================================
    // 6. CONSULTAS & BLOQUEIO OPERACIONAL
    // =========================================================================

    public WarehouseInventoryAuditDTO getById(UUID auditId, UUID companyId, boolean blind) {
        return WarehouseInventoryAuditDTO.fromEntity(findScoped(auditId, companyId), blind);
    }

    public Page<WarehouseInventoryAuditDTO> list(UUID companyId, WarehouseInventoryStatus status, Pageable pageable) {
        Page<WarehouseInventoryAudit> page;
        if (status != null) {
            page = auditRepository.findByCompanyIdAndStatusOrderByOpenedAtDesc(companyId, status, pageable);
        } else {
            page = auditRepository.findByCompanyIdOrderByOpenedAtDesc(companyId, pageable);
        }
        return page.map(a -> WarehouseInventoryAuditDTO.fromEntity(a, false));
    }

    /**
     * Valida se um produto está com movimentações congeladas por auditoria de inventário ativa.
     */
    public void validateFreeze(UUID companyId, UUID productId, UUID locationId) {
        List<WarehouseInventoryAudit> freezingAudits = auditRepository.findActiveFreezingAudits(companyId);
        if (freezingAudits.isEmpty()) return;

        WarehouseProduct product = productRepository.findById(productId).orElse(null);
        if (product == null) return;

        for (WarehouseInventoryAudit audit : freezingAudits) {
            boolean matches = false;
            if (audit.getScopeType() == WarehouseInventoryScope.ALL) {
                matches = true;
            } else if (audit.getScopeType() == WarehouseInventoryScope.CATEGORY && audit.getTargetCategory() != null) {
                matches = product.getCategory() != null && product.getCategory().getId().equals(audit.getTargetCategory().getId());
            } else if (audit.getScopeType() == WarehouseInventoryScope.LOCATION && audit.getTargetLocation() != null) {
                matches = locationId != null && locationId.equals(audit.getTargetLocation().getId());
            } else {
                matches = audit.getItems().stream().anyMatch(i -> i.getProduct().getId().equals(productId));
            }

            if (matches) {
                throw new BusinessException("Movimentação bloqueada: o produto '" + product.getName() +
                        "' está sob inventário ativo com bloqueio operacional (" + audit.getCode() + ").");
            }
        }
    }

    // =========================================================================
    // MÉTODOS AUXILIARES
    // =========================================================================

    private WarehouseInventoryAudit findScoped(UUID auditId, UUID companyId) {
        WarehouseInventoryAudit audit = auditRepository.findById(auditId)
                .orElseThrow(() -> new ResourceNotFoundException("Auditoria de inventário não encontrada com ID: " + auditId));
        if (audit.getCompanyId() != null && companyId != null && !companyId.equals(audit.getCompanyId())) {
            throw new ResourceNotFoundException("Auditoria de inventário não encontrada com ID: " + auditId);
        }
        return audit;
    }

    private boolean verifySerialInSystem(String serial, WarehouseProduct product, UUID companyId) {
        // Verificar se serial existe em pneus
        boolean existsTire = tireRepository.existsBySerialNumber(serial);
        if (existsTire) return true;

        // Verificar se serial existe em baterias
        return batteryRepository.findByCompanyIdOrderByCreatedAtDesc(companyId).stream()
                .anyMatch(b -> serial.equalsIgnoreCase(b.getSerialNumber()) || serial.equalsIgnoreCase(b.getBatteryCode()));
    }

    /**
     * Quando pneus ou baterias faltam no inventário físico, baixa as instâncias como SUCATA / EXTRAVIO.
     */
    private void handleMissingTrackableItems(WarehouseInventoryAudit audit, WarehouseProduct product, int missingCount, UUID companyId) {
        if (missingCount <= 0) return;

        // 1. Pneus em estoque não bipados
        List<Tire> availableTires = tireRepository.findByCompanyIdAndStatus(companyId, TireStatus.AVAILABLE);
        int markedTires = 0;
        for (Tire t : availableTires) {
            if (markedTires >= missingCount) break;
            boolean wasScanned = audit.getScannedSerials().stream()
                    .anyMatch(s -> s.getSerialOrDot().equalsIgnoreCase(t.getSerialNumber()) || (t.getDot() != null && s.getSerialOrDot().equalsIgnoreCase(t.getDot())));
            if (!wasScanned) {
                t.setStatus(TireStatus.SCRAPPED);
                tireRepository.save(t);
                markedTires++;
                log.warn("Pneu {} marcado como SUCATA/EXTRAVIO devido a inventário {}", t.getSerialNumber(), audit.getCode());
            }
        }

        // 2. Baterias em estoque não bipadas
        List<VehicleBattery> activeBatteries = batteryRepository.findByCompanyIdOrderByCreatedAtDesc(companyId).stream()
                .filter(b -> b.getVehicle() == null && b.getStatus() == VehicleBattery.BatteryStatus.ACTIVE)
                .toList();

        int markedBatteries = 0;
        for (VehicleBattery b : activeBatteries) {
            if (markedBatteries >= missingCount) break;
            boolean wasScanned = audit.getScannedSerials().stream()
                    .anyMatch(s -> s.getSerialOrDot().equalsIgnoreCase(b.getSerialNumber()) || s.getSerialOrDot().equalsIgnoreCase(b.getBatteryCode()));
            if (!wasScanned) {
                b.setStatus(VehicleBattery.BatteryStatus.SCRAPPED);
                b.setRemovalReason("Baixa por extravio - Inventário " + audit.getCode());
                batteryRepository.save(b);
                markedBatteries++;
                log.warn("Bateria {} marcada como SCRAPPED devido a inventário {}", b.getBatteryCode(), audit.getCode());
            }
        }
    }
}
