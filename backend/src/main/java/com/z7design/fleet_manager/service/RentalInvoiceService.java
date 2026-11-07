package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.RentalInvoiceDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.AccountsReceivable;
import com.z7design.fleet_manager.model.Client;
import com.z7design.fleet_manager.model.Contract;
import com.z7design.fleet_manager.model.RentalInvoice;
import com.z7design.fleet_manager.model.RentalInvoiceVehicle;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.model.enums.PaymentMethod;
import com.z7design.fleet_manager.model.enums.ReceivableCategory;
import com.z7design.fleet_manager.model.enums.ReceivableStatus;
import com.z7design.fleet_manager.repository.AccountsReceivableRepository;
import com.z7design.fleet_manager.repository.ClientRepository;
import com.z7design.fleet_manager.repository.ContractRepository;
import com.z7design.fleet_manager.repository.RentalInvoiceRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RentalInvoiceService {

    private static final String DEFAULT_ITEM_DESCRIPTION = "LOCAÇÃO DE VEÍCULO SEM CESSÃO DE MÃO DE OBRA";

    private final RentalInvoiceRepository rentalInvoiceRepository;
    private final ClientRepository clientRepository;
    private final ContractRepository contractRepository;
    private final VehicleRepository vehicleRepository;
    private final AccountsReceivableRepository accountsReceivableRepository;

    @Transactional(readOnly = true)
    public List<RentalInvoiceDTO> list(UUID clientId, UUID contractId, String status, String search) {
        List<RentalInvoice> invoices;
        if (clientId != null) {
            invoices = rentalInvoiceRepository.findByClientIdOrderByIssueDateDescCreatedAtDesc(clientId);
        } else if (contractId != null) {
            invoices = rentalInvoiceRepository.findByContractIdOrderByIssueDateDescCreatedAtDesc(contractId);
        } else {
            invoices = rentalInvoiceRepository.findAllByOrderByIssueDateDescCreatedAtDesc();
        }

        return invoices.stream()
                .filter(invoice -> matchesStatus(invoice, status))
                .filter(invoice -> matchesSearch(invoice, search))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RentalInvoiceDTO getById(UUID id) {
        return toDTO(findEntity(id));
    }

    @Transactional(readOnly = true)
    public String nextNumber() {
        Integer max = rentalInvoiceRepository.findMaxNumericNumber();
        int next = (max == null ? 0 : max) + 1;
        return String.valueOf(next);
    }

    @Transactional
    public RentalInvoiceDTO create(RentalInvoiceDTO dto) {
        RentalInvoice invoice = new RentalInvoice();
        applyBasicData(invoice, dto, true);
        applyItems(invoice, dto);
        recalculate(invoice);
        RentalInvoice saved = rentalInvoiceRepository.save(invoice);
        ensureFiscalData(saved);
        saved = rentalInvoiceRepository.save(saved);
        syncReceivable(saved);
        log.info("Fatura de locação {} criada para o cliente {} e integrada ao Contas a Receber",
                saved.getNumber(), saved.getClientName());
        return toDTO(saved);
    }

    @Transactional
    public RentalInvoiceDTO update(UUID id, RentalInvoiceDTO dto) {
        RentalInvoice invoice = findEntity(id);
        if (invoice.getNfseNumber() != null && !invoice.getNfseNumber().isBlank()
                && !"CANCELADA".equalsIgnoreCase(invoice.getNfseStatus())) {
            BigDecimal oldTotal = invoice.getTotalAmount() != null ? invoice.getTotalAmount() : BigDecimal.ZERO;
            BigDecimal newTotal = dto.getTotalAmount() != null ? dto.getTotalAmount() : BigDecimal.ZERO;
            if (newTotal.compareTo(BigDecimal.ZERO) > 0 && oldTotal.subtract(newTotal).abs().compareTo(new BigDecimal("0.05")) > 0) {
                throw new IllegalArgumentException(String.format(
                    "Esta Fatura de Locação está travada pois possui a NFS-e Nº %s vinculada. " +
                    "O valor da Nota Fiscal deve ser idêntico ao valor da Fatura. Para alterar valores, desvincule ou cancele a NFS-e primeiro.",
                    invoice.getNfseNumber()
                ));
            }
        }
        applyBasicData(invoice, dto, false);
        applyItems(invoice, dto);
        recalculate(invoice);
        RentalInvoice saved = rentalInvoiceRepository.save(invoice);
        ensureFiscalData(saved);
        saved = rentalInvoiceRepository.save(saved);
        syncReceivable(saved);
        log.info("Fatura de locação {} atualizada e sincronizada com o Contas a Receber", saved.getNumber());
        return toDTO(saved);
    }

    @Transactional
    public RentalInvoiceDTO updateStatus(UUID id, String status) {
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Informe o status da fatura.");
        }
        RentalInvoice invoice = findEntity(id);
        try {
            invoice.setStatus(ReceivableStatus.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Status de fatura inválido: " + status);
        }
        applyReceiptDate(invoice, null);
        ensureFiscalData(invoice);
        RentalInvoice saved = rentalInvoiceRepository.save(invoice);
        syncReceivable(saved);
        return toDTO(saved);
    }

    @Transactional
    public void delete(UUID id) {
        RentalInvoice invoice = findEntity(id);
        accountsReceivableRepository.findByRentalInvoiceId(id)
                .forEach(accountsReceivableRepository::delete);
        rentalInvoiceRepository.delete(invoice);
        log.info("Fatura de locação {} excluída (título financeiro vinculado removido)", invoice.getNumber());
    }

    /**
     * Gera/atualiza os títulos do Contas a Receber de todas as faturas de locação já existentes.
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    public int syncAllReceivables() {
        int created = 0;
        for (RentalInvoice invoice : rentalInvoiceRepository.findAll()) {
            try {
                boolean existed = !accountsReceivableRepository.findByRentalInvoiceId(invoice.getId()).isEmpty();
                ensureFiscalData(invoice);
                rentalInvoiceRepository.save(invoice);
                syncReceivable(invoice);
                if (!existed) {
                    created++;
                }
            } catch (Exception e) {
                log.warn("Falha ao sincronizar fatura de locação {} no Contas a Receber: {}",
                        invoice.getNumber(), e.getMessage());
            }
        }
        return created;
    }

    private void applyBasicData(RentalInvoice invoice, RentalInvoiceDTO dto, boolean isNew) {
        if (dto.getClientId() == null) {
            throw new IllegalArgumentException("Informe o cliente da fatura de locação.");
        }
        Client client = clientRepository.findById(dto.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado"));

        invoice.setClientId(client.getId());
        invoice.setClient(client);
        invoice.setClientName(dto.getClientName() != null && !dto.getClientName().isBlank()
                ? dto.getClientName() : client.getName());
        invoice.setClientCnpj(firstNonBlank(dto.getClientCnpj(), client.getCnpj()));
        invoice.setClientIe(dto.getClientIe());
        invoice.setClientAddress(firstNonBlank(dto.getClientAddress(), client.getAddress()));
        invoice.setClientCity(firstNonBlank(dto.getClientCity(), client.getCity()));
        invoice.setClientState(firstNonBlank(dto.getClientState(), client.getState()));
        invoice.setClientZipCode(firstNonBlank(dto.getClientZipCode(), client.getZipCode()));

        Contract contract = null;
        if (dto.getContractId() != null) {
            contract = contractRepository.findById(dto.getContractId())
                    .orElseThrow(() -> new ResourceNotFoundException("Contrato não encontrado"));
            invoice.setContractId(contract.getId());
            invoice.setContract(contract);
            invoice.setContractNumber(firstNonBlank(dto.getContractNumber(), contract.getContractNumber()));
        } else {
            invoice.setContractId(null);
            invoice.setContract(null);
            invoice.setContractNumber(dto.getContractNumber());
        }

        if (isNew) {
            invoice.setNumber(dto.getNumber() != null && !dto.getNumber().isBlank()
                    ? dto.getNumber().trim() : nextNumber());
        } else if (dto.getNumber() != null && !dto.getNumber().isBlank()) {
            invoice.setNumber(dto.getNumber().trim());
        }

        if (dto.getPeriodStart() == null || dto.getPeriodEnd() == null || dto.getDueDate() == null) {
            throw new IllegalArgumentException("Informe o período da locação e a data de vencimento da fatura.");
        }
        invoice.setIssueDate(dto.getIssueDate() != null ? dto.getIssueDate() : LocalDate.now());
        invoice.setPeriodStart(dto.getPeriodStart());
        invoice.setPeriodEnd(dto.getPeriodEnd());
        invoice.setDueDate(dto.getDueDate());

        if (dto.getStatus() != null) {
            invoice.setStatus(dto.getStatus());
        } else if (isNew) {
            invoice.setStatus(ReceivableStatus.PENDING);
        }
        applyReceiptDate(invoice, dto.getReceiptDate());

        invoice.setPaymentMethod(dto.getPaymentMethod());
        invoice.setBankName(dto.getBankName());
        invoice.setBankAgency(dto.getBankAgency());
        invoice.setBankAccount(dto.getBankAccount());
        invoice.setNotes(dto.getNotes());
        invoice.setDiscount(scale(dto.getDiscount() == null ? BigDecimal.ZERO : dto.getDiscount()));
    }

    private void applyItems(RentalInvoice invoice, RentalInvoiceDTO dto) {
        invoice.getItems().clear();

        List<RentalInvoiceDTO.Item> requested = dto.getItems() == null ? List.of() : dto.getItems();
        for (RentalInvoiceDTO.Item itemDto : requested) {
            if (itemDto == null) {
                continue;
            }
            Vehicle vehicle = null;
            if (itemDto.getVehicleId() != null) {
                vehicle = vehicleRepository.findById(itemDto.getVehicleId()).orElse(null);
            }
            if (vehicle == null && itemDto.getPlate() != null && !itemDto.getPlate().isBlank()) {
                String cleanPlate = itemDto.getPlate().trim().toUpperCase();
                vehicle = vehicleRepository.findByPlate(cleanPlate).orElse(null);
                if (vehicle == null) {
                    vehicle = vehicleRepository.findByPlateRaw(cleanPlate).orElse(null);
                }
            }
            String plate = firstNonBlank(itemDto.getPlate(), vehicle != null ? vehicle.getPlate() : null);
            if (plate == null || plate.isBlank()) {
                continue;
            }
            RentalInvoiceVehicle item = RentalInvoiceVehicle.builder()
                    .vehicleId(vehicle != null ? vehicle.getId() : itemDto.getVehicleId())
                    .plate(plate.trim().toUpperCase())
                    .model(firstNonBlank(itemDto.getModel(), vehicle != null ? vehicle.getModel() : null))
                    .description(firstNonBlank(itemDto.getDescription(), DEFAULT_ITEM_DESCRIPTION))
                    .amount(scale(itemDto.getAmount() == null ? BigDecimal.ZERO : itemDto.getAmount()))
                    .build();
            invoice.addItem(item);
        }

        if (invoice.getItems().isEmpty() && invoice.getClientId() != null) {
            Contract contract = invoice.getContractId() != null
                    ? contractRepository.findById(invoice.getContractId()).orElse(null)
                    : null;
            for (Vehicle vehicle : resolveVehicles(invoice.getClientId(), contract)) {
                RentalInvoiceVehicle item = RentalInvoiceVehicle.builder()
                        .vehicleId(vehicle.getId())
                        .plate(vehicle.getPlate())
                        .model(vehicle.getModel())
                        .description(DEFAULT_ITEM_DESCRIPTION)
                        .amount(unitValue(contract))
                        .build();
                invoice.addItem(item);
            }
        }
    }

    private List<Vehicle> resolveVehicles(UUID clientId, Contract contract) {
        List<Vehicle> allVehicles = vehicleRepository.findAll();
        Set<Vehicle> contractVehicles = new LinkedHashSet<>();
        String clientName = clientId == null ? null
                : clientRepository.findById(clientId).map(Client::getName).orElse(null);

        if (contract != null) {
            for (Vehicle vehicle : allVehicles) {
                if (contract.getId() != null && contract.getId().equals(vehicle.getContractId())) {
                    contractVehicles.add(vehicle);
                } else if (contract.getContractNumber() != null && vehicle.getAllocationContractNumber() != null
                        && contract.getContractNumber().equalsIgnoreCase(vehicle.getAllocationContractNumber())) {
                    contractVehicles.add(vehicle);
                }
            }
            if (!contractVehicles.isEmpty()) {
                return new ArrayList<>(contractVehicles);
            }
        }

        for (Vehicle vehicle : allVehicles) {
            if (clientId != null && clientId.equals(vehicle.getClientId())) {
                contractVehicles.add(vehicle);
            } else if (clientName != null && vehicle.getClientName() != null
                    && clientName.trim().equalsIgnoreCase(vehicle.getClientName().trim())) {
                // Dados legados: o vínculo do veículo com o cliente está no nome do cliente
                contractVehicles.add(vehicle);
            }
        }

        return contractVehicles.stream()
                .sorted(Comparator.comparing(v -> v.getPlate() == null ? "" : v.getPlate()))
                .collect(Collectors.toList());
    }

    private BigDecimal unitValue(Contract contract) {
        if (contract == null) {
            return BigDecimal.ZERO;
        }
        if (contract.getUnitVehicleValue() != null) {
            return scale(contract.getUnitVehicleValue());
        }
        int quantity = contract.getVehicleQuantity() == null ? 0 : contract.getVehicleQuantity();
        if (quantity > 0 && contract.getValue() != null) {
            return scale(contract.getValue().divide(BigDecimal.valueOf(quantity), 2, RoundingMode.HALF_UP));
        }
        return BigDecimal.ZERO;
    }

    /**
     * Define a data de recebimento apenas quando a fatura está paga.
     */
    private void applyReceiptDate(RentalInvoice invoice, LocalDate requested) {
        if (invoice.getStatus() == ReceivableStatus.PAID) {
            if (requested != null) {
                invoice.setReceiptDate(requested);
            } else if (invoice.getReceiptDate() == null) {
                invoice.setReceiptDate(LocalDate.now());
            }
        } else {
            invoice.setReceiptDate(null);
        }
    }

    /**
     * Garante os dados da Nota Fiscal gerada para o cliente.
     */
    private void ensureFiscalData(RentalInvoice invoice) {
        if (invoice.getId() == null) {
            return;
        }
        invoice.setNfseNumber(firstNonBlank(invoice.getNfseNumber(), invoice.getNumber()));
        if (invoice.getNfseIssueDate() == null) {
            invoice.setNfseIssueDate(LocalDateTime.now());
        }
        invoice.setNfseStatus(invoice.getStatus() == ReceivableStatus.CANCELLED ? "CANCELADA" : "EMITIDA");
        invoice.setNfsePdfUrl("/api/rental-invoices/" + invoice.getId() + "/nfse");
    }

    /**
     * Cria/atualiza o título no Contas a Receber correspondente à fatura de locação.
     */
    private void syncReceivable(RentalInvoice invoice) {
        if (invoice.getId() == null || invoice.getClientId() == null) {
            return;
        }
        Client client = clientRepository.findById(invoice.getClientId()).orElse(null);
        if (client == null) {
            return;
        }

        List<AccountsReceivable> existing = accountsReceivableRepository.findByRentalInvoiceId(invoice.getId());
        AccountsReceivable account = existing.isEmpty() ? new AccountsReceivable() : existing.get(0);

        BigDecimal rawNet = invoice.getNetAmount() != null ? invoice.getNetAmount() : invoice.getTotalAmount();
        BigDecimal amount = scale(rawNet != null && rawNet.compareTo(BigDecimal.ZERO) >= 0 ? rawNet : BigDecimal.ZERO);
        UUID effectiveCompanyId = client.getCompanyId() != null
                ? client.getCompanyId()
                : com.z7design.fleet_manager.tenant.TenantContext.getCurrentTenant();
        account.setRentalInvoiceId(invoice.getId());
        account.setClient(client);
        account.setCompanyId(effectiveCompanyId);
        account.setInvoiceNumber(invoice.getNumber() != null && !invoice.getNumber().isBlank() ? invoice.getNumber() : "LOC-" + invoice.getId().toString().substring(0, 6));
        account.setDescription("Locação de Veículos - Fatura " + invoice.getNumber()
                + " (" + formatPeriod(invoice) + ")");
        account.setAmount(amount);
        account.setAmountPaid(invoice.getStatus() == ReceivableStatus.PAID ? amount : BigDecimal.ZERO);
        account.setIssueDate(invoice.getIssueDate() != null ? invoice.getIssueDate() : LocalDate.now());
        account.setDueDate(invoice.getDueDate() != null ? invoice.getDueDate() : LocalDate.now().plusDays(15));
        account.setPaymentDate(invoice.getReceiptDate());
        account.setStatus(invoice.getStatus() == null ? ReceivableStatus.PENDING : invoice.getStatus());
        account.setCategory(ReceivableCategory.VEHICLE_RENTAL);
        account.setPaymentMethod(resolvePaymentMethod(invoice.getPaymentMethod()));
        account.setOverdueDays(0);
        account.setLateFee(BigDecimal.ZERO);
        account.setLatePenalty(BigDecimal.ZERO);
        account.setNotes(invoice.getNotes());
        account.setContract(invoice.getContractId() != null
                ? contractRepository.findById(invoice.getContractId()).orElse(null)
                : null);
        account.setGrossAmount(scale(invoice.getTotalAmount()));
        account.setNetAmount(amount);
        account.setNfseNumber(invoice.getNfseNumber());
        account.setNfseStatus(invoice.getNfseStatus());
        account.setNfseIssueDate(invoice.getNfseIssueDate());
        account.setNfsePdfUrl(invoice.getNfsePdfUrl());
        account.setFaturaLocacaoNumber(invoice.getNumber());
        account.setPeriodoLocacao(formatPeriod(invoice));
        account.setPlacasVeiculos(joinPlates(invoice));
        account.setDadosBancarios(formatBankData(invoice));
        account.calculateOverdueDays();

        accountsReceivableRepository.save(account);
    }

    private String formatPeriod(RentalInvoice invoice) {
        if (invoice.getPeriodStart() == null || invoice.getPeriodEnd() == null) {
            return "-";
        }
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        return invoice.getPeriodStart().format(formatter) + " a " + invoice.getPeriodEnd().format(formatter);
    }

    private String joinPlates(RentalInvoice invoice) {
        return invoice.getItems().stream()
                .map(RentalInvoiceVehicle::getPlate)
                .filter(plate -> plate != null && !plate.isBlank())
                .distinct()
                .collect(Collectors.joining(", "));
    }

    private String formatBankData(RentalInvoice invoice) {
        List<String> parts = new ArrayList<>();
        if (invoice.getBankName() != null && !invoice.getBankName().isBlank()) {
            parts.add("Banco: " + invoice.getBankName().trim());
        }
        if (invoice.getBankAgency() != null && !invoice.getBankAgency().isBlank()) {
            parts.add("Agência: " + invoice.getBankAgency().trim());
        }
        if (invoice.getBankAccount() != null && !invoice.getBankAccount().isBlank()) {
            parts.add("Conta: " + invoice.getBankAccount().trim());
        }
        return parts.isEmpty() ? null : String.join(" | ", parts);
    }

    private PaymentMethod resolvePaymentMethod(String value) {
        if (value == null || value.isBlank()) {
            return PaymentMethod.TRANSFER;
        }
        String normalized = value.toUpperCase();
        if (normalized.contains("PIX")) {
            return PaymentMethod.PIX;
        }
        if (normalized.contains("BOLETO")) {
            return PaymentMethod.BOLETO;
        }
        if (normalized.contains("DINHEIRO")) {
            return PaymentMethod.CASH;
        }
        if (normalized.contains("CART")) {
            return PaymentMethod.CARD;
        }
        return PaymentMethod.TRANSFER;
    }

    private void recalculate(RentalInvoice invoice) {
        BigDecimal total = invoice.getItems().stream()
                .map(RentalInvoiceVehicle::getAmount)
                .filter(amount -> amount != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal discount = invoice.getDiscount() == null ? BigDecimal.ZERO : invoice.getDiscount();
        BigDecimal net = total.subtract(discount);
        if (net.compareTo(BigDecimal.ZERO) < 0) {
            net = BigDecimal.ZERO;
        }
        invoice.setTotalAmount(scale(total));
        invoice.setDiscount(scale(discount));
        invoice.setNetAmount(scale(net));
    }

    private boolean matchesStatus(RentalInvoice invoice, String status) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) {
            return true;
        }
        return invoice.getStatus() != null && invoice.getStatus().name().equalsIgnoreCase(status);
    }

    private boolean matchesSearch(RentalInvoice invoice, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }
        String term = search.trim().toLowerCase();
        return contains(invoice.getNumber(), term)
                || contains(invoice.getClientName(), term)
                || contains(invoice.getClientCnpj(), term)
                || contains(invoice.getContractNumber(), term)
                || invoice.getItems().stream().anyMatch(item -> contains(item.getPlate(), term)
                        || contains(item.getModel(), term));
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase().contains(term);
    }

    private String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) {
            return first.trim();
        }
        return second != null && !second.isBlank() ? second.trim() : null;
    }

    private BigDecimal scale(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value.setScale(2, RoundingMode.HALF_UP);
    }

    private RentalInvoice findEntity(UUID id) {
        return rentalInvoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fatura de locação não encontrada"));
    }

    private UUID receivableId(RentalInvoice invoice) {
        if (invoice.getId() == null) {
            return null;
        }
        return accountsReceivableRepository.findByRentalInvoiceId(invoice.getId()).stream()
                .map(AccountsReceivable::getId)
                .findFirst()
                .orElse(null);
    }

    private RentalInvoiceDTO toDTO(RentalInvoice invoice) {
        return RentalInvoiceDTO.builder()
                .id(invoice.getId())
                .number(invoice.getNumber())
                .clientId(invoice.getClientId())
                .clientName(invoice.getClientName())
                .clientCnpj(invoice.getClientCnpj())
                .clientIe(invoice.getClientIe())
                .clientAddress(invoice.getClientAddress())
                .clientCity(invoice.getClientCity())
                .clientState(invoice.getClientState())
                .clientZipCode(invoice.getClientZipCode())
                .contractId(invoice.getContractId())
                .contractNumber(invoice.getContractNumber())
                .issueDate(invoice.getIssueDate())
                .periodStart(invoice.getPeriodStart())
                .periodEnd(invoice.getPeriodEnd())
                .dueDate(invoice.getDueDate())
                .receiptDate(invoice.getReceiptDate())
                .nfseNumber(invoice.getNfseNumber())
                .nfseStatus(invoice.getNfseStatus())
                .nfseIssueDate(invoice.getNfseIssueDate())
                .nfsePdfUrl(invoice.getNfsePdfUrl())
                .receivableId(receivableId(invoice))
                .totalAmount(invoice.getTotalAmount())
                .discount(invoice.getDiscount())
                .netAmount(invoice.getNetAmount())
                .status(invoice.getStatus())
                .paymentMethod(invoice.getPaymentMethod())
                .bankName(invoice.getBankName())
                .bankAgency(invoice.getBankAgency())
                .bankAccount(invoice.getBankAccount())
                .notes(invoice.getNotes())
                .items(invoice.getItems().stream()
                        .map(item -> RentalInvoiceDTO.Item.builder()
                                .id(item.getId())
                                .vehicleId(item.getVehicleId())
                                .plate(item.getPlate())
                                .model(item.getModel())
                                .description(item.getDescription())
                                .amount(item.getAmount())
                                .build())
                        .collect(Collectors.toList()))
                .createdAt(invoice.getCreatedAt())
                .updatedAt(invoice.getUpdatedAt())
                .build();
    }
}
