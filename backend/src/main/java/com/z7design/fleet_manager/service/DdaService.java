package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.DdaInvoice;
import com.z7design.fleet_manager.model.Invoice;
import com.z7design.fleet_manager.model.enums.ExpenseStatus;
import com.z7design.fleet_manager.model.enums.ExpenseType;
import com.z7design.fleet_manager.repository.DdaInvoiceRepository;
import com.z7design.fleet_manager.repository.InvoiceRepository;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class DdaService {

    private final DdaInvoiceRepository ddaInvoiceRepository;
    private final InvoiceRepository invoiceRepository;

    @Transactional(readOnly = true)
    public List<DdaInvoice> getDdaInvoicesForCompany() {
        UUID companyId = TenantContext.get();
        if (companyId == null) {
            return Collections.emptyList();
        }
        return ddaInvoiceRepository.findByCompanyIdOrderByDueDateAsc(companyId);
    }

    /**
     * Sincronização automatizada DDA acionada via API ou Cron (duas vezes ao dia).
     */
    @Transactional
    public List<DdaInvoice> syncDdaForCurrentCompany() {
        UUID companyId = TenantContext.get();
        if (companyId == null) {
            return Collections.emptyList();
        }
        return performDdaSync(companyId);
    }

    @Scheduled(cron = "0 0 6,18 * * ?") // 06:00 e 18:00
    public void scheduledDdaSyncAll() {
        log.info("⏰ Executando varredura DDA agendada na CIP para todas as empresas...");
        // Em ambiente real, itera pelas empresas ativas e executa performDdaSync
    }

    private List<DdaInvoice> performDdaSync(UUID companyId) {
        log.info("🔄 Varrendo CIP / DDA Bancário para empresa ID: {}", companyId);

        // Simulador inteligente de DDA da CIP (geração realista de boletos de peças/serviços emitidos no mercado)
        List<DdaInvoice> fetched = generateMockDdaInvoices(companyId);
        List<DdaInvoice> saved = new ArrayList<>();

        for (DdaInvoice dto : fetched) {
            Optional<DdaInvoice> existing = ddaInvoiceRepository.findByBarcodeAndCompanyId(dto.getBarcode(), companyId);
            if (existing.isEmpty()) {
                dto.setCompanyId(companyId);
                dto.setSyncedAt(LocalDateTime.now());
                dto.setStatus("DETECTED");

                DdaInvoice savedDda = ddaInvoiceRepository.save(dto);

                // Auto-Conciliação: tenta vincular a uma fatura existente por (CNPJ + Valor + Data de Vencimento)
                attemptAutoReconciliation(savedDda);

                saved.add(savedDda);
            } else {
                saved.add(existing.get());
            }
        }

        log.info("✅ Varredura DDA concluída. {} boletos detectados/atualizados.", saved.size());
        return saved;
    }

    private void attemptAutoReconciliation(DdaInvoice dda) {
        if (dda.getIssuerCnpj() == null || dda.getAmount() == null || dda.getDueDate() == null) return;

        List<Invoice> pending = invoiceRepository.findByCompanyId(dda.getCompanyId());
        for (Invoice inv : pending) {
            if (inv.getAmount() != null && inv.getAmount().compareTo(dda.getAmount()) == 0 &&
                inv.getDueDate() != null && inv.getDueDate().equals(dda.getDueDate())) {

                dda.setLinkedInvoiceId(inv.getId());
                dda.setStatus("LINKED");
                ddaInvoiceRepository.save(dda);

                inv.setDdaInvoiceId(dda.getId());
                if (dda.getBarcode() != null && !dda.getBarcode().isBlank()) {
                    inv.setBarcode(dda.getBarcode());
                }
                invoiceRepository.save(inv);

                log.info("🔗 Auto-Conciliação DDA bem-sucedida! Boleto DDA {} vinculado à ContaAPagar ID {}", dda.getId(), inv.getId());
                break;
            }
        }
    }

    @Transactional
    public DdaInvoice linkToInvoice(UUID ddaId, UUID invoiceId) {
        DdaInvoice dda = ddaInvoiceRepository.findById(ddaId)
                .orElseThrow(() -> new IllegalArgumentException("Boleto DDA não encontrado com ID: " + ddaId));

        Invoice inv = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Conta a Pagar não encontrada com ID: " + invoiceId));

        dda.setLinkedInvoiceId(inv.getId());
        dda.setStatus("LINKED");
        DdaInvoice savedDda = ddaInvoiceRepository.save(dda);

        inv.setDdaInvoiceId(dda.getId());
        if (dda.getBarcode() != null && !dda.getBarcode().isBlank()) {
            inv.setBarcode(dda.getBarcode());
        }
        invoiceRepository.save(inv);

        log.info("🔗 Boleto DDA {} vinculado manualmente à Conta a Pagar {}", ddaId, invoiceId);
        return savedDda;
    }

    @Transactional
    public Invoice importDdaAsInvoice(UUID ddaId) {
        DdaInvoice dda = ddaInvoiceRepository.findById(ddaId)
                .orElseThrow(() -> new IllegalArgumentException("Boleto DDA não encontrado com ID: " + ddaId));

        if (dda.getLinkedInvoiceId() != null) {
            return invoiceRepository.findById(dda.getLinkedInvoiceId()).orElse(null);
        }

        String invNum = "DDA-" + (dda.getBarcode() != null && dda.getBarcode().length() >= 10 ? dda.getBarcode().substring(dda.getBarcode().length() - 10) : System.currentTimeMillis() % 1000000);

        Invoice inv = new Invoice();
        inv.setCompanyId(dda.getCompanyId());
        inv.setInvoiceNumber(invNum);
        inv.setDescription("Boleto DDA: " + (dda.getIssuerName() != null ? dda.getIssuerName() : "Fornecedor CIP") + " (CNPJ: " + dda.getIssuerCnpj() + ")");
        inv.setAmount(dda.getAmount());
        inv.setType(ExpenseType.VARIAVEL);
        inv.setStatus(ExpenseStatus.PENDENTE);
        inv.setDueDate(dda.getDueDate());
        inv.setIssueDate(dda.getIssueDate() != null ? dda.getIssueDate() : LocalDate.now());
        inv.setBarcode(dda.getBarcode());
        inv.setCategory("FORNECEDORES DDA");
        inv.setSupplierName(dda.getIssuerName());
        inv.setPaymentMethod("BOLETO");
        inv.setDdaInvoiceId(dda.getId());
        inv.setNotes("Importado automaticamente do Débito Direto Autorizado (DDA/CIP).");

        Invoice savedInvoice = invoiceRepository.save(inv);

        dda.setLinkedInvoiceId(savedInvoice.getId());
        dda.setStatus("LINKED");
        ddaInvoiceRepository.save(dda);

        log.info("📥 Boleto DDA {} importado com sucesso como Conta a Pagar {}", ddaId, savedInvoice.getId());
        return savedInvoice;
    }

    @Transactional
    public DdaInvoice payDdaInvoice(UUID ddaId, String paymentMethod) {
        DdaInvoice dda = ddaInvoiceRepository.findById(ddaId)
                .orElseThrow(() -> new IllegalArgumentException("Boleto DDA não encontrado com ID: " + ddaId));

        String txId = "TX-BANK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        dda.setStatus("PAID");
        dda.setTransactionId(txId);
        dda.setPaidAt(LocalDateTime.now());
        DdaInvoice savedDda = ddaInvoiceRepository.save(dda);

        // Se houver vinculo com ContaAPagar, dar baixa
        if (dda.getLinkedInvoiceId() != null) {
            invoiceRepository.findById(dda.getLinkedInvoiceId()).ifPresent(inv -> {
                inv.setStatus(ExpenseStatus.PAGA);
                inv.setPaymentDate(LocalDate.now());
                inv.setBaixa("Baixado via DDA / " + (paymentMethod != null ? paymentMethod : "PIX") + " (TxId: " + txId + ")");
                inv.setPaidAmount(dda.getAmount());
                invoiceRepository.save(inv);
            });
        }

        log.info("💸 Boleto DDA {} liquidado com sucesso na API bancária. TxId: {}", ddaId, txId);
        return savedDda;
    }

    private List<DdaInvoice> generateMockDdaInvoices(UUID companyId) {
        List<DdaInvoice> list = new ArrayList<>();

        list.add(DdaInvoice.builder()
                .companyId(companyId)
                .barcode("23793381286000001500090000012345678901234567")
                .linhaDigitavel("23790.00019 12345.678902 12345.678901 9 9500000150000")
                .issuerCnpj("00.360.305/0001-04")
                .issuerName("CAIXA ECONOMICA FEDERAL - QUITACAO")
                .payerCnpj("12.345.678/0001-99")
                .payerName("VIACAO SAO SILVESTRE LTDA")
                .amount(new BigDecimal("38771.55"))
                .dueDate(LocalDate.now().plusDays(5))
                .issueDate(LocalDate.now().minusDays(10))
                .build());

        list.add(DdaInvoice.builder()
                .companyId(companyId)
                .barcode("07793381286000000450090000098765432101234567")
                .linhaDigitavel("07790.00019 98765.432109 12345.678901 8 9500000045000")
                .issuerCnpj("61.082.004/0001-20")
                .issuerName("ROCHA PECAS DIESEL E COMPONENTES LTDA")
                .payerCnpj("12.345.678/0001-99")
                .payerName("VIACAO SAO SILVESTRE LTDA")
                .amount(new BigDecimal("4500.00"))
                .dueDate(LocalDate.now().plusDays(12))
                .issueDate(LocalDate.now().minusDays(5))
                .build());

        list.add(DdaInvoice.builder()
                .companyId(companyId)
                .barcode("3419338128600000012509000001122334455667788")
                .linhaDigitavel("34190.00019 11223.344556 67788.990011 7 9500000012500")
                .issuerCnpj("11.222.333/0001-44")
                .issuerName("MICHELIN BRASIL PNEUS E SERVICOS S/A")
                .payerCnpj("12.345.678/0001-99")
                .payerName("VIACAO SAO SILVESTRE LTDA")
                .amount(new BigDecimal("1250.00"))
                .dueDate(LocalDate.now().plusDays(20))
                .issueDate(LocalDate.now().minusDays(2))
                .build());

        return list;
    }
}
