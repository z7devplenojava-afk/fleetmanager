package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.InvoiceDTO;
import com.z7design.fleet_manager.model.Invoice;
import com.z7design.fleet_manager.model.enums.ExpenseStatus;
import com.z7design.fleet_manager.model.enums.ExpenseType;
import com.z7design.fleet_manager.repository.InvoiceRepository;
import com.z7design.fleet_manager.repository.SupplierRepository;
import com.z7design.fleet_manager.repository.ClientRepository;
import com.z7design.fleet_manager.repository.ContractRepository;
import com.z7design.fleet_manager.repository.WorkPostRepository;
import com.z7design.fleet_manager.repository.UnitRepository;
import com.z7design.fleet_manager.model.WorkPost;
import com.z7design.fleet_manager.model.Client;
import com.z7design.fleet_manager.model.Supplier;
import com.z7design.fleet_manager.model.Contract;
import com.z7design.fleet_manager.model.Unit;
import com.z7design.fleet_manager.model.Garage;
import com.z7design.fleet_manager.repository.GarageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class InvoiceService {
    
    private final InvoiceRepository invoiceRepository;
    private final SupplierRepository supplierRepository;
    private final ClientRepository clientRepository;
    private final ContractRepository contractRepository;
    private final WorkPostRepository workPostRepository;
    private final UnitRepository unitRepository;
    private final GarageRepository garageRepository;
    
    @Transactional(readOnly = true)
    public List<Invoice> findAll() {
        return invoiceRepository.findAll();
    }
    
    @Transactional(readOnly = true)
    public Page<Invoice> findAll(Pageable pageable) {
        return invoiceRepository.findAll(pageable);
    }
    
    public Optional<Invoice> findById(UUID id) {
        // Usar mÃ©todo com EntityGraph para carregar relacionamentos e evitar LazyInitializationException
        return invoiceRepository.findByIdWithRelations(id);
    }
    
    public List<Invoice> findByStatus(ExpenseStatus status) {
        return invoiceRepository.findByStatus(status);
    }
    
    public Page<Invoice> findByStatus(ExpenseStatus status, Pageable pageable) {
        return invoiceRepository.findByStatus(status, pageable);
    }
    
    public List<Invoice> findByType(ExpenseType type) {
        return invoiceRepository.findByType(type);
    }
    
    public Page<Invoice> findByType(ExpenseType type, Pageable pageable) {
        return invoiceRepository.findByType(type, pageable);
    }
    
    public List<Invoice> findBySupplier(UUID supplierId) {
        return invoiceRepository.findBySupplierId(supplierId);
    }
    
    public Page<Invoice> findBySupplier(UUID supplierId, Pageable pageable) {
        return invoiceRepository.findBySupplierId(supplierId, pageable);
    }
    
    public List<Invoice> findByClient(UUID clientId) {
        return invoiceRepository.findByClientId(clientId);
    }
    
    public Page<Invoice> findByClient(UUID clientId, Pageable pageable) {
        return invoiceRepository.findByClientId(clientId, pageable);
    }
    
    public List<Invoice> findByContract(UUID contractId) {
        return invoiceRepository.findByContractId(contractId);
    }
    
    public Page<Invoice> findByContract(UUID contractId, Pageable pageable) {
        return invoiceRepository.findByContractId(contractId, pageable);
    }
    
    public List<Invoice> findByDueDate(LocalDate dueDate) {
        return invoiceRepository.findByDueDate(dueDate);
    }
    
    public List<Invoice> findByDueDateBetween(LocalDate startDate, LocalDate endDate) {
        return invoiceRepository.findByDueDateBetween(startDate, endDate);
    }
    
    public List<Invoice> findByPaymentDate(LocalDate paymentDate) {
        return invoiceRepository.findByPaymentDate(paymentDate);
    }
    
    public List<Invoice> findByPaymentDateBetween(LocalDate startDate, LocalDate endDate) {
        return invoiceRepository.findByPaymentDateBetween(startDate, endDate);
    }
    
    public List<Invoice> findByCategory(String category) {
        return invoiceRepository.findByCategory(category);
    }
    
    public Page<Invoice> findByCategory(String category, Pageable pageable) {
        return invoiceRepository.findByCategory(category, pageable);
    }
    
    public List<Invoice> findByInvoiceNumber(String invoiceNumber) {
        return invoiceRepository.findByInvoiceNumberContaining(invoiceNumber);
    }
    
    public List<Invoice> findByDescription(String description) {
        return invoiceRepository.findByDescriptionContainingIgnoreCase(description);
    }
    
    public List<Invoice> findByBarcode(String barcode) {
        return invoiceRepository.findByBarcode(barcode);
    }
    
    public List<Invoice> findOverdueInvoices() {
        return invoiceRepository.findOverdueInvoices(LocalDate.now());
    }
    
    public List<Invoice> findInvoicesDueSoon(int days) {
        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusDays(days);
        return invoiceRepository.findInvoicesDueSoon(startDate, endDate);
    }
    
    public List<Invoice> findPaidInvoicesInPeriod(LocalDate startDate, LocalDate endDate) {
        return invoiceRepository.findPaidInvoicesInPeriod(startDate, endDate);
    }
    
    public Page<Invoice> findByAdvancedFilters(ExpenseStatus status, ExpenseType type, UUID supplierId, 
                                             UUID clientId, UUID unitId, String category, String description, 
                                             LocalDate startDate, LocalDate endDate, Pageable pageable) {
        return invoiceRepository.findByAdvancedFilters(status, type, supplierId, clientId, unitId, category, description, startDate, endDate, pageable);
    }
    
    public Invoice save(Invoice invoice) {
        // Garantir unidade vÃ¡lida: se nÃ£o vier no DTO, usar a primeira unidade existente
        if (invoice.getUnit() == null || invoice.getUnit().getId() == null) {
            try {
                org.springframework.data.domain.PageRequest pr = org.springframework.data.domain.PageRequest.of(0, 1);
                Unit fallback = unitRepository.findAll(pr).stream().findFirst()
                        .orElseThrow(() -> new IllegalArgumentException("Nenhuma unidade cadastrada"));
                invoice.setUnit(fallback);
            } catch (Exception e) {
                throw new IllegalArgumentException("Unidade Ã© obrigatÃ³ria para faturas", e);
            }
        }
        return invoiceRepository.save(invoice);
    }
    
    public Invoice create(InvoiceDTO invoiceDTO) {
        Invoice invoice = new Invoice();
        updateInvoiceFromDTO(invoice, invoiceDTO);
        return invoiceRepository.save(invoice);
    }
    
    public Invoice update(UUID id, InvoiceDTO invoiceDTO) {
        log.info("Atualizando fatura com ID: {}", id);
        log.info("Dados do DTO: {}", invoiceDTO);
        
        try {
            return invoiceRepository.findById(id)
                    .map(invoice -> {
                        log.info("Fatura encontrada, atualizando dados...");
                        try {
                            updateInvoiceFromDTO(invoice, invoiceDTO);
                            log.info("Dados atualizados, salvando fatura...");
                            Invoice saved = invoiceRepository.save(invoice);
                            
                            // Inicializar relacionamentos lazy dentro da transaÃ§Ã£o
                            initializeInvoiceRelationships(saved);
                            
                            log.info("Fatura salva com sucesso: {}", saved.getId());
                            return saved;
                        } catch (Exception e) {
                            log.error("Erro ao atualizar dados da fatura: {}", e.getMessage(), e);
                            throw new RuntimeException("Erro ao atualizar fatura: " + e.getMessage(), e);
                        }
                    })
                    .orElseThrow(() -> {
                        log.error("Fatura nÃ£o encontrada com ID: {}", id);
                        return new RuntimeException("Fatura nÃ£o encontrada com ID: " + id);
                    });
        } catch (Exception e) {
            log.error("Erro geral ao atualizar fatura {}: {}", id, e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Inicializa relacionamentos lazy de uma Invoice, tratando casos onde entidades foram deletadas
     */
    private void initializeInvoiceRelationships(Invoice invoice) {
        // Inicializar Supplier
        if (invoice.getSupplier() != null) {
            try {
                invoice.getSupplier().getName(); // ForÃ§a inicializaÃ§Ã£o
            } catch (org.hibernate.LazyInitializationException | jakarta.persistence.EntityNotFoundException e) {
                // Supplier foi deletado ou nÃ£o pode ser inicializado, definir como null
                invoice.setSupplier(null);
            }
        }
        
        // Inicializar Client
        if (invoice.getClient() != null) {
            try {
                invoice.getClient().getName(); // ForÃ§a inicializaÃ§Ã£o
            } catch (org.hibernate.LazyInitializationException | jakarta.persistence.EntityNotFoundException e) {
                // Client foi deletado ou nÃ£o pode ser inicializado, definir como null
                invoice.setClient(null);
            }
        }
        
        // Inicializar Contract
        if (invoice.getContract() != null) {
            try {
                invoice.getContract().getContractNumber(); // Força inicialização
            } catch (org.hibernate.LazyInitializationException | jakarta.persistence.EntityNotFoundException e) {
                // Contract foi deletado ou não pode ser inicializado, definir como null
                invoice.setContract(null);
            }
        }

        // Inicializar WorkPost (Obra)
        if (invoice.getWorkPost() != null) {
            try {
                invoice.getWorkPost().getName(); // Força inicialização
            } catch (org.hibernate.LazyInitializationException | jakarta.persistence.EntityNotFoundException e) {
                // WorkPost foi deletado ou não pode ser inicializado, definir como null
                invoice.setWorkPost(null);
            }
        }
        
        // Inicializar Unit
        if (invoice.getUnit() != null) {
            try {
                invoice.getUnit().getName(); // Força inicialização
            } catch (org.hibernate.LazyInitializationException | jakarta.persistence.EntityNotFoundException e) {
                // Unit foi deletado ou não pode ser inicializado, definir como null
                invoice.setUnit(null);
            }
        }

        // Inicializar Garage
        if (invoice.getGarage() != null) {
            try {
                invoice.getGarage().getName(); // Força inicialização
            } catch (org.hibernate.LazyInitializationException | jakarta.persistence.EntityNotFoundException e) {
                invoice.setGarage(null);
            }
        }
    }
    
    public void deleteById(UUID id) {
        invoiceRepository.deleteById(id);
    }
    
    public Invoice updateStatus(UUID id, ExpenseStatus status) {
        return invoiceRepository.findById(id)
                .map(invoice -> {
                    invoice.setStatus(status);
                    return invoiceRepository.save(invoice);
                })
                .orElseThrow(() -> new RuntimeException("Fatura nÃ£o encontrada"));
    }
    
    public Invoice markAsPaid(UUID id, LocalDate paymentDate) {
        return invoiceRepository.findById(id)
                .map(invoice -> {
                    invoice.setStatus(ExpenseStatus.PAGA);
                    invoice.setPaymentDate(paymentDate != null ? paymentDate : LocalDate.now());
                    return invoiceRepository.save(invoice);
                })
                .orElseThrow(() -> new RuntimeException("Fatura nÃ£o encontrada"));
    }
    
    public Invoice cancel(UUID id) {
        return invoiceRepository.findById(id)
                .map(invoice -> {
                    invoice.setStatus(ExpenseStatus.CANCELADA);
                    return invoiceRepository.save(invoice);
                })
                .orElseThrow(() -> new RuntimeException("Fatura nÃ£o encontrada"));
    }
    
    // MÃ©todos de relatÃ³rios
    public List<Object[]> getAmountByStatus() {
        return invoiceRepository.sumAmountByStatus();
    }
    
    public List<Object[]> getAmountByType() {
        return invoiceRepository.sumAmountByType();
    }
    
    public List<Object[]> getAmountBySupplier() {
        return invoiceRepository.sumAmountBySupplier();
    }
    
    public List<Object[]> getAmountByCategory() {
        return invoiceRepository.sumAmountByCategory();
    }
    
    public List<Object[]> getCountByStatus() {
        return invoiceRepository.countByStatus();
    }
    
    public List<Object[]> getCountByType() {
        return invoiceRepository.countByType();
    }
    
    public BigDecimal getTotalPaidInPeriod(LocalDate startDate, LocalDate endDate) {
        return invoiceRepository.getTotalPaidInPeriod(startDate, endDate);
    }
    
    public BigDecimal getTotalPending() {
        return invoiceRepository.getTotalPending();
    }
    
    public BigDecimal getTotalOverdue() {
        return invoiceRepository.getTotalOverdue(LocalDate.now());
    }
    
    // Novos mÃ©todos para busca por unidade
    public List<Invoice> findByUnit(UUID unitId) {
        return invoiceRepository.findByUnitId(unitId);
    }
    
    public Page<Invoice> findByUnit(UUID unitId, Pageable pageable) {
        return invoiceRepository.findByUnitId(unitId, pageable);
    }
    
    public List<Invoice> findByUnitAndStatus(UUID unitId, ExpenseStatus status) {
        return invoiceRepository.findByUnitIdAndStatus(unitId, status);
    }
    
    public Page<Invoice> findByUnitAndStatus(UUID unitId, ExpenseStatus status, Pageable pageable) {
        return invoiceRepository.findByUnitIdAndStatus(unitId, status, pageable);
    }
    
    public List<Invoice> findByUnitAndType(UUID unitId, ExpenseType type) {
        return invoiceRepository.findByUnitIdAndType(unitId, type);
    }
    
    public Page<Invoice> findByUnitAndType(UUID unitId, ExpenseType type, Pageable pageable) {
        return invoiceRepository.findByUnitIdAndType(unitId, type, pageable);
    }
    
    public List<Invoice> findByUnitAndCategory(UUID unitId, String category) {
        return invoiceRepository.findByCategoryAndUnitId(category, unitId);
    }
    
    public Page<Invoice> findByUnitAndCategory(UUID unitId, String category, Pageable pageable) {
        return invoiceRepository.findByCategoryAndUnitId(category, unitId, pageable);
    }
    
    public List<Invoice> findByUnits(List<UUID> unitIds) {
        return invoiceRepository.findByUnitIdIn(unitIds);
    }
    
    public Page<Invoice> findByUnits(List<UUID> unitIds, Pageable pageable) {
        return invoiceRepository.findByUnitIdIn(unitIds, pageable);
    }
    
    public List<Invoice> findByUnitsAndStatus(List<UUID> unitIds, ExpenseStatus status) {
        return invoiceRepository.findByUnitIdInAndStatus(unitIds, status);
    }
    
    public Page<Invoice> findByUnitsAndStatus(List<UUID> unitIds, ExpenseStatus status, Pageable pageable) {
        return invoiceRepository.findByUnitIdInAndStatus(unitIds, status, pageable);
    }
    
    public List<Invoice> findByUnitsAndPeriod(List<UUID> unitIds, LocalDate startDate, LocalDate endDate) {
        return invoiceRepository.findByUnitIdInAndDueDateBetween(unitIds, startDate, endDate);
    }
    
    public Page<Invoice> findByUnitsAndPeriod(List<UUID> unitIds, LocalDate startDate, LocalDate endDate, Pageable pageable) {
        return invoiceRepository.findByUnitIdInAndDueDateBetween(unitIds, startDate, endDate, pageable);
    }
    
    public List<Invoice> findOverdueInvoicesByUnit(UUID unitId) {
        return invoiceRepository.findOverdueInvoicesByUnit(unitId, LocalDate.now());
    }
    
    public List<Invoice> findInvoicesDueSoonByUnit(UUID unitId, int days) {
        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusDays(days);
        return invoiceRepository.findInvoicesDueSoonByUnit(unitId, startDate, endDate);
    }
    
    public List<Invoice> findPaidInvoicesInPeriodByUnit(UUID unitId, LocalDate startDate, LocalDate endDate) {
        return invoiceRepository.findPaidInvoicesInPeriodByUnit(unitId, startDate, endDate);
    }
    
    // MÃ©todos de relatÃ³rios por unidade
    public List<Object[]> getAmountByStatusAndUnit(UUID unitId) {
        return invoiceRepository.sumAmountByStatusAndUnit(unitId);
    }
    
    public List<Object[]> getAmountByTypeAndUnit(UUID unitId) {
        return invoiceRepository.sumAmountByTypeAndUnit(unitId);
    }
    
    public List<Object[]> getAmountBySupplierAndUnit(UUID unitId) {
        return invoiceRepository.sumAmountBySupplierAndUnit(unitId);
    }
    
    public List<Object[]> getAmountByCategoryAndUnit(UUID unitId) {
        return invoiceRepository.sumAmountByCategoryAndUnit(unitId);
    }
    
    public BigDecimal getTotalPaidInPeriodByUnit(UUID unitId, LocalDate startDate, LocalDate endDate) {
        return invoiceRepository.getTotalPaidInPeriodByUnit(unitId, startDate, endDate);
    }
    
    public BigDecimal getTotalPendingByUnit(UUID unitId) {
        return invoiceRepository.getTotalPendingByUnit(unitId);
    }
    
    public BigDecimal getTotalOverdueByUnit(UUID unitId) {
        return invoiceRepository.getTotalOverdueByUnit(unitId, LocalDate.now());
    }
    
    // ---- RelatÃ³rios por Centro de Custo ----
    public BigDecimal getTotalByCostCenterAndPeriod(String centro, LocalDate start, LocalDate end) {
        return invoiceRepository.sumByCentroCustoAndPeriod(centro, start, end);
    }

    public List<Invoice> getInvoicesByCostCenterAndPeriod(String centro, LocalDate start, LocalDate end) {
        return invoiceRepository.findByCentroCustoAndPeriod(centro, start, end);
    }

    public long getInvoicesCountByCostCenter(String centro) {
        return invoiceRepository.countByCentroCusto(centro);
    }

    public void updateInvoiceFromDTO(Invoice invoice, InvoiceDTO dto) {
        log.info("Iniciando atualizaÃ§Ã£o de invoice com DTO: {}", dto);
        
        try {
            // GeraÃ§Ã£o automÃ¡tica do nÃºmero da fatura se nÃ£o enviado
            String invoiceNumber = dto.getInvoiceNumber();
            if (invoiceNumber == null || invoiceNumber.trim().isEmpty()) {
                // Exemplo: FAT-2025-<UUID curto>
                String year = String.valueOf(java.time.LocalDate.now().getYear());
                invoiceNumber = "FAT-" + year + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            }
            invoice.setInvoiceNumber(invoiceNumber);
            log.debug("NÃºmero da fatura definido: {}", invoiceNumber);
            
            invoice.setDescription(dto.getDescription());
            invoice.setAmount(dto.getAmount());
            invoice.setStatus(dto.getStatus() != null ? dto.getStatus() : ExpenseStatus.PENDENTE);
            invoice.setType(dto.getType() != null ? dto.getType() : ExpenseType.VARIAVEL);
            invoice.setIssueDate(dto.getIssueDate() != null ? dto.getIssueDate() : LocalDate.now());
            invoice.setDueDate(dto.getDueDate());
            invoice.setPaymentDate(dto.getPaymentDate());
            invoice.setCategory(dto.getCategory());
            invoice.setCentroCusto(dto.getCentroCusto());
            invoice.setComprovanteUrl(dto.getComprovanteUrl());
            invoice.setBarcode(dto.getBarcode());
            invoice.setNotes(dto.getNotes());
            invoice.setCompanySigla(dto.getCompanySigla());

            // Novos campos SIGLO / Relatório de Despesas
            if (dto.getExpenseNumber() != null) invoice.setExpenseNumber(dto.getExpenseNumber());
            if (dto.getInstallmentSeq() != null) invoice.setInstallmentSeq(dto.getInstallmentSeq());
            if (dto.getSupplierCode() != null) invoice.setSupplierCode(dto.getSupplierCode());
            if (dto.getInterestAmount() != null) invoice.setInterestAmount(dto.getInterestAmount());
            if (dto.getFineAmount() != null) invoice.setFineAmount(dto.getFineAmount());
            if (dto.getDiscountAmount() != null) invoice.setDiscountAmount(dto.getDiscountAmount());
            if (dto.getAdjustmentAmount() != null) invoice.setAdjustmentAmount(dto.getAdjustmentAmount());
            if (dto.getPaidAmount() != null) invoice.setPaidAmount(dto.getPaidAmount());
            if (dto.getBalanceAmount() != null) invoice.setBalanceAmount(dto.getBalanceAmount());
            if (dto.getBankAccountInfo() != null) invoice.setBankAccountInfo(dto.getBankAccountInfo());
            if (dto.getIsCanceled() != null) invoice.setIsCanceled(dto.getIsCanceled());
            
            log.debug("Campos bÃ¡sicos definidos");
            
            // Relacionamentos
            if (dto.getSupplierId() != null) {
                log.debug("Processando fornecedor: {}", dto.getSupplierId());
                Supplier supplier = supplierRepository.findById(dto.getSupplierId())
                        .orElseThrow(() -> new RuntimeException("Fornecedor nÃ£o encontrado: " + dto.getSupplierId()));
                invoice.setSupplier(supplier);
                log.debug("Fornecedor definido: {}", supplier.getName());
            }

            if (dto.getClientId() != null) {
                log.debug("Processando cliente: {}", dto.getClientId());
                Client client = clientRepository.findById(dto.getClientId())
                        .orElseThrow(() -> new RuntimeException("Cliente nÃ£o encontrado: " + dto.getClientId()));
                invoice.setClient(client);
                log.debug("Cliente definido: {}", client.getName());
            }

            if (dto.getContractId() != null) {
                log.debug("Processando contrato: {}", dto.getContractId());
                Contract contract = contractRepository.findById(dto.getContractId())
                        .orElseThrow(() -> new RuntimeException("Contrato não encontrado: " + dto.getContractId()));
                invoice.setContract(contract);
                log.debug("Contrato definido: {}", contract.getContractNumber());
            }

            if (dto.getWorkPostId() != null) {
                log.debug("Processando obra/posto: {}", dto.getWorkPostId());
                WorkPost workPost = workPostRepository.findById(dto.getWorkPostId())
                        .orElseThrow(() -> new RuntimeException("Obra/Posto não encontrado: " + dto.getWorkPostId()));
                invoice.setWorkPost(workPost);
                log.debug("Obra/Posto definido: {}", workPost.getName());
            }

            if (dto.getUnitId() != null) {
                log.debug("Processando unidade: {}", dto.getUnitId());
                try {
                    Unit unit = unitRepository.findById(dto.getUnitId())
                            .orElseThrow(() -> new RuntimeException("Unidade nÃ£o encontrada: " + dto.getUnitId()));
                    invoice.setUnit(unit);
                    log.debug("Unidade definida: {}", unit.getName());
                } catch (Exception e) {
                    log.error("Erro ao buscar unidade {}: {}", dto.getUnitId(), e.getMessage());
                    throw new RuntimeException("Erro ao processar unidade: " + e.getMessage(), e);
                }
            }

            if (dto.getGarageId() != null) {
                log.debug("Processando garagem: {}", dto.getGarageId());
                garageRepository.findById(dto.getGarageId()).ifPresentOrElse(
                        invoice::setGarage,
                        () -> invoice.setGarage(null)
                );
            } else {
                invoice.setGarage(null);
            }
            
            log.info("AtualizaÃ§Ã£o de invoice concluÃ­da com sucesso");
        } catch (Exception e) {
            log.error("Erro ao atualizar invoice: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    public BigDecimal getTotalByTypeAndStatus(String type, String status) {
        // Considera apenas faturas com type e status informados
        List<Invoice> invoices = invoiceRepository.findAll();
        return invoices.stream()
            .filter(i -> {
                boolean typeMatch = false;
                if (type.equalsIgnoreCase("INCOME")) {
                    typeMatch = i.getType() != null && i.getType().name().equalsIgnoreCase("FIXA") || i.getType().name().equalsIgnoreCase("VARIAVEL");
                } else if (type.equalsIgnoreCase("EXPENSE")) {
                    typeMatch = i.getType() != null && i.getType().name().equalsIgnoreCase("FIXA") || i.getType().name().equalsIgnoreCase("VARIAVEL");
                }
                return typeMatch && i.getStatus() != null && i.getStatus().name().equalsIgnoreCase(status);
            })
            .map(Invoice::getAmount)
            .filter(a -> a != null)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    
    public BigDecimal getTotalExpensesByStatus(String status) {
        List<Invoice> invoices = invoiceRepository.findAll();
        return invoices.stream()
            .filter(i -> i.getStatus() != null && i.getStatus().name().equalsIgnoreCase(status))
            .map(Invoice::getAmount)
            .filter(a -> a != null)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    
    // Buscar categorias Ãºnicas
    public List<String> getDistinctCategories() {
        return invoiceRepository.findDistinctCategories();
    }
    
    // Buscar centros de custo Ãºnicos
    public List<String> getDistinctCostCenters() {
        return invoiceRepository.findAllCostCenterNames();
    }
    
    // Buscar centros de custo Ãºnicos da tabela invoices
    public List<String> getDistinctCostCentersFromInvoices() {
        return invoiceRepository.findDistinctCostCenters();
    }
    
    // Buscar todos os centros de custo da tabela cost_centers
    public List<String> getAllCostCenterNames() {
        return invoiceRepository.findAllCostCenterNames();
    }
} 
