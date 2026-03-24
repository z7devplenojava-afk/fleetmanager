package com.z7design.fleet_manager.worker;

import com.z7design.fleet_manager.model.Payslip;
import com.z7design.fleet_manager.model.PaymentReceipt;
import com.z7design.fleet_manager.model.UnifiedDocument;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.repository.PayslipRepository;
import com.z7design.fleet_manager.repository.PaymentReceiptRepository;
import com.z7design.fleet_manager.repository.UnifiedDocumentRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.service.UnifiedDocumentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.text.similarity.JaroWinklerSimilarity;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Worker responsÃ¡vel por fazer matching e unificaÃ§Ã£o de holerites e
 * comprovantes
 * jÃ¡ processados e salvos nas tabelas payslips e payment_receipts.
 * 
 * Este worker roda periodicamente e faz matching entre documentos jÃ¡
 * processados.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UnificationWorker {

    private final PayslipRepository payslipRepository;
    private final PaymentReceiptRepository paymentReceiptRepository;
    private final UnifiedDocumentRepository unifiedDocumentRepository;
    private final UnifiedDocumentService unifiedDocumentService;
    private final EmployeeRepository employeeRepository;
    private final ApplicationContext applicationContext;
    private final JaroWinklerSimilarity jaroWinkler = new JaroWinklerSimilarity();

    private static final double SIMILARITY_THRESHOLD = 0.85;

    /**
     * Processa unificaÃ§Ã£o periodicamente (a cada 5 minutos)
     * Busca holerites e comprovantes nÃ£o unificados e tenta fazer matching
     */
    @Scheduled(fixedDelay = 300000) // 5 minutos
    public void processUnification() {
        try {
            // Verificar se o contexto da aplicaÃ§Ã£o ainda estÃ¡ ativo
            if (!isApplicationContextActive()) {
                log.warn(
                        "âš ï¸ UnificationWorker: Contexto da aplicaÃ§Ã£o nÃ£o estÃ¡ mais ativo. Pulando execuÃ§Ã£o.");
                return;
            }

            log.info("ðŸ”„ UnificationWorker: Iniciando processo de unificaÃ§Ã£o...");

            // Buscar holerites que ainda nÃ£o foram unificados (em transaÃ§Ã£o separada)
            List<Payslip> ununifiedPayslips = findUnunifiedPayslips();

            log.info("ðŸ“Š UnificationWorker: Encontrados {} holerites nÃ£o unificados", ununifiedPayslips.size());

            int matchedCount = 0;
            for (Payslip payslip : ununifiedPayslips) {
                // Verificar novamente se o contexto ainda estÃ¡ ativo antes de processar cada
                // item
                if (!isApplicationContextActive()) {
                    log.warn(
                            "âš ï¸ UnificationWorker: Contexto da aplicaÃ§Ã£o foi fechado durante o processamento. Interrompendo.");
                    break;
                }

                try {
                    Optional<PaymentReceipt> match = findMatchingReceipt(payslip);
                    if (match.isPresent()) {
                        // Processar cada unificaÃ§Ã£o em transaÃ§Ã£o separada para evitar problemas de
                        // conexÃ£o
                        processUnificationInTransaction(payslip, match.get());
                        matchedCount++;
                    }
                } catch (org.springframework.context.ApplicationContextException e) {
                    log.warn("âš ï¸ Contexto da aplicaÃ§Ã£o fechado durante processamento. Interrompendo.");
                    break;
                } catch (org.springframework.dao.DataAccessResourceFailureException e) {
                    log.warn("âš ï¸ Erro de acesso ao banco de dados (possivelmente contexto fechado): {}",
                            e.getMessage());
                    break;
                } catch (org.springframework.dao.DataAccessException e) {
                    if (e.getMessage() != null
                            && (e.getMessage().contains("closed") || e.getMessage().contains("Connection"))) {
                        log.warn("âš ï¸ ConexÃ£o com banco de dados foi fechada. Interrompendo processamento.");
                        break;
                    }
                    log.error("âŒ Erro de banco de dados ao processar unificaÃ§Ã£o para payslip {}", payslip.getId(),
                            e);
                } catch (IllegalStateException e) {
                    if (e.getMessage() != null && e.getMessage().contains("closed")) {
                        log.warn("âš ï¸ Contexto da aplicaÃ§Ã£o foi fechado. Interrompendo processamento.");
                        break;
                    }
                    log.error("âŒ Erro ao processar unificaÃ§Ã£o para payslip {}", payslip.getId(), e);
                } catch (Exception e) {
                    log.error("âŒ Erro ao processar unificaÃ§Ã£o para payslip {}", payslip.getId(), e);
                }
            }

            log.info("âœ… UnificationWorker: Processamento concluÃ­do - {} documentos unificados", matchedCount);
        } catch (org.springframework.context.ApplicationContextException e) {
            log.warn(
                    "âš ï¸ UnificationWorker: Contexto da aplicaÃ§Ã£o nÃ£o estÃ¡ mais disponÃ­vel. Pulando execuÃ§Ã£o.");
        } catch (IllegalStateException e) {
            if (e.getMessage() != null && e.getMessage().contains("closed")) {
                log.warn("âš ï¸ UnificationWorker: Contexto da aplicaÃ§Ã£o foi fechado. Pulando execuÃ§Ã£o.");
            } else {
                log.error("âŒ Erro no UnificationWorker", e);
            }
        } catch (org.springframework.dao.DataAccessResourceFailureException e) {
            log.warn("âš ï¸ UnificationWorker: Erro de acesso ao banco de dados (possivelmente contexto fechado): {}",
                    e.getMessage());
        } catch (org.springframework.dao.DataAccessException e) {
            if (e.getMessage() != null
                    && (e.getMessage().contains("closed") || e.getMessage().contains("Connection"))) {
                log.warn("âš ï¸ UnificationWorker: ConexÃ£o com banco de dados foi fechada. Pulando execuÃ§Ã£o.");
            } else {
                log.error("âŒ Erro de banco de dados no UnificationWorker", e);
            }
        } catch (Exception e) {
            log.error("âŒ Erro no UnificationWorker", e);
        }
    }

    /**
     * Busca holerites nÃ£o unificados em transaÃ§Ã£o separada
     */
    @Transactional(readOnly = true, timeout = 30)
    private List<Payslip> findUnunifiedPayslips() {
        return payslipRepository.findAll().stream()
                .filter(p -> {
                    try {
                        return !isUnified(p);
                    } catch (Exception e) {
                        // Se houver erro ao verificar (ex: contexto fechado), considerar como nÃ£o
                        // unificado
                        log.warn("âš ï¸ Erro ao verificar se payslip {} estÃ¡ unificado: {}", p.getId(),
                                e.getMessage());
                        return false;
                    }
                })
                .toList();
    }

    /**
     * Processa uma unificaÃ§Ã£o em transaÃ§Ã£o separada para evitar problemas de
     * conexÃ£o
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW, timeout = 60)
    private void processUnificationInTransaction(Payslip payslip, PaymentReceipt receipt) {
        createUnifiedDocument(payslip, receipt);
    }

    /**
     * Verifica se o contexto da aplicaÃ§Ã£o ainda estÃ¡ ativo
     */
    private boolean isApplicationContextActive() {
        try {
            if (applicationContext == null) {
                return false;
            }
            // Tentar obter um bean simples para verificar se o contexto estÃ¡ ativo
            // Se o contexto foi fechado, isso lanÃ§arÃ¡ IllegalStateException
            applicationContext.getBean(PayslipRepository.class);
            return true;
        } catch (IllegalStateException e) {
            // Contexto foi fechado
            return false;
        } catch (Exception e) {
            // Qualquer outro erro, assumir que nÃ£o estÃ¡ ativo
            log.debug("Erro ao verificar contexto: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Verifica se um payslip jÃ¡ foi unificado
     */
    private boolean isUnified(Payslip payslip) {
        try {
            // Pode haver mÃºltiplos documentos unificados para o mesmo payslip (ex:
            // unificaÃ§Ãµes individuais e em lote)
            // Verificar se existe pelo menos um
            List<UnifiedDocument> unifiedDocs = unifiedDocumentRepository.findAllByPayslipId(payslip.getId());
            return unifiedDocs != null && !unifiedDocs.isEmpty();
        } catch (Exception e) {
            log.warn("âš ï¸ Erro ao verificar se payslip {} estÃ¡ unificado: {}", payslip.getId(), e.getMessage());
            return false;
        }
    }

    /**
     * Encontra um comprovante que corresponde ao holerite
     * REGRA DE NEGÃ“CIO: Comparar Nome, Valor LÃ­quido e Conta Corrente (quando
     * disponÃ­vel)
     */
    private Optional<PaymentReceipt> findMatchingReceipt(Payslip payslip) {
        log.info("ðŸ” Buscando comprovante correspondente para holerite: {} - {}/{}",
                payslip.getEmployeeName(), payslip.getMonth(), payslip.getYear());

        // Buscar comprovantes do mesmo perÃ­odo (mÃªs seguinte ou mesmo mÃªs)
        int receiptMonthNext = payslip.getMonth() == 12 ? 1 : payslip.getMonth() + 1;
        int receiptYearNext = payslip.getMonth() == 12 ? payslip.getYear() + 1 : payslip.getYear();

        List<PaymentReceipt> candidates = new java.util.ArrayList<>();
        candidates.addAll(paymentReceiptRepository.findByYearAndMonth(receiptYearNext, receiptMonthNext));
        candidates.addAll(paymentReceiptRepository.findByYearAndMonth(payslip.getYear(), payslip.getMonth()));

        log.info("ðŸ“Š Candidatos encontrados: {} comprovante(s) para perÃ­odo {}/{} ou {}/{}",
                candidates.size(), receiptMonthNext, receiptYearNext, payslip.getMonth(), payslip.getYear());

        // Buscar funcionÃ¡rio na tabela employees para obter dados adicionais (CPF,
        // conta corrente)
        Employee employee = null;
        if (payslip.getEmployeeName() != null || payslip.getCpf() != null) {
            employee = findEmployeeForPayslip(payslip);
            if (employee != null) {
                log.info("âœ… FuncionÃ¡rio encontrado na tabela employees: {} (ID: {}, CPF: {}, Conta: {})",
                        employee.getName(), employee.getId(),
                        employee.getDocument() != null ? employee.getDocument() : "N/A",
                        employee.getContaCorrente() != null ? employee.getContaCorrente() : "N/A");
            }
        }

        for (PaymentReceipt receipt : candidates) {
            // Verificar se jÃ¡ foi unificado (pode haver mÃºltiplos documentos unificados
            // para o mesmo receipt)
            try {
                List<UnifiedDocument> existingUnified = unifiedDocumentRepository.findAllByReceiptId(receipt.getId());
                if (existingUnified != null && !existingUnified.isEmpty()) {
                    continue;
                }
            } catch (Exception e) {
                log.warn("âš ï¸ Erro ao verificar se receipt {} estÃ¡ unificado: {}", receipt.getId(), e.getMessage());
            }

            // REGRA DE NEGÃ“CIO: Verificar matching usando mÃºltiplos critÃ©rios
            boolean nameMatches = false;
            boolean valueMatches = false;
            boolean accountMatches = false; // Conta corrente (comentado para uso futuro)

            // 1. VERIFICAR NOME
            if (payslip.getEmployeeName() != null && receipt.getEmployeeName() != null) {
                String payslipName = normalizeName(payslip.getEmployeeName());
                String receiptName = normalizeName(receipt.getEmployeeName());

                // Usar tambÃ©m o nome da conta creditada se disponÃ­vel
                String receiptCreditedName = receipt.getCreditedName() != null
                        ? normalizeName(receipt.getCreditedName())
                        : receiptName;

                double similarity = Math.max(
                        jaroWinkler.apply(payslipName, receiptName),
                        jaroWinkler.apply(payslipName, receiptCreditedName));

                nameMatches = similarity >= SIMILARITY_THRESHOLD ||
                        payslipName.equals(receiptName) ||
                        payslipName.equals(receiptCreditedName) ||
                        payslipName.contains(receiptName) ||
                        receiptName.contains(payslipName);

                log.debug("   Nome - Payslip: '{}' vs Receipt: '{}' (creditado: '{}') -> Match: {}",
                        payslipName, receiptName, receiptCreditedName, nameMatches);
            }

            // 2. VERIFICAR VALOR (Valor LÃ­quido do Holerite vs Valor do Comprovante)
            valueMatches = valuesMatch(payslip.getNetValue(), receipt.getNetSalary());
            log.debug("   Valor - Payslip: {} vs Receipt: {} -> Match: {}",
                    payslip.getNetValue(), receipt.getNetSalary(), valueMatches);

            // 3. VERIFICAR CONTA CORRENTE (COMENTADO - para uso futuro quando holerite
            // tiver conta corrente)
            /*
             * // Quando o holerite tiver o campo contaCorrente, descomentar este cÃ³digo:
             * if (payslip.getContaCorrente() != null && receipt.getCreditedAccount() !=
             * null) {
             * String payslipAccount = normalizeAccount(payslip.getContaCorrente());
             * String receiptAccount = normalizeAccount(receipt.getCreditedAccount());
             * accountMatches = payslipAccount.equals(receiptAccount);
             * log.debug("   Conta Corrente - Payslip: '{}' vs Receipt: '{}' -> Match: {}",
             * payslipAccount, receiptAccount, accountMatches);
             * }
             */

            // 4. VERIFICAR CONTA CORRENTE USANDO TABELA EMPLOYEES (quando nÃ£o tiver no
            // holerite)
            // Se nÃ£o encontrou match de conta corrente no holerite, buscar na tabela
            // employees
            if (employee != null && employee.getContaCorrente() != null && receipt.getCreditedAccount() != null) {
                String employeeAccount = normalizeAccount(employee.getContaCorrente());
                String receiptAccount = normalizeAccount(receipt.getCreditedAccount());
                accountMatches = employeeAccount.equals(receiptAccount);

                if (accountMatches) {
                    log.info("âœ… Conta corrente corresponde (via tabela employees): '{}' = '{}'",
                            employeeAccount, receiptAccount);
                } else {
                    log.debug("   Conta Corrente (via employees) - Employee: '{}' vs Receipt: '{}' -> Match: {}",
                            employeeAccount, receiptAccount, accountMatches);
                }
            }

            // REGRA A: Match perfeito (Nome + Valor + Conta Corrente se disponÃ­vel)
            if (nameMatches && valueMatches) {
                // Se conta corrente foi verificada e nÃ£o corresponde, nÃ£o fazer match
                if (accountMatches || (!accountMatches && receipt.getCreditedAccount() == null)) {
                    log.info("âœ… Match encontrado - Payslip: {}, Receipt: {} (Nome: {}, Valor: {}, Conta: {})",
                            payslip.getId(), receipt.getId(), nameMatches, valueMatches,
                            accountMatches ? "âœ…" : "N/A");
                    return Optional.of(receipt);
                } else {
                    log.debug("   Match parcial - Nome e Valor OK, mas Conta Corrente nÃ£o corresponde");
                }
            }

            // REGRA B: Match por CPF (se disponÃ­vel) + Valor
            if (payslip.getCpf() != null && receipt.getEmployeeName() != null) {
                String payslipCpf = normalizeCpf(payslip.getCpf());
                String receiptCpf = extractCpfFromName(receipt.getEmployeeName());

                // Se nÃ£o encontrou CPF no nome do comprovante, tentar buscar via employee
                if (receiptCpf.isEmpty() && employee != null && employee.getDocument() != null) {
                    String employeeCpf = normalizeCpf(employee.getDocument());
                    if (payslipCpf.equals(employeeCpf) && valueMatches) {
                        log.info("âœ… Match por CPF (via employees) + Valor - Payslip: {}, Receipt: {}",
                                payslip.getId(), receipt.getId());
                        return Optional.of(receipt);
                    }
                } else if (payslipCpf.equals(receiptCpf) && valueMatches) {
                    log.info("âœ… Match por CPF + Valor - Payslip: {}, Receipt: {}",
                            payslip.getId(), receipt.getId());
                    return Optional.of(receipt);
                }
            }
        }

        log.debug("âŒ Nenhum comprovante correspondente encontrado para holerite: {} - {}/{}",
                payslip.getEmployeeName(), payslip.getMonth(), payslip.getYear());
        return Optional.empty();
    }

    /**
     * Busca funcionÃ¡rio na tabela employees usando dados do holerite
     * EstratÃ©gia: CPF > Nome exato > Nome parcial
     */
    private Employee findEmployeeForPayslip(Payslip payslip) {
        try {
            // ESTRATÃ‰GIA 1: Buscar por CPF
            if (payslip.getCpf() != null && !payslip.getCpf().trim().isEmpty()) {
                String normalizedCpf = normalizeCpf(payslip.getCpf());
                if (normalizedCpf.length() >= 11) {
                    Optional<Employee> employeeOpt = employeeRepository.findByCpf(normalizedCpf);
                    if (employeeOpt.isPresent()) {
                        return employeeOpt.get();
                    }
                }
            }

            // ESTRATÃ‰GIA 2: Buscar por nome exato
            if (payslip.getEmployeeName() != null && !payslip.getEmployeeName().trim().isEmpty()) {
                Optional<Employee> employeeOpt = employeeRepository.findByNameExact(payslip.getEmployeeName().trim());
                if (employeeOpt.isPresent()) {
                    return employeeOpt.get();
                }
            }

            // ESTRATÃ‰GIA 3: Buscar por nome parcial
            if (payslip.getEmployeeName() != null && !payslip.getEmployeeName().trim().isEmpty()) {
                List<Employee> employees = employeeRepository
                        .findByNameContainingIgnoreCase(payslip.getEmployeeName().trim());
                if (!employees.isEmpty()) {
                    // Retornar o primeiro (ou o mais prÃ³ximo se houver lÃ³gica de matching)
                    return employees.get(0);
                }
            }
        } catch (Exception e) {
            log.warn("âš ï¸ Erro ao buscar funcionÃ¡rio na tabela employees: {}", e.getMessage());
        }

        return null;
    }

    /**
     * Normaliza conta corrente removendo espaÃ§os, hÃ­fens e pontos
     */
    private String normalizeAccount(String account) {
        if (account == null)
            return "";
        return account.replaceAll("[^0-9]", "");
    }

    /**
     * Cria documento unificado
     */
    private void createUnifiedDocument(Payslip payslip, PaymentReceipt receipt) {
        try {
            // Verificar se jÃ¡ existe
            if (unifiedDocumentRepository.findByPayslipIdAndReceiptId(
                    payslip.getId(), receipt.getId()).isPresent()) {
                log.debug("Documento unificado jÃ¡ existe para payslip {} e receipt {}",
                        payslip.getId(), receipt.getId());
                return;
            }

            // Criar PDF unificado
            String unifiedPdfPath;
            try {
                unifiedPdfPath = unifiedDocumentService.createUnifiedDocument(payslip, receipt);
            } catch (java.io.IOException e) {
                log.error("âŒ Erro de I/O ao criar PDF unificado", e);
                throw new RuntimeException("Erro ao criar PDF unificado: " + e.getMessage(), e);
            }

            // Criar entidade UnifiedDocument
            UnifiedDocument unifiedDocument = UnifiedDocument.builder()
                    .payslip(payslip)
                    .receipt(receipt)
                    .month(payslip.getMonth())
                    .year(payslip.getYear())
                    .employeeName(payslip.getEmployeeName())
                    .filePath(unifiedPdfPath)
                    .fileName(extractFileName(unifiedPdfPath))
                    .fileSize(0L) // SerÃ¡ calculado depois se necessÃ¡rio
                    .status(UnifiedDocument.UnifiedDocumentStatus.PROCESSED)
                    .matchingConfidence(new BigDecimal("1.0"))
                    .notes("UnificaÃ§Ã£o automÃ¡tica via UnificationWorker")
                    .build();

            unifiedDocumentRepository.save(unifiedDocument);

            log.info("âœ… Documento unificado criado - Payslip: {}, Receipt: {}, UnifiedDocument: {}",
                    payslip.getId(), receipt.getId(), unifiedDocument.getId());
        } catch (Exception e) {
            log.error("âŒ Erro ao criar documento unificado", e);
            throw e;
        }
    }

    // MÃ©todos auxiliares
    private String normalizeCpf(String cpf) {
        if (cpf == null)
            return "";
        return cpf.replaceAll("[^0-9]", "");
    }

    private String normalizeName(String name) {
        if (name == null)
            return "";
        return name.trim().toUpperCase()
                .replaceAll("\\s+", " ")
                .replaceAll("[^A-Z\\u00C0-\\u00FF\\s]", "");
    }

    private String extractCpfFromName(String name) {
        // Tentar extrair CPF do nome (caso esteja no formato "NOME - CPF")
        if (name == null)
            return "";
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("(\\d{11})");
        java.util.regex.Matcher matcher = pattern.matcher(name);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return "";
    }

    private boolean valuesMatch(BigDecimal value1, BigDecimal value2) {
        if (value1 == null || value2 == null)
            return false;
        return value1.compareTo(value2) == 0;
    }

    private String extractFileName(String filePath) {
        if (filePath == null)
            return "unified.pdf";
        int lastSlash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
        return lastSlash >= 0 ? filePath.substring(lastSlash + 1) : filePath;
    }
}
