package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.PurchaseQuotationDTO;
import com.z7design.fleet_manager.model.PurchaseQuotation;
import com.z7design.fleet_manager.model.PurchaseRequest;
import com.z7design.fleet_manager.model.Supplier;
import com.z7design.fleet_manager.model.Unit;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.enums.PurchaseQuotationStatus;
import com.z7design.fleet_manager.repository.PurchaseQuotationRepository;
import com.z7design.fleet_manager.repository.PurchaseRequestRepository;
import com.z7design.fleet_manager.repository.SupplierRepository;
import com.z7design.fleet_manager.repository.UnitRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PurchaseQuotationService {
    
    private final PurchaseQuotationRepository purchaseQuotationRepository;
    private final SupplierRepository supplierRepository;
    private final UnitRepository unitRepository;
    private final UserRepository userRepository;
    private final PurchaseRequestRepository purchaseRequestRepository;
    
    @Transactional(readOnly = true)
    public List<PurchaseQuotationDTO> getAllQuotations() {
        try {
            return purchaseQuotationRepository.findAllWithRelations().stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Erro ao buscar todas as cotaÃ§Ãµes: {}", e.getMessage(), e);
            // Fallback para findAll() se houver problema com fetch join
            return purchaseQuotationRepository.findAll().stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        }
    }
    
    @Transactional(readOnly = true)
    public Optional<PurchaseQuotationDTO> getQuotationById(UUID id) {
        return purchaseQuotationRepository.findById(id)
                .map(this::convertToDTO);
    }
    
    @Transactional
    public PurchaseQuotationDTO createQuotation(PurchaseQuotationDTO quotationDTO, UUID createdById) {
        PurchaseQuotation quotation = convertToEntity(quotationDTO);
        
        // Definir usuÃ¡rio criador
        User createdBy = userRepository.findById(createdById)
                .orElseThrow(() -> new RuntimeException("UsuÃ¡rio nÃ£o encontrado"));
        quotation.setCreatedBy(createdBy);
        
        // Gerar nÃºmero da cotaÃ§Ã£o se nÃ£o fornecido
        if (quotation.getQuoteNumber() == null || quotation.getQuoteNumber().isEmpty()) {
            quotation.setQuoteNumber(generateQuoteNumber());
        }
        
        // Definir status padrÃ£o
        if (quotation.getStatus() == null) {
            quotation.setStatus(PurchaseQuotationStatus.DRAFT);
        }
        
        PurchaseQuotation savedQuotation = purchaseQuotationRepository.save(quotation);
        return convertToDTO(savedQuotation);
    }
    
    @Transactional
    public PurchaseQuotationDTO updateQuotation(UUID id, PurchaseQuotationDTO quotationDTO) {
        Optional<PurchaseQuotation> existingQuotation = purchaseQuotationRepository.findById(id);
        if (existingQuotation.isPresent()) {
            PurchaseQuotation quotation = existingQuotation.get();
            updateQuotationFromDTO(quotation, quotationDTO);
            
            PurchaseQuotation savedQuotation = purchaseQuotationRepository.save(quotation);
            return convertToDTO(savedQuotation);
        }
        throw new RuntimeException("CotaÃ§Ã£o nÃ£o encontrada");
    }
    
    @Transactional
    public void deleteQuotation(UUID id) {
        purchaseQuotationRepository.deleteById(id);
    }
    
    @Transactional
    public PurchaseQuotationDTO updateStatus(UUID id, String status) {
        Optional<PurchaseQuotation> quotation = purchaseQuotationRepository.findById(id);
        if (quotation.isPresent()) {
            PurchaseQuotation pq = quotation.get();
            try {
                PurchaseQuotationStatus newStatus = PurchaseQuotationStatus.valueOf(status.toUpperCase());
                pq.setStatus(newStatus);
                
                // Se expirou, atualizar status automaticamente
                if (pq.isExpired() && newStatus != PurchaseQuotationStatus.EXPIRED) {
                    pq.setStatus(PurchaseQuotationStatus.EXPIRED);
                }
                
                PurchaseQuotation savedQuotation = purchaseQuotationRepository.save(pq);
                return convertToDTO(savedQuotation);
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Status invÃ¡lido: " + status);
            }
        }
        throw new RuntimeException("CotaÃ§Ã£o nÃ£o encontrada");
    }
    
    @Transactional(readOnly = true)
    public List<PurchaseQuotationDTO> findByStatus(String status) {
        try {
            PurchaseQuotationStatus quotationStatus = PurchaseQuotationStatus.valueOf(status.toUpperCase());
            return purchaseQuotationRepository.findByStatus(quotationStatus).stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Status invÃ¡lido: " + status);
        }
    }
    
    @Transactional(readOnly = true)
    public List<PurchaseQuotationDTO> findBySupplier(UUID supplierId) {
        return purchaseQuotationRepository.findBySupplierId(supplierId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<PurchaseQuotationDTO> findByUnit(UUID unitId) {
        return purchaseQuotationRepository.findByUnitId(unitId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<PurchaseQuotationDTO> findByAssignedTo(UUID userId) {
        return purchaseQuotationRepository.findByAssignedToId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<PurchaseQuotationDTO> findExpiredQuotations() {
        return purchaseQuotationRepository.findExpiredQuotations(
                LocalDate.now(), 
                PurchaseQuotationStatus.EXPIRED
        ).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<PurchaseQuotationDTO> findQuotationsExpiringSoon(int days) {
        LocalDate today = LocalDate.now();
        LocalDate futureDate = today.plusDays(days);
        return purchaseQuotationRepository.findQuotationsExpiringSoon(today, futureDate).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<PurchaseQuotationDTO> searchQuotations(String term) {
        return purchaseQuotationRepository.searchQuotations(term).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public long countByStatus(PurchaseQuotationStatus status) {
        return purchaseQuotationRepository.countByStatus(status);
    }
    
    // MÃ©todos auxiliares
    private String generateQuoteNumber() {
        // Formato: COT-YYYYMMDD-XXXX
        String date = LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
        String random = String.format("%04d", (int) (Math.random() * 10000));
        return "COT-" + date + "-" + random;
    }
    
    // MÃ©todos de conversÃ£o
    private PurchaseQuotationDTO convertToDTO(PurchaseQuotation quotation) {
        try {
            PurchaseQuotationDTO dto = PurchaseQuotationDTO.builder()
                    .id(quotation.getId())
                    .quoteNumber(quotation.getQuoteNumber())
                    .title(quotation.getTitle())
                    .description(quotation.getDescription())
                    .supplierId(getSupplierId(quotation))
                    .supplierName(getSupplierName(quotation))
                    .unitId(getUnitId(quotation))
                    .unitName(getUnitName(quotation))
                    .purchaseRequestId(getPurchaseRequestId(quotation))
                    .purchaseRequestNumber(getPurchaseRequestNumber(quotation))
                    .purchaseRequestTitle(getPurchaseRequestTitle(quotation))
                    .status(quotation.getStatus())
                    .totalValue(quotation.getTotalValue())
                    .validUntil(quotation.getValidUntil())
                    .terms(quotation.getTerms())
                    .paymentMethod(quotation.getPaymentMethod())
                    .deliveryMethod(quotation.getDeliveryMethod())
                    .notes(quotation.getNotes())
                    .createdById(getCreatedById(quotation))
                    .createdByName(getCreatedByName(quotation))
                    .assignedToId(getAssignedToId(quotation))
                    .assignedToName(getAssignedToName(quotation))
                    .createdAt(quotation.getCreatedAt())
                    .updatedAt(quotation.getUpdatedAt())
                    .build();
            
            // Campos calculados
            dto.setExpired(quotation.isExpired());
            dto.setExpiringSoon(quotation.isExpiringSoon(7)); // 7 dias
            dto.setCanBeApproved(quotation.canBeApproved());
            dto.setCanBeRejected(quotation.canBeRejected());
            
            return dto;
        } catch (Exception e) {
            log.error("Erro ao converter PurchaseQuotation para DTO: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao converter cotaÃ§Ã£o para DTO", e);
        }
    }
    
    // MÃ©todos auxiliares para acesso seguro a relacionamentos
    private UUID getSupplierId(PurchaseQuotation quotation) {
        try {
            return quotation.getSupplier() != null ? quotation.getSupplier().getId() : null;
        } catch (Exception e) {
            log.warn("Erro ao acessar supplier.id: {}", e.getMessage());
            return null;
        }
    }
    
    private String getSupplierName(PurchaseQuotation quotation) {
        try {
            return quotation.getSupplier() != null ? quotation.getSupplier().getName() : null;
        } catch (Exception e) {
            log.warn("Erro ao acessar supplier.name: {}", e.getMessage());
            return null;
        }
    }
    
    private UUID getUnitId(PurchaseQuotation quotation) {
        try {
            return quotation.getUnit() != null ? quotation.getUnit().getId() : null;
        } catch (Exception e) {
            log.warn("Erro ao acessar unit.id: {}", e.getMessage());
            return null;
        }
    }
    
    private String getUnitName(PurchaseQuotation quotation) {
        try {
            return quotation.getUnit() != null ? quotation.getUnit().getName() : null;
        } catch (Exception e) {
            log.warn("Erro ao acessar unit.name: {}", e.getMessage());
            return null;
        }
    }
    
    private UUID getPurchaseRequestId(PurchaseQuotation quotation) {
        try {
            return quotation.getPurchaseRequest() != null ? quotation.getPurchaseRequest().getId() : null;
        } catch (Exception e) {
            log.warn("Erro ao acessar purchaseRequest.id: {}", e.getMessage());
            return null;
        }
    }
    
    private String getPurchaseRequestNumber(PurchaseQuotation quotation) {
        try {
            return quotation.getPurchaseRequest() != null ? quotation.getPurchaseRequest().getRequestNumber() : null;
        } catch (Exception e) {
            log.warn("Erro ao acessar purchaseRequest.requestNumber: {}", e.getMessage());
            return null;
        }
    }
    
    private String getPurchaseRequestTitle(PurchaseQuotation quotation) {
        try {
            return quotation.getPurchaseRequest() != null ? quotation.getPurchaseRequest().getTitle() : null;
        } catch (Exception e) {
            log.warn("Erro ao acessar purchaseRequest.title: {}", e.getMessage());
            return null;
        }
    }
    
    private UUID getCreatedById(PurchaseQuotation quotation) {
        try {
            return quotation.getCreatedBy() != null ? quotation.getCreatedBy().getId() : null;
        } catch (Exception e) {
            log.warn("Erro ao acessar createdBy.id: {}", e.getMessage());
            return null;
        }
    }
    
    private String getCreatedByName(PurchaseQuotation quotation) {
        try {
            return quotation.getCreatedBy() != null ? quotation.getCreatedBy().getName() : null;
        } catch (Exception e) {
            log.warn("Erro ao acessar createdBy.name: {}", e.getMessage());
            return null;
        }
    }
    
    private UUID getAssignedToId(PurchaseQuotation quotation) {
        try {
            return quotation.getAssignedTo() != null ? quotation.getAssignedTo().getId() : null;
        } catch (Exception e) {
            log.warn("Erro ao acessar assignedTo.id: {}", e.getMessage());
            return null;
        }
    }
    
    private String getAssignedToName(PurchaseQuotation quotation) {
        try {
            return quotation.getAssignedTo() != null ? quotation.getAssignedTo().getName() : null;
        } catch (Exception e) {
            log.warn("Erro ao acessar assignedTo.name: {}", e.getMessage());
            return null;
        }
    }
    
    private PurchaseQuotation convertToEntity(PurchaseQuotationDTO dto) {
        PurchaseQuotation quotation = new PurchaseQuotation();
        quotation.setQuoteNumber(dto.getQuoteNumber());
        quotation.setTitle(dto.getTitle());
        quotation.setDescription(dto.getDescription());
        quotation.setStatus(dto.getStatus() != null ? dto.getStatus() : PurchaseQuotationStatus.DRAFT);
        quotation.setTotalValue(dto.getTotalValue());
        quotation.setValidUntil(dto.getValidUntil());
        quotation.setTerms(dto.getTerms());
        quotation.setPaymentMethod(dto.getPaymentMethod());
        quotation.setDeliveryMethod(dto.getDeliveryMethod());
        quotation.setNotes(dto.getNotes());
        
        if (dto.getSupplierId() != null) {
            Optional<Supplier> supplier = supplierRepository.findById(dto.getSupplierId());
            supplier.ifPresent(quotation::setSupplier);
        }
        
        if (dto.getUnitId() != null) {
            Optional<Unit> unit = unitRepository.findById(dto.getUnitId());
            unit.ifPresent(quotation::setUnit);
        }
        
        if (dto.getPurchaseRequestId() != null) {
            Optional<PurchaseRequest> purchaseRequest = purchaseRequestRepository.findById(dto.getPurchaseRequestId());
            purchaseRequest.ifPresent(quotation::setPurchaseRequest);
        }
        
        if (dto.getAssignedToId() != null) {
            Optional<User> assignedTo = userRepository.findById(dto.getAssignedToId());
            assignedTo.ifPresent(quotation::setAssignedTo);
        }
        
        return quotation;
    }
    
    private void updateQuotationFromDTO(PurchaseQuotation quotation, PurchaseQuotationDTO dto) {
        if (dto.getTitle() != null) {
            quotation.setTitle(dto.getTitle());
        }
        if (dto.getDescription() != null) {
            quotation.setDescription(dto.getDescription());
        }
        if (dto.getStatus() != null) {
            quotation.setStatus(dto.getStatus());
        }
        if (dto.getTotalValue() != null) {
            quotation.setTotalValue(dto.getTotalValue());
        }
        if (dto.getValidUntil() != null) {
            quotation.setValidUntil(dto.getValidUntil());
        }
        if (dto.getTerms() != null) {
            quotation.setTerms(dto.getTerms());
        }
        if (dto.getPaymentMethod() != null) {
            quotation.setPaymentMethod(dto.getPaymentMethod());
        }
        if (dto.getDeliveryMethod() != null) {
            quotation.setDeliveryMethod(dto.getDeliveryMethod());
        }
        if (dto.getNotes() != null) {
            quotation.setNotes(dto.getNotes());
        }
        
        if (dto.getSupplierId() != null) {
            Optional<Supplier> supplier = supplierRepository.findById(dto.getSupplierId());
            supplier.ifPresent(quotation::setSupplier);
        } else if (dto.getSupplierId() == null && quotation.getSupplier() != null) {
            quotation.setSupplier(null);
        }
        
        if (dto.getUnitId() != null) {
            Optional<Unit> unit = unitRepository.findById(dto.getUnitId());
            unit.ifPresent(quotation::setUnit);
        } else if (dto.getUnitId() == null && quotation.getUnit() != null) {
            quotation.setUnit(null);
        }
        
        if (dto.getPurchaseRequestId() != null) {
            Optional<PurchaseRequest> purchaseRequest = purchaseRequestRepository.findById(dto.getPurchaseRequestId());
            purchaseRequest.ifPresent(quotation::setPurchaseRequest);
        } else if (dto.getPurchaseRequestId() == null && quotation.getPurchaseRequest() != null) {
            quotation.setPurchaseRequest(null);
        }
        
        if (dto.getAssignedToId() != null) {
            Optional<User> assignedTo = userRepository.findById(dto.getAssignedToId());
            assignedTo.ifPresent(quotation::setAssignedTo);
        } else if (dto.getAssignedToId() == null && quotation.getAssignedTo() != null) {
            quotation.setAssignedTo(null);
        }
    }
}






