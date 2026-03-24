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

@Service
@RequiredArgsConstructor
@Slf4j
public class EPIDeliveryFormService {

    private final EPIDeliveryFormRepository epiDeliveryFormRepository;
    private final EmployeeRepository employeeRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final PersonalProtectiveEquipmentRepository epiRepository;

    @Transactional
    public EPIDeliveryFormDTO create(CreateEPIDeliveryFormDTO dto, UUID createdByUserId) {
        log.info("ðŸ“ Criando nova ficha de entrega de EPI para funcionÃ¡rio: {}", dto.getEmployeeId());

        // Buscar entidades relacionadas
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("FuncionÃ¡rio nÃ£o encontrado com id: " + dto.getEmployeeId()));

        Company company = companyRepository.findById(dto.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Empresa nÃ£o encontrada com id: " + dto.getCompanyId()));

        Employee responsibleEmployee = null;
        if (dto.getResponsibleEmployeeId() != null) {
            responsibleEmployee = employeeRepository.findById(dto.getResponsibleEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("FuncionÃ¡rio responsÃ¡vel nÃ£o encontrado com id: " + dto.getResponsibleEmployeeId()));
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

        // Adicionar itens e dar baixa no estoque
        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            for (EPIDeliveryFormItemDTO itemDto : dto.getItems()) {
                String epiName = itemDto.getEpiName();
                if (epiName == null || epiName.trim().isEmpty()) {
                    log.warn("âš ï¸ Item de EPI sem nome informado. Usando valor padrÃ£o.");
                    epiName = "EPI";
                }
                Integer quantity = itemDto.getQuantity() != null ? itemDto.getQuantity() : 1;
                
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
                
                // Se encontrou o EPI no estoque, verificar e dar baixa
                if (epi != null) {
                    Integer availableStock = epi.getCurrentStock();

                    if (availableStock == null) {
                        log.warn("âš ï¸ Estoque atual do EPI '{}' estÃ¡ indefinido. Entrega registrada sem baixa.", epiName);
                    } else if (availableStock < quantity) {
                        log.warn("âš ï¸ Estoque insuficiente para o EPI '{}'. DisponÃ­vel: {}, Solicitado: {}. Entrega registrada sem baixa.",
                            epiName, availableStock, quantity);
                    } else {
                        Integer newStock = availableStock - quantity;
                        epi.setCurrentStock(newStock);
                        epiRepository.save(epi);

                        log.info("ðŸ“¦ Baixa no estoque: EPI '{}' - Quantidade: {} - Estoque anterior: {} - Estoque atual: {}",
                            epiName, quantity, availableStock, newStock);

                        if (epi.getMinimumStock() != null && newStock <= epi.getMinimumStock()) {
                            log.warn("âš ï¸ Estoque baixo para o EPI '{}': {} unidades (mÃ­nimo: {})",
                                epiName, newStock, epi.getMinimumStock());
                        }
                    }
                } else {
                    log.warn("âš ï¸ EPI '{}' nÃ£o encontrado no estoque. Entrega registrada sem baixa no estoque.", epiName);
                }
                
                // Criar item da ficha
                EPIDeliveryFormItem item = EPIDeliveryFormItem.builder()
                        .deliveryForm(form)
                        .epiName(epiName)
                        .quantity(quantity)
                        .ca(itemDto.getCa())
                        .caName(itemDto.getCaName())
                        .validityDate(itemDto.getValidityDate())
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



