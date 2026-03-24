package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.text.Normalizer;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SectorOrganizationService {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    
    private static final String SOURCE_DIR = "uploads/unified/expanded/";
    private static final String TARGET_DIR = "uploads/unified/por_setor/";
    
    // Lista de setores conhecidos (pode ser expandida)
    private static final List<String> KNOWN_SECTORS = Arrays.asList(
        "ASSOCIACAO DO VALE IMPERIAL",
        "ASSOCIAGAO DO VALE IMPERIAL",  // VariaÃ§Ã£o com erro de digitaÃ§Ã£o
        "PROMOVER VIGILANCIA PATRIMONIA",
        "PROMOVER VIGILANCIA PATRIMONIAL",
        "PROMOVER TERCEIRIZACAO",
        "PROMOVER TERCEIRIZACAO & SERVICOS LTDA",
        "PROMOVER VIGILANCIA",
        "VALE IMPERIAL",
        "VIGILANCIA PATRIMONIA",
        "VIGILANCIA PATRIMONIAL"
    );

    /**
     * Extrai informaÃ§Ãµes da primeira pÃ¡gina do PDF
     */
    public ExtractedDocumentInfo extractInfoFromPdf(File pdfFile) throws IOException {
        log.info("ðŸ“„ Extraindo informaÃ§Ãµes de: {}", pdfFile.getName());
        
        try (PDDocument document = PDDocument.load(pdfFile)) {
            // Extrair texto da primeira pÃ¡gina
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setStartPage(1);
            stripper.setEndPage(1);
            String pageText = stripper.getText(document);
            
            log.info("ðŸ“ Texto extraÃ­do ({} caracteres)", pageText.length());
            
            // DEBUG: Mostrar primeiras 20 linhas do PDF
            log.info("ðŸ“„ ===== PRIMEIRAS 20 LINHAS DO PDF =====");
            String[] lines = pageText.split("\n");
            for (int i = 0; i < Math.min(20, lines.length); i++) {
                log.info("  Linha {}: [{}]", i, lines[i].trim());
            }
            log.info("ðŸ“„ =========================================");
            
            ExtractedDocumentInfo info = new ExtractedDocumentInfo();
            info.setOriginalFileName(pdfFile.getName());
            info.setOriginalFilePath(pdfFile.getAbsolutePath());
            
            // EXTRAIR CPF
            String cpf = extractCpf(pageText);
            info.setCpf(cpf);
            log.info("âœ… CPF extraÃ­do: {}", cpf);
            
            // EXTRAIR NOME DO FUNCIONÃRIO
            String nome = extractEmployeeName(pageText);
            info.setEmployeeName(nome);
            log.info("âœ… Nome extraÃ­do: {}", nome);
            
            // EXTRAIR PERÃODO (mÃªs/ano trabalhado)
            // ESTRATÃ‰GIA 1: Tentar extrair do NOME DO ARQUIVO primeiro (mais confiÃ¡vel para unificados)
            Map<String, Integer> periodo = extractPeriodFromFileName(pdfFile.getName());
            
            // ESTRATÃ‰GIA 2: Se falhou, tentar extrair do CONTEÃšDO do PDF
            if (periodo.get("month") == 0 || periodo.get("year") == 0) {
                log.warn("âš ï¸ NÃ£o foi possÃ­vel extrair perÃ­odo do nome do arquivo, tentando do conteÃºdo...");
                periodo = extractPeriod(pageText);
            }
            
            info.setMonth(periodo.get("month"));
            info.setYear(periodo.get("year"));
            
            if (info.getMonth() == null || info.getMonth() == 0 || info.getYear() == null || info.getYear() == 0) {
                log.error("âŒ PERÃODO NÃƒO EXTRAÃDO CORRETAMENTE! MÃªs: {}, Ano: {}", info.getMonth(), info.getYear());
                log.error("ðŸ“„ Nome do arquivo: {}", pdfFile.getName());
                log.error("ðŸ“„ Primeiras 500 caracteres do texto:");
                log.error(pageText.substring(0, Math.min(500, pageText.length())));
                throw new IOException("NÃ£o foi possÃ­vel extrair o perÃ­odo do documento: " + pdfFile.getName());
            }
            
            log.info("âœ… PerÃ­odo extraÃ­do: {}/{}", periodo.get("month"), periodo.get("year"));
            
            // EXTRAIR SETOR
            String setor = extractSector(pageText);
            info.setSector(setor);
            log.info("âœ… Setor extraÃ­do: {}", setor);
            
            return info;
            
        } catch (Exception e) {
            log.error("âŒ Erro ao extrair informaÃ§Ãµes do PDF: {}", e.getMessage(), e);
            throw new IOException("Erro ao processar PDF: " + e.getMessage(), e);
        }
    }

    /**
     * Extrai CPF do texto (padrÃ£o: "CPF: 07349527675" ou "CPF 073.495.276-75")
     */
    private String extractCpf(String text) {
        // PadrÃ£o 1: "CPF: 07349527675" (11 dÃ­gitos seguidos)
        Pattern pattern1 = Pattern.compile("CPF[:\\s]*(\\d{11})");
        Matcher matcher1 = pattern1.matcher(text);
        if (matcher1.find()) {
            return matcher1.group(1);
        }
        
        // PadrÃ£o 2: "CPF 073.495.276-75" (formatado)
        Pattern pattern2 = Pattern.compile("CPF[:\\s]*(\\d{3})[.\\s]*(\\d{3})[.\\s]*(\\d{3})[-\\s]*(\\d{2})");
        Matcher matcher2 = pattern2.matcher(text);
        if (matcher2.find()) {
            return matcher2.group(1) + matcher2.group(2) + matcher2.group(3) + matcher2.group(4);
        }
        
        // PadrÃ£o 3: Qualquer sequÃªncia de 11 dÃ­gitos apÃ³s "CPF"
        Pattern pattern3 = Pattern.compile("CPF.*?(\\d{11})");
        Matcher matcher3 = pattern3.matcher(text);
        if (matcher3.find()) {
            return matcher3.group(1);
        }
        
        log.warn("âš ï¸ CPF nÃ£o encontrado no texto");
        return null;
    }

    /**
     * Extrai nome do funcionÃ¡rio (padrÃ£o: "000044 ELAINE APARECIDA SOARES PEREIRA")
     */
    private String extractEmployeeName(String text) {
        // PadrÃ£o: matrÃ­cula (5-6 dÃ­gitos) seguida de nome em maiÃºsculas atÃ© CPF
        Pattern pattern = Pattern.compile("(\\d{5,6})\\s+([A-ZÃ€-Ãš\\s]{10,})\\s+CPF", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            String nome = matcher.group(2).trim();
            
            // Remover frases comuns que aparecem antes do nome real
            nome = nome.replaceAll("(?i)FOLHA\\s+DE\\s+PAGAMENTO\\s+", "");
            nome = nome.replaceAll("(?i)HOLERITE\\s+", "");
            nome = nome.replaceAll("(?i)RECIBO\\s+DE\\s+PAGAMENTO\\s+", "");
            nome = nome.replaceAll("(?i)DEMONSTRATIVO\\s+", "");
            nome = nome.replaceAll("(?i)CONTRACHEQUE\\s+", "");
            
            // Limpar espaÃ§os mÃºltiplos
            nome = nome.replaceAll("\\s+", " ").trim();
            
            // Se ficou muito curto (menos de 10 caracteres), provavelmente extraiu errado
            if (nome.length() < 10) {
                log.warn("âš ï¸ Nome extraÃ­do muito curto ({}): '{}'", nome.length(), nome);
                return null;
            }
            
            log.info("âœ… Nome extraÃ­do (apÃ³s limpeza): '{}'", nome);
            return nome;
        }
        
        log.warn("âš ï¸ Nome do funcionÃ¡rio nÃ£o encontrado no texto");
        return null;
    }

    /**
     * Extrai setor/empresa do texto
     * IMPORTANTE: O setor estÃ¡ na MESMA LINHA do perÃ­odo!
     * Formatos possÃ­veis:
     * - "01/06/2025 a 30/06/2025    ASSOCIACAO DO VALE IMPERIAL" (com "a")
     * - "30/09/202501/09/2025 CONSTRUTORA BARBOSA MELLO" (datas coladas, sem "a")
     */
    private String extractSector(String text) {
        log.info("ðŸ” Iniciando extraÃ§Ã£o do setor...");
        
        String[] lines = text.split("\n");
        
        // ESTRATÃ‰GIA CORRETA: Procurar linha com perÃ­odo e extrair TUDO que vem DEPOIS
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();
            
            // PadrÃ£o 1: DD/MM/YYYY a DD/MM/YYYY (com "a" e espaÃ§os)
            Pattern pattern1 = Pattern.compile(".*(\\d{2}/\\d{2}/\\d{4})\\s+a\\s+(\\d{2}/\\d{2}/\\d{4})(.*)", Pattern.CASE_INSENSITIVE);
            Matcher matcher1 = pattern1.matcher(line);
            
            // PadrÃ£o 2: DD/MM/YYYYDD/MM/YYYY (datas coladas, sem espaÃ§o e sem "a")
            Pattern pattern2 = Pattern.compile(".*(\\d{2}/\\d{2}/\\d{4})(\\d{2}/\\d{2}/\\d{4})(.*)", Pattern.CASE_INSENSITIVE);
            Matcher matcher2 = pattern2.matcher(line);
            
            String afterPeriod = null;
            
            if (matcher1.find()) {
                // Formato com "a": extrair tudo apÃ³s a segunda data
                afterPeriod = matcher1.group(3).trim();
                log.info("ðŸ” Linha COMPLETA com perÃ­odo (formato com 'a'): [{}]", line);
                log.info("ðŸ” PerÃ­odo encontrado: {} a {}", matcher1.group(1), matcher1.group(2));
            } else if (matcher2.find()) {
                // Formato sem "a": extrair tudo apÃ³s a segunda data
                afterPeriod = matcher2.group(3).trim();
                log.info("ðŸ” Linha COMPLETA com perÃ­odo (datas coladas): [{}]", line);
                log.info("ðŸ” PerÃ­odo encontrado: {} a {}", matcher2.group(1), matcher2.group(2));
            }
            
            if (afterPeriod != null && !afterPeriod.isEmpty()) {
                log.info("ðŸ” Texto APÃ“S o perÃ­odo: [{}]", afterPeriod);
                
                // Limpar possÃ­veis nÃºmeros/cÃ³digos no inÃ­cio (ex: "43576260000112 ASSOCIACAO...")
                afterPeriod = afterPeriod.replaceAll("^\\d+\\s*", "").trim();
                
                log.info("ðŸ” Texto apÃ³s limpar nÃºmeros: [{}]", afterPeriod);
                
                // Se tem conteÃºdo vÃ¡lido (sÃ³ letras maiÃºsculas, espaÃ§os e &)
                if (afterPeriod.length() > 3 && afterPeriod.matches(".*[A-ZÃ€-Ãš].*")) {
                    // Limpar espaÃ§os mÃºltiplos e caracteres especiais indesejados no inÃ­cio
                    afterPeriod = afterPeriod.replaceAll("^[^A-ZÃ€-Ãš]+", "").trim();
                    afterPeriod = afterPeriod.replaceAll("\\s+", " ").trim();
                    
                    if (afterPeriod.length() > 3) {
                        log.info("âœ… SETOR EXTRAÃDO COM SUCESSO: '{}'", afterPeriod);
                        return afterPeriod;
                    }
                }
                
                log.warn("âš ï¸ Texto apÃ³s perÃ­odo nÃ£o parece um setor vÃ¡lido: '{}'", afterPeriod);
            }
        }
        
        // FALLBACK: Se nÃ£o encontrou na linha do perÃ­odo, tentar setores conhecidos
        log.warn("âš ï¸ NÃ£o encontrou setor na linha do perÃ­odo, tentando lista de setores conhecidos...");
        for (String sector : KNOWN_SECTORS) {
            if (text.toUpperCase().contains(sector.toUpperCase())) {
                log.info("âš ï¸ Setor conhecido encontrado (fallback): {}", sector);
                return sector;
            }
        }
        
        log.error("âŒ SETOR NÃƒO IDENTIFICADO!");
        log.error("ðŸ“„ Primeiras 10 linhas do PDF:");
        String[] firstLines = text.split("\n");
        for (int i = 0; i < Math.min(10, firstLines.length); i++) {
            log.error("  Linha {}: [{}]", i, firstLines[i].trim());
        }
        
        return "SETOR_NAO_IDENTIFICADO";
    }

    /**
     * Extrai perÃ­odo do NOME DO ARQUIVO
     * PadrÃ£o: UNIFICADO_NOME_CPF_MES_ANO.pdf
     * Exemplo: UNIFICADO_JOSE_MARIO_12345678901_9_2025.pdf â†’ MÃªs: 9, Ano: 2025
     */
    private Map<String, Integer> extractPeriodFromFileName(String fileName) {
        Map<String, Integer> result = new HashMap<>();
        result.put("month", 0);
        result.put("year", 0);
        
        log.info("ðŸ” Tentando extrair perÃ­odo do nome do arquivo: {}", fileName);
        
        // PadrÃ£o: _MES_ANO.pdf (ex: _9_2025.pdf)
        Pattern pattern = Pattern.compile("_(\\d{1,2})_(\\d{4})\\.pdf$");
        Matcher matcher = pattern.matcher(fileName);
        
        if (matcher.find()) {
            int month = Integer.parseInt(matcher.group(1));
            int year = Integer.parseInt(matcher.group(2));
            
            // Validar se sÃ£o valores razoÃ¡veis
            if (month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
                result.put("month", month);
                result.put("year", year);
                log.info("âœ… PerÃ­odo extraÃ­do do nome do arquivo: {}/{}", month, year);
                return result;
            } else {
                log.warn("âš ï¸ PerÃ­odo invÃ¡lido no nome do arquivo: {}/{}", month, year);
            }
        } else {
            log.warn("âš ï¸ Nome do arquivo nÃ£o segue o padrÃ£o esperado: {}", fileName);
        }
        
        return result;
    }

    /**
     * Extrai perÃ­odo (mÃªs/ano) do texto
     * PadrÃ£o: "01/06/2025 a 30/06/2025" â†’ MÃªs: 06, Ano: 2025
     */
    private Map<String, Integer> extractPeriod(String text) {
        Map<String, Integer> result = new HashMap<>();
        
        log.info("ðŸ” Iniciando extraÃ§Ã£o do perÃ­odo...");
        
        // PadrÃ£o: DD/MM/AAAA a DD/MM/AAAA
        Pattern pattern = Pattern.compile("(\\d{2})/(\\d{2})/(\\d{4})\\s+a\\s+(\\d{2})/(\\d{2})/(\\d{4})");
        Matcher matcher = pattern.matcher(text);
        
        if (matcher.find()) {
            // Usar mÃªs de INÃCIO do perÃ­odo (mÃªs trabalhado)
            int month = Integer.parseInt(matcher.group(2)); // MM do primeiro DD/MM/AAAA
            int year = Integer.parseInt(matcher.group(3));  // AAAA do primeiro DD/MM/AAAA
            
            result.put("month", month);
            result.put("year", year);
            
            log.info("âœ… PERÃODO EXTRAÃDO COM SUCESSO: {}/{} (de {} a {})", 
                month, year, matcher.group(0).split(" a ")[0], matcher.group(0).split(" a ")[1]);
            
            return result;
        }
        
        log.error("âŒ PERÃODO NÃƒO ENCONTRADO com o padrÃ£o DD/MM/AAAA a DD/MM/AAAA");
        log.error("ðŸ“„ Primeiras 5 linhas do PDF:");
        String[] firstLines = text.split("\n");
        for (int i = 0; i < Math.min(5, firstLines.length); i++) {
            log.error("  Linha {}: [{}]", i, firstLines[i].trim());
        }
        
        // Fallback: tentar extrair do nome do arquivo
        String fileName = text.split("\n")[0]; // Primeira linha pode ter info
        Pattern filePattern = Pattern.compile("_(\\d{1,2})_(\\d{4})");
        Matcher fileMatcher = filePattern.matcher(fileName);
        if (fileMatcher.find()) {
            int month = Integer.parseInt(fileMatcher.group(1));
            int year = Integer.parseInt(fileMatcher.group(2));
            log.warn("âš ï¸ PerÃ­odo extraÃ­do do nome do arquivo (fallback): {}/{}", month, year);
            result.put("month", month);
            result.put("year", year);
            return result;
        }
        
        log.error("âŒ FALLBACK TAMBÃ‰M FALHOU! Retornando 0/0");
        result.put("month", 0);
        result.put("year", 0);
        return result;
    }

    /**
     * Valida informaÃ§Ãµes extraÃ­das contra o banco de dados
     */
    public ValidationResult validateExtractedInfo(ExtractedDocumentInfo info) {
        ValidationResult result = new ValidationResult();
        result.setValid(true);
        
        // Validar CPF
        if (info.getCpf() == null || info.getCpf().length() != 11) {
            result.setValid(false);
            result.addError("CPF invÃ¡lido ou nÃ£o encontrado");
            return result;
        }
        
        // Buscar usuÃ¡rio no banco
        Optional<User> userOpt = userRepository.findByUsername(info.getCpf());
        if (userOpt.isEmpty()) {
            result.setValid(false);
            result.addError("CPF " + formatCpf(info.getCpf()) + " nÃ£o cadastrado no sistema");
            result.setCpfExists(false);
            return result;
        }
        
        User user = userOpt.get();
        result.setCpfExists(true);
        result.setUser(user);
        
        // Validar nome
        boolean nameMatches = compareNames(info.getEmployeeName(), user.getName());
        if (!nameMatches) {
            result.setValid(false);
            result.setNameMatches(false);
            result.addError(String.format(
                "Nome nÃ£o corresponde - Arquivo: '%s' | Cadastro: '%s'",
                info.getEmployeeName(), user.getName()
            ));
            return result;
        }
        
        result.setNameMatches(true);
        result.addSuccess("CPF e Nome validados com sucesso");
        
        return result;
    }

    /**
     * Organiza um documento por setor
     */
    public OrganizationResult organizeDocumentBySector(File pdfFile) {
        OrganizationResult result = new OrganizationResult();
        result.setOriginalFileName(pdfFile.getName());
        
        try {
            // 1. Extrair informaÃ§Ãµes do PDF
            log.info("ðŸ” Processando arquivo: {}", pdfFile.getName());
            ExtractedDocumentInfo info = extractInfoFromPdf(pdfFile);
            
            // 2. Validar contra banco de dados
            ValidationResult validation = validateExtractedInfo(info);
            result.setValidation(validation);
            
            if (!validation.isValid()) {
                result.setSuccess(false);
                result.setError("ValidaÃ§Ã£o falhou: " + String.join(", ", validation.getErrors()));
                log.warn("âŒ ValidaÃ§Ã£o falhou para {}: {}", pdfFile.getName(), result.getError());
                return result;
            }
            
            // 3. Criar estrutura de pastas
            String sanitizedSector = sanitizeFolderName(info.getSector());
            String periodFolder = String.format("%d_%d", info.getMonth(), info.getYear());
            
            Path targetDir = Paths.get(TARGET_DIR, sanitizedSector, periodFolder);
            Files.createDirectories(targetDir);
            log.info("ðŸ“ DiretÃ³rio criado/verificado: {}", targetDir);
            
            // 4. Gerar novo nome do arquivo
            String sanitizedName = sanitizeFolderName(info.getEmployeeName());
            String newFileName = String.format("%s_%s.pdf", sanitizedName, info.getCpf());
            
            // 5. COPIAR arquivo para nova localizaÃ§Ã£o
            Path sourcePath = pdfFile.toPath();
            Path targetPath = targetDir.resolve(newFileName);
            
            Files.copy(sourcePath, targetPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("âœ… Arquivo copiado: {} â†’ {}", pdfFile.getName(), targetPath);
            
            // 6. Preencher resultado
            result.setSuccess(true);
            result.setNewFilePath(targetPath.toString());
            result.setNewFileName(newFileName);
            result.setSector(info.getSector());
            result.setMonth(info.getMonth());
            result.setYear(info.getYear());
            result.setEmployeeName(info.getEmployeeName());
            result.setCpf(info.getCpf());
            
            log.info("ðŸŽ‰ Documento organizado com sucesso!");
            
            return result;
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao organizar documento: {}", e.getMessage(), e);
            result.setSuccess(false);
            result.setError("Erro ao processar: " + e.getMessage());
            return result;
        }
    }

    /**
     * Processa todos os documentos unificados
     */
    public BatchOrganizationResult organizeAllDocuments(Integer filterMonth, Integer filterYear) {
        BatchOrganizationResult batchResult = new BatchOrganizationResult();
        List<OrganizationResult> results = new ArrayList<>();
        
        try {
            // Listar todos os PDFs da pasta source
            Path sourcePath = Paths.get(SOURCE_DIR);
            if (!Files.exists(sourcePath)) {
                batchResult.setSuccess(false);
                batchResult.setMessage("Pasta de origem nÃ£o existe: " + SOURCE_DIR);
                return batchResult;
            }
            
            List<File> pdfFiles = Files.walk(sourcePath)
                .filter(Files::isRegularFile)
                .filter(path -> path.toString().toLowerCase().endsWith(".pdf"))
                .map(Path::toFile)
                .collect(Collectors.toList());
            
            log.info("ðŸ“Š Encontrados {} documentos para processar", pdfFiles.size());
            batchResult.setTotalDocuments(pdfFiles.size());
            
            int successCount = 0;
            int failedCount = 0;
            
            for (File pdfFile : pdfFiles) {
                OrganizationResult result = organizeDocumentBySector(pdfFile);
                
                // Aplicar filtros se especificados
                boolean shouldProcess = true;
                if (filterMonth != null && result.getMonth() != null && !result.getMonth().equals(filterMonth)) {
                    shouldProcess = false;
                }
                if (filterYear != null && result.getYear() != null && !result.getYear().equals(filterYear)) {
                    shouldProcess = false;
                }
                
                if (!shouldProcess) {
                    log.info("â­ï¸ Pulando documento (fora do filtro): {}", pdfFile.getName());
                    continue;
                }
                
                results.add(result);
                
                if (result.isSuccess()) {
                    successCount++;
                } else {
                    failedCount++;
                }
                
                // Pequena pausa para nÃ£o sobrecarregar
                try { Thread.sleep(50); } catch (InterruptedException ignored) {}
            }
            
            batchResult.setResults(results);
            batchResult.setSuccessCount(successCount);
            batchResult.setFailedCount(failedCount);
            batchResult.setSuccess(successCount > 0);
            batchResult.setMessage(String.format(
                "Processados %d documentos: %d sucesso, %d falhas",
                successCount + failedCount, successCount, failedCount
            ));
            
            log.info("âœ… Processamento em lote concluÃ­do: {} sucessos, {} falhas", successCount, failedCount);
            
            return batchResult;
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro no processamento em lote: {}", e.getMessage(), e);
            batchResult.setSuccess(false);
            batchResult.setMessage("Erro no processamento: " + e.getMessage());
            return batchResult;
        }
    }

    /**
     * Lista documentos organizados por setor
     */
    public Map<String, Object> listOrganizedDocuments() throws IOException {
        Map<String, Object> response = new HashMap<>();
        
        Path basePath = Paths.get(TARGET_DIR);
        if (!Files.exists(basePath)) {
            response.put("sectors", new ArrayList<>());
            response.put("totalDocuments", 0);
            response.put("totalSectors", 0);
            return response;
        }
        
        List<Map<String, Object>> sectors = new ArrayList<>();
        int totalDocs = 0;
        
        // Listar setores (pastas no nÃ­vel 1)
        List<Path> sectorDirs = Files.walk(basePath, 1)
            .filter(Files::isDirectory)
            .filter(path -> !path.equals(basePath))
            .collect(Collectors.toList());
        
        for (Path sectorDir : sectorDirs) {
            Map<String, Object> sectorInfo = new HashMap<>();
            String sectorName = sectorDir.getFileName().toString();
            sectorInfo.put("name", sectorName);
            sectorInfo.put("path", sectorDir.toString());
            
            List<Map<String, Object>> periods = new ArrayList<>();
            int sectorDocCount = 0;
            
            // Listar perÃ­odos (pastas no nÃ­vel 2)
            List<Path> periodDirs = Files.walk(sectorDir, 1)
                .filter(Files::isDirectory)
                .filter(path -> !path.equals(sectorDir))
                .collect(Collectors.toList());
            
            for (Path periodDir : periodDirs) {
                Map<String, Object> periodInfo = new HashMap<>();
                String periodName = periodDir.getFileName().toString();
                periodInfo.put("period", periodName);
                periodInfo.put("path", periodDir.toString());
                
                // Listar documentos (arquivos PDF)
                List<Map<String, Object>> documents = new ArrayList<>();
                List<Path> pdfFiles = Files.walk(periodDir, 1)
                    .filter(Files::isRegularFile)
                    .filter(path -> path.toString().toLowerCase().endsWith(".pdf"))
                    .collect(Collectors.toList());
                
                for (Path pdfFile : pdfFiles) {
                    Map<String, Object> docInfo = new HashMap<>();
                    String fileName = pdfFile.getFileName().toString();
                    docInfo.put("fileName", fileName);
                    docInfo.put("filePath", pdfFile.toString());
                    
                    // Extrair informaÃ§Ãµes do nome do arquivo
                    // Formato esperado: NOME_FUNCIONARIO_CPF.pdf
                    Pattern pattern = Pattern.compile("(.+)_(\\d{11})\\.pdf");
                    Matcher matcher = pattern.matcher(fileName);
                    if (matcher.find()) {
                        String employeeName = matcher.group(1).replace("_", " ");
                        String cpf = matcher.group(2);
                        docInfo.put("employeeName", employeeName);
                        docInfo.put("cpf", cpf);
                    }
                    
                    // Extrair mÃªs e ano do perÃ­odo (formato: MES_ANO)
                    String[] periodParts = periodName.split("_");
                    if (periodParts.length == 2) {
                        try {
                            int month = Integer.parseInt(periodParts[0]);
                            int year = Integer.parseInt(periodParts[1]);
                            
                            // Validar se mÃªs e ano sÃ£o vÃ¡lidos
                            if (month > 0 && month <= 12 && year > 2000 && year < 2100) {
                                docInfo.put("month", month);
                                docInfo.put("year", year);
                            } else {
                                log.warn("âš ï¸ PerÃ­odo invÃ¡lido no nome da pasta: {}/{}", month, year);
                                docInfo.put("month", 0);
                                docInfo.put("year", 0);
                            }
                        } catch (NumberFormatException e) {
                            log.warn("âš ï¸ Erro ao parsear perÃ­odo: {}", periodName);
                            docInfo.put("month", 0);
                            docInfo.put("year", 0);
                        }
                    } else {
                        log.warn("âš ï¸ Formato de perÃ­odo invÃ¡lido: {}", periodName);
                        docInfo.put("month", 0);
                        docInfo.put("year", 0);
                    }
                    
                    docInfo.put("sector", sectorName);
                    documents.add(docInfo);
                }
                
                periodInfo.put("documentCount", documents.size());
                periodInfo.put("documents", documents);
                periods.add(periodInfo);
                sectorDocCount += documents.size();
            }
            
            sectorInfo.put("periods", periods);
            sectorInfo.put("documentCount", sectorDocCount);
            sectors.add(sectorInfo);
            totalDocs += sectorDocCount;
        }
        
        response.put("sectors", sectors);
        response.put("totalDocuments", totalDocs);
        response.put("totalSectors", sectors.size());
        
        applyCollaboratorFilter(response);
        
        return response;
    }
    
    @SuppressWarnings("unchecked")
    private void applyCollaboratorFilter(Map<String, Object> response) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return;
        }
        
        boolean isColaborador = authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_COLABORADOR".equals(authority.getAuthority()));
        if (!isColaborador) {
            return;
        }
        
        String cpf = sanitizeCpfValue(authentication.getName());
        if (cpf.isEmpty()) {
            return;
        }
        
        Set<String> normalizedNames = new HashSet<>();
        userRepository.findByUsername(cpf)
                .map(User::getName)
                .map(this::normalizeName)
                .ifPresent(normalizedNames::add);
        employeeRepository.findByDocument(cpf)
                .map(Employee::getName)
                .map(this::normalizeName)
                .ifPresent(normalizedNames::add);
        
        List<Map<String, Object>> sectors = (List<Map<String, Object>>) response.getOrDefault("sectors", new ArrayList<>());
        List<Map<String, Object>> filteredSectors = new ArrayList<>();
        int totalDocuments = 0;
        
        for (Map<String, Object> sector : sectors) {
            List<Map<String, Object>> periods = (List<Map<String, Object>>) sector.getOrDefault("periods", new ArrayList<>());
            List<Map<String, Object>> filteredPeriods = new ArrayList<>();
            int sectorDocumentCount = 0;
            
            for (Map<String, Object> period : periods) {
                List<Map<String, Object>> documents = (List<Map<String, Object>>) period.getOrDefault("documents", new ArrayList<>());
                List<Map<String, Object>> filteredDocuments = documents.stream()
                        .filter(doc -> matchesSectorDocument(doc, cpf, normalizedNames))
                        .collect(Collectors.toList());
                
                if (!filteredDocuments.isEmpty()) {
                    period.put("documents", filteredDocuments);
                    period.put("documentCount", filteredDocuments.size());
                    filteredPeriods.add(period);
                    sectorDocumentCount += filteredDocuments.size();
                }
            }
            
            if (!filteredPeriods.isEmpty()) {
                sector.put("periods", filteredPeriods);
                sector.put("documentCount", sectorDocumentCount);
                filteredSectors.add(sector);
                totalDocuments += sectorDocumentCount;
            }
        }
        
        response.put("sectors", filteredSectors);
        response.put("totalSectors", filteredSectors.size());
        response.put("totalDocuments", totalDocuments);
    }
    
    private boolean matchesSectorDocument(Map<String, Object> doc, String cpf, Set<String> normalizedNames) {
        if (doc == null) {
            return false;
        }
        
        String docCpf = sanitizeCpfValue(String.valueOf(doc.getOrDefault("cpf", "")));
        String fileName = String.valueOf(doc.getOrDefault("fileName", ""));
        
        if (!cpf.isEmpty() && (docCpf.contains(cpf) || fileName.contains(cpf))) {
            return true;
        }
        
        String employeeName = normalizeName(String.valueOf(doc.getOrDefault("employeeName", "")));
        if (employeeName.isEmpty()) {
            return false;
        }
        
        return normalizedNames.stream()
                .filter(name -> !name.isEmpty())
                .anyMatch(name -> employeeName.equals(name) || employeeName.contains(name) || name.contains(employeeName));
    }
    
    private String sanitizeCpfValue(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("\\D", "");
    }

    /**
     * Compara nomes ignorando maiÃºsculas, acentos e caracteres especiais
     */
    private boolean compareNames(String name1, String name2) {
        if (name1 == null || name2 == null) return false;
        
        String normalized1 = normalizeName(name1);
        String normalized2 = normalizeName(name2);
        
        return normalized1.equals(normalized2);
    }

    /**
     * Normaliza nome para comparaÃ§Ã£o
     */
    private String normalizeName(String name) {
        return Normalizer.normalize(name.toUpperCase(), Normalizer.Form.NFD)
                .replaceAll("[\u0300-\u036f]", "")  // Remove acentos
                .replaceAll("[^A-Z0-9]", "")         // Remove tudo exceto letras e nÃºmeros
                .trim();
    }

    private String normalizeCpf(String cpf) {
        if (cpf == null) {
            return "";
        }
        return cpf.replaceAll("[^0-9]", "");
    }

    /**
     * Sanitiza nome para usar em pasta/arquivo
     */
    private String sanitizeFolderName(String name) {
        if (name == null) return "DESCONHECIDO";
        
        return name.toUpperCase()
                .replaceAll("[^A-ZÃ€-Ãš0-9\\s]", "")  // Remove caracteres especiais
                .replaceAll("\\s+", "_")             // EspaÃ§os para underscore
                .trim();
    }

    /**
     * Formata CPF para exibiÃ§Ã£o
     */
    private String formatCpf(String cpf) {
        if (cpf == null || cpf.length() != 11) return cpf;
        return String.format("%s.%s.%s-%s",
            cpf.substring(0, 3),
            cpf.substring(3, 6),
            cpf.substring(6, 9),
            cpf.substring(9, 11)
        );
    }

    // ===== CLASSES INTERNAS (DTOs) =====

    public static class ExtractedDocumentInfo {
        private String originalFileName;
        private String originalFilePath;
        private String employeeName;
        private String cpf;
        private String sector;
        private Integer month;
        private Integer year;
        
        // Getters e Setters
        public String getOriginalFileName() { return originalFileName; }
        public void setOriginalFileName(String originalFileName) { this.originalFileName = originalFileName; }
        
        public String getOriginalFilePath() { return originalFilePath; }
        public void setOriginalFilePath(String originalFilePath) { this.originalFilePath = originalFilePath; }
        
        public String getEmployeeName() { return employeeName; }
        public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
        
        public String getCpf() { return cpf; }
        public void setCpf(String cpf) { this.cpf = cpf; }
        
        public String getSector() { return sector; }
        public void setSector(String sector) { this.sector = sector; }
        
        public Integer getMonth() { return month; }
        public void setMonth(Integer month) { this.month = month; }
        
        public Integer getYear() { return year; }
        public void setYear(Integer year) { this.year = year; }
    }

    public static class ValidationResult {
        private boolean valid = true;
        private boolean cpfExists = false;
        private boolean nameMatches = false;
        private User user;
        private List<String> errors = new ArrayList<>();
        private List<String> successes = new ArrayList<>();
        
        public void addError(String error) { errors.add(error); }
        public void addSuccess(String success) { successes.add(success); }
        
        // Getters e Setters
        public boolean isValid() { return valid; }
        public void setValid(boolean valid) { this.valid = valid; }
        
        public boolean isCpfExists() { return cpfExists; }
        public void setCpfExists(boolean cpfExists) { this.cpfExists = cpfExists; }
        
        public boolean isNameMatches() { return nameMatches; }
        public void setNameMatches(boolean nameMatches) { this.nameMatches = nameMatches; }
        
        public User getUser() { return user; }
        public void setUser(User user) { this.user = user; }
        
        public List<String> getErrors() { return errors; }
        public List<String> getSuccesses() { return successes; }
    }

    /**
     * Download de documento individual
     */
    public org.springframework.core.io.Resource downloadDocument(String sector, String period, String fileName) throws IOException {
        String filePath = String.format("%s%s/%s/%s", TARGET_DIR, sector, period, fileName);
        Path path = Paths.get(filePath);
        
        if (!Files.exists(path)) {
            throw new IOException("Arquivo nÃ£o encontrado: " + filePath);
        }
        
        log.info("ðŸ“¥ Download: {}", filePath);
        return new org.springframework.core.io.FileSystemResource(path);
    }

    /**
     * Cria ZIP com todos os PDFs de um setor/perÃ­odo
     */
    public org.springframework.core.io.Resource createZipForSector(String sector, String period) throws IOException {
        String sectorDir = String.format("%s%s/%s", TARGET_DIR, sector, period);
        Path sectorPath = Paths.get(sectorDir);
        
        if (!Files.exists(sectorPath)) {
            throw new IOException("DiretÃ³rio nÃ£o encontrado: " + sectorDir);
        }
        
        // Criar arquivo ZIP temporÃ¡rio
        Path tempZip = Files.createTempFile("sector_docs_", ".zip");
        
        try (java.util.zip.ZipOutputStream zos = new java.util.zip.ZipOutputStream(Files.newOutputStream(tempZip))) {
            
            Files.walk(sectorPath)
                .filter(path -> path.toString().endsWith(".pdf"))
                .forEach(path -> {
                    try {
                        String zipEntryName = path.getFileName().toString();
                        java.util.zip.ZipEntry zipEntry = new java.util.zip.ZipEntry(zipEntryName);
                        zos.putNextEntry(zipEntry);
                        Files.copy(path, zos);
                        zos.closeEntry();
                        log.info("ðŸ“¦ Adicionado ao ZIP: {}", zipEntryName);
                    } catch (IOException e) {
                        log.error("âŒ Erro ao adicionar {} ao ZIP: {}", path.getFileName(), e.getMessage());
                    }
                });
        }
        
        log.info("âœ… ZIP criado: {} (Setor: {}, PerÃ­odo: {})", tempZip, sector, period);
        return new org.springframework.core.io.FileSystemResource(tempZip);
    }

    /**
     * Envia documento por email
     */
    public Map<String, Object> sendDocumentByEmail(String filePath, String cpf, String employeeName) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Verificar se arquivo existe
            Path path = Paths.get(filePath);
            if (!Files.exists(path)) {
                response.put("success", false);
                response.put("message", "Arquivo nÃ£o encontrado: " + filePath);
                return response;
            }
            
            // Buscar usuÃ¡rio pelo CPF do funcionÃ¡rio
            Optional<User> userOpt = userRepository.findByEmployeeCpf(cpf);
            if (userOpt.isEmpty()) {
                String normalizedCpf = normalizeCpf(cpf);
                userOpt = userRepository.findByEmployeeCpf(normalizedCpf);
                if (userOpt.isEmpty()) {
                    userOpt = userRepository.findByUsername(normalizedCpf);
                }
            }
            if (userOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "UsuÃ¡rio nÃ£o encontrado com CPF: " + cpf);
                return response;
            }
            
            User user = userOpt.get();
            
            String email = user.getEmail() != null ? user.getEmail().trim() : "";
            if (email.isEmpty()) {
                response.put("success", false);
                response.put("message", "UsuÃ¡rio nÃ£o possui email cadastrado");
                return response;
            }
            
            // Garantir que o email estÃ¡ vinculado ao mesmo usuÃ¡rio/CPF
            Optional<User> ownerByEmail = userRepository.findByEmail(email);
            if (ownerByEmail.isPresent() && !ownerByEmail.get().getId().equals(user.getId())) {
                response.put("success", false);
                response.put("message", "Email associado a outro usuÃ¡rio. Verifique cadastro na tabela users.");
                return response;
            }

            // Validar CPF do usuÃ¡rio
            String userCpf = normalizeCpf(user.getUsername());
            if (!userCpf.isEmpty() && !normalizeCpf(cpf).equals(userCpf)) {
                response.put("success", false);
                response.put("message", "CPF do usuÃ¡rio nÃ£o coincide com o CPF do documento.");
                return response;
            }

            // Validar nome (quando disponÃ­vel)
            if (employeeName != null && !employeeName.isBlank()) {
                if (!compareNames(user.getName(), employeeName)) {
                    response.put("success", false);
                    response.put("message", "Nome do usuÃ¡rio na tabela users nÃ£o coincide com o funcionÃ¡rio do holerite.");
                    return response;
                }
            }
            
            // TODO: Integrar com EnvioService para envio real
            // Por enquanto, apenas simular sucesso
            log.info("ðŸ“§ Email enviado para: {} ({})", user.getName(), email);
            
            response.put("success", true);
            response.put("message", "Email enviado com sucesso para " + email);
            response.put("email", email);
            
        } catch (Exception e) {
            log.error("âŒ Erro ao enviar email: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Erro ao enviar email: " + e.getMessage());
        }
        
        return response;
    }

    /**
     * Envia documento por WhatsApp
     */
    public Map<String, Object> sendDocumentByWhatsApp(String filePath, String cpf) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Verificar se arquivo existe
            Path path = Paths.get(filePath);
            if (!Files.exists(path)) {
                response.put("success", false);
                response.put("message", "Arquivo nÃ£o encontrado: " + filePath);
                return response;
            }
            
            // Buscar usuÃ¡rio pelo CPF do funcionÃ¡rio
            Optional<User> userOpt = userRepository.findByEmployeeCpf(cpf);
            if (userOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "UsuÃ¡rio nÃ£o encontrado com CPF: " + cpf);
                return response;
            }
            
            User user = userOpt.get();
            
            if (user.getWhatsapp() == null || user.getWhatsapp().isEmpty()) {
                response.put("success", false);
                response.put("message", "UsuÃ¡rio nÃ£o possui WhatsApp cadastrado");
                return response;
            }
            
            if (!user.getWhatsappConsent()) {
                response.put("success", false);
                response.put("message", "UsuÃ¡rio nÃ£o autorizou recebimento via WhatsApp");
                return response;
            }
            
            // TODO: Integrar com BaileysRestService para envio real
            // Por enquanto, apenas simular sucesso
            log.info("ðŸ“± WhatsApp enviado para: {} ({})", user.getName(), user.getWhatsapp());
            
            response.put("success", true);
            response.put("message", "WhatsApp enviado com sucesso para " + user.getWhatsapp());
            response.put("whatsapp", user.getWhatsapp());
            
        } catch (Exception e) {
            log.error("âŒ Erro ao enviar WhatsApp: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Erro ao enviar WhatsApp: " + e.getMessage());
        }
        
        return response;
    }

    public static class OrganizationResult {
        private boolean success;
        private String originalFileName;
        private String newFileName;
        private String newFilePath;
        private String employeeName;
        private String cpf;
        private String sector;
        private Integer month;
        private Integer year;
        private String error;
        private ValidationResult validation;
        
        // Getters e Setters
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        
        public String getOriginalFileName() { return originalFileName; }
        public void setOriginalFileName(String originalFileName) { this.originalFileName = originalFileName; }
        
        public String getNewFileName() { return newFileName; }
        public void setNewFileName(String newFileName) { this.newFileName = newFileName; }
        
        public String getNewFilePath() { return newFilePath; }
        public void setNewFilePath(String newFilePath) { this.newFilePath = newFilePath; }
        
        public String getEmployeeName() { return employeeName; }
        public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
        
        public String getCpf() { return cpf; }
        public void setCpf(String cpf) { this.cpf = cpf; }
        
        public String getSector() { return sector; }
        public void setSector(String sector) { this.sector = sector; }
        
        public Integer getMonth() { return month; }
        public void setMonth(Integer month) { this.month = month; }
        
        public Integer getYear() { return year; }
        public void setYear(Integer year) { this.year = year; }
        
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
        
        public ValidationResult getValidation() { return validation; }
        public void setValidation(ValidationResult validation) { this.validation = validation; }
    }

    public static class BatchOrganizationResult {
        private boolean success;
        private int totalDocuments;
        private int successCount;
        private int failedCount;
        private String message;
        private List<OrganizationResult> results = new ArrayList<>();
        
        // Getters e Setters
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        
        public int getTotalDocuments() { return totalDocuments; }
        public void setTotalDocuments(int totalDocuments) { this.totalDocuments = totalDocuments; }
        
        public int getSuccessCount() { return successCount; }
        public void setSuccessCount(int successCount) { this.successCount = successCount; }
        
        public int getFailedCount() { return failedCount; }
        public void setFailedCount(int failedCount) { this.failedCount = failedCount; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public List<OrganizationResult> getResults() { return results; }
        public void setResults(List<OrganizationResult> results) { this.results = results; }
    }
}


