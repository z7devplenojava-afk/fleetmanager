package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.ExpensePdfImportResultDTO;
import com.z7design.fleet_manager.dto.InvoiceDTO;
import com.z7design.fleet_manager.model.Invoice;
import com.z7design.fleet_manager.model.Supplier;
import com.z7design.fleet_manager.model.Unit;
import com.z7design.fleet_manager.model.enums.ExpenseStatus;
import com.z7design.fleet_manager.model.enums.ExpenseType;
import com.z7design.fleet_manager.repository.InvoiceRepository;
import com.z7design.fleet_manager.repository.SupplierRepository;
import com.z7design.fleet_manager.repository.UnitRepository;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpensePdfImportService {

    private final InvoiceRepository invoiceRepository;
    private final SupplierRepository supplierRepository;
    private final UnitRepository unitRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // Padrão que identifica o miolo de uma linha de despesa SIGLO:
    // [Despesa: 4 a 8 dígitos] [Seq: 1 a 3 dígitos] [Data Emissão: dd/MM/yyyy] [Data Vencimento: dd/MM/yyyy]
    private static final Pattern EXPENSE_CORE_PATTERN = Pattern.compile(
            "\\b(\\d{4,8})\\s+(\\d{1,3})\\s+(\\d{2}/\\d{2}/\\d{4})\\s+(\\d{2}/\\d{2}/\\d{4})(.*)$"
    );

    // Padrão de datas brasileiras
    private static final Pattern DATE_PATTERN = Pattern.compile("\\b(\\d{2}/\\d{2}/\\d{4})\\b");

    // Padrão de valores monetários (ex: 7.218,38 ou 225,00 ou 0,00 ou -10,00)
    private static final Pattern MONEY_PATTERN = Pattern.compile("-?\\d{1,3}(?:\\.\\d{3})*,\\d{2}");

    // Padrão do código do fornecedor no final da razão social/fantasia, ex: (812) ou (1709)
    private static final Pattern SUPPLIER_CODE_PATTERN = Pattern.compile("^(.*?)\\s*\\((\\d+)\\)\\s*$");

    // Padrão de Conta Corrente
    private static final Pattern CONTA_CORRENTE_PATTERN = Pattern.compile("Conta\\s+Corrente\\s*:\\s*([^\\n\\r]+)", Pattern.CASE_INSENSITIVE);

    @Transactional
    public ExpensePdfImportResultDTO importPdf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("O arquivo PDF de despesas está vazio ou não foi fornecido.");
        }

        try (InputStream is = file.getInputStream()) {
            return processPdfStream(is);
        } catch (Exception e) {
            log.error("Erro ao importar PDF de despesas: {}", e.getMessage(), e);
            ExpensePdfImportResultDTO res = ExpensePdfImportResultDTO.empty();
            res.getErrors().add("Erro ao processar arquivo PDF: " + e.getMessage());
            return res;
        }
    }

    public ExpensePdfImportResultDTO processPdfStream(InputStream is) throws Exception {
        ExpensePdfImportResultDTO result = ExpensePdfImportResultDTO.empty();

        try (PDDocument document = PDDocument.load(is)) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            String fullText = stripper.getText(document);

            if (fullText == null || fullText.trim().isEmpty()) {
                result.getErrors().add("Não foi possível extrair nenhum texto do PDF. O documento pode ser uma imagem escaneada.");
                return result;
            }

            List<RawExpenseBlock> rawBlocks = parseTextIntoBlocks(fullText);
            log.info("Total de blocos de despesas extraídos do PDF: {}", rawBlocks.size());
            result.setTotalRead(rawBlocks.size());

            Unit fallbackUnit = resolveFallbackUnit();
            UUID tenantCompanyId = TenantContext.get();

            for (RawExpenseBlock block : rawBlocks) {
                try {
                    InvoiceDTO savedDto = saveOrUpdateInvoice(block, fallbackUnit, tenantCompanyId, result);
                    if (savedDto != null) {
                        result.getItems().add(savedDto);
                    }
                } catch (Exception ex) {
                    log.error("Erro ao salvar despesa {}: {}", block.expenseNumber, ex.getMessage(), ex);
                    result.getErrors().add("Despesa " + block.expenseNumber + " (" + block.supplierName + "): " + ex.getMessage());
                }
            }
        }

        return result;
    }

    private static class RawExpenseBlock {
        String supplierRaw;
        String supplierName;
        String supplierCode;
        String documentNumber;
        String expenseNumber;
        Integer installmentSeq = 1;
        LocalDate issueDate;
        LocalDate dueDate;
        LocalDate paymentDate;
        Boolean isCanceled = false;
        BigDecimal amount = BigDecimal.ZERO;
        BigDecimal interestAmount = BigDecimal.ZERO;
        BigDecimal fineAmount = BigDecimal.ZERO;
        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal adjustmentAmount = BigDecimal.ZERO;
        BigDecimal paidAmount = BigDecimal.ZERO;
        BigDecimal balanceAmount = BigDecimal.ZERO;
        String bankAccountInfo;
        StringBuilder notesBuilder = new StringBuilder();
    }

    private List<RawExpenseBlock> parseTextIntoBlocks(String text) {
        List<RawExpenseBlock> blocks = new ArrayList<>();
        String[] lines = text.split("\\r?\\n");

        RawExpenseBlock currentBlock = null;

        for (String rawLine : lines) {
            String line = rawLine.trim();
            if (line.isEmpty()) continue;

            // Ignorar cabeçalhos e rodapés comuns do SIGLO
            if (line.contains("Fornecedor(es)") && line.contains("Documento") && line.contains("Despesa")) {
                continue;
            }
            if (line.startsWith("Impresso por :") || line.contains("SIGLO - Sistema Integrado de Gestao")) {
                continue;
            }

            Matcher coreMatcher = EXPENSE_CORE_PATTERN.matcher(line);
            if (coreMatcher.find()) {
                // Se já tínhamos um bloco anterior, adiciona à lista
                if (currentBlock != null) {
                    blocks.add(currentBlock);
                }

                currentBlock = new RawExpenseBlock();

                // Lado esquerdo: Fornecedor e Documento
                String leftPart = line.substring(0, coreMatcher.start()).trim();
                extractSupplierAndDocument(leftPart, currentBlock);

                // Miolo
                currentBlock.expenseNumber = coreMatcher.group(1).trim();
                try {
                    currentBlock.installmentSeq = Integer.parseInt(coreMatcher.group(2).trim());
                } catch (NumberFormatException e) {
                    currentBlock.installmentSeq = 1;
                }

                currentBlock.issueDate = parseDate(coreMatcher.group(3));
                currentBlock.dueDate = parseDate(coreMatcher.group(4));

                // Resto da linha: datas adicionais (pagamento/cancelamento) e valores monetários
                String remainingPart = coreMatcher.group(5).trim();
                parseRemainingLineData(remainingPart, currentBlock);

            } else if (currentBlock != null) {
                // Linha subsequente: pode conter Observações/Histórico e Conta Corrente
                Matcher ccMatcher = CONTA_CORRENTE_PATTERN.matcher(line);
                if (ccMatcher.find()) {
                    currentBlock.bankAccountInfo = ccMatcher.group(1).trim();
                    // O restante da linha antes de "Conta Corrente :" pode ser texto de observação
                    String beforeCc = line.substring(0, ccMatcher.start()).trim();
                    if (!beforeCc.isEmpty()) {
                        if (currentBlock.notesBuilder.length() > 0) currentBlock.notesBuilder.append(" ");
                        currentBlock.notesBuilder.append(beforeCc);
                    }
                } else {
                    if (currentBlock.notesBuilder.length() > 0) currentBlock.notesBuilder.append(" ");
                    currentBlock.notesBuilder.append(line);
                }
            }
        }

        if (currentBlock != null) {
            blocks.add(currentBlock);
        }

        return blocks;
    }

    private void extractSupplierAndDocument(String leftPart, RawExpenseBlock block) {
        if (leftPart == null || leftPart.trim().isEmpty()) {
            block.supplierName = "FORNECEDOR NÃO INFORMADO";
            block.documentNumber = "S/N";
            return;
        }

        // Exemplo: "FABIANO ALEX BARBOSA (FABIANO CHAVEIRO E PAPELARIA) (812) FATURA 01/2026"
        // Procuramos o último padrão "(\d+)"
        int lastCodeIndex = -1;
        int lastCodeEnd = -1;
        String codeFound = null;

        Pattern codePattern = Pattern.compile("\\((\\d+)\\)");
        Matcher codeMatcher = codePattern.matcher(leftPart);
        while (codeMatcher.find()) {
            lastCodeIndex = codeMatcher.start();
            lastCodeEnd = codeMatcher.end();
            codeFound = codeMatcher.group(1);
        }

        if (lastCodeIndex != -1) {
            // Tudo até o fim de "(codigo)" é o fornecedor
            String supplierFull = leftPart.substring(0, lastCodeEnd).trim();
            block.supplierRaw = supplierFull;
            block.supplierCode = codeFound;

            // Nome do fornecedor sem o código final entre parênteses
            String cleanName = leftPart.substring(0, lastCodeIndex).trim();
            block.supplierName = cleanName.isEmpty() ? supplierFull : cleanName;

            // Tudo após "(codigo)" é o número do documento
            String doc = leftPart.substring(lastCodeEnd).trim();
            block.documentNumber = doc.isEmpty() ? "FATURA " + block.supplierCode : doc;
        } else {
            // Caso sem código numérico entre parênteses
            block.supplierRaw = leftPart;
            block.supplierName = leftPart;
            block.documentNumber = "S/N";
        }
    }

    private void parseRemainingLineData(String remaining, RawExpenseBlock block) {
        if (remaining == null || remaining.trim().isEmpty()) return;

        // Extrai todas as datas adicionais
        List<LocalDate> additionalDates = new ArrayList<>();
        Matcher dateMatcher = DATE_PATTERN.matcher(remaining);
        while (dateMatcher.find()) {
            LocalDate d = parseDate(dateMatcher.group(1));
            if (d != null) {
                additionalDates.add(d);
            }
        }

        if (!additionalDates.isEmpty()) {
            // A primeira data adicional no fluxo SIGLO é a data de Pagamento
            block.paymentDate = additionalDates.get(0);
        }

        // Extrai todos os valores monetários
        List<BigDecimal> amounts = new ArrayList<>();
        Matcher moneyMatcher = MONEY_PATTERN.matcher(remaining);
        while (moneyMatcher.find()) {
            amounts.add(parseCurrency(moneyMatcher.group()));
        }

        // Colunas no SIGLO: Valor, Juros, Multa, Desconto, Ajustes, Pagou, Saldo (7 colunas)
        int size = amounts.size();
        if (size >= 1) block.amount = amounts.get(0);
        if (size >= 2) block.interestAmount = amounts.get(1);
        if (size >= 3) block.fineAmount = amounts.get(2);
        if (size >= 4) block.discountAmount = amounts.get(3);
        if (size >= 5) block.adjustmentAmount = amounts.get(4);
        if (size >= 6) block.paidAmount = amounts.get(5);
        if (size >= 7) block.balanceAmount = amounts.get(6);

        // Se tiver flag ou palavra "cancelada"
        if (remaining.toLowerCase().contains("cancel")) {
            block.isCanceled = true;
        }
    }

    private InvoiceDTO saveOrUpdateInvoice(RawExpenseBlock block, Unit fallbackUnit, UUID tenantCompanyId, ExpensePdfImportResultDTO result) {
        // 1. Obter ou criar fornecedor
        Supplier supplier = resolveOrCreateSupplier(block.supplierName, block.supplierCode, tenantCompanyId);

        // 2. Localizar fatura existente por expenseNumber e installmentSeq
        Optional<Invoice> existingOpt = Optional.empty();
        if (block.expenseNumber != null && !block.expenseNumber.trim().isEmpty()) {
            existingOpt = invoiceRepository.findByExpenseNumberAndInstallmentSeq(block.expenseNumber, block.installmentSeq);
        }

        boolean isUpdate = existingOpt.isPresent();
        Invoice invoice = existingOpt.orElseGet(Invoice::new);

        // Se nova, definir invoiceNumber único
        if (!isUpdate) {
            String docBase = (block.documentNumber != null && !block.documentNumber.trim().isEmpty())
                    ? block.documentNumber.trim()
                    : "DESP-" + block.expenseNumber;

            String proposedInvoiceNumber = (block.installmentSeq != null && block.installmentSeq > 1)
                    ? docBase + "-" + block.installmentSeq
                    : docBase;

            // Se já existir fatura com esse número, adicionar sufixo para garantir unicidade
            Optional<Invoice> collision = invoiceRepository.findFirstByInvoiceNumber(proposedInvoiceNumber);
            if (collision.isPresent()) {
                proposedInvoiceNumber = proposedInvoiceNumber + "-DESP" + block.expenseNumber;
            }

            invoice.setInvoiceNumber(proposedInvoiceNumber);
            if (tenantCompanyId != null) {
                invoice.setCompanyId(tenantCompanyId);
            }
            invoice.setUnit(fallbackUnit);
            invoice.setType(ExpenseType.VARIAVEL);
        }

        // Preencher dados comuns
        invoice.setExpenseNumber(block.expenseNumber);
        invoice.setInstallmentSeq(block.installmentSeq);
        invoice.setSupplier(supplier);
        invoice.setSupplierCode(block.supplierCode);
        invoice.setSupplierName(supplier != null ? supplier.getName() : block.supplierName);

        invoice.setAmount(block.amount != null ? block.amount : BigDecimal.ZERO);
        invoice.setInterestAmount(block.interestAmount != null ? block.interestAmount : BigDecimal.ZERO);
        invoice.setFineAmount(block.fineAmount != null ? block.fineAmount : BigDecimal.ZERO);
        invoice.setDiscountAmount(block.discountAmount != null ? block.discountAmount : BigDecimal.ZERO);
        invoice.setAdjustmentAmount(block.adjustmentAmount != null ? block.adjustmentAmount : BigDecimal.ZERO);
        invoice.setPaidAmount(block.paidAmount != null ? block.paidAmount : BigDecimal.ZERO);
        invoice.setBalanceAmount(block.balanceAmount != null ? block.balanceAmount : BigDecimal.ZERO);

        invoice.setIssueDate(block.issueDate != null ? block.issueDate : LocalDate.now());
        invoice.setDueDate(block.dueDate != null ? block.dueDate : LocalDate.now());
        invoice.setPaymentDate(block.paymentDate);
        invoice.setIsCanceled(block.isCanceled != null && block.isCanceled);

        if (block.bankAccountInfo != null && !block.bankAccountInfo.trim().isEmpty()) {
            invoice.setBankAccountInfo(block.bankAccountInfo.trim());
        }

        String notes = block.notesBuilder.toString().trim();
        if (!notes.isEmpty()) {
            invoice.setNotes(notes);
            if (invoice.getDescription() == null || invoice.getDescription().trim().isEmpty()) {
                invoice.setDescription(notes.length() > 500 ? notes.substring(0, 500) : notes);
            }
        }

        if (invoice.getDescription() == null || invoice.getDescription().trim().isEmpty()) {
            String desc = (block.documentNumber != null ? block.documentNumber : "Despesa " + block.expenseNumber)
                    + " - " + block.supplierName;
            invoice.setDescription(desc.length() > 500 ? desc.substring(0, 500) : desc);
        }

        // Definir categoria padrão se vazia
        if (invoice.getCategory() == null || invoice.getCategory().trim().isEmpty()) {
            invoice.setCategory("DESPESAS OPERACIONAIS");
        }

        // Definir status apropriado
        if (Boolean.TRUE.equals(invoice.getIsCanceled())) {
            invoice.setStatus(ExpenseStatus.CANCELADA);
        } else if (invoice.getBalanceAmount() != null
                && invoice.getBalanceAmount().compareTo(BigDecimal.ZERO) == 0
                && invoice.getPaidAmount() != null
                && invoice.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            invoice.setStatus(ExpenseStatus.PAGA);
        } else {
            invoice.setStatus(ExpenseStatus.PENDENTE);
        }

        Invoice saved = invoiceRepository.save(invoice);

        if (isUpdate) {
            result.setUpdated(result.getUpdated() + 1);
        } else {
            result.setCreated(result.getCreated() + 1);
        }

        return InvoiceDTO.fromEntity(saved);
    }

    private Supplier resolveOrCreateSupplier(String name, String code, UUID tenantCompanyId) {
        if (name == null || name.trim().isEmpty()) {
            name = "FORNECEDOR DIVERSOS";
        }
        String searchName = name.trim();

        // 1. Tentar encontrar por nome exato
        Optional<Supplier> found = supplierRepository.findFirstByNameIgnoreCase(searchName);
        if (found.isPresent()) {
            return found.get();
        }

        // 2. Tentar encontrar por nome contendo
        List<Supplier> byPartialName = supplierRepository.findByNameContainingIgnoreCase(searchName);
        if (!byPartialName.isEmpty()) {
            return byPartialName.get(0);
        }

        // 3. Criar novo fornecedor ativo
        try {
            Supplier newSupplier = new Supplier();
            newSupplier.setName(searchName.length() > 255 ? searchName.substring(0, 255) : searchName);
            if (code != null && !code.trim().isEmpty()) {
                newSupplier.setRegistrationNumber(code.trim());
            }
            newSupplier.setIsActive(true);
            if (tenantCompanyId != null) {
                newSupplier.setCompanyId(tenantCompanyId);
            }
            return supplierRepository.save(newSupplier);
        } catch (Exception e) {
            log.warn("Não foi possível salvar fornecedor '{}': {}", searchName, e.getMessage());
            return null;
        }
    }

    private Unit resolveFallbackUnit() {
        try {
            return unitRepository.findAll(PageRequest.of(0, 1))
                    .stream()
                    .findFirst()
                    .orElseGet(() -> {
                        Unit unit = new Unit();
                        unit.setName("Matriz Principal");
                        unit.setAddress("Endereço Principal");
                        return unitRepository.save(unit);
                    });
        } catch (Exception e) {
            log.warn("Erro ao buscar unidade padrão: {}", e.getMessage());
            Unit unit = new Unit();
            unit.setName("Matriz Principal");
            unit.setAddress("Endereço Principal");
            return unitRepository.save(unit);
        }
    }

    private BigDecimal parseCurrency(String text) {
        if (text == null || text.trim().isEmpty() || "-".equals(text.trim())) {
            return BigDecimal.ZERO;
        }
        try {
            String clean = text.trim().replace(".", "").replace(",", ".");
            return new BigDecimal(clean);
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    private LocalDate parseDate(String text) {
        if (text == null || text.trim().isEmpty()) {
            return null;
        }
        try {
            return LocalDate.parse(text.trim(), DATE_FORMATTER);
        } catch (Exception e) {
            return null;
        }
    }
}
