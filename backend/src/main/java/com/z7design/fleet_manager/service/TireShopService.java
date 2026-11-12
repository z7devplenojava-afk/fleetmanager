package com.z7design.fleet_manager.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.fleet_manager.dto.warehouse.TireShopServiceDTO;
import com.z7design.fleet_manager.exception.BusinessException;
import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.model.enums.ExpenseStatus;
import com.z7design.fleet_manager.model.enums.ExpenseType;
import com.z7design.fleet_manager.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TireShopService {

    private final TireShopServiceCatalogRepository catalogRepository;
    private final TireShopServiceRecordRepository recordRepository;
    private final SupplierRepository supplierRepository;
    private final VehicleRepository vehicleRepository;
    private final TireRepository tireRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceService invoiceService;
    private final ObjectMapper objectMapper;

    public List<TireShopServiceCatalog> getCatalog(UUID companyId) {
        if (companyId == null) {
            return catalogRepository.findAllActive();
        }
        return catalogRepository.findActiveForCompany(companyId);
    }

    @Transactional
    public TireShopServiceCatalog createCatalogItem(TireShopServiceCatalog req, UUID companyId) {
        if (req.getName() == null || req.getName().isBlank()) {
            throw new BusinessException("Nome do serviço de borracharia é obrigatório.");
        }
        String code = req.getCode();
        if (code == null || code.isBlank()) {
            long total = catalogRepository.count() + 1;
            code = String.format("BOR-%03d", total);
        }
        TireShopServiceCatalog entity = TireShopServiceCatalog.builder()
                .companyId(companyId)
                .code(code.trim().toUpperCase())
                .name(req.getName().trim())
                .description(req.getDescription())
                .defaultPrice(req.getDefaultPrice() != null ? req.getDefaultPrice() : BigDecimal.ZERO)
                .requiresPickup(Boolean.TRUE.equals(req.getRequiresPickup()))
                .active(true)
                .build();
        return catalogRepository.save(entity);
    }

    @Transactional
    public TireShopServiceCatalog updateCatalogItem(UUID id, TireShopServiceCatalog req) {
        TireShopServiceCatalog existing = catalogRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Serviço do catálogo não encontrado."));
        if (req.getCode() != null && !req.getCode().isBlank()) existing.setCode(req.getCode().trim().toUpperCase());
        if (req.getName() != null && !req.getName().isBlank()) existing.setName(req.getName().trim());
        if (req.getDescription() != null) existing.setDescription(req.getDescription());
        if (req.getDefaultPrice() != null) existing.setDefaultPrice(req.getDefaultPrice());
        if (req.getRequiresPickup() != null) existing.setRequiresPickup(req.getRequiresPickup());
        if (req.getActive() != null) existing.setActive(req.getActive());
        return catalogRepository.save(existing);
    }

    @Transactional
    public void deleteCatalogItem(UUID id) {
        TireShopServiceCatalog existing = catalogRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Serviço do catálogo não encontrado."));
        existing.setActive(false);
        catalogRepository.save(existing);
    }

    public List<TireShopServiceDTO> getAllRecords(UUID companyId) {
        List<TireShopServiceRecord> records = (companyId == null)
                ? recordRepository.findAllByOrderByServiceDateDescCreatedAtDesc()
                : recordRepository.findByCompanyIdOrderByServiceDateDescCreatedAtDesc(companyId);
        return enrichRecords(records);
    }

    @Transactional
    public TireShopServiceDTO createRecord(TireShopServiceDTO dto, UUID companyId, User user) {
        if (dto.getSupplierId() == null) {
            throw new BusinessException("Selecione o fornecedor / borracharia responsável pelo serviço.");
        }

        Supplier supplier = supplierRepository.findById(dto.getSupplierId())
                .orElseThrow(() -> new NoSuchElementException("Fornecedor não encontrado."));

        UUID effectiveCompanyId = companyId != null ? companyId : supplier.getCompanyId();

        String serviceName = dto.getServiceName();
        if ((serviceName == null || serviceName.isBlank()) && dto.getCatalogServiceId() != null) {
            serviceName = catalogRepository.findById(dto.getCatalogServiceId())
                    .map(TireShopServiceCatalog::getName)
                    .orElse("");
        }
        if (serviceName == null || serviceName.isBlank()) {
            throw new BusinessException("Informe o serviço de borracharia realizado.");
        }

        int qty = dto.getQuantity() != null && dto.getQuantity() > 0 ? dto.getQuantity() : 1;
        BigDecimal unitAmt = dto.getUnitAmount() != null ? dto.getUnitAmount() : BigDecimal.ZERO;
        BigDecimal totalAmt = dto.getTotalAmount() != null && dto.getTotalAmount().compareTo(BigDecimal.ZERO) > 0
                ? dto.getTotalAmount()
                : unitAmt.multiply(BigDecimal.valueOf(qty));

        LocalDate serviceDate = dto.getServiceDate() != null ? dto.getServiceDate() : LocalDate.now();
        LocalDate dueDate = dto.getDueDate() != null ? dto.getDueDate() : serviceDate.plusDays(15);

        String serviceNumber = generateServiceNumber(effectiveCompanyId, serviceDate);
        List<UUID> tireIds = dto.getTireIds() != null ? dto.getTireIds() : List.of();
        String tireSummary = buildTireSummary(tireIds, dto.getTireLabelsSummary());
        String tireIdsJson = serializeTireIds(tireIds);

        String beneficiaryName = blankToNull(dto.getBeneficiaryName());
        if (beneficiaryName == null) beneficiaryName = blankToNull(supplier.getName());
        String beneficiaryCnpj = blankToNull(dto.getBeneficiaryCnpj());
        if (beneficiaryCnpj == null) beneficiaryCnpj = blankToNull(supplier.getCnpj());

        TireShopServiceRecord entity = TireShopServiceRecord.builder()
                .companyId(effectiveCompanyId)
                .serviceNumber(serviceNumber)
                .catalogServiceId(dto.getCatalogServiceId())
                .serviceName(serviceName.trim())
                .supplierId(supplier.getId())
                .supplierName(supplier.getName())
                .vehicleId(dto.getVehicleId())
                .tireIdsJson(tireIdsJson)
                .tireLabelsSummary(tireSummary)
                .quantity(qty)
                .unitAmount(unitAmt)
                .totalAmount(totalAmt)
                .serviceDate(serviceDate)
                .dueDate(dueDate)
                .boletoUrl(blankToNull(dto.getBoletoUrl()))
                .boletoOriginalName(blankToNull(dto.getBoletoOriginalName()))
                .linhaDigitavel(blankToNull(dto.getLinhaDigitavel()))
                .barcode(blankToNull(dto.getBarcode()))
                .nfNumber(blankToNull(dto.getNfNumber()))
                .nfKey(blankToNull(dto.getNfKey()))
                .nfUrl(blankToNull(dto.getNfUrl()))
                .nfOriginalName(blankToNull(dto.getNfOriginalName()))
                .beneficiaryName(beneficiaryName)
                .beneficiaryCnpj(beneficiaryCnpj)
                .generatePayable(dto.getGeneratePayable() == null || dto.getGeneratePayable())
                .notes(blankToNull(dto.getNotes()))
                .createdByUserId(user != null ? user.getId() : null)
                .createdByName(user != null ? (user.getName() != null ? user.getName() : user.getUsername()) : null)
                .build();

        if (Boolean.TRUE.equals(entity.getGeneratePayable()) && totalAmt.compareTo(BigDecimal.ZERO) > 0) {
            Invoice invoice = createPayableInvoiceForService(entity, supplier, effectiveCompanyId);
            entity.setInvoiceId(invoice.getId());
            entity.setInvoiceNumber(invoice.getInvoiceNumber());
        }

        TireShopServiceRecord saved = recordRepository.save(entity);
        return enrichRecords(List.of(saved)).get(0);
    }

    @Transactional
    public TireShopServiceDTO updateRecord(UUID id, TireShopServiceDTO dto, UUID companyId, User user) {
        TireShopServiceRecord entity = recordRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Serviço de borracharia não encontrado."));

        UUID effectiveCompanyId = entity.getCompanyId() != null ? entity.getCompanyId() : companyId;

        Supplier supplier = dto.getSupplierId() != null
                ? supplierRepository.findById(dto.getSupplierId())
                        .orElseThrow(() -> new NoSuchElementException("Fornecedor não encontrado."))
                : supplierRepository.findById(entity.getSupplierId())
                        .orElseThrow(() -> new NoSuchElementException("Fornecedor não encontrado."));

        if (dto.getCatalogServiceId() != null) entity.setCatalogServiceId(dto.getCatalogServiceId());
        if (dto.getServiceName() != null && !dto.getServiceName().isBlank()) entity.setServiceName(dto.getServiceName().trim());
        entity.setSupplierId(supplier.getId());
        entity.setSupplierName(supplier.getName());
        entity.setVehicleId(dto.getVehicleId());

        if (dto.getTireIds() != null) {
            entity.setTireIdsJson(serializeTireIds(dto.getTireIds()));
            entity.setTireLabelsSummary(buildTireSummary(dto.getTireIds(), dto.getTireLabelsSummary()));
        }

        int qty = dto.getQuantity() != null && dto.getQuantity() > 0 ? dto.getQuantity() : entity.getQuantity();
        BigDecimal unitAmt = dto.getUnitAmount() != null ? dto.getUnitAmount() : entity.getUnitAmount();
        BigDecimal totalAmt = dto.getTotalAmount() != null && dto.getTotalAmount().compareTo(BigDecimal.ZERO) > 0
                ? dto.getTotalAmount()
                : unitAmt.multiply(BigDecimal.valueOf(qty));
        entity.setQuantity(qty);
        entity.setUnitAmount(unitAmt);
        entity.setTotalAmount(totalAmt);

        if (dto.getServiceDate() != null) entity.setServiceDate(dto.getServiceDate());
        if (dto.getDueDate() != null) entity.setDueDate(dto.getDueDate());
        if (dto.getBoletoUrl() != null) entity.setBoletoUrl(blankToNull(dto.getBoletoUrl()));
        if (dto.getBoletoOriginalName() != null) entity.setBoletoOriginalName(blankToNull(dto.getBoletoOriginalName()));
        if (dto.getLinhaDigitavel() != null) entity.setLinhaDigitavel(blankToNull(dto.getLinhaDigitavel()));
        if (dto.getBarcode() != null) entity.setBarcode(blankToNull(dto.getBarcode()));
        if (dto.getNfNumber() != null) entity.setNfNumber(blankToNull(dto.getNfNumber()));
        if (dto.getNfKey() != null) entity.setNfKey(blankToNull(dto.getNfKey()));
        if (dto.getNfUrl() != null) entity.setNfUrl(blankToNull(dto.getNfUrl()));
        if (dto.getNfOriginalName() != null) entity.setNfOriginalName(blankToNull(dto.getNfOriginalName()));
        if (dto.getBeneficiaryName() != null) entity.setBeneficiaryName(blankToNull(dto.getBeneficiaryName()));
        if (dto.getBeneficiaryCnpj() != null) entity.setBeneficiaryCnpj(blankToNull(dto.getBeneficiaryCnpj()));
        if (entity.getBeneficiaryName() == null) entity.setBeneficiaryName(blankToNull(supplier.getName()));
        if (entity.getBeneficiaryCnpj() == null) entity.setBeneficiaryCnpj(blankToNull(supplier.getCnpj()));
        if (dto.getNotes() != null) entity.setNotes(blankToNull(dto.getNotes()));
        if (dto.getGeneratePayable() != null) entity.setGeneratePayable(dto.getGeneratePayable());

        if (entity.getInvoiceId() != null) {
            invoiceRepository.findById(entity.getInvoiceId()).ifPresent(inv -> {
                if (inv.getStatus() != ExpenseStatus.PAGA) {
                    inv.setSupplier(supplier);
                    inv.setSupplierName(entity.getBeneficiaryName() != null ? entity.getBeneficiaryName() : supplier.getName());
                    inv.setDescription(buildInvoiceDescription(entity));
                    if (entity.getTotalAmount().compareTo(BigDecimal.ZERO) > 0) {
                        inv.setAmount(entity.getTotalAmount());
                        inv.setBalanceAmount(entity.getTotalAmount());
                    }
                    inv.setIssueDate(entity.getServiceDate());
                    inv.setDueDate(entity.getDueDate() != null ? entity.getDueDate() : entity.getServiceDate().plusDays(15));
                    inv.setBoletoUrl(entity.getBoletoUrl());
                    inv.setBoletoOriginalName(entity.getBoletoOriginalName());
                    inv.setLinhaDigitavel(truncate(entity.getLinhaDigitavel(), 60));
                    inv.setBarcode(entity.getBarcode());
                    inv.setNfeKey(truncate(entity.getNfKey(), 100));
                    inv.setNfePdfUrl(truncate(entity.getNfUrl(), 500));
                    if (entity.getNfNumber() != null || entity.getNfUrl() != null) {
                        inv.setIsNfse(Boolean.TRUE);
                    }
                    inv.setNotes(entity.getNotes());
                    invoiceService.save(inv);
                }
            });
        } else if (Boolean.TRUE.equals(entity.getGeneratePayable()) && entity.getTotalAmount().compareTo(BigDecimal.ZERO) > 0) {
            Invoice invoice = createPayableInvoiceForService(entity, supplier, effectiveCompanyId);
            entity.setInvoiceId(invoice.getId());
            entity.setInvoiceNumber(invoice.getInvoiceNumber());
        }

        TireShopServiceRecord saved = recordRepository.save(entity);
        return enrichRecords(List.of(saved)).get(0);
    }

    @Transactional
    public void deleteRecord(UUID id) {
        TireShopServiceRecord entity = recordRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Serviço de borracharia não encontrado."));
        if (entity.getInvoiceId() != null) {
            Invoice inv = invoiceRepository.findById(entity.getInvoiceId()).orElse(null);
            if (inv != null) {
                if (inv.getStatus() == ExpenseStatus.PAGA) {
                    throw new BusinessException("Este serviço já possui fatura PAGA no Financeiro (" + inv.getInvoiceNumber() + ") e não pode ser excluído.");
                }
                invoiceRepository.delete(inv);
            }
        }
        recordRepository.delete(entity);
    }

    private Invoice createPayableInvoiceForService(TireShopServiceRecord entity, Supplier supplier, UUID companyId) {
        Invoice invoice = new Invoice();
        invoice.setCompanyId(companyId);
        String year = String.valueOf(entity.getServiceDate().getYear());
        String shortSuffix = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        String nfClean = entity.getNfNumber() != null ? entity.getNfNumber().replaceAll("[^A-Za-z0-9\\-]", "") : "";
        String invNumber = !nfClean.isBlank()
                ? truncate("NF-" + nfClean + "-" + shortSuffix.substring(0, 4), 50)
                : "BOR-" + year + "-" + shortSuffix;
        invoice.setInvoiceNumber(invNumber);
        invoice.setDescription(buildInvoiceDescription(entity));
        invoice.setAmount(entity.getTotalAmount());
        invoice.setBalanceAmount(entity.getTotalAmount());
        invoice.setPaidAmount(BigDecimal.ZERO);
        invoice.setType(ExpenseType.VARIAVEL);
        invoice.setStatus(ExpenseStatus.PENDENTE);
        invoice.setIssueDate(entity.getServiceDate());
        invoice.setDueDate(entity.getDueDate() != null ? entity.getDueDate() : entity.getServiceDate().plusDays(15));
        invoice.setCategory("Borracharia / Pneus");
        invoice.setCentroCusto("MANUTENCAO / PNEUS");
        invoice.setSupplier(supplier);
        invoice.setSupplierName(entity.getBeneficiaryName() != null ? entity.getBeneficiaryName() : supplier.getName());
        invoice.setBoletoUrl(entity.getBoletoUrl());
        invoice.setBoletoOriginalName(entity.getBoletoOriginalName());
        invoice.setLinhaDigitavel(truncate(entity.getLinhaDigitavel(), 60));
        invoice.setBarcode(entity.getBarcode());
        invoice.setNfeKey(truncate(entity.getNfKey(), 100));
        invoice.setNfePdfUrl(truncate(entity.getNfUrl(), 500));
        if (entity.getNfNumber() != null || entity.getNfUrl() != null) {
            invoice.setIsNfse(Boolean.TRUE);
        }
        invoice.setNotes(entity.getNotes());
        return invoiceService.save(invoice);
    }

    private String buildInvoiceDescription(TireShopServiceRecord entity) {
        StringBuilder sb = new StringBuilder("Borracharia ");
        sb.append(entity.getServiceNumber());
        if (entity.getNfNumber() != null && !entity.getNfNumber().isBlank()) {
            sb.append(" • NF ").append(entity.getNfNumber().trim());
        }
        sb.append(" • ").append(entity.getServiceName());
        if (entity.getTireLabelsSummary() != null && !entity.getTireLabelsSummary().isBlank()) {
            sb.append(" [Pneus: ").append(entity.getTireLabelsSummary()).append("]");
        }
        String raw = sb.toString();
        return raw.length() > 490 ? raw.substring(0, 490) : raw;
    }

    private String generateServiceNumber(UUID companyId, LocalDate date) {
        long count = companyId != null ? recordRepository.countByCompanyId(companyId) : recordRepository.count();
        return String.format("SB-%d-%04d", date.getYear(), count + 1);
    }

    private String buildTireSummary(List<UUID> tireIds, String fallbackSummary) {
        if (tireIds != null && !tireIds.isEmpty()) {
            List<Tire> found = tireRepository.findAllById(tireIds);
            if (!found.isEmpty()) {
                return found.stream()
                        .map(t -> t.getFireNumber() != null && !t.getFireNumber().isBlank() ? t.getFireNumber() : t.getSerialNumber())
                        .collect(Collectors.joining(", "));
            }
        }
        return blankToNull(fallbackSummary);
    }

    private String serializeTireIds(List<UUID> tireIds) {
        if (tireIds == null || tireIds.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(tireIds);
        } catch (Exception e) {
            return null;
        }
    }

    private List<UUID> parseTireIds(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<UUID>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private List<TireShopServiceDTO> enrichRecords(List<TireShopServiceRecord> records) {
        if (records == null || records.isEmpty()) return List.of();

        Set<UUID> vehicleIds = records.stream().map(TireShopServiceRecord::getVehicleId).filter(Objects::nonNull).collect(Collectors.toSet());
        Set<UUID> supplierIds = records.stream().map(TireShopServiceRecord::getSupplierId).filter(Objects::nonNull).collect(Collectors.toSet());
        Set<UUID> invoiceIds = records.stream().map(TireShopServiceRecord::getInvoiceId).filter(Objects::nonNull).collect(Collectors.toSet());

        Map<UUID, Vehicle> vehicleMap = vehicleIds.isEmpty()
                ? Map.of()
                : vehicleRepository.findAllRawByIdIn(vehicleIds).stream().collect(Collectors.toMap(Vehicle::getId, v -> v, (a, b) -> a));

        Map<UUID, Supplier> supplierMap = supplierIds.isEmpty()
                ? Map.of()
                : supplierRepository.findAllById(supplierIds).stream().collect(Collectors.toMap(Supplier::getId, s -> s, (a, b) -> a));

        Map<UUID, Invoice> invoiceMap = invoiceIds.isEmpty()
                ? Map.of()
                : invoiceRepository.findAllById(invoiceIds).stream().collect(Collectors.toMap(Invoice::getId, inv -> inv, (a, b) -> a));

        return records.stream().map(r -> {
            Vehicle v = r.getVehicleId() != null ? vehicleMap.get(r.getVehicleId()) : null;
            Supplier s = r.getSupplierId() != null ? supplierMap.get(r.getSupplierId()) : null;
            Invoice inv = r.getInvoiceId() != null ? invoiceMap.get(r.getInvoiceId()) : null;
            return TireShopServiceDTO.builder()
                    .id(r.getId())
                    .companyId(r.getCompanyId())
                    .serviceNumber(r.getServiceNumber())
                    .catalogServiceId(r.getCatalogServiceId())
                    .serviceName(r.getServiceName())
                    .supplierId(r.getSupplierId())
                    .supplierName(s != null ? s.getName() : r.getSupplierName())
                    .supplierCnpj(s != null ? s.getCnpj() : null)
                    .vehicleId(r.getVehicleId())
                    .vehiclePlate(v != null ? v.getPlate() : null)
                    .vehicleFleetNumber(v != null ? v.getFleetNumber() : null)
                    .tireIds(parseTireIds(r.getTireIdsJson()))
                    .tireLabelsSummary(r.getTireLabelsSummary())
                    .quantity(r.getQuantity())
                    .unitAmount(r.getUnitAmount())
                    .totalAmount(r.getTotalAmount())
                    .serviceDate(r.getServiceDate())
                    .dueDate(r.getDueDate())
                    .boletoUrl(inv != null && inv.getBoletoUrl() != null ? inv.getBoletoUrl() : r.getBoletoUrl())
                    .boletoOriginalName(inv != null && inv.getBoletoOriginalName() != null ? inv.getBoletoOriginalName() : r.getBoletoOriginalName())
                    .linhaDigitavel(inv != null && inv.getLinhaDigitavel() != null ? inv.getLinhaDigitavel() : r.getLinhaDigitavel())
                    .barcode(inv != null && inv.getBarcode() != null ? inv.getBarcode() : r.getBarcode())
                    .invoiceId(r.getInvoiceId())
                    .invoiceNumber(inv != null ? inv.getInvoiceNumber() : r.getInvoiceNumber())
                    .invoiceStatus(inv != null && inv.getStatus() != null ? inv.getStatus().name() : null)
                    .invoiceDueDate(inv != null ? inv.getDueDate() : r.getDueDate())
                    .invoicePaymentDate(inv != null ? inv.getPaymentDate() : null)
                    .nfNumber(r.getNfNumber())
                    .nfKey(r.getNfKey())
                    .nfUrl(r.getNfUrl() != null ? r.getNfUrl() : (inv != null ? inv.getNfePdfUrl() : null))
                    .nfOriginalName(r.getNfOriginalName())
                    .beneficiaryName(r.getBeneficiaryName() != null ? r.getBeneficiaryName() : (s != null ? s.getName() : r.getSupplierName()))
                    .beneficiaryCnpj(r.getBeneficiaryCnpj() != null ? r.getBeneficiaryCnpj() : (s != null ? s.getCnpj() : null))
                    .generatePayable(r.getGeneratePayable())
                    .notes(r.getNotes())
                    .createdByName(r.getCreatedByName())
                    .createdAt(r.getCreatedAt())
                    .build();
        }).toList();
    }

    private String blankToNull(String val) {
        return val == null || val.isBlank() ? null : val.trim();
    }

    private String truncate(String val, int maxLen) {
        if (val == null) return null;
        return val.length() > maxLen ? val.substring(0, maxLen) : val;
    }
}

