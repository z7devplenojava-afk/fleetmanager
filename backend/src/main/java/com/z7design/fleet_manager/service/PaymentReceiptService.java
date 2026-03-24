package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.CreatePaymentReceiptDTO;
import com.z7design.fleet_manager.dto.PaymentReceiptDTO;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.PaymentReceipt;
import com.z7design.fleet_manager.model.PaymentReceiptStatus;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.PaymentReceiptRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.UnifiedDocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import lombok.extern.slf4j.Slf4j;

import java.text.Normalizer;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.Employee;

import java.util.Set;
import java.util.HashSet;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import java.io.BufferedInputStream;
import java.io.FileInputStream;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
@Transactional
@Slf4j
public class PaymentReceiptService {

    @Autowired
    private PaymentReceiptRepository paymentReceiptRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private UnifiedDocumentRepository unifiedDocumentRepository;

    public PaymentReceiptDTO createPaymentReceipt(CreatePaymentReceiptDTO createDTO) {
        PaymentReceipt paymentReceipt = new PaymentReceipt(
                createDTO.getEmployeeId(),
                createDTO.getEmployeeName(),
                createDTO.getMonth(),
                createDTO.getYear(),
                createDTO.getFileName(),
                createDTO.getFilePath(),
                PaymentReceiptStatus.PENDING);

        // Definir campos adicionais
        paymentReceipt.setReceiptNumber(createDTO.getReceiptNumber());
        paymentReceipt.setPaymentDate(createDTO.getPaymentDate());
        paymentReceipt.setGrossSalary(createDTO.getGrossSalary());
        paymentReceipt.setNetSalary(createDTO.getNetSalary());
        paymentReceipt.setFileSize(createDTO.getFileSize());
        paymentReceipt.setNotes(createDTO.getNotes());
        paymentReceipt.setCreatedBy(createDTO.getCreatedBy());
        paymentReceipt.setCompanyName(createDTO.getCompanyName());
        paymentReceipt.setCompanyCnpj(createDTO.getCompanyCnpj());
        paymentReceipt.setCompanySigla(createDTO.getCompanySigla());
        if (createDTO.getCompanyId() != null) {
            companyRepository.findById(createDTO.getCompanyId()).ifPresent(paymentReceipt::setCompany);
        }

        // Campos bancÃ¡rios
        paymentReceipt.setDebitedAgency(createDTO.getDebitedAgency());
        paymentReceipt.setDebitedAccount(createDTO.getDebitedAccount());
        paymentReceipt.setDebitedName(createDTO.getDebitedName());
        paymentReceipt.setCreditedAgency(createDTO.getCreditedAgency());
        paymentReceipt.setCreditedAccount(createDTO.getCreditedAccount());
        paymentReceipt.setCreditedName(createDTO.getCreditedName());
        paymentReceipt.setControlNumber(createDTO.getControlNumber());
        paymentReceipt.setAuthenticationCode(createDTO.getAuthenticationCode());
        paymentReceipt.setTransferDate(createDTO.getTransferDate());
        paymentReceipt.setTransferTime(createDTO.getTransferTime());
        paymentReceipt.setBankName(createDTO.getBankName());
        paymentReceipt.setTransactionType(createDTO.getTransactionType());
        paymentReceipt.setStatementIdentification(createDTO.getStatementIdentification());

        applyCompanyHierarchy(paymentReceipt);

        PaymentReceipt savedReceipt = paymentReceiptRepository.save(paymentReceipt);
        return convertToDTO(savedReceipt);
    }

