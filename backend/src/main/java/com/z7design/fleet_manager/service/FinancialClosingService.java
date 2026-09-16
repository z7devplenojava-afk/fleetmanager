package com.z7design.fleet_manager.service;

import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.TextAlignment;
import com.z7design.fleet_manager.model.AccountsReceivable;
import com.z7design.fleet_manager.model.Contract;
import com.z7design.fleet_manager.model.ContractRetention;
import com.z7design.fleet_manager.model.MeasurementBulletin;
import com.z7design.fleet_manager.model.enums.RetentionStatus;
import com.z7design.fleet_manager.repository.AccountsReceivableRepository;
import com.z7design.fleet_manager.repository.ContractRepository;
import com.z7design.fleet_manager.repository.ContractRetentionRepository;
import com.z7design.fleet_manager.repository.MeasurementBulletinRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * MÓDULO 7 — RF-07.4: Emissão Fiscal e Controle de Caução.
 *
 * - Destaca e controla a Retenção de Caução Técnica (padrão 3%) em conta gráfica do contrato
 *   ao validar o Boletim de Medição (contra-duplicata por medição/mês).
 * - Registra o Boleto Bancário (prazo contratual 15–30 dias) no título a receber,
 *   com linha digitável/barcode e PDF para envio ao cliente.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FinancialClosingService {

    private static final BigDecimal DEFAULT_RETENTION_RATE = new BigDecimal("3.00");

    private final MeasurementBulletinRepository bulletinRepository;
    private final ContractRetentionRepository retentionRepository;
    private final ContractRepository contractRepository;
    private final AccountsReceivableRepository accountsReceivableRepository;

    private static final DateTimeFormatter BR_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // ════════════════════════════════ Caução ════════════════════════════════

    /**
     * Cria/atualiza a retenção de caução técnica do BM validado (idempotente por medição + mês).
     * Chamado automaticamente na validação do Boletim de Medição.
     */
    @Transactional
    public ContractRetention registerRetentionOnValidation(MeasurementBulletin bulletin) {
        if (bulletin == null || bulletin.getSubtotal() == null
                || bulletin.getSubtotal().signum() <= 0) {
            log.info("M7: BM {} sem subtotal — caução não registrada",
                    bulletin != null ? bulletin.getId() : null);
            return null;
        }

        BigDecimal measuredValue = bulletin.getSubtotal();
        String referenceMonth = bulletin.getPeriodStart() != null
                ? bulletin.getPeriodStart().format(DateTimeFormatter.ofPattern("yyyy-MM"))
                : LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));

        // Idempotência: não duplicar retenção para a mesma medição
        List<ContractRetention> existing = bulletin.getId() != null
                ? retentionRepository.findByMeasurementId(bulletin.getId())
                : List.of();
        ContractRetention retention = existing.stream().findFirst().orElseGet(ContractRetention::new);

        retention.setMeasurement(bulletin);
        retention.setClient(bulletin.getClient());
        retention.setContract(resolveContract(bulletin));
        retention.setUnit(bulletin.getUnit());
        retention.setReferenceMonth(referenceMonth);
        retention.setMeasuredValue(measuredValue);
        retention.setRetentionRate(retention.getRetentionRate() != null
                ? retention.getRetentionRate() : DEFAULT_RETENTION_RATE);
        retention.setRetentionValue(measuredValue
                .multiply(retention.getRetentionRate())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
        BigDecimal rmuDiscount = retention.getRmuDiscount() != null
                ? retention.getRmuDiscount() : BigDecimal.ZERO;
        retention.setNetInvoicedValue(measuredValue.subtract(rmuDiscount).subtract(retention.getRetentionValue()));
        if (retention.getStatus() == null || retention.getStatus() == RetentionStatus.LIBERADO
                || retention.getStatus() == RetentionStatus.CANCELADO) {
            retention.setStatus(RetentionStatus.RETIDO);
        }
        if (retention.getExpectedReleaseDate() == null) {
            // Liberação prevista: 60 dias após o fim do período de medição (padrão de mercado)
            LocalDate base = bulletin.getPeriodEnd() != null ? bulletin.getPeriodEnd() : LocalDate.now();
            retention.setExpectedReleaseDate(base.plusDays(60));
        }

        return retentionRepository.save(retention);
    }

    /**
     * Libera a caução (devolução ao contratado) com data efetiva.
     */
    @Transactional
    public ContractRetention releaseRetention(UUID retentionId, LocalDate actualReleaseDate) {
        ContractRetention retention = retentionRepository.findById(retentionId)
                .orElseThrow(() -> new IllegalArgumentException("Retenção não encontrada: " + retentionId));
        retention.setStatus(RetentionStatus.LIBERADO);
        retention.setActualReleaseDate(actualReleaseDate != null ? actualReleaseDate : LocalDate.now());
        return retentionRepository.save(retention);
    }

    /**
     * Conta gráfica de caução por contrato: acumulado retido, liberado e saldo.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getRetentionLedger(UUID contractId) {
        List<ContractRetention> retentions = retentionRepository.findByContractId(contractId);

        BigDecimal retained = retentions.stream()
                .filter(r -> r.getStatus() == RetentionStatus.RETIDO || r.getStatus() == RetentionStatus.FATURADO)
                .map(ContractRetention::getRetentionValue)
                .filter(v -> v != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal released = retentions.stream()
                .filter(r -> r.getStatus() == RetentionStatus.LIBERADO)
                .map(ContractRetention::getRetentionValue)
                .filter(v -> v != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> ledger = new HashMap<>();
        ledger.put("contractId", contractId);
        ledger.put("retentionRate", DEFAULT_RETENTION_RATE);
        ledger.put("retainedValue", retained);
        ledger.put("releasedValue", released);
        ledger.put("ledgerBalance", retained.subtract(released));
        ledger.put("movements", retentions.stream()
                .sorted(java.util.Comparator.comparing(
                        r -> r.getReferenceMonth() != null ? r.getReferenceMonth() : ""))
                .toList());
        return ledger;
    }

    // ════════════════════════════════ Boleto ════════════════════════════════

    /**
     * Registra o Boleto Bancário no título a receber da medição (RF-07.4).
     * Integração bancária real (CNAB/API) é plugável — aqui gera identificação
     * determinística e o PDF do boleto para envio.
     */
    @Transactional
    public AccountsReceivable registerBoleto(UUID receivableId, Integer contractualDays) {
        AccountsReceivable receivable = accountsReceivableRepository.findById(receivableId)
                .orElseThrow(() -> new IllegalArgumentException("Título não encontrado: " + receivableId));

        int prazoDias = contractualDays != null ? contractualDays : 30;
        LocalDate baseDate = receivable.getIssueDate() != null ? receivable.getIssueDate() : LocalDate.now();
        if (receivable.getDueDate() == null || receivable.getDueDate().isAfter(baseDate.plusDays(prazoDias))) {
            receivable.setDueDate(baseDate.plusDays(prazoDias));
        }

        // Identificação do boleto (registrado) — em produção, substituir pela resposta do banco
        String nossoNumero = "24" + String.format("%011d",
                Math.abs(receivable.getId().getMostSignificantBits()) % 100_000_000_000L);
        String barcode = "03399" + receivable.getAmount().movePointRight(2).setScale(0, RoundingMode.DOWN)
                + String.format("%010d", Math.abs(baseDate.toEpochDay()) % 100_000_000L)
                + nossoNumero;
        String digitable = formatDigitableLine(barcode);

        receivable.setBoletoBarCode(barcode);
        receivable.setBoletoDigitableLine(digitable);
        receivable.setBoletoGenerationDate(LocalDateTime.now());
        receivable.setBoletoUrl("/api/financial-closing/receivables/" + receivableId + "/boleto-pdf");

        receivable.setPaymentMethod(com.z7design.fleet_manager.model.enums.PaymentMethod.BOLETO);

        return accountsReceivableRepository.save(receivable);
    }

    /**
     * PDF do Boleto Bancário (ficha de compensação simplificada).
     */
    @Transactional(readOnly = true)
    public byte[] generateBoletoPdf(UUID receivableId) throws Exception {
        AccountsReceivable ar = accountsReceivableRepository.findById(receivableId)
                .orElseThrow(() -> new IllegalArgumentException("Título não encontrado: " + receivableId));

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(out);
        PdfDocument pdf = new PdfDocument(writer);
        Document doc = new Document(pdf);
        PdfFont bold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
        PdfFont normal = PdfFontFactory.createFont(StandardFonts.HELVETICA);

        doc.add(new Paragraph("BOLETO BANCÁRIO — FICHA DE COMPENSAÇÃO").setFont(bold).setFontSize(13)
                .setTextAlignment(TextAlignment.CENTER));
        doc.add(new Paragraph("Pagamento disponível até "
                + (ar.getDueDate() != null ? ar.getDueDate().format(BR_DATE) : "-")
                + " após a data de vencimento.").setFont(normal).setFontSize(9)
                .setTextAlignment(TextAlignment.CENTER));

        doc.add(new Paragraph("\n"));
        doc.add(new Paragraph("Linha digitável:").setFont(normal).setFontSize(9));
        doc.add(new Paragraph(ar.getBoletoDigitableLine() != null
                ? ar.getBoletoDigitableLine() : "(boleto não registrado)").setFont(bold).setFontSize(11));

        doc.add(new Paragraph("\n"));
        doc.add(new Paragraph("Beneficiário: PROMOVER VIGILÂNCIA PATRIMONIAL LTDA")
                .setFont(normal).setFontSize(9));
        doc.add(new Paragraph("Pagador: " + (ar.getClient() != null && ar.getClient().getName() != null
                ? ar.getClient().getName() : "-")).setFont(normal).setFontSize(9));
        doc.add(new Paragraph("Documento (NFe/Med): " + safe(ar.getInvoiceNumber())).setFont(normal).setFontSize(9));
        doc.add(new Paragraph("Vencimento: "
                + (ar.getDueDate() != null ? ar.getDueDate().format(BR_DATE) : "-")).setFont(normal).setFontSize(9));
        doc.add(new Paragraph("Valor: R$ " + (ar.getAmount() != null ? ar.getAmount() : BigDecimal.ZERO)
                .setScale(2, RoundingMode.HALF_UP)).setFont(bold).setFontSize(12));

        doc.add(new Paragraph("\n"));
        doc.add(new Paragraph("Código de barras: " + safe(ar.getBoletoBarCode())).setFont(normal).setFontSize(8));
        doc.add(new Paragraph("Nosso número: " + safe(ar.getBoletoBarCode() != null
                ? ar.getBoletoBarCode().substring(Math.min(ar.getBoletoBarCode().length(), 19))
                : "")).setFont(normal).setFontSize(8));
        doc.add(new Paragraph("Autenticação mecânica — emitido em "
                + LocalDate.now().format(BR_DATE)).setFont(normal).setFontSize(7)
                .setTextAlignment(TextAlignment.CENTER));

        doc.close();
        return out.toByteArray();
    }

    // ════════════════════════════════ Helpers ════════════════════════════════

    private Contract resolveContract(MeasurementBulletin bulletin) {
        if (bulletin.getContract() != null) {
            return bulletin.getContract();
        }
        if (bulletin.getContractNumber() != null) {
            Optional<Contract> byNumber = contractRepository
                    .findByContractNumber(bulletin.getContractNumber());
            if (byNumber.isPresent()) {
                return byNumber.get();
            }
        }
        return null;
    }

    private String formatDigitableLine(String barcode) {
        String digits = barcode.replaceAll("[^0-9]", "");
        if (digits.length() < 44) {
            digits = String.format("%-44s", digits).replace(' ', '0');
        }
        return digits.substring(0, 5) + "." + digits.substring(5, 10) + " "
                + digits.substring(10, 15) + "." + digits.substring(15, 21) + " "
                + digits.substring(21, 26) + "." + digits.substring(26, 32) + " "
                + digits.substring(32, 33) + " " + digits.substring(33, 44);
    }

    private String safe(String value) {
        return value != null ? value : "-";
    }
}
