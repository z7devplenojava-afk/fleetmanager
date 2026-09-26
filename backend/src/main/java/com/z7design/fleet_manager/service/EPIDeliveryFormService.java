package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.CreateEPIDeliveryFormDTO;
import com.z7design.fleet_manager.dto.EPIDeliveryFormDTO;
import com.z7design.fleet_manager.dto.EPIDeliveryFormItemDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.EPIDeliveryForm;
import com.z7design.fleet_manager.model.EPIDeliveryFormItem;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.PersonalProtectiveEquipment;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.EPIDeliveryFormRepository;
import com.z7design.fleet_manager.repository.PersonalProtectiveEquipmentRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.z7design.fleet_manager.model.StockItem;
import com.z7design.fleet_manager.model.StockMovement;
import com.z7design.fleet_manager.model.enums.MovementType;
import com.z7design.fleet_manager.model.enums.MovementReason;
import com.z7design.fleet_manager.repository.StockItemRepository;
import com.z7design.fleet_manager.repository.StockMovementRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class EPIDeliveryFormService {

    private final EPIDeliveryFormRepository epiDeliveryFormRepository;
    private final EmployeeRepository employeeRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final PersonalProtectiveEquipmentRepository epiRepository;
    private final StockItemRepository stockItemRepository;
    private final StockMovementRepository stockMovementRepository;

    @Transactional
    public EPIDeliveryFormDTO create(CreateEPIDeliveryFormDTO dto, UUID createdByUserId) {
        log.info("ðŸ“ Criando nova ficha de entrega de EPI para funcionÃ¡rio: {}", dto.getEmployeeId());

        // Buscar entidades relacionadas
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Funcionário não encontrado com id: " + dto.getEmployeeId()));

        Company company = null;
        if (dto.getCompanyId() != null) {
            company = companyRepository.findById(dto.getCompanyId()).orElse(null);
        }
        if (company == null && employee.getCompanyId() != null) {
            company = companyRepository.findById(employee.getCompanyId()).orElse(null);
        }
        if (company == null && employee.getCompany() != null) {
            company = employee.getCompany();
        }
        if (company == null) {
            company = companyRepository.findAll().stream().findFirst().orElseThrow(
                    () -> new ResourceNotFoundException("Nenhuma empresa cadastrada no sistema."));
        }

        Employee responsibleEmployee = null;
        if (dto.getResponsibleEmployeeId() != null) {
            responsibleEmployee = employeeRepository.findById(dto.getResponsibleEmployeeId())
                    .orElse(null);
        }

        User createdBy = null;
        if (createdByUserId != null) {
            createdBy = userRepository.findById(createdByUserId)
                    .orElse(null);
        }

        // Criar ficha
        EPIDeliveryForm form = EPIDeliveryForm.builder()
                .employee(employee)
                .company(company)
                .deliveryDate(dto.getDeliveryDate())
                .responsibleEmployee(responsibleEmployee)
                .observations(dto.getObservations())
                .pdfUrl(dto.getPdfUrl())
                .createdBy(createdBy)
                .build();

        // Adicionar itens e dar baixa rigorosa no estoque (Almoxarifado e SST)
        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            for (EPIDeliveryFormItemDTO itemDto : dto.getItems()) {
                String epiName = itemDto.getEpiName();
                if (epiName == null || epiName.trim().isEmpty()) {
                    epiName = "EPI";
                }
                Integer quantity = itemDto.getQuantity() != null ? itemDto.getQuantity() : 1;

                // 1. Identificar Item de Estoque e EPI do SST
                StockItem stockItem = null;
                PersonalProtectiveEquipment epi = null;

                if (itemDto.getStockItemId() != null) {
                    stockItem = stockItemRepository.findById(itemDto.getStockItemId()).orElse(null);
                    epi = epiRepository.findByStockItemId(itemDto.getStockItemId()).orElse(null);
                }

                if (epi == null) {
                    List<PersonalProtectiveEquipment> epis = epiRepository.findByNameContainingIgnoreCase(epiName);
                    for (PersonalProtectiveEquipment e : epis) {
                        if (e.getName().equalsIgnoreCase(epiName) && Boolean.TRUE.equals(e.getIsActive())) {
                            epi = e;
                            break;
                        }
                    }
                    if (epi == null && !epis.isEmpty()) {
                        epi = epis.stream().filter(e -> Boolean.TRUE.equals(e.getIsActive())).findFirst().orElse(null);
                    }
                }

                if (stockItem == null && epi != null && epi.getStockItemId() != null) {
                    stockItem = stockItemRepository.findById(epi.getStockItemId()).orElse(null);
                }

                if (stockItem == null) {
                    List<StockItem> stockItems = stockItemRepository.findByNameContainingIgnoreCase(epiName);
                    for (StockItem si : stockItems) {
                        if (si.getName().equalsIgnoreCase(epiName) && Boolean.TRUE.equals(si.getActive())) {
                            stockItem = si;
                            break;
                        }
                    }
                    if (stockItem == null && !stockItems.isEmpty()) {
                        stockItem = stockItems.stream().filter(si -> Boolean.TRUE.equals(si.getActive())).findFirst().orElse(null);
                    }
                }

                // 2. Validacao Rigorosa de Saldo em Estoque
                Integer availableStock = null;
                if (stockItem != null && stockItem.getCurrentQuantity() != null) {
                    availableStock = stockItem.getCurrentQuantity();
                } else if (epi != null && epi.getCurrentStock() != null) {
                    availableStock = epi.getCurrentStock();
                }

                if (availableStock != null && availableStock < quantity) {
                    throw new IllegalArgumentException(String.format(
                        "Estoque insuficiente para o EPI '%s'. Disponivel em estoque: %d un, Solicitado: %d un.",
                        epiName, availableStock, quantity
                    ));
                }

                // 3. Baixa no modulo SST (PersonalProtectiveEquipment)
                if (epi != null) {
                    int currentPpeStock = epi.getCurrentStock() != null ? epi.getCurrentStock() : (availableStock != null ? availableStock : 0);
                    int newPpeStock = Math.max(0, currentPpeStock - quantity);
                    epi.setCurrentStock(newPpeStock);
                    if (stockItem != null && epi.getStockItemId() == null) {
                        epi.setStockItemId(stockItem.getId());
                    }
                    epiRepository.save(epi);
                    log.info("Baixa no estoque SST: EPI '{}' - Qtd: {} - Estoque restante: {}", epiName, quantity, newPpeStock);
                }

                // 4. Baixa no Almoxarifado (StockItem) e Registro de Movimentacao (SAIDA)
                UUID linkedStockItemId = stockItem != null ? stockItem.getId() : (epi != null ? epi.getStockItemId() : null);
                if (stockItem != null) {
                    int prevStock = stockItem.getCurrentQuantity() != null ? stockItem.getCurrentQuantity() : 0;
                    int newStock = Math.max(0, prevStock - quantity);
                    stockItem.setCurrentQuantity(newStock);
                    if (epi != null && stockItem.getEpiId() == null) {
                        stockItem.setEpiId(epi.getId());
                    }
                    stockItemRepository.save(stockItem);

                    try {
                        StockMovement movement = new StockMovement();
                        movement.setStockItem(stockItem);
                        movement.setMovementType(MovementType.SAIDA);
                        movement.setReason(MovementReason.ENTREGA_INICIAL);
                        movement.setQuantity(quantity);
                        movement.setPreviousQuantity(prevStock);
                        movement.setNewQuantity(newStock);
                        movement.setDocumentNumber("FICHA-SST");
                        movement.setMovementDate(form.getDeliveryDate() != null ? form.getDeliveryDate().atStartOfDay() : java.time.LocalDateTime.now());
                        movement.setNotes("Entrega de EPI - Ficha SST - Colaborador: " + employee.getName() + " (CPF: " + (employee.getDocument() != null ? employee.getDocument() : "N/I") + ")");
                        stockMovementRepository.save(movement);
                        log.info("Baixa no Almoxarifado registrada: Item '{}' (-{} un). Saldo: {}", stockItem.getName(), quantity, newStock);
                    } catch (Exception e) {
                        log.warn("Erro ao registrar movimentacao de saida para item {}: {}", stockItem.getCode(), e.getMessage());
                    }
                }

                // 5. Criar item da ficha
                EPIDeliveryFormItem item = EPIDeliveryFormItem.builder()
                        .deliveryForm(form)
                        .stockItemId(linkedStockItemId)
                        .epiName(epiName)
                        .quantity(quantity)
                        .ca(itemDto.getCa() != null ? itemDto.getCa() : (epi != null ? epi.getCaNumber() : (stockItem != null ? stockItem.getCaNumber() : null)))
                        .caName(itemDto.getCaName())
                        .validityDate(itemDto.getValidityDate() != null ? itemDto.getValidityDate() : (epi != null ? epi.getCaValidity() : (stockItem != null ? stockItem.getCaValidity() : null)))
                        .uniformType(itemDto.getUniformType())
                        .uniformPiece(itemDto.getUniformPiece())
                        .observations(itemDto.getObservations())
                        .build();
                form.getItems().add(item);
            }
        }

        EPIDeliveryForm savedForm = epiDeliveryFormRepository.save(form);
        log.info("âœ… Ficha de entrega de EPI criada com sucesso: {}", savedForm.getId());

        return EPIDeliveryFormDTO.fromEntity(savedForm);
    }

    public EPIDeliveryFormDTO findById(UUID id) {
        EPIDeliveryForm form = epiDeliveryFormRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ficha de entrega de EPI nÃ£o encontrada com id: " + id));
        return EPIDeliveryFormDTO.fromEntity(form);
    }

    public EPIDeliveryForm findByIdEntity(UUID id) {
        return epiDeliveryFormRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ficha de entrega de EPI nÃ£o encontrada com id: " + id));
    }

    public Page<EPIDeliveryFormDTO> findAll(Pageable pageable) {
        return epiDeliveryFormRepository.findAll(pageable)
                .map(EPIDeliveryFormDTO::fromEntity);
    }

    public Page<EPIDeliveryFormDTO> findByFilters(UUID employeeId, UUID companyId, LocalDate startDate, LocalDate endDate, Pageable pageable) {
        return epiDeliveryFormRepository.findByFilters(employeeId, companyId, startDate, endDate, pageable)
                .map(EPIDeliveryFormDTO::fromEntity);
    }

    public List<EPIDeliveryFormDTO> findByEmployeeId(UUID employeeId) {
        return epiDeliveryFormRepository.findByEmployeeId(employeeId).stream()
                .map(EPIDeliveryFormDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<EPIDeliveryFormDTO> findByCompanyId(UUID companyId) {
        return epiDeliveryFormRepository.findByCompanyId(companyId).stream()
                .map(EPIDeliveryFormDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public void delete(UUID id) {
        EPIDeliveryForm form = epiDeliveryFormRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ficha de entrega de EPI nÃ£o encontrada com id: " + id));
        
        // Devolver itens ao estoque antes de deletar
        if (form.getItems() != null && !form.getItems().isEmpty()) {
            for (EPIDeliveryFormItem item : form.getItems()) {
                String epiName = item.getEpiName();
                Integer quantity = item.getQuantity() != null ? item.getQuantity() : 1;
                
                // Buscar EPI pelo nome no estoque
                List<PersonalProtectiveEquipment> epis = epiRepository.findByNameContainingIgnoreCase(epiName);
                PersonalProtectiveEquipment epi = null;
                
                // Tentar encontrar EPI exato primeiro
                for (PersonalProtectiveEquipment e : epis) {
                    if (e.getName().equalsIgnoreCase(epiName) && e.getIsActive()) {
                        epi = e;
                        break;
                    }
                }
                
                // Se nÃ£o encontrou exato, pegar o primeiro ativo
                if (epi == null && !epis.isEmpty()) {
                    epi = epis.stream()
                            .filter(e -> e.getIsActive())
                            .findFirst()
                            .orElse(null);
                }
                
                // Se encontrou o EPI, devolver ao estoque
                if (epi != null) {
                    Integer currentStock = epi.getCurrentStock();
                    Integer newStock = currentStock + quantity;
                    epi.setCurrentStock(newStock);
                    epiRepository.save(epi);
                    
                    log.info("ðŸ“¦ DevoluÃ§Ã£o ao estoque: EPI '{}' - Quantidade: {} - Estoque anterior: {} - Estoque atual: {}", 
                        epiName, quantity, currentStock, newStock);
                } else {
                    log.warn("âš ï¸ EPI '{}' nÃ£o encontrado no estoque. NÃ£o foi possÃ­vel devolver ao estoque.", epiName);
                }
            }
        }
        
        epiDeliveryFormRepository.deleteById(id);
        log.info("ðŸ—‘ï¸ Ficha de entrega de EPI deletada: {}", id);
    }
}