    @Transactional(readOnly = true)
    public List<PaymentReceiptDTO> findAll() {
        return paymentReceiptRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PaymentReceiptDTO> findByUserCpf(String cpf) {
        log.info("ðŸ” Buscando comprovantes para CPF: {}", cpf);

        String sanitizedCpf = sanitizeCpf(cpf);
        if (sanitizedCpf.isEmpty()) {
            log.warn("âš ï¸ CPF informado vazio ou invÃ¡lido. Retornando lista vazia.");
            return List.of();
        }

        Optional<User> userOptional = userRepository.findByUsername(sanitizedCpf);
        Optional<Employee> employeeOptional = employeeRepository.findByDocument(sanitizedCpf);

        UUID userId = userOptional.map(User::getId).orElse(null);
        UUID employeeId = employeeOptional.map(Employee::getId).orElse(null);

        Set<String> normalizedNames = new HashSet<>();
        userOptional.map(User::getName).map(this::normalizeName).ifPresent(normalizedNames::add);
        employeeOptional.map(Employee::getName).map(this::normalizeName).ifPresent(normalizedNames::add);

        List<PaymentReceiptDTO> receipts = paymentReceiptRepository.findAll()
                .stream()
                .filter(receipt -> matchesReceiptForUser(receipt, sanitizedCpf, normalizedNames, userId, employeeId))
                .sorted((r1, r2) -> {
                    int yearCompare = r2.getYear().compareTo(r1.getYear());
                    if (yearCompare != 0) {
                        return yearCompare;
                    }
                    return r2.getMonth().compareTo(r1.getMonth());
                })
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        log.info("âœ… Comprovantes encontrados para CPF {}: {}", cpf, receipts.size());
        return receipts;
    }

    private boolean matchesReceiptForUser(PaymentReceipt receipt, String sanitizedCpf, Set<String> normalizedNames,
            UUID userId, UUID employeeId) {
        if (receipt == null) {
            return false;
        }

        if (userId != null && receipt.getEmployeeId() != null && receipt.getEmployeeId().equals(userId)) {
            return true;
        }

        if (employeeId != null && receipt.getEmployeeId() != null && receipt.getEmployeeId().equals(employeeId)) {
            return true;
        }

        String receiptFileName = Optional.ofNullable(receipt.getFileName()).orElse("");
        if (!sanitizedCpf.isEmpty() && receiptFileName.contains(sanitizedCpf)) {
            return true;
        }

        String receiptFilePath = Optional.ofNullable(receipt.getFilePath()).orElse("");
        if (!sanitizedCpf.isEmpty() && receiptFilePath.contains(sanitizedCpf)) {
            return true;
        }

        String receiptEmployeeName = Optional.ofNullable(receipt.getEmployeeName()).orElse("");
        String receiptCreditedName = Optional.ofNullable(receipt.getCreditedName()).orElse("");

        String normalizedReceiptEmployeeName = normalizeName(receiptEmployeeName);
        String normalizedReceiptCreditedName = normalizeName(receiptCreditedName);

        if (!normalizedNames.isEmpty()) {
            for (String normalizedName : normalizedNames) {
                if (normalizedName.isEmpty()) {
                    continue;
                }
                if (normalizedName.equals(normalizedReceiptEmployeeName) ||
                        normalizedName.equals(normalizedReceiptCreditedName)) {
                    return true;
                }
                if (!normalizedReceiptEmployeeName.isEmpty() &&
                        (normalizedReceiptEmployeeName.contains(normalizedName)
                                || normalizedName.contains(normalizedReceiptEmployeeName))) {
                    return true;
                }
                if (!normalizedReceiptCreditedName.isEmpty() &&
                        (normalizedReceiptCreditedName.contains(normalizedName)
                                || normalizedName.contains(normalizedReceiptCreditedName))) {
                    return true;
                }
            }
        }

        return false;
    }

    private String sanitizeCpf(String cpf) {
        if (cpf == null) {
            return "";
        }
        return cpf.replaceAll("\\D", "");
    }

    private String normalizeName(String value) {
        if (value == null) {
            return "";
        }
        String withoutAccents = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return withoutAccents.replaceAll("[^a-zA-Z0-9]", "")
                .toLowerCase();
    }

    @Transactional(readOnly = true)
    public List<PaymentReceiptDTO> findByYearAndMonth(Integer year, Integer month) {
        return paymentReceiptRepository.findByYearAndMonth(year, month)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Integer> findDistinctYears() {
        return paymentReceiptRepository.findDistinctYears();
    }

    @Transactional(readOnly = true)
    public List<Integer> findDistinctMonthsByYear(Integer year) {
        return paymentReceiptRepository.findDistinctMonthsByYear(year);
    }

    @Transactional(readOnly = true)
    public long count() {
        return paymentReceiptRepository.count();
    }

    @Transactional(readOnly = true)
    public long countProcessedToday() {
        return paymentReceiptRepository.countProcessedToday();
    }

    @Transactional(readOnly = true)
    public List<PaymentReceiptDTO> findByStatus(PaymentReceiptStatus status) {
        List<PaymentReceipt> receipts = paymentReceiptRepository.findByStatus(status);
        return receipts.stream()
                .map(this::convertToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentReceiptDTO> findByIds(List<UUID> ids) {
        return paymentReceiptRepository.findByIdIn(ids)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PaymentReceiptDTO> search(String searchTerm) {
        if (searchTerm == null || searchTerm.trim().length() < 4) {
            log.warn("âš ï¸ Termo de busca muito curto (mÃ­nimo 4 caracteres): {}", searchTerm);
            return List.of();
        }

        String trimmedSearch = searchTerm.trim();
        String normalizedSearch = normalizeName(trimmedSearch);
        log.info("ðŸ” Buscando comprovantes com termo: '{}' (normalizado: '{}')", trimmedSearch, normalizedSearch);

        List<PaymentReceipt> allReceipts = paymentReceiptRepository.findAll();
        log.info("ðŸ“Š Total de comprovantes no banco: {}", allReceipts.size());

        // Debug: mostrar alguns nomes de comprovantes para verificar
        if (allReceipts.size() > 0 && allReceipts.size() <= 10) {
            log.info("ðŸ“‹ Nomes dos comprovantes no banco:");
            allReceipts.forEach(r -> {
                String name = r.getEmployeeName() != null ? r.getEmployeeName() : "N/A";
                log.info("   - '{}' (normalizado: '{}')", name, normalizeName(name));
            });
        }

        List<PaymentReceiptDTO> results = allReceipts.stream()
                .filter(receipt -> {
                    boolean matches = matchesSearchTerm(receipt, normalizedSearch, trimmedSearch);
                    if (matches && receipt.getEmployeeName() != null) {
                        log.debug("âœ… Match encontrado: '{}' para busca '{}'", receipt.getEmployeeName(),
                                trimmedSearch);
                    }
                    return matches;
                })
                .sorted((r1, r2) -> {
                    // Ordenar por data de transferÃªncia (mais recente primeiro)
                    if (r1.getTransferDate() != null && r2.getTransferDate() != null) {
                        return r2.getTransferDate().compareTo(r1.getTransferDate());
                    }
                    // Se nÃ£o tiver data, ordenar por ano/mÃªs
                    int yearCompare = r2.getYear().compareTo(r1.getYear());
                    if (yearCompare != 0) {
                        return yearCompare;
                    }
                    return r2.getMonth().compareTo(r1.getMonth());
                })
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        log.info("âœ… Comprovantes encontrados: {} registros (de {} total)", results.size(), allReceipts.size());
        if (results.isEmpty() && !allReceipts.isEmpty()) {
            log.warn("âš ï¸ Nenhum comprovante encontrado para '{}'. Verifique se o nome estÃ¡ correto.",
                    trimmedSearch);
        }
        return results;
    }

    private boolean matchesSearchTerm(PaymentReceipt receipt, String normalizedSearch, String originalSearch) {
        if (receipt == null) {
            return false;
        }

        String originalSearchLower = originalSearch.toLowerCase().trim();

        // Buscar por nome do funcionÃ¡rio - MÃšLTIPLAS ESTRATÃ‰GIAS
        String employeeName = Optional.ofNullable(receipt.getEmployeeName()).orElse("");
        if (!employeeName.isEmpty()) {
            String employeeNameLower = employeeName.toLowerCase();
            String normalizedEmployeeName = normalizeName(employeeName);

            // EstratÃ©gia 1: Busca normalizada (sem acentos, sem espaÃ§os)
            if (normalizedEmployeeName.contains(normalizedSearch) ||
                    normalizedSearch.contains(normalizedEmployeeName)) {
                return true;
            }

            // EstratÃ©gia 2: Busca case-insensitive simples
            if (employeeNameLower.contains(originalSearchLower)) {
                return true;
            }

            // EstratÃ©gia 3: Busca por palavras individuais (se o termo de busca tiver
            // mÃºltiplas palavras)
            String[] searchWords = originalSearchLower.split("\\s+");
            if (searchWords.length > 1) {
                boolean allWordsMatch = true;
                for (String word : searchWords) {
                    if (word.length() >= 3 && !employeeNameLower.contains(word)) {
                        allWordsMatch = false;
                        break;
                    }
                }
                if (allWordsMatch) {
                    return true;
                }
            }

            // EstratÃ©gia 4: Busca por primeiro e Ãºltimo nome
            String[] employeeNameParts = employeeNameLower.split("\\s+");
            String[] searchParts = originalSearchLower.split("\\s+");
            if (employeeNameParts.length >= 2 && searchParts.length >= 2) {
                String employeeFirst = employeeNameParts[0];
                String employeeLast = employeeNameParts[employeeNameParts.length - 1];
                String searchFirst = searchParts[0];
                String searchLast = searchParts[searchParts.length - 1];

                if (employeeFirst.contains(searchFirst) && employeeLast.contains(searchLast)) {
                    return true;
                }
                if (searchFirst.contains(employeeFirst) && searchLast.contains(employeeLast)) {
                    return true;
                }
            }

            // EstratÃ©gia 5: Busca considerando abreviaÃ§Ãµes de nomes do meio (1-3
            // caracteres)
            // Ex: "SILVANA FERREIRA S HONORATO" vs "SILVANA FERREIRA SELVO HONORATO"
            if (employeeNameParts.length >= 3 && searchParts.length >= 3) {
                // Verificar primeiro e Ãºltimo nome
                String employeeFirst = employeeNameParts[0];
                String employeeLast = employeeNameParts[employeeNameParts.length - 1];
                String searchFirst = searchParts[0];
                String searchLast = searchParts[searchParts.length - 1];

                boolean firstMatches = employeeFirst.contains(searchFirst) || searchFirst.contains(employeeFirst);
                boolean lastMatches = employeeLast.contains(searchLast) || searchLast.contains(employeeLast);

                if (firstMatches && lastMatches) {
                    // Verificar nomes do meio considerando abreviaÃ§Ãµes
                    List<String> employeeMiddle = new ArrayList<>();
                    List<String> searchMiddle = new ArrayList<>();

                    for (int i = 1; i < employeeNameParts.length - 1; i++) {
                        employeeMiddle.add(employeeNameParts[i]);
                    }
                    for (int i = 1; i < searchParts.length - 1; i++) {
                        searchMiddle.add(searchParts[i]);
                    }

                    // Verificar se as abreviaÃ§Ãµes correspondem
                    boolean middleMatches = checkMiddleNamesWithAbbreviations(employeeMiddle, searchMiddle);
                    if (middleMatches) {
                        return true;
                    }
                }
            }
        }

        // Buscar por empresa
        String companyName = Optional.ofNullable(receipt.getCompanyName()).orElse("");
        if (!companyName.isEmpty()) {
            String normalizedCompanyName = normalizeName(companyName);
            if (normalizedCompanyName.contains(normalizedSearch) ||
                    companyName.toLowerCase().contains(originalSearchLower)) {
                return true;
            }
        }

        // Buscar por CNPJ da empresa
        String companyCnpj = Optional.ofNullable(receipt.getCompanyCnpj()).orElse("");
        if (!companyCnpj.isEmpty()) {
            String cnpjDigits = companyCnpj.replaceAll("\\D", "");
            String searchDigits = originalSearch.replaceAll("\\D", "");
            if (!searchDigits.isEmpty() && cnpjDigits.contains(searchDigits)) {
                return true;
            }
        }

        // Buscar por conta corrente debitada (debitedAccount)
        String debitedAccount = Optional.ofNullable(receipt.getDebitedAccount()).orElse("");
        if (!debitedAccount.isEmpty()) {
            // Remover formataÃ§Ã£o (espaÃ§os, hÃ­fens, pontos) para comparaÃ§Ã£o
            String debitedAccountClean = debitedAccount.replaceAll("[\\s\\-\\.]", "");
            String searchAccountClean = originalSearch.replaceAll("[\\s\\-\\.]", "");
            if (!searchAccountClean.isEmpty()) {
                // Busca exata (sem formataÃ§Ã£o)
                if (debitedAccountClean.contains(searchAccountClean) ||
                        searchAccountClean.contains(debitedAccountClean)) {
                    return true;
                }
                // Busca case-insensitive com formataÃ§Ã£o
                if (debitedAccount.toLowerCase().contains(originalSearchLower)) {
                    return true;
                }
            }
        }

        // Buscar por data de transferÃªncia (transferDate Ã© String) - MELHORADO
        if (receipt.getTransferDate() != null) {
            String dateStr = receipt.getTransferDate().toLowerCase().trim();
            String originalSearchLowerTrim = originalSearchLower.trim();

            // Busca simples por substring
            if (dateStr.contains(originalSearchLowerTrim)) {
                return true;
            }

            // Tentar diferentes formatos de data
            // Formato DD/MM/YYYY ou DD.MM.YYYY
            if (dateStr.matches("\\d{2}[/\\.]\\d{2}[/\\.]\\d{4}")) {
                String[] dateParts = dateStr.split("[/\\.]");
                if (dateParts.length == 3) {
                    String day = dateParts[0];
                    String month = dateParts[1];
                    String year = dateParts[2];

                    // Buscar por dia
                    if (day.contains(originalSearchLowerTrim)) {
                        return true;
                    }
                    // Buscar por mÃªs
                    if (month.contains(originalSearchLowerTrim)) {
                        return true;
                    }
                    // Buscar por ano
                    if (year.contains(originalSearchLowerTrim)) {
                        return true;
                    }
                    // Buscar por DD/MM
                    if ((day + "/" + month).contains(originalSearchLowerTrim) ||
                            (day + "." + month).contains(originalSearchLowerTrim)) {
                        return true;
                    }
                    // Buscar por MM/YYYY
                    if ((month + "/" + year).contains(originalSearchLowerTrim) ||
                            (month + "." + year).contains(originalSearchLowerTrim)) {
                        return true;
                    }
                }
            }

            // Formato MM/YYYY ou MM-YYYY
            if (dateStr.matches("\\d{2}[/\\-]\\d{4}")) {
                String[] dateParts = dateStr.split("[/\\-]");
                if (dateParts.length == 2) {
                    String month = dateParts[0];
                    String year = dateParts[1];

                    // Buscar por mÃªs
                    if (month.contains(originalSearchLowerTrim)) {
                        return true;
                    }
                    // Buscar por ano
                    if (year.contains(originalSearchLowerTrim)) {
                        return true;
                    }
                    // Buscar por MM/YYYY
                    if ((month + "/" + year).contains(originalSearchLowerTrim) ||
                            (month + "-" + year).contains(originalSearchLowerTrim)) {
                        return true;
                    }
                }
            }
        }

        // Buscar por mÃªs/ano (formato MM/YYYY ou MM-YYYY) - baseado nos campos month e
        // year
        String monthYear1 = String.format("%02d/%d", receipt.getMonth(), receipt.getYear());
        String monthYear2 = String.format("%02d-%d", receipt.getMonth(), receipt.getYear());
        String monthYear3 = String.format("%d/%d", receipt.getMonth(), receipt.getYear());
        if (monthYear1.contains(originalSearch) ||
                monthYear2.contains(originalSearch) ||
                monthYear3.contains(originalSearch)) {
            return true;
        }

        return false;
    }

    /**
     * Verifica se os nomes do meio correspondem, considerando abreviaÃ§Ãµes (1-3
     * caracteres)
     */
    private boolean checkMiddleNamesWithAbbreviations(List<String> middle1, List<String> middle2) {
        if (middle1.isEmpty() && middle2.isEmpty()) {
            return true;
        }

        // Se um nÃ£o tem nomes do meio e o outro tem, verificar se sÃ£o abreviaÃ§Ãµes
        if (middle1.isEmpty() || middle2.isEmpty()) {
            return false; // Se um tem e outro nÃ£o, nÃ£o Ã© match
        }

        // Comparar palavra por palavra considerando abreviaÃ§Ãµes
        for (String w1 : middle1) {
            boolean found = false;
            for (String w2 : middle2) {
                if (wordsMatchWithAbbreviation(w1, w2)) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                return false;
            }
        }

        // E vice-versa
        for (String w2 : middle2) {
            boolean found = false;
            for (String w1 : middle1) {
                if (wordsMatchWithAbbreviation(w1, w2)) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                return false;
            }
        }

        return true;
    }

    /**
     * Verifica se uma palavra corresponde a outra, considerando abreviaÃ§Ãµes (1-3
     * caracteres)
     */
    private boolean wordsMatchWithAbbreviation(String word1, String word2) {
        if (word1.equals(word2)) {
            return true;
        }

        // Se uma palavra tem 1-3 caracteres, pode ser abreviaÃ§Ã£o da outra
        if (word1.length() >= 1 && word1.length() <= 3 && word2.length() > word1.length()) {
            // word1 Ã© abreviaÃ§Ã£o? Verificar se word2 comeÃ§a com word1
            if (word2.toLowerCase().startsWith(word1.toLowerCase())) {
                return true;
            }
        }
        if (word2.length() >= 1 && word2.length() <= 3 && word1.length() > word2.length()) {
            // word2 Ã© abreviaÃ§Ã£o? Verificar se word1 comeÃ§a com word2
            if (word1.toLowerCase().startsWith(word2.toLowerCase())) {
                return true;
            }
        }

        // Verificar se uma contÃ©m a outra (para casos como "FERREIRA" vs "FERREIRA")
        if (word1.length() >= 3 && word2.length() >= 3) {
            return word1.toLowerCase().contains(word2.toLowerCase()) ||
                    word2.toLowerCase().contains(word1.toLowerCase());
        }

        return false;
    }

    @Transactional
    public PaymentReceiptDTO processUploadedFile(MultipartFile file, String employeeName, Integer month, Integer year) {
        try {
            // Validar arquivo
            if (file.isEmpty()) {
                throw new IllegalArgumentException("Arquivo nÃ£o pode estar vazio");
            }

            if (!file.getContentType().equals("application/pdf")) {
                throw new IllegalArgumentException("Apenas arquivos PDF sÃ£o aceitos");
            }

            // Criar diretÃ³rio de upload se nÃ£o existir
            String uploadDir = "uploads/payment-receipts/" + year + "/" + month;
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Gerar nome Ãºnico para o arquivo
            String originalFileName = file.getOriginalFilename();
            String fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            String uniqueFileName = employeeName.toLowerCase().replaceAll("\\s+", "_") + "_" +
                    year + "_" + month + "_" + System.currentTimeMillis() + fileExtension;

            // Salvar arquivo
            Path filePath = uploadPath.resolve(uniqueFileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Derivar mÃªs/ano da pasta do caminho quando nÃ£o fornecido corretamente
            if (month == null || year == null) {
                try {
                    // uploads/payment-receipts/{year}/{month}
                    String[] parts = uploadDir.replace('\\', '/').split("/");
                    int len = parts.length;
                    int derivedYear = Integer.parseInt(parts[len - 2]);
                    int derivedMonth = Integer.parseInt(parts[len - 1]);
                    month = derivedMonth;
                    year = derivedYear;
                } catch (Exception ignored) {
                }
            }

            // Criar registro no banco
            PaymentReceipt paymentReceipt = new PaymentReceipt();
            paymentReceipt.setEmployeeName(employeeName);
            paymentReceipt.setMonth(month);
            paymentReceipt.setYear(year);
            paymentReceipt.setFileName(uniqueFileName);
            paymentReceipt.setFilePath(filePath.toString());
            paymentReceipt.setFileSize(file.getSize());
            paymentReceipt.setStatus(PaymentReceiptStatus.PENDING);
            paymentReceipt.setCompanyName(paymentReceipt.getDebitedName());
            paymentReceipt.setCompanySigla(null);
            paymentReceipt.setCompanyCnpj(null);

            // Ajustar datas: usar primeiro dia do mÃªs/ano da pasta
            try {
                // Armazenar apenas MM/AAAA
                String normalizedTransferDate = String.format("%02d/%04d", month, year);
                paymentReceipt.setTransferDate(normalizedTransferDate);
                paymentReceipt.setTransferTime(null);
            } catch (Exception e) {
                // ignore e deixe para etapa de processamento
            }

            // Salvar no banco
            PaymentReceipt savedReceipt = paymentReceiptRepository.save(paymentReceipt);

            // TODO: Implementar processamento de PDF para extrair dados bancÃ¡rios
            // Por enquanto, marcar como processado
            savedReceipt.setStatus(PaymentReceiptStatus.PROCESSED);
            savedReceipt.setNetSalary(java.math.BigDecimal.ZERO); // SerÃ¡ preenchido apÃ³s processamento
            savedReceipt.setGrossSalary(java.math.BigDecimal.ZERO);
            applyCompanyHierarchy(savedReceipt);

            PaymentReceipt finalReceipt = paymentReceiptRepository.save(savedReceipt);

            return convertToDTO(finalReceipt);

        } catch (IOException e) {
            throw new RuntimeException("Erro ao processar arquivo: " + e.getMessage(), e);
        }
    }

    public void deletePaymentReceipt(UUID id) {
        paymentReceiptRepository.deleteById(id);
    }

    public ResponseEntity<byte[]> downloadReceiptFile(String id) {
        try {
            UUID receiptId = UUID.fromString(id);
            Optional<PaymentReceipt> receiptOpt = paymentReceiptRepository.findById(receiptId);

            if (receiptOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            PaymentReceipt receipt = receiptOpt.get();
            Path filePath = Paths.get(receipt.getFilePath());

            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }

            byte[] fileContent = Files.readAllBytes(filePath);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", receipt.getFileName());
            headers.setContentLength(fileContent.length);

            return new ResponseEntity<>(fileContent, headers, HttpStatus.OK);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Download em lote de comprovantes (ZIP) - VERSÃƒO DE ALTA PERFORMANCE
     * Processamento assÃ­ncrono com StreamingResponseBody para nÃ£o bloquear o
     * servidor
     */
    public ResponseEntity<StreamingResponseBody> downloadBatch(List<String> ids) {
        try {
            log.info("ðŸ“¦ Iniciando download em lote de {} comprovante(s)", ids.size());

            // Converter strings para UUIDs
            List<UUID> uuids = ids.stream()
                    .map(id -> {
                        try {
                            return UUID.fromString(id);
                        } catch (IllegalArgumentException e) {
                            log.warn("âš ï¸ ID invÃ¡lido ignorado: {}", id);
                            return null;
                        }
                    })
                    .filter(id -> id != null)
                    .collect(Collectors.toList());

            if (uuids.isEmpty()) {
                log.warn("âš ï¸ Nenhum UUID vÃ¡lido fornecido");
                return ResponseEntity.badRequest().build();
            }

            // Buscar comprovantes do banco em uma Ãºnica query (otimizaÃ§Ã£o)
            List<PaymentReceipt> receipts = paymentReceiptRepository.findByIdIn(uuids);

            if (receipts.isEmpty()) {
                log.warn("âš ï¸ Nenhum comprovante encontrado");
                return ResponseEntity.notFound().build();
            }

            log.info("âœ… {} comprovante(s) encontrado(s) para download", receipts.size());

            // Criar StreamingResponseBody para processamento assÃ­ncrono
            StreamingResponseBody responseBody = outputStream -> {
                try (ZipOutputStream zos = new ZipOutputStream(outputStream)) {
                    AtomicInteger filesAdded = new AtomicInteger(0);
                    AtomicInteger filesSkipped = new AtomicInteger(0);

                    // Processar em lotes para melhor performance (evitar sobrecarga de memÃ³ria)
                    int batchSize = 50; // Processar 50 arquivos por vez
                    ForkJoinPool customThreadPool = new ForkJoinPool(
                            Math.min(4, Runtime.getRuntime().availableProcessors()));

                    for (int i = 0; i < receipts.size(); i += batchSize) {
                        int endIndex = Math.min(i + batchSize, receipts.size());
                        List<PaymentReceipt> batch = receipts.subList(i, endIndex);

                        // Processar batch em paralelo
                        List<CompletableFuture<Void>> futures = batch.stream()
                                .map(receipt -> CompletableFuture.runAsync(() -> {
                                    try {
                                        Path filePath = Paths.get(receipt.getFilePath());

                                        if (!Files.exists(filePath)) {
                                            log.warn("âš ï¸ Arquivo nÃ£o encontrado: {}", receipt.getFilePath());
                                            filesSkipped.incrementAndGet();
                                            return;
                                        }

                                        // Criar nome do arquivo no ZIP (evitar duplicatas)
                                        String zipEntryName = sanitizeFileName(
                                                receipt.getEmployeeName() != null ? receipt.getEmployeeName()
                                                        : "Sem_Nome",
                                                receipt.getMonth(),
                                                receipt.getYear(),
                                                receipt.getId()) + ".pdf";

                                        synchronized (zos) {
                                            ZipEntry zipEntry = new ZipEntry(zipEntryName);
                                            zipEntry.setTime(System.currentTimeMillis());
                                            zos.putNextEntry(zipEntry);

                                            // Ler e escrever arquivo com buffer otimizado
                                            try (BufferedInputStream bis = new BufferedInputStream(
                                                    new FileInputStream(filePath.toFile()), 65536)) {
                                                byte[] buffer = new byte[65536]; // 64KB buffer
                                                int bytesRead;
                                                while ((bytesRead = bis.read(buffer)) != -1) {
                                                    zos.write(buffer, 0, bytesRead);
                                                }
                                            }

                                            zos.closeEntry();
                                            int added = filesAdded.incrementAndGet();

                                            if (added % 10 == 0) {
                                                log.debug("ðŸ“¦ Progresso: {} arquivo(s) adicionado(s)...", added);
                                            }
                                        }
                                    } catch (Exception e) {
                                        log.error("âŒ Erro ao adicionar arquivo {} ao ZIP: {}",
                                                receipt.getFileName(), e.getMessage());
                                        filesSkipped.incrementAndGet();
                                    }
                                }, customThreadPool))
                                .collect(Collectors.toList());

                        // Aguardar conclusÃ£o do batch
                        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
                    }

                    customThreadPool.shutdown();

                    log.info("âœ… ZIP criado com sucesso: {} arquivo(s) adicionado(s), {} pulado(s)",
                            filesAdded.get(), filesSkipped.get());
                } catch (Exception e) {
                    log.error("ðŸ’¥ Erro ao criar ZIP: {}", e.getMessage(), e);
                    throw new RuntimeException("Erro ao criar ZIP", e);
                }
            };

            String zipFileName = "comprovantes_" + System.currentTimeMillis() + ".zip";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", zipFileName);

            log.info("âš¡ Download em lote preparado: {} comprovante(s)", receipts.size());

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(responseBody);

        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao preparar download em lote: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Sanitiza nome do arquivo para evitar problemas no ZIP
     */
    private String sanitizeFileName(String employeeName, Integer month, Integer year, UUID id) {
        String sanitized = employeeName
                .replaceAll("[^a-zA-Z0-9\\s]", "_")
                .replaceAll("\\s+", "_")
                .substring(0, Math.min(50, employeeName.length()));
        return String.format("%s_%02d_%d_%s", sanitized, month != null ? month : 0,
                year != null ? year : 0, id.toString().substring(0, 8));
    }

    public ResponseEntity<byte[]> viewReceiptFile(String id) {
        try {
            UUID receiptId = UUID.fromString(id);
            Optional<PaymentReceipt> receiptOpt = paymentReceiptRepository.findById(receiptId);

            if (receiptOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            PaymentReceipt receipt = receiptOpt.get();
            Path filePath = Paths.get(receipt.getFilePath());

            if (!Files.exists(filePath)) {
                log.warn("Arquivo nÃ£o encontrado: {}", filePath);
                return ResponseEntity.notFound().build();
            }

            byte[] fileContent = Files.readAllBytes(filePath);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("inline", receipt.getFileName());
            headers.setContentLength(fileContent.length);
            headers.setCacheControl("no-cache, no-store, must-revalidate");
            headers.setPragma("no-cache");
            headers.setExpires(0);

            return new ResponseEntity<>(fileContent, headers, HttpStatus.OK);

        } catch (Exception e) {
            log.error("Erro ao visualizar arquivo: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private PaymentReceiptDTO convertToDTO(PaymentReceipt paymentReceipt) {
        PaymentReceiptDTO dto = new PaymentReceiptDTO();
        dto.setId(paymentReceipt.getId());
        dto.setEmployeeId(paymentReceipt.getEmployeeId());
        dto.setEmployeeName(paymentReceipt.getEmployeeName());
        dto.setCompanyId(paymentReceipt.getCompanyId());
        dto.setCompanyName(paymentReceipt.getCompanyName());
        dto.setCompanyCnpj(paymentReceipt.getCompanyCnpj());
        dto.setCompanySigla(paymentReceipt.getCompanySigla());
        dto.setMonth(paymentReceipt.getMonth());
        dto.setYear(paymentReceipt.getYear());
        dto.setReceiptNumber(paymentReceipt.getReceiptNumber());
        dto.setPaymentDate(paymentReceipt.getPaymentDate());
        dto.setGrossSalary(paymentReceipt.getGrossSalary());
        dto.setNetSalary(paymentReceipt.getNetSalary());
        dto.setFilePath(paymentReceipt.getFilePath());
        dto.setFileName(paymentReceipt.getFileName());
        dto.setFileSize(paymentReceipt.getFileSize());
        dto.setStatus(paymentReceipt.getStatus());
        dto.setNotes(paymentReceipt.getNotes());
        dto.setCreatedAt(paymentReceipt.getCreatedAt());
        dto.setUpdatedAt(paymentReceipt.getUpdatedAt());
        dto.setProcessedAt(paymentReceipt.getProcessedAt());
        dto.setCreatedBy(paymentReceipt.getCreatedBy());
        dto.setUpdatedBy(paymentReceipt.getUpdatedBy());

        // Campos bancÃ¡rios
        dto.setDebitedAgency(paymentReceipt.getDebitedAgency());
        dto.setDebitedAccount(paymentReceipt.getDebitedAccount());
        dto.setDebitedName(paymentReceipt.getDebitedName());
        dto.setCreditedAgency(paymentReceipt.getCreditedAgency());
        dto.setCreditedAccount(paymentReceipt.getCreditedAccount());
        dto.setCreditedName(paymentReceipt.getCreditedName());
        dto.setControlNumber(paymentReceipt.getControlNumber());
        dto.setAuthenticationCode(paymentReceipt.getAuthenticationCode());
        dto.setTransferDate(paymentReceipt.getTransferDate());
        dto.setTransferTime(paymentReceipt.getTransferTime());
        dto.setBankName(paymentReceipt.getBankName());
        dto.setTransactionType(paymentReceipt.getTransactionType());
        dto.setStatementIdentification(paymentReceipt.getStatementIdentification());

        return dto;
    }

    public void applyCompanyHierarchy(PaymentReceipt paymentReceipt) {
        if (paymentReceipt == null) {
            return;
        }

        if (!hasText(paymentReceipt.getCompanyName()) && hasText(paymentReceipt.getDebitedName())) {
            paymentReceipt.setCompanyName(paymentReceipt.getDebitedName());
        }

        String normalizedCnpj = normalizeCnpj(paymentReceipt.getCompanyCnpj());
        if (normalizedCnpj != null) {
            paymentReceipt.setCompanyCnpj(normalizedCnpj);
            List<Company> companies = companyRepository.findByNormalizedCnpj(normalizedCnpj);
            if (!companies.isEmpty()) {
                applyCompanyLink(paymentReceipt, companies.get(0));
            }
        }

        if (paymentReceipt.getCompany() == null && hasText(paymentReceipt.getCompanySigla())) {
            companyRepository.findFirstBySiglaIgnoreCase(paymentReceipt.getCompanySigla().trim())
                    .ifPresent(company -> applyCompanyLink(paymentReceipt, company));
        }

        if (paymentReceipt.getCompany() == null && hasText(paymentReceipt.getCompanyName())) {
            String normalizedName = normalizeText(paymentReceipt.getCompanyName());
            companyRepository.findByNormalizedName(normalizedName)
                    .ifPresent(company -> applyCompanyLink(paymentReceipt, company));
        }
    }

    private void applyCompanyLink(PaymentReceipt receipt, Company company) {
        receipt.setCompany(company);
        if (!hasText(receipt.getCompanyName())) {
            receipt.setCompanyName(company.getName());
        }
        receipt.setCompanySigla(company.getSigla());
        String normalizedCompanyCnpj = normalizeCnpj(company.getCnpj());
        if (normalizedCompanyCnpj != null) {
            receipt.setCompanyCnpj(normalizedCompanyCnpj);
        }
    }

    private String normalizeCnpj(String cnpj) {
        if (!hasText(cnpj)) {
            return null;
        }
        String digits = cnpj.replaceAll("\\D", "");
        return digits.length() == 14 ? digits : digits;
    }

    private String normalizeText(String value) {
        if (!hasText(value)) {
            return null;
        }
        String noAccents = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return noAccents.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    // Excluir comprovante por ID
    public void deleteById(String id) {
        deleteByIdInTransaction(id);
    }

    // MÃ©todo auxiliar para excluir em transaÃ§Ã£o separada
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW, rollbackFor = Exception.class)
    private void deleteByIdInTransaction(String id) {
        if (id == null || id.trim().isEmpty()) {
            log.warn("ID nulo ou vazio fornecido para exclusÃ£o");
            return;
        }

        try {
            UUID receiptId = UUID.fromString(id.trim());
            Optional<PaymentReceipt> receiptOpt = paymentReceiptRepository.findById(receiptId);

            if (receiptOpt.isPresent()) {
                PaymentReceipt receipt = receiptOpt.get();

                // Excluir arquivo fÃ­sico se existir (fora da transaÃ§Ã£o)
                if (receipt.getFilePath() != null && !receipt.getFilePath().trim().isEmpty()) {
                    try {
                        Path filePath = Paths.get(receipt.getFilePath());
                        if (Files.exists(filePath)) {
                            Files.delete(filePath);
                            log.info("âœ… Arquivo fÃ­sico excluÃ­do: {}", filePath);
                        } else {
                            log.debug("âš ï¸ Arquivo fÃ­sico nÃ£o encontrado (jÃ¡ foi excluÃ­do?): {}", filePath);
                        }
                    } catch (IOException e) {
                        log.warn("âš ï¸ Erro ao excluir arquivo fÃ­sico {}: {}", receipt.getFilePath(),
                                e.getMessage());
                        // NÃ£o lanÃ§ar exceÃ§Ã£o - continuar com exclusÃ£o do banco
                    } catch (Exception e) {
                        log.warn("âš ï¸ Erro inesperado ao excluir arquivo fÃ­sico {}: {}", receipt.getFilePath(),
                                e.getMessage());
                        // NÃ£o lanÃ§ar exceÃ§Ã£o - continuar com exclusÃ£o do banco
                    }
                }

                // ANTES de excluir, remover referÃªncias na tabela unified_documents
                try {
                    int updatedCount = unifiedDocumentRepository.removeReceiptReference(receiptId);
                    if (updatedCount > 0) {
                        log.info("âœ… {} referÃªncia(s) removida(s) em unified_documents para o comprovante {}",
                                updatedCount, id);
                    }
                } catch (Exception e) {
                    log.warn("âš ï¸ Erro ao remover referÃªncias em unified_documents: {}", e.getMessage());
                    // Continuar mesmo assim - tentar excluir
                }

                // Excluir do banco de dados
                try {
                    paymentReceiptRepository.deleteById(receiptId);
                    paymentReceiptRepository.flush(); // ForÃ§a o commit imediato
                    log.info("âœ… Comprovante excluÃ­do do banco com sucesso: {}", id);
                } catch (org.springframework.dao.DataIntegrityViolationException e) {
                    log.error("âŒ Erro de integridade ao excluir comprovante {}: {}", id, e.getMessage(), e);
                    String errorMsg = "Erro ao excluir comprovante: existe referÃªncia em outra tabela. " +
                            (e.getCause() != null ? e.getCause().getMessage() : e.getMessage());
                    throw new RuntimeException(errorMsg, e);
                } catch (jakarta.persistence.EntityNotFoundException e) {
                    log.warn("âš ï¸ Comprovante nÃ£o encontrado no banco (jÃ¡ foi excluÃ­do?): {}", id);
                    // NÃ£o lanÃ§ar exceÃ§Ã£o - comprovante nÃ£o existe Ã© um caso vÃ¡lido
                } catch (org.hibernate.exception.ConstraintViolationException e) {
                    log.error("âŒ Erro de constraint ao excluir comprovante {}: {}", id, e.getMessage(), e);
                    throw new RuntimeException("Erro ao excluir comprovante: violaÃ§Ã£o de constraint. " +
                            (e.getCause() != null ? e.getCause().getMessage() : e.getMessage()), e);
                } catch (Exception e) {
                    log.error("âŒ Erro ao excluir comprovante do banco de dados {}: {}", id, e.getMessage(), e);
                    log.error("âŒ Tipo da exceÃ§Ã£o: {}", e.getClass().getName());
                    if (e.getCause() != null) {
                        log.error("âŒ Causa: {}", e.getCause().getMessage());
                    }
                    throw new RuntimeException("Erro ao excluir comprovante do banco de dados: " +
                            (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()), e);
                }
            } else {
                log.warn("âš ï¸ Comprovante nÃ£o encontrado para exclusÃ£o: {}", id);
                // NÃ£o lanÃ§ar exceÃ§Ã£o - comprovante nÃ£o existe Ã© um caso vÃ¡lido
            }
        } catch (IllegalArgumentException e) {
            log.error("âŒ ID invÃ¡lido fornecido para exclusÃ£o: {} - {}", id, e.getMessage());
            throw new IllegalArgumentException("ID invÃ¡lido: " + id, e);
        } catch (RuntimeException e) {
            // Re-lanÃ§ar RuntimeException
            throw e;
        } catch (Exception e) {
            log.error("âŒ Erro inesperado ao excluir comprovante {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Erro ao excluir comprovante: " + e.getMessage(), e);
        }
    }

    // Excluir mÃºltiplos comprovantes
    public Map<String, Object> deleteMultiplePaymentReceipts(List<String> ids) {
        Map<String, Object> result = new HashMap<>();
        int deleted = 0;
        int failed = 0;
        List<String> errors = new ArrayList<>();

        if (ids == null || ids.isEmpty()) {
            log.info("ðŸ“‹ Lista de IDs vazia ou nula para exclusÃ£o mÃºltipla");
            result.put("deleted", 0);
            result.put("failed", 0);
            result.put("errors", new ArrayList<>());
            return result;
        }

        log.info("ðŸ—‘ï¸ Iniciando exclusÃ£o de {} comprovantes", ids.size());

        for (String id : ids) {
            try {
                // Validar UUID antes de tentar excluir
                if (id == null || id.trim().isEmpty()) {
                    failed++;
                    errors.add("ID vazio ou nulo fornecido");
                    log.warn("âš ï¸ ID vazio ou nulo fornecido para exclusÃ£o");
                    continue;
                }

                String trimmedId = id.trim();

                // Validar formato UUID
                try {
                    UUID.fromString(trimmedId);
                } catch (IllegalArgumentException e) {
                    failed++;
                    String error = "ID invÃ¡lido (nÃ£o Ã© um UUID vÃ¡lido): " + trimmedId;
                    errors.add(error);
                    log.warn("âš ï¸ {}", error);
                    continue;
                }

                // Tentar excluir cada comprovante
                try {
                    deleteByIdInTransaction(trimmedId);
                    deleted++;
                    log.info("âœ… Comprovante excluÃ­do com sucesso: {}", trimmedId);
                } catch (IllegalArgumentException e) {
                    failed++;
                    String error = "ID invÃ¡lido " + trimmedId + ": " + e.getMessage();
                    errors.add(error);
                    log.error("âŒ {}", error);
                } catch (Exception e) {
                    failed++;
                    String errorMsg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
                    String error = "Erro ao excluir comprovante " + trimmedId + ": " + errorMsg;
                    errors.add(error);
                    log.error("âŒ Erro ao excluir comprovante {}: {}", trimmedId, errorMsg, e);
                }
            } catch (Exception e) {
                failed++;
                String errorMsg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
                String error = "Erro inesperado ao processar ID " + id + ": " + errorMsg;
                errors.add(error);
                log.error("âŒ Erro inesperado ao processar ID {}: {}", id, errorMsg, e);
            }
        }

        result.put("deleted", deleted);
        result.put("failed", failed);
        result.put("errors", errors);

        log.info("âœ… ExclusÃ£o mÃºltipla concluÃ­da: {} excluÃ­dos, {} falharam", deleted, failed);
        return result;
    }
}
