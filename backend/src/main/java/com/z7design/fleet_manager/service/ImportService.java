package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.ImportResultDto;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.List;
import java.util.ArrayList;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImportService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    
    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public ImportResultDto importPdf(MultipartFile file) {
        ImportResultDto result = ImportResultDto.empty();
        try {
            byte[] fileBytes = file.getBytes();
            String text = extractTextFromPdf(fileBytes);
            log.info("Texto extraÃ­do do PDF: {} caracteres", text.length());

            List<EmployeeData> extracted = extractEmployeeData(text);
            log.info("Dados extraÃ­dos: {} funcionÃ¡rios encontrados", extracted.size());

            result.setTotalRows(extracted.size());

            for (EmployeeData data : extracted) {
                if (data.cpf == null || data.cpf.length() != 11) {
                    result.getErrors().add("CPF invÃ¡lido: " + (data.cpf == null ? "null" : data.cpf));
                    result.setSkipped(result.getSkipped() + 1);
                    continue;
                }

                try {
                    // EXTRAIR: apenas nome, CPF e WhatsApp do PDF
                    log.info("Processando dados extraÃ­dos - Nome: {}, CPF: {}, WhatsApp: {}", 
                             data.name, data.cpf, data.whatsapp);
                    
                    // Busca em cascata: CPF -> Nome -> WhatsApp
                    Optional<Employee> empOpt = Optional.empty();
                    String searchMethod = "";
                    
                    // 1. Tentar buscar por CPF primeiro
                    if (data.cpf != null && !data.cpf.trim().isEmpty()) {
                        empOpt = employeeRepository.findByCpf(normalizeDigits(data.cpf));
                        if (empOpt.isPresent()) {
                            searchMethod = "CPF";
                            log.info("Employee encontrado por CPF: {}", data.cpf);
                        }
                    }
                    
                    // 2. Se nÃ£o encontrou por CPF, tentar por Nome
                    if (!empOpt.isPresent() && data.name != null && !data.name.trim().isEmpty()) {
                        empOpt = employeeRepository.findByNameExact(data.name.trim());
                        if (empOpt.isPresent()) {
                            searchMethod = "Nome";
                            log.info("Employee encontrado por Nome: {}", data.name);
                        }
                    }
                    
                    // 3. Se nÃ£o encontrou por CPF nem Nome, tentar por WhatsApp
                    if (!empOpt.isPresent() && data.whatsapp != null && !data.whatsapp.trim().isEmpty()) {
                        String whatsappNormalized = normalizeDigits(data.whatsapp.trim());
                        empOpt = employeeRepository.findByWhatsApp(whatsappNormalized);
                        if (empOpt.isPresent()) {
                            searchMethod = "WhatsApp";
                            log.info("Employee encontrado por WhatsApp: {}", whatsappNormalized);
                        }
                    }
                    
                    // Se encontrou o Employee, verificar se jÃ¡ tem nome e atualizar whatsapp
                    if (empOpt.isPresent()) {
                        Employee emp = empOpt.get();
                        
                        // Verificar se jÃ¡ tem nome na coluna name
                        if (emp.getName() != null && !emp.getName().trim().isEmpty()) {
                            log.info("Employee encontrado por {} e possui nome '{}', atualizando whatsapp...", 
                                    searchMethod, emp.getName());
                            
                            // Normalizar WhatsApp extraÃ­do do PDF (apenas dÃ­gitos)
                            String whatsappValue = null;
                            if (data.whatsapp != null && !data.whatsapp.trim().isEmpty()) {
                                // Normalizar para formato numÃ©rico puro (remove tudo exceto dÃ­gitos)
                                whatsappValue = normalizeDigits(data.whatsapp.trim());
                                // Adicionar DDI 55 se nÃ£o tiver (garantir formato internacional)
                                if (!whatsappValue.startsWith("55") && whatsappValue.length() >= 10) {
                                    whatsappValue = "55" + whatsappValue;
                                }
                                // Garantir que tenha pelo menos 12 dÃ­gitos (55 + DDD + 9 dÃ­gitos)
                                if (whatsappValue.length() < 12) {
                                    log.warn("WhatsApp muito curto: {}, ignorando", whatsappValue);
                                    whatsappValue = null;
                                }
                            }
                            
                            // Update nativo para atualizar apenas a coluna whatsapp (nÃ£o document, nÃ£o name, nÃ£o cpf)
                            if (whatsappValue != null && !whatsappValue.isEmpty()) {
                                jakarta.persistence.Query updateQuery = entityManager.createNativeQuery(
                                    "UPDATE employees SET whatsapp = :whatsapp WHERE id = :id"
                                );
                                updateQuery.setParameter("whatsapp", whatsappValue);
                                updateQuery.setParameter("id", emp.getId());
                                
                                int updated = updateQuery.executeUpdate();
                                log.info("âœ… WhatsApp atualizado - ID: {}, Nome: {}, WhatsApp: {}", 
                                         emp.getId(), emp.getName(), whatsappValue);
                                
                                result.setUpdated(result.getUpdated() + 1);
                            } else {
                                log.warn("âš ï¸ WhatsApp nÃ£o foi extraÃ­do do PDF para CPF: {}", data.cpf);
                                result.setSkipped(result.getSkipped() + 1);
                            }
                        } else {
                            log.warn("âš ï¸ Employee encontrado por {} mas nÃ£o possui nome, pulando atualizaÃ§Ã£o", searchMethod);
                            result.setSkipped(result.getSkipped() + 1);
                        }
                    } else {
                        log.warn("âš ï¸ Employee nÃ£o encontrado no banco (CPF: {}, Nome: {}, WhatsApp: {}), pulando...", 
                                 data.cpf, data.name, data.whatsapp);
                        result.setSkipped(result.getSkipped() + 1);
                        result.getErrors().add("FuncionÃ¡rio nÃ£o encontrado (CPF: " + data.cpf + ", Nome: " + data.name + ")");
                    }

                    // Upsert User
                    Optional<User> userOpt = userRepository.findByUsername(data.cpf);
                    String whatsappForUser = null;
                    // Normaliza WhatsApp para o formato esperado pelo User (apenas dÃ­gitos, 9-20 caracteres)
                    if (data.whatsapp != null && !data.whatsapp.isEmpty()) {
                        String whatsappNormalized = normalizeDigits(data.whatsapp);
                        // Valida se estÃ¡ no range aceito pelo User (9-20 dÃ­gitos)
                        if (whatsappNormalized.length() >= 9 && whatsappNormalized.length() <= 20) {
                            whatsappForUser = whatsappNormalized;
                        }
                    }
                    
                    if (userOpt.isPresent()) {
                        User u = userOpt.get();
                        if (data.name != null && !data.name.isEmpty()) u.setName(data.name);
                        if (whatsappForUser != null) {
                            u.setWhatsapp(whatsappForUser);
                        }
                        userRepository.save(u);
                    } else {
                        User u = new User();
                        u.setUsername(data.cpf);
                        u.setName(data.name != null ? data.name : "FuncionÃ¡rio " + data.cpf);
                        // Email padrÃ£o baseado no CPF
                        u.setEmail("colaborador." + data.cpf + "@promovervigilancia.com.br");
                        // Password padrÃ£o no formato CPF@2025 (aceito pela validaÃ§Ã£o)
                        u.setPassword(data.cpf + "@2025");
                        if (whatsappForUser != null) {
                            u.setWhatsapp(whatsappForUser);
                        }
                        u.setActive(true);
                        userRepository.save(u);
                    }
                } catch (Exception e) {
                    log.error("Erro ao importar CPF: {}", data.cpf, e);
                    result.getErrors().add("Falha ao importar cpf=" + data.cpf + ": " + e.getMessage());
                    result.setSkipped(result.getSkipped() + 1);
                }
            }
        } catch (Exception e) {
            log.error("Erro geral na importaÃ§Ã£o", e);
            result.getErrors().add("Erro geral: " + e.getMessage());
        }
        return result;
    }

    private String extractTextFromPdf(byte[] pdfBytes) throws IOException {
        PDDocument doc = null;
        ByteArrayInputStream bis = null;
        try {
            bis = new ByteArrayInputStream(pdfBytes);
            doc = PDDocument.load(bis);
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(doc);
            return text;
        } finally {
            // Fechar documento PDF primeiro
            if (doc != null) {
                try {
                    doc.close();
                } catch (IOException e) {
                    log.warn("Erro ao fechar documento PDF: {}", e.getMessage());
                }
            }
            // Fechar stream de input
            if (bis != null) {
                try {
                    bis.close();
                } catch (IOException e) {
                    log.warn("Erro ao fechar stream: {}", e.getMessage());
                }
            }
        }
    }

    private List<EmployeeData> extractEmployeeData(String text) {
        List<EmployeeData> result = new ArrayList<>();
        // Regex para CPF: formato brasileiro (com ou sem formataÃ§Ã£o)
        Pattern cpfPattern = Pattern.compile("(\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2})");

        Matcher cpfMatcher = cpfPattern.matcher(text);
        while (cpfMatcher.find()) {
            String cpfRaw = cpfMatcher.group(1);
            String cpf = normalizeDigits(cpfRaw);
            if (cpf.length() == 11) {
                EmployeeData data = new EmployeeData();
                data.cpf = cpf;
                
                // Buscar nome e WhatsApp no contexto ao redor do CPF (500 caracteres antes e depois)
                int cpfPos = cpfMatcher.start();
                int contextStart = Math.max(0, cpfPos - 500);
                int contextEnd = Math.min(text.length(), cpfPos + 500);
                String context = text.substring(contextStart, contextEnd);
                
                // Extrair nome
                String extractedName = extractNameFromContext(context, cpfPos - contextStart);
                data.name = extractedName != null ? extractedName : null;
                log.debug("Nome extraÃ­do para CPF {}: {}", cpf, data.name);
                
                // Extrair WhatsApp
                String extractedWhats = extractWhatsAppFromContext(context);
                data.whatsapp = extractedWhats != null && !extractedWhats.isEmpty() ? extractedWhats : null;
                log.debug("WhatsApp extraÃ­do para CPF {}: {}", cpf, data.whatsapp);
                
                result.add(data);
            }
        }
        return result;
    }
    
    private String extractWhatsAppFromContext(String context) {
        // PadrÃµes para detectar WhatsApp - priorizar formato "+55 XX XXXX-XXXX"
        // PadrÃ£o 1: +55 XX XXXX-XXXX ou +55 XX 9XXXX-XXXX (formato internacional)
        Pattern pattern1 = Pattern.compile(
            "\\+55\\s*(\\d{2})\\s*(?:9)?(\\d{4})\\s*-?\\s*(\\d{4})",
            Pattern.CASE_INSENSITIVE
        );
        // PadrÃ£o 2: (XX) 9 XXXX-XXXX ou XX 9 XXXX-XXXX (formato nacional)
        Pattern pattern2 = Pattern.compile(
            "(?:\\+55\\s*)?(?:\\()?(\\d{2})(?:\\))?\\s*(?:9)?\\s*(\\d{4})(?:\\s*-?\\s*)?(\\d{4})",
            Pattern.CASE_INSENSITIVE
        );
        // PadrÃ£o 3: 55XX9XXXXXXXX (sem formataÃ§Ã£o)
        Pattern pattern3 = Pattern.compile("55(\\d{2})(?:9)?(\\d{8,9})");
        // PadrÃ£o 4: nÃºmeros com 10-13 dÃ­gitos que podem ser telefone
        Pattern pattern4 = Pattern.compile("(?:^|\\s|\\+)(\\d{10,13})(?:\\s|$)");
        
        // Tentar padrÃ£o 1 primeiro (formato +55 XX XXXX-XXXX)
        Matcher m1 = pattern1.matcher(context);
        if (m1.find()) {
            String ddd = m1.group(1);
            String parte1 = m1.group(2);
            String parte2 = m1.group(3);
            String whats = "55" + ddd + parte1 + parte2;
            log.debug("WhatsApp extraÃ­do (padrÃ£o 1): +55 {} {}-{}", ddd, parte1, parte2);
            return whats;
        }
        
        // Tentar padrÃ£o 2 (formato nacional com ou sem +55)
        Matcher m2 = pattern2.matcher(context);
        if (m2.find()) {
            String ddd = m2.group(1);
            String parte1 = m2.group(2);
            String parte2 = m2.group(3);
            String whats = ddd + parte1 + parte2;
            // Se tiver 10 dÃ­gitos, adiciona o 9 (celular)
            if (whats.length() == 10) {
                whats = ddd + "9" + parte1 + parte2;
            }
            if (whats.length() == 11 || whats.length() == 12) {
                String result = "55" + whats;
                log.debug("WhatsApp extraÃ­do (padrÃ£o 2): {}", result);
                return result;
            }
        }
        
        // Tentar padrÃ£o 3 (com DDI jÃ¡ presente - 55 jÃ¡ estÃ¡ na captura)
        Matcher m3 = pattern3.matcher(context);
        if (m3.find()) {
            String ddd = m3.group(1);
            String numero = m3.group(2);
            // O padrÃ£o jÃ¡ captura apÃ³s "55", entÃ£o sÃ³ concatenamos
            String result = "55" + ddd + numero;
            log.debug("WhatsApp extraÃ­do (padrÃ£o 3): {}", result);
            return result;
        }
        
        // Tentar padrÃ£o 4 (nÃºmero longo que pode ser telefone)
        Matcher m4 = pattern4.matcher(context);
        while (m4.find()) {
            String numero = m4.group(1);
            // Filtrar CPFs (11 dÃ­gitos comeÃ§ando com 0-3)
            if (numero.length() == 11 && numero.charAt(0) >= '0' && numero.charAt(0) <= '3') {
                continue; // Provavelmente Ã© um CPF, nÃ£o telefone
            }
            // Se tem 10-13 dÃ­gitos e parece ser telefone
            if (numero.length() >= 10 && numero.length() <= 13) {
                String result = numero.startsWith("55") ? numero : "55" + numero;
                log.debug("WhatsApp extraÃ­do (padrÃ£o 4): {}", result);
                return result;
            }
        }
        
        log.debug("WhatsApp nÃ£o encontrado no contexto");
        return ""; // NÃ£o encontrou WhatsApp
    }

    private String extractNameFromContext(String context, int relativeCpfPos) {
        // Procura por nome completo perto do CPF
        // PadrÃ£o 1: Nome completo (2-5 palavras, maiÃºsculas/minÃºsculas)
        Pattern namePattern1 = Pattern.compile(
            "([A-ZÃÃ‰ÃÃ“ÃšÃ‡Ã‚ÃŠÃ”ÃƒÃ•][a-zÃ¡Ã©Ã­Ã³ÃºÃ§Ã¢ÃªÃ´Ã£Ãµ]+(?:\\s+[A-ZÃÃ‰ÃÃ“ÃšÃ‡Ã‚ÃŠÃ”ÃƒÃ•][a-zÃ¡Ã©Ã­Ã³ÃºÃ§Ã¢ÃªÃ´Ã£Ãµ]+){1,4})",
            Pattern.CASE_INSENSITIVE
        );
        
        // PadrÃ£o 2: Nome todo em maiÃºsculas (comum em documentos)
        Pattern namePattern2 = Pattern.compile(
            "([A-ZÃÃ‰ÃÃ“ÃšÃ‡Ã‚ÃŠÃ”ÃƒÃ•]{2,}(?:\\s+[A-ZÃÃ‰ÃÃ“ÃšÃ‡Ã‚ÃŠÃ”ÃƒÃ•]{2,}){1,4})"
        );
        
        String bestMatch = null;
        int bestDistance = Integer.MAX_VALUE;
        
        // Buscar padrÃ£o 1 (nome normal)
        Matcher m1 = namePattern1.matcher(context);
        while (m1.find()) {
            String match = m1.group(1).trim();
            // Ignorar palavras muito curtas que podem ser labels
            if (match.length() < 6) continue;
            
            int namePos = m1.start();
            int distance = Math.abs(namePos - relativeCpfPos);
            if (distance < bestDistance && distance < 200) { // MÃ¡ximo 200 caracteres do CPF
                bestDistance = distance;
                bestMatch = match;
            }
        }
        
        // Se nÃ£o achou, buscar padrÃ£o 2 (todo maiÃºsculas)
        if (bestMatch == null) {
            Matcher m2 = namePattern2.matcher(context);
            while (m2.find()) {
                String match = m2.group(1).trim();
                // Ignorar palavras muito curtas
                if (match.length() < 6) continue;
                
                int namePos = m2.start();
                int distance = Math.abs(namePos - relativeCpfPos);
                if (distance < bestDistance && distance < 200) {
                    bestDistance = distance;
                    bestMatch = match;
                }
            }
        }
        
        // Retornar nome encontrado ou padrÃ£o
        if (bestMatch != null) {
            // Capitalizar primeira letra de cada palavra se estiver tudo maiÃºsculo
            if (bestMatch.equals(bestMatch.toUpperCase())) {
                String[] words = bestMatch.split("\\s+");
                StringBuilder capitalized = new StringBuilder();
                for (String word : words) {
                    if (capitalized.length() > 0) capitalized.append(" ");
                    if (word.length() > 0) {
                        capitalized.append(word.substring(0, 1).toUpperCase())
                                   .append(word.substring(1).toLowerCase());
                    }
                }
                return capitalized.toString();
            }
            return bestMatch;
        }
        
        return null; // Retornar null para usar fallback
    }

    private static class EmployeeData {
        String name;
        String cpf;
        String whatsapp;
    }

    private String normalizeDigits(String s) {
        return s == null ? "" : s.replaceAll("[^0-9]", "");
    }



    private String normalizePhone(String s) {
        String n = normalizeDigits(s);
        if (n.startsWith("55") && n.length() == 13 && n.charAt(4) == '9') {
            // remove 9 extra apÃ³s DDD
            n = n.substring(0, 4) + n.substring(5);
        }
        if (!n.startsWith("55") && (n.length() == 10 || n.length() == 11 || n.length() == 12)) {
            n = "55" + n;
            if (n.length() == 13 && n.charAt(4) == '9') {
                n = n.substring(0, 4) + n.substring(5);
            }
        }
        return n;
    }

    /**
     * Importa dados bancÃ¡rios de um arquivo CSV ou Excel
     * O arquivo deve conter: nome, agencia, contaCorrente (e opcionalmente banco)
     * Faz match pelo nome do funcionÃ¡rio na tabela employees
     */
    @Transactional
    public ImportResultDto importBankingData(MultipartFile file) {
        ImportResultDto result = ImportResultDto.empty();
        List<String> errors = new ArrayList<>();
        
        try {
            String fileName = file.getOriginalFilename();
            if (fileName == null || fileName.isEmpty()) {
                errors.add("Nome do arquivo invÃ¡lido");
                result.setErrors(errors);
                return result;
            }
            
            String extension = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
            List<BankingData> bankingDataList = new ArrayList<>();
            
            if ("csv".equals(extension)) {
                bankingDataList = parseCsv(file);
            } else if ("xlsx".equals(extension) || "xls".equals(extension)) {
                bankingDataList = parseExcel(file);
            } else {
                errors.add("Formato de arquivo nÃ£o suportado. Use CSV ou Excel (.xlsx, .xls)");
                result.setErrors(errors);
                return result;
            }
            
            result.setTotalRows(bankingDataList.size());
            
            int updated = 0;
            int skipped = 0;
            
            for (BankingData data : bankingDataList) {
                try {
                    if (data.name == null || data.name.trim().isEmpty()) {
                        skipped++;
                        errors.add("Linha ignorada: nome do funcionÃ¡rio vazio");
                        continue;
                    }
                    
                    // Buscar funcionÃ¡rio pelo nome (case-insensitive, trim)
                    Optional<Employee> employeeOpt = employeeRepository.findByNameExact(data.name.trim());
                    
                    if (employeeOpt.isEmpty()) {
                        skipped++;
                        errors.add(String.format("FuncionÃ¡rio nÃ£o encontrado: %s", data.name));
                        continue;
                    }
                    
                    Employee employee = employeeOpt.get();
                    
                    // Atualizar dados bancÃ¡rios
                    if (data.agencia != null && !data.agencia.trim().isEmpty()) {
                        employee.setAgencia(data.agencia.trim());
                    }
                    if (data.contaCorrente != null && !data.contaCorrente.trim().isEmpty()) {
                        employee.setContaCorrente(data.contaCorrente.trim());
                    }
                    if (data.banco != null && !data.banco.trim().isEmpty()) {
                        employee.setBanco(data.banco.trim());
                    }
                    
                    employeeRepository.save(employee);
                    updated++;
                    log.info("Dados bancÃ¡rios atualizados para funcionÃ¡rio: {}", data.name);
                    
                } catch (Exception e) {
                    skipped++;
                    errors.add(String.format("Erro ao processar %s: %s", data.name, e.getMessage()));
                    log.error("Erro ao processar dados bancÃ¡rios para {}", data.name, e);
                }
            }
            
            result.setUpdated(updated);
            result.setSkipped(skipped);
            result.setErrors(errors);
            
            log.info("ImportaÃ§Ã£o bancÃ¡ria concluÃ­da: {} processados, {} atualizados, {} ignorados", 
                    bankingDataList.size(), updated, skipped);
            
        } catch (Exception e) {
            log.error("Erro ao importar dados bancÃ¡rios", e);
            errors.add("Erro ao processar arquivo: " + e.getMessage());
            result.setErrors(errors);
        }
        
        return result;
    }
    
    private List<BankingData> parseCsv(MultipartFile file) throws IOException {
        List<BankingData> dataList = new ArrayList<>();
        String content = new String(file.getBytes(), java.nio.charset.StandardCharsets.UTF_8);
        String[] lines = content.split("\n");
        
        // Pular header se existir
        int startIndex = 0;
        if (lines.length > 0 && (lines[0].toLowerCase().contains("nome") || lines[0].toLowerCase().contains("name"))) {
            startIndex = 1;
        }
        
        for (int i = startIndex; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isEmpty()) continue;
            
            // CSV simples: nome,agencia,contaCorrente,banco
            String[] parts = line.split(",");
            if (parts.length >= 3) {
                BankingData data = new BankingData();
                data.name = parts[0].trim().replace("\"", "");
                data.agencia = parts.length > 1 ? parts[1].trim().replace("\"", "") : null;
                data.contaCorrente = parts.length > 2 ? parts[2].trim().replace("\"", "") : null;
                data.banco = parts.length > 3 ? parts[3].trim().replace("\"", "") : null;
                dataList.add(data);
            }
        }
        
        return dataList;
    }
    
    private List<BankingData> parseExcel(MultipartFile file) throws IOException {
        List<BankingData> dataList = new ArrayList<>();
        // Para Excel, vamos usar uma abordagem simples lendo como texto
        // Em produÃ§Ã£o, seria melhor usar Apache POI
        try {
            // Tentar ler como CSV primeiro (Excel pode ser salvo como CSV)
            return parseCsv(file);
        } catch (Exception e) {
            log.warn("Erro ao ler Excel, tentando como texto: {}", e.getMessage());
            // Fallback: ler como texto e processar
            String content = new String(file.getBytes(), java.nio.charset.StandardCharsets.UTF_8);
            String[] lines = content.split("\n");
            
            for (String line : lines) {
                line = line.trim();
                if (line.isEmpty() || line.toLowerCase().contains("nome")) continue;
                
                // Tentar separar por tab ou espaÃ§o mÃºltiplo
                String[] parts = line.split("\t|\\s{2,}");
                if (parts.length >= 2) {
                    BankingData data = new BankingData();
                    data.name = parts[0].trim();
                    data.agencia = parts.length > 1 ? parts[1].trim() : null;
                    data.contaCorrente = parts.length > 2 ? parts[2].trim() : null;
                    data.banco = parts.length > 3 ? parts[3].trim() : null;
                    dataList.add(data);
                }
            }
        }
        return dataList;
    }
    
    private static class BankingData {
        String name;
        String agencia;
        String contaCorrente;
        String banco;
    }
}



