package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.CompanyTypeOrganizationResponse;
import com.z7design.fleet_manager.dto.PayslipOrganizationResponse;
import com.z7design.fleet_manager.dto.PayslipProcessedFileResponse;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.Payslip;
import com.z7design.fleet_manager.repository.PayslipRepository;
import com.z7design.fleet_manager.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.sourceforge.tess4j.TesseractException;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import com.z7design.fleet_manager.dto.PayslipComparisonResult;

import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.RoleRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import org.springframework.util.StringUtils;
import org.springframework.transaction.annotation.Transactional;
import java.time.Month;

@Service
@Slf4j
@RequiredArgsConstructor
public class PayslipService {

    private final PayslipRepository payslipRepository;
    private final TesseractService tesseractService;
    private final ExtractDataHoleritesService extractDataHoleritesService;
    private final CompanyRepository companyRepository;
    private final EmployeeRepository employeeRepository;
    private final UserService userService;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private static final String OUTPUT_DIR = "backend/holerites";
    private static final List<String> COMPANY_SIGLA_PRIORITY = List.of("TERC", "ADM", "VIG");

    public List<Payslip> processPayslipPDF(MultipartFile file) throws IOException {
        log.info("Iniciando processamento do arquivo: {}", file.getOriginalFilename());

        if (file.isEmpty()) {
            throw new IllegalArgumentException("O arquivo estÃ¡ vazio");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            throw new IllegalArgumentException("O arquivo deve ser um PDF");
        }

        List<Payslip> processedPayslips = new ArrayList<>();
        int pageCount = 0;
        int paginasProcessadas = 0;
        int paginasComErro = 0;
        int paginasPuladasPorDuplicidade = 0;

        try {
            // Create output directory if it doesn't exist
            Path outputPath = Paths.get(OUTPUT_DIR);
            if (!Files.exists(outputPath)) {
                Files.createDirectories(outputPath);
            }

            // Carregar arquivo em memÃ³ria para evitar problemas de stream fechado
            byte[] fileBytes = file.getBytes();
            log.info("ðŸ“¦ Arquivo carregado em memÃ³ria: {} bytes", fileBytes.length);

            if (fileBytes.length == 0) {
                log.error("âŒ Arquivo carregado estÃ¡ vazio!");
                throw new IllegalArgumentException("O arquivo estÃ¡ vazio apÃ³s carregamento");
            }

            try (PDDocument document = PDDocument.load(new java.io.ByteArrayInputStream(fileBytes))) {
                if (document.isEncrypted()) {
                    throw new IllegalArgumentException("O PDF estÃ¡ criptografado");
                }

                PDFTextStripper stripper = new PDFTextStripper();
                pageCount = document.getNumberOfPages();
                log.info("ðŸ“„ PDF contÃ©m {} pÃ¡gina(s) - Arquivo: {}", pageCount, file.getOriginalFilename());
                log.info("   ðŸ“Š Expectativa: {} holerite(s) serÃ£o processados (1 holerite por pÃ¡gina)", pageCount);

                if (pageCount == 0) {
                    log.error("âŒ ERRO: PDF nÃ£o contÃ©m pÃ¡ginas!");
                    return processedPayslips;
                }

                if (pageCount > 1000) {
                    log.warn("âš ï¸ ATENÃ‡ÃƒO: PDF muito grande ({} pÃ¡ginas). Processamento pode demorar.",
                            pageCount);
                }
                log.info("");
                log.info(
                        "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
                log.info("ðŸ” ETAPA 1: LENDO TODAS AS PÃGINAS E IDENTIFICANDO CPFs");
                log.info(
                        "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");

                // Estrutura para armazenar informaÃ§Ãµes de cada holerite encontrado
                class HoleriteInfo {
                    String cpf;
                    int pagina;
                    int posicaoNaPagina; // PosiÃ§Ã£o do CPF no texto da pÃ¡gina
                    String textoCompleto;
                    String secaoTexto; // SeÃ§Ã£o do texto correspondente a este CPF
                }

                List<HoleriteInfo> holeritesEncontrados = new ArrayList<>();
                Map<Integer, String> textosDasPaginas = new HashMap<>();

                // ETAPA 1: Ler todas as pÃ¡ginas e identificar todos os CPFs
                for (int i = 1; i <= pageCount; i++) {
                    log.info("ðŸ“– Lendo pÃ¡gina {}/{}", i, pageCount);
                    stripper.setStartPage(i);
                    stripper.setEndPage(i);
                    String pageText = stripper.getText(document);

                    // Verificar se o texto foi extraÃ­do
                    if (pageText == null || pageText.trim().isEmpty()) {
                        log.warn(
                                "âš ï¸ ATENÃ‡ÃƒO: PÃ¡gina {} nÃ£o contÃ©m texto extraÃ­vel. O PDF pode ser escaneado (imagem).",
                                i);
                        log.warn(
                                "âš ï¸ SOLUÃ‡ÃƒO: Use o endpoint /api/v1/document-processing/upload-payslips que suporta OCR.");
                        continue; // Pular esta pÃ¡gina
                    }

                    log.info("   ðŸ“ Texto extraÃ­do: {} caracteres", pageText.length());
                    if (pageText.length() < 50) {
                        log.warn(
                                "âš ï¸ ATENÃ‡ÃƒO: Texto muito curto ({} caracteres). O PDF pode ser escaneado (imagem).",
                                pageText.length());
                        log.warn(
                                "âš ï¸ SOLUÃ‡ÃƒO: Use o endpoint /api/v1/document-processing/upload-payslips que suporta OCR.");
                    }

                    textosDasPaginas.put(i, pageText);

                    // Identificar todos os CPFs nesta pÃ¡gina
                    List<String> cpfsUnicos = detectarTodosCPFsNaPagina(pageText);
                    log.info("   âœ… {} CPF(s) encontrado(s) na pÃ¡gina {}: {}", cpfsUnicos.size(), i, cpfsUnicos);

                    if (cpfsUnicos.isEmpty()) {
                        log.warn(
                                "âš ï¸ Nenhum CPF encontrado na pÃ¡gina {}. Verifique se o PDF contÃ©m texto ou se Ã© uma imagem escaneada.",
                                i);
                        log.warn(
                                "âš ï¸ SOLUÃ‡ÃƒO: Use o endpoint /api/v1/document-processing/upload-payslips que suporta OCR.");
                    }

                    // Para cada CPF, encontrar sua posiÃ§Ã£o no texto
                    for (String cpf : cpfsUnicos) {
                        HoleriteInfo info = new HoleriteInfo();
                        info.cpf = cpf;
                        info.pagina = i;
                        info.textoCompleto = pageText;

                        // Encontrar posiÃ§Ã£o do CPF no texto
                        String cpfFormatado = cpf.replaceAll("(\\d{3})(\\d{3})(\\d{3})(\\d{2})", "$1.$2.$3-$4");
                        Pattern[] cpfPatterns = {
                                Pattern.compile("CPF[:\\s]*" + cpfFormatado.replace(".", "\\.").replace("-", "\\-"),
                                        Pattern.CASE_INSENSITIVE),
                                Pattern.compile("CPF[:\\s]*" + cpf, Pattern.CASE_INSENSITIVE),
                                Pattern.compile(cpfFormatado.replace(".", "\\.").replace("-", "\\-")),
                                Pattern.compile(cpf)
                        };

                        for (Pattern pattern : cpfPatterns) {
                            Matcher matcher = pattern.matcher(pageText);
                            if (matcher.find()) {
                                info.posicaoNaPagina = matcher.start();
                                break;
                            }
                        }

                        holeritesEncontrados.add(info);
                    }
                }

                log.info("");
                log.info(
                        "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
                log.info("ðŸ“Š RESUMO DA ETAPA 1:");
                log.info("   Total de holerites encontrados: {}", holeritesEncontrados.size());
                log.info("   CPFs Ãºnicos: {}", holeritesEncontrados.stream().map(h -> h.cpf).distinct().count());
                log.info(
                        "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");

                if (holeritesEncontrados.isEmpty()) {
                    log.error("âŒ ERRO CRÃTICO: Nenhum CPF foi detectado em nenhuma pÃ¡gina do PDF!");
                    log.error("âŒ POSSÃVEIS CAUSAS:");
                    log.error("   1. O PDF Ã© uma imagem escaneada (nÃ£o contÃ©m texto extraÃ­vel)");
                    log.error("   2. O PDF estÃ¡ corrompido ou protegido");
                    log.error("   3. Os holerites nÃ£o contÃªm CPF no formato esperado");
                    log.error(
                            "âŒ SOLUÃ‡ÃƒO: Use o endpoint /api/v1/document-processing/upload-payslips que suporta OCR para PDFs escaneados.");
                    log.error("ðŸ“Š Tentando processar pÃ¡ginas mesmo sem CPF detectado (fallback)...");

                    // FALLBACK: Tentar processar pÃ¡ginas mesmo sem CPF detectado
                    // Pode ser que o CPF esteja em formato diferente ou o texto nÃ£o foi extraÃ­do
                    // corretamente
                    for (int i = 1; i <= pageCount; i++) {
                        try {
                            String pageText = textosDasPaginas.get(i);
                            if (pageText != null && !pageText.trim().isEmpty()) {
                                log.info("ðŸ”„ Tentando processar pÃ¡gina {} sem CPF detectado (fallback)", i);
                                Payslip payslip = extractPayslipInfo(pageText, i);
                                if (payslip != null && payslip.getCpf() != null) {
                                    log.info("âœ… CPF encontrado no fallback: {} na pÃ¡gina {}", payslip.getCpf(), i);
                                    if (processarHoleriteUnico(document, i, payslip, pageText, processedPayslips)) {
                                        paginasProcessadas++;
                                    }
                                }
                            }
                        } catch (Exception e) {
                            log.warn("âš ï¸ Erro ao processar pÃ¡gina {} no fallback: {}", i, e.getMessage());
                        }
                    }

                    if (processedPayslips.isEmpty()) {
                        log.error("âŒ Nenhum holerite foi processado mesmo com fallback");
                        return processedPayslips; // Retornar lista vazia
                    } else {
                        log.info("âœ… Fallback processou {} holerite(s)", processedPayslips.size());
                    }
                }

                log.info("");
                log.info(
                        "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
                log.info("ðŸ” ETAPA 2: IDENTIFICANDO EMPRESA E CNPJ PARA CADA CPF");
                log.info(
                        "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");

                // ETAPA 2: Para cada CPF, identificar empresa e CNPJ
                for (HoleriteInfo info : holeritesEncontrados) {
                    log.info("ðŸ” Processando CPF {} (pÃ¡gina {})", info.cpf, info.pagina);

                    // Dividir texto em seÃ§Ã£o correspondente ao CPF
                    String pageText = info.textoCompleto;
                    int posicaoCpf = info.posicaoNaPagina;

                    // Encontrar posiÃ§Ã£o do prÃ³ximo CPF (ou fim do texto)
                    int posicaoProximoCpf = pageText.length();
                    for (HoleriteInfo outro : holeritesEncontrados) {
                        if (outro.pagina == info.pagina && !outro.cpf.equals(info.cpf)
                                && outro.posicaoNaPagina > posicaoCpf) {
                            if (outro.posicaoNaPagina < posicaoProximoCpf) {
                                posicaoProximoCpf = outro.posicaoNaPagina;
                            }
                        }
                    }

                    // Extrair seÃ§Ã£o do texto (incluir contexto antes do CPF)
                    int inicioSecao = Math.max(0, posicaoCpf - 500);
                    int fimSecao = posicaoProximoCpf;
                    info.secaoTexto = pageText.substring(inicioSecao, fimSecao);

                    log.debug("   SeÃ§Ã£o extraÃ­da: {} caracteres", info.secaoTexto.length());
                }

                log.info("");
                log.info(
                        "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
                log.info("ðŸ” ETAPA 3: IDENTIFICANDO SETOR PARA CADA CPF");
                log.info(
                        "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");

                // ETAPA 3: Identificar setor para cada CPF (jÃ¡ estÃ¡ na seÃ§Ã£o do texto)

                log.info("");
                log.info(
                        "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
                log.info("ðŸ” ETAPA 4: PROCESSANDO CADA HOLERITE COM SEPARAÃ‡ÃƒO");
                log.info(
                        "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");

                // ETAPA 4: Processar cada holerite
                // Resetar contadores para este arquivo
                paginasProcessadas = 0;
                paginasComErro = 0;
                paginasPuladasPorDuplicidade = 0;

                log.info("ðŸ”„ Iniciando processamento de {} holerite(s) encontrado(s)...",
                        holeritesEncontrados.size());

                for (int idx = 0; idx < holeritesEncontrados.size(); idx++) {
                    HoleriteInfo info = holeritesEncontrados.get(idx);
                    log.info("ðŸ“„ [{}/{}] Processando holerite - CPF: {} (pÃ¡gina {})",
                            idx + 1, holeritesEncontrados.size(), info.cpf, info.pagina);
                    log.info("ðŸ“„ Processando holerite - CPF: {} (pÃ¡gina {})", info.cpf, info.pagina);

                    try {
                        // Extrair informaÃ§Ãµes do holerite usando a seÃ§Ã£o do texto
                        Payslip payslip = extractPayslipInfo(info.secaoTexto, info.pagina);

                        // Verificar se o CPF extraÃ­do corresponde
                        if (payslip == null || payslip.getCpf() == null || !payslip.getCpf().equals(info.cpf)) {
                            log.warn("âš ï¸ CPF extraÃ­do ({}) nÃ£o corresponde ao esperado ({}). Tentando OCR...",
                                    payslip != null && payslip.getCpf() != null ? payslip.getCpf() : "null", info.cpf);
                            payslip = extractPayslipInfoWithOCR(document, info.pagina);
                        }

                        if (payslip != null && payslip.getCpf() != null && payslip.getCpf().equals(info.cpf)) {
                            if (processarHoleriteUnico(document, info.pagina, payslip, info.textoCompleto,
                                    processedPayslips)) {
                                paginasProcessadas++;
                                log.debug("âœ… Holerite CPF {} (pÃ¡gina {}) processado com sucesso", info.cpf,
                                        info.pagina);
                            } else {
                                paginasPuladasPorDuplicidade++;
                                // NÃƒO incrementar paginasProcessadas quando pulado por duplicidade
                                // A pÃ¡gina jÃ¡ foi processada anteriormente, nÃ£o deve contar novamente
                                log.debug(
                                        "â­ï¸ Holerite CPF {} (pÃ¡gina {}) pulado por duplicidade - jÃ¡ foi processado anteriormente",
                                        info.cpf, info.pagina);
                            }
                        } else {
                            paginasComErro++;
                            log.warn(
                                    "âš ï¸ NÃ£o foi possÃ­vel extrair holerite para CPF {} na pÃ¡gina {} - CPF extraÃ­do: {}",
                                    info.cpf, info.pagina,
                                    payslip != null && payslip.getCpf() != null ? payslip.getCpf() : "null");
                        }
                    } catch (Exception e) {
                        paginasComErro++;
                        log.error("âŒ Erro ao processar holerite CPF {} na pÃ¡gina {}: {}",
                                info.cpf, info.pagina, e.getMessage(), e);
                    }
                }

                log.info("âœ… Processamento de holerites concluÃ­do: {} processados, {} erros, {} duplicidades",
                        paginasProcessadas - paginasPuladasPorDuplicidade, paginasComErro,
                        paginasPuladasPorDuplicidade);

                // VALIDAÃ‡ÃƒO: Verificar se quantidade de holerites processados corresponde Ã 
                // quantidade de pÃ¡ginas
                int paginasEsperadasProcessadas = pageCount - paginasPuladasPorDuplicidade;
                int holeritesProcessados = processedPayslips.size();

                log.info("");
                log.info(
                        "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
                log.info("ðŸ“Š RESUMO DO PROCESSAMENTO:");
                log.info(
                        "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
                log.info("ðŸ“„ Total de pÃ¡ginas no arquivo: {}", pageCount);
                log.info("âœ… PÃ¡ginas processadas com sucesso: {}", paginasProcessadas);
                log.info("âŒ PÃ¡ginas com erro na extraÃ§Ã£o: {}", paginasComErro);
                log.info("â­ï¸  PÃ¡ginas puladas (duplicidade): {}", paginasPuladasPorDuplicidade);
                log.info("ðŸ“‹ Total de holerites processados: {}", holeritesProcessados);

                // ValidaÃ§Ã£o principal: holerites processados devem ser igual a pÃ¡ginas
                // (menos duplicidades)
                if (holeritesProcessados != paginasEsperadasProcessadas) {
                    log.warn(
                            "âš ï¸ ATENÃ‡ÃƒO: Quantidade de holerites processados ({}) nÃ£o corresponde Ã  quantidade esperada ({} pÃ¡ginas - {} duplicidades = {} esperados)",
                            holeritesProcessados, pageCount, paginasPuladasPorDuplicidade, paginasEsperadasProcessadas);
                    log.warn("âš ï¸ DiferenÃ§a: {} holerite(s) a mais/menos do esperado",
                            Math.abs(holeritesProcessados - paginasEsperadasProcessadas));

                    if (holeritesProcessados > paginasEsperadasProcessadas) {
                        log.info(
                                "â„¹ï¸ Mais holerites que pÃ¡ginas: Algumas pÃ¡ginas contÃªm mÃºltiplos holerites (comportamento esperado)");
                    } else if (holeritesProcessados < paginasEsperadasProcessadas) {
                        log.warn(
                                "âš ï¸ POSSÃVEL CAUSA: Uma ou mais pÃ¡ginas nÃ£o geraram holerite (erro na extraÃ§Ã£o ou dados invÃ¡lidos)");
                        log.warn(
                                "âš ï¸ SOLUÃ‡ÃƒO: Verificar logs de erro acima para identificar pÃ¡ginas problemÃ¡ticas");
                    }
                } else {
                    log.info(
                            "âœ… VALIDAÃ‡ÃƒO OK: Quantidade de holerites processados ({}) corresponde Ã  quantidade de pÃ¡ginas processadas ({})",
                            holeritesProcessados, paginasEsperadasProcessadas);
                }

                log.info(
                        "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
            }

            log.info(
                    "ðŸŽ‰ Processamento concluÃ­do. {} holerite(s) processado(s) com sucesso de {} pÃ¡gina(s) do arquivo",
                    processedPayslips.size(), pageCount);

            // ValidaÃ§Ã£o final: garantir que processamos todas as pÃ¡ginas possÃ­veis
            if (processedPayslips.size() < pageCount - paginasComErro - paginasPuladasPorDuplicidade) {
                log.warn("âš ï¸ ATENÃ‡ÃƒO: Algumas pÃ¡ginas podem nÃ£o ter sido processadas completamente!");
                log.warn("   Esperado: {} holerites ({} pÃ¡ginas - {} erros - {} duplicidades)",
                        pageCount - paginasComErro - paginasPuladasPorDuplicidade,
                        pageCount, paginasComErro, paginasPuladasPorDuplicidade);
                log.warn("   Processado: {} holerites", processedPayslips.size());
            }

            return processedPayslips;
        } catch (IllegalArgumentException e) {
            // Re-lanÃ§ar IllegalArgumentException para que o controller possa tratÃ¡-la
            log.error("âŒ Erro de validaÃ§Ã£o: {}", e.getMessage());
            throw e;
        } catch (IOException e) {
            // Re-lanÃ§ar IOException conforme a assinatura do mÃ©todo
            log.error("âŒ Erro de I/O ao processar arquivo {}: {}",
                    file != null ? file.getOriginalFilename() : "null", e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            // Capturar qualquer outra exceÃ§Ã£o nÃ£o esperada
            log.error("âŒ ERRO INESPERADO ao processar arquivo {}: {}",
                    file != null ? file.getOriginalFilename() : "null", e.getMessage(), e);
            log.error("   Tipo da exceÃ§Ã£o: {}", e.getClass().getName());
            // Retornar lista vazia em vez de lanÃ§ar exceÃ§Ã£o para nÃ£o quebrar o
            // processamento de outros arquivos
            return processedPayslips;
        }
    }

    /**
     * Detecta todos os CPFs Ãºnicos na pÃ¡gina
     * Suporta mÃºltiplos formatos: CPF: 123.456.789-00, CPF 12345678900, etc.
     */
    private List<String> detectarTodosCPFsNaPagina(String pageText) {
        List<String> cpfs = new ArrayList<>();

        // PadrÃ£o 1: CPF: 123.456.789-00 ou CPF 123.456.789-00 ou CPF: 12345678900
        // Melhorado para capturar CPF sem formataÃ§Ã£o tambÃ©m
        Pattern cpfPattern1 = Pattern.compile("CPF[:\\s]*([0-9]{3}\\.?[0-9]{3}\\.?[0-9]{3}-?[0-9]{2}|[0-9]{11})",
                Pattern.CASE_INSENSITIVE);
        Matcher matcher1 = cpfPattern1.matcher(pageText);

        while (matcher1.find()) {
            String cpf = matcher1.group(1).replaceAll("[^0-9]", "");
            if (cpf.length() == 11 && !cpfs.contains(cpf)) {
                cpfs.add(cpf);
                log.info("âœ… CPF detectado (padrÃ£o 1): {} (contexto: '{}')", cpf,
                        matcher1.group(0).substring(0, Math.min(50, matcher1.group(0).length())));
            }
        }

        // PadrÃ£o 2: Apenas nÃºmeros de 11 dÃ­gitos (pode ser CPF sem rÃ³tulo)
        // Mas apenas se nÃ£o estiver dentro de um CNPJ (14 dÃ­gitos)
        Pattern cpfPattern2 = Pattern.compile("(?<!\\d)([0-9]{11})(?!\\d)");
        Matcher matcher2 = cpfPattern2.matcher(pageText);

        while (matcher2.find()) {
            String cpf = matcher2.group(1);
            // Verificar se nÃ£o Ã© parte de um CNPJ (14 dÃ­gitos)
            int start = matcher2.start();
            int end = matcher2.end();
            if (start > 0 && end < pageText.length()) {
                // Verificar contexto: se hÃ¡ "CNPJ" prÃ³ximo, pode ser parte de CNPJ
                String contexto = pageText.substring(Math.max(0, start - 20), Math.min(pageText.length(), end + 20));
                if (!contexto.toUpperCase().contains("CNPJ") && !cpfs.contains(cpf)) {
                    // Validar se parece um CPF vÃ¡lido (nÃ£o todos zeros, nÃ£o sequencial)
                    if (!cpf.matches("0{11}|1{11}|2{11}|3{11}|4{11}|5{11}|6{11}|7{11}|8{11}|9{11}")) {
                        cpfs.add(cpf);
                        log.debug("âœ… CPF detectado (padrÃ£o 2 - sem rÃ³tulo): {}", cpf);
                    }
                }
            }
        }

        // PadrÃ£o 3: CPF formatado com pontos e traÃ§o: 123.456.789-00 (sem rÃ³tulo
        // CPF)
        Pattern cpfPattern3 = Pattern.compile("([0-9]{3}\\.[0-9]{3}\\.[0-9]{3}-[0-9]{2})");
        Matcher matcher3 = cpfPattern3.matcher(pageText);

        while (matcher3.find()) {
            String cpf = matcher3.group(1).replaceAll("[^0-9]", "");
            if (cpf.length() == 11 && !cpfs.contains(cpf)) {
                cpfs.add(cpf);
                log.debug("âœ… CPF detectado (padrÃ£o 3 - formatado): {}", cpf);
            }
        }

        log.info("ðŸ” Total de CPFs Ãºnicos detectados na pÃ¡gina: {}", cpfs.size());
        return cpfs;
    }

    /**
     * Extrai informaÃ§Ãµes do holerite para um CPF especÃ­fico
     * Quando hÃ¡ mÃºltiplos holerites na mesma pÃ¡gina, divide o texto em seÃ§Ãµes
     * e extrai apenas a seÃ§Ã£o correspondente ao CPF alvo
     */
    private Payslip extractPayslipInfoPorCPF(String text, int pageNumber, String cpfAlvo) {
        log.info("ðŸ” Extraindo holerite para CPF especÃ­fico: {} na pÃ¡gina {}", cpfAlvo, pageNumber);

        // Se o texto contÃ©m mÃºltiplos CPFs, dividir em seÃ§Ãµes
        List<String> cpfsEncontrados = detectarTodosCPFsNaPagina(text);

        if (cpfsEncontrados.size() > 1) {
            log.info("ðŸ“„ MÃºltiplos CPFs detectados na pÃ¡gina {}: {}. Dividindo texto em seÃ§Ãµes...", pageNumber,
                    cpfsEncontrados);

            // Encontrar a posiÃ§Ã£o do CPF alvo no texto
            String cpfAlvoFormatado = cpfAlvo.replaceAll("(\\d{3})(\\d{3})(\\d{3})(\\d{2})", "$1.$2.$3-$4");
            String cpfAlvoSemFormatacao = cpfAlvo;

            // Procurar por diferentes formatos do CPF
            Pattern[] cpfPatterns = {
                    Pattern.compile("CPF[:\\s]*" + cpfAlvoFormatado.replace(".", "\\.").replace("-", "\\-")),
                    Pattern.compile("CPF[:\\s]*" + cpfAlvoSemFormatacao),
                    Pattern.compile(cpfAlvoFormatado.replace(".", "\\.").replace("-", "\\-")),
                    Pattern.compile(cpfAlvoSemFormatacao)
            };

            int posicaoCpfAlvo = -1;
            for (Pattern pattern : cpfPatterns) {
                Matcher matcher = pattern.matcher(text);
                if (matcher.find()) {
                    posicaoCpfAlvo = matcher.start();
                    log.debug("âœ… CPF alvo encontrado na posiÃ§Ã£o {} usando padrÃ£o: {}", posicaoCpfAlvo,
                            pattern.pattern());
                    break;
                }
            }

            if (posicaoCpfAlvo == -1) {
                log.warn("âš ï¸ CPF alvo {} nÃ£o encontrado no texto. Tentando extraÃ§Ã£o completa...", cpfAlvo);
                Payslip payslip = extractPayslipInfo(text, pageNumber);
                // Verificar se o CPF extraÃ­do corresponde
                if (payslip != null && payslip.getCpf() != null && payslip.getCpf().equals(cpfAlvo)) {
                    return payslip;
                }
                return null;
            }

            // Encontrar a posiÃ§Ã£o do prÃ³ximo CPF (ou fim do texto)
            int posicaoProximoCpf = text.length();
            for (String outroCpf : cpfsEncontrados) {
                if (!outroCpf.equals(cpfAlvo)) {
                    String outroCpfFormatado = outroCpf.replaceAll("(\\d{3})(\\d{3})(\\d{3})(\\d{2})", "$1.$2.$3-$4");
                    Pattern outroCpfPattern = Pattern
                            .compile("CPF[:\\s]*" + outroCpfFormatado.replace(".", "\\.").replace("-", "\\-"));
                    Matcher outroMatcher = outroCpfPattern.matcher(text);
                    while (outroMatcher.find()) {
                        int pos = outroMatcher.start();
                        if (pos > posicaoCpfAlvo && pos < posicaoProximoCpf) {
                            posicaoProximoCpf = pos;
                        }
                    }
                }
            }

            // Extrair apenas a seÃ§Ã£o do texto correspondente ao CPF alvo
            // Incluir um pouco antes do CPF para pegar contexto (ex: nome, cÃ³digo)
            int inicioSecao = Math.max(0, posicaoCpfAlvo - 500);
            int fimSecao = posicaoProximoCpf;
            String secaoTexto = text.substring(inicioSecao, fimSecao);

            log.info("ðŸ“„ SeÃ§Ã£o extraÃ­da para CPF {}: {} caracteres (posiÃ§Ã£o {} a {})",
                    cpfAlvo, secaoTexto.length(), inicioSecao, fimSecao);
            log.debug("ðŸ“„ ConteÃºdo da seÃ§Ã£o (primeiros 500 chars): {}",
                    secaoTexto.length() > 500 ? secaoTexto.substring(0, 500) + "..." : secaoTexto);

            // Extrair informaÃ§Ãµes apenas desta seÃ§Ã£o
            Payslip payslip = extractPayslipInfo(secaoTexto, pageNumber);

            // Verificar se o CPF extraÃ­do corresponde ao alvo
            if (payslip != null && payslip.getCpf() != null && payslip.getCpf().equals(cpfAlvo)) {
                log.info("âœ… Holerite extraÃ­do com sucesso para CPF {}", cpfAlvo);
                return payslip;
            } else {
                log.warn("âš ï¸ CPF extraÃ­do ({}) nÃ£o corresponde ao alvo ({}). Tentando extraÃ§Ã£o completa...",
                        payslip != null && payslip.getCpf() != null ? payslip.getCpf() : "null", cpfAlvo);
                // Fallback: tentar extraÃ§Ã£o completa mas verificar CPF
                payslip = extractPayslipInfo(text, pageNumber);
                if (payslip != null && payslip.getCpf() != null && payslip.getCpf().equals(cpfAlvo)) {
                    return payslip;
                }
                return null;
            }
        } else {
            // Apenas um CPF na pÃ¡gina, extrair normalmente
            Payslip payslip = extractPayslipInfo(text, pageNumber);
            if (payslip != null && payslip.getCpf() != null && payslip.getCpf().equals(cpfAlvo)) {
                return payslip;
            }
            return payslip;
        }
    }

    /**
     * Processa um holerite Ãºnico (usado tanto para holerite Ãºnico quanto para
     * mÃºltiplos)
     * 
     * @return true se o holerite foi processado, false se foi pulado por
     *         duplicidade
     */
    private boolean processarHoleriteUnico(PDDocument document, int pageNumber, Payslip payslip, String pageText,
            List<Payslip> processedPayslips) {
        try {
            if (payslip == null || payslip.getEmployeeName() == null || payslip.getEmployeeName().equals("Desconhecido")
                    || payslip.getCpf() == null) {
                log.warn("âš ï¸ Holerite invÃ¡lido - nÃ£o serÃ¡ processado");
                return false;
            }

            // Verificar se os dados da tabela foram extraÃ­dos
            if (payslip.getTableDetails() == null || payslip.getTableDetails().isEmpty()) {
                log.warn(
                        "âš ï¸ PDFBox extraiu dados bÃ¡sicos mas nÃ£o encontrou dados da tabela. Tentando re-extrair tabela do texto...");
                String[] linhas = pageText.split("\r?\n");
                List<com.z7design.fleet_manager.dto.PayslipTableRow> tableDetails = extractTableDetails(linhas);
                if (!tableDetails.isEmpty()) {
                    payslip.setTableDetails(tableDetails);
                    log.info("âœ… Dados da tabela re-extraÃ­dos: {} linha(s)", tableDetails.size());
                }
            }

            enrichCompanyData(payslip);

            if (payslip != null && !payslip.getEmployeeName().equals("Desconhecido") && payslip.getCpf() != null) {
                // TASK 02: Verificar se holerite jÃ¡ foi processado e comparar dados
                try {
                    List<Payslip> holeritesExistentes = payslipRepository
                            .findByCompanyCnpjAndCpfAndWorkPostNameAndMonthAndYear(
                                    payslip.getCompanyCnpj(),
                                    payslip.getCpf(),
                                    payslip.getWorkPostName(),
                                    payslip.getMonth(),
                                    payslip.getYear());

                    if (!holeritesExistentes.isEmpty()) {
                        // Filtrar apenas holerites que ainda existem fisicamente (nÃ£o foram
                        // excluÃ­dos)
                        List<Payslip> holeritesExistentesNaoExcluidos = holeritesExistentes.stream()
                                .filter(p -> {
                                    try {
                                        boolean exists = p.getArquivoCaminho() != null &&
                                                java.nio.file.Files
                                                        .exists(java.nio.file.Paths.get(p.getArquivoCaminho()));
                                        if (!exists) {
                                            log.debug(
                                                    "   âš ï¸ Holerite ID {} foi excluÃ­do fisicamente, ignorando na verificaÃ§Ã£o de duplicatas",
                                                    p.getId());
                                        }
                                        return exists;
                                    } catch (Exception e) {
                                        log.warn("   âš ï¸ Erro ao verificar arquivo fÃ­sico do holerite ID {}: {}",
                                                p.getId(), e.getMessage());
                                        return false;
                                    }
                                })
                                .collect(java.util.stream.Collectors.toList());

                        if (holeritesExistentesNaoExcluidos.isEmpty()) {
                            log.info(
                                    "âœ… Todos os holerites existentes foram excluÃ­dos fisicamente - permitindo processamento");
                        } else {
                            log.info(
                                    "ðŸ” {} holerite(s) jÃ¡ processado(s) e nÃ£o excluÃ­do(s) encontrado(s) para CPF: {}, Empresa: {}, Setor: {}, PerÃ­odo: {}/{}",
                                    holeritesExistentesNaoExcluidos.size(),
                                    payslip.getCpf(),
                                    payslip.getCompanyCnpj() != null ? payslip.getCompanyCnpj() : "nÃ£o informado",
                                    payslip.getWorkPostName() != null ? payslip.getWorkPostName() : "nÃ£o informado",
                                    payslip.getMonth(),
                                    payslip.getYear());

                            // Usar apenas holerites nÃ£o excluÃ­dos para comparaÃ§Ã£o
                            holeritesExistentes = holeritesExistentesNaoExcluidos;
                        }
                    }

                    if (!holeritesExistentes.isEmpty()) {

                        // Calcular hash do arquivo PDF da pÃ¡gina atual para comparar com arquivo
                        // original
                        // IMPORTANTE: Usar hash do PDF (bytes) em vez de hash do texto para
                        // comparaÃ§Ã£o mais confiÃ¡vel
                        String hashPaginaAtual = calculatePagePdfHash(document, pageNumber);
                        if (hashPaginaAtual == null) {
                            // Fallback: usar hash do texto se nÃ£o conseguir calcular do PDF
                            log.warn(
                                    "âš ï¸ NÃ£o foi possÃ­vel calcular hash do PDF, usando hash do texto como fallback");
                            hashPaginaAtual = calculatePageHash(pageText);
                        }
                        log.debug("ðŸ” Hash da pÃ¡gina atual (PDF): {}",
                                hashPaginaAtual != null
                                        ? hashPaginaAtual.substring(0, Math.min(16, hashPaginaAtual.length())) + "..."
                                        : "null");

                        // Comparar com o holerite mais recente (primeiro da lista ordenada por
                        // processedAt DESC)
                        Payslip holeriteExistente = holeritesExistentes.get(0);
                        log.info(
                                "ðŸ“„ Comparando com holerite existente mais recente: ID={}, VersÃ£o={}, Arquivo={}, Processado em: {}",
                                holeriteExistente.getId(),
                                holeriteExistente.getVersao() != null ? holeriteExistente.getVersao() : "N/A",
                                holeriteExistente.getFileName(),
                                holeriteExistente.getProcessedAt());

                        // IMPORTANTE: Sempre recalcular hash do arquivo PDF salvo para garantir
                        // comparaÃ§Ã£o correta
                        // NÃ£o usar hash do banco porque pode ter sido calculado do texto (mÃ©todo
                        // antigo)
                        // Sempre comparar hash do PDF (bytes) com hash do PDF (bytes)
                        String hashArquivoOriginal = getPayslipFileHash(holeriteExistente);
                        if (hashArquivoOriginal == null) {
                            // Se nÃ£o conseguir calcular do arquivo, tentar usar do banco como fallback
                            hashArquivoOriginal = holeriteExistente.getHashConteudo();
                            log.warn(
                                    "âš ï¸ NÃ£o foi possÃ­vel calcular hash do arquivo PDF salvo, usando hash do banco como fallback");
                        } else {
                            log.info(
                                    "ðŸ” Hash recalculado do arquivo PDF salvo: {}... (garantindo comparaÃ§Ã£o PDF vs PDF)",
                                    hashArquivoOriginal.substring(0, Math.min(16, hashArquivoOriginal.length())));
                        }

                        if (hashArquivoOriginal == null || hashArquivoOriginal.isEmpty()) {
                            log.warn(
                                    "âš ï¸ Hash do arquivo original nÃ£o disponÃ­vel - nÃ£o serÃ¡ possÃ­vel verificar duplicidade por hash");
                        } else {
                            log.info("ðŸ” Hash da pÃ¡gina atual (PDF): {}...",
                                    hashPaginaAtual != null
                                            ? hashPaginaAtual.substring(0, Math.min(16, hashPaginaAtual.length()))
                                            : "null");
                            log.info("ðŸ” Hash do arquivo original (PDF): {}...",
                                    hashArquivoOriginal.substring(0, Math.min(16, hashArquivoOriginal.length())));
                            if (hashPaginaAtual != null && hashArquivoOriginal != null) {
                                if (hashPaginaAtual.equals(hashArquivoOriginal)) {
                                    log.info("âœ… HASHES IDÃŠNTICOS - Arquivo PDF nÃ£o foi modificado");
                                } else {
                                    log.warn(
                                            "âš ï¸ HASHES DIFERENTES - Arquivo PDF foi modificado ou hÃ¡ diferenÃ§a nos metadados");
                                }
                            }
                        }

                        // Comparar dados extraÃ­dos e hash do arquivo
                        log.info("ðŸ” Iniciando comparaÃ§Ã£o detalhada de holerites...");
                        log.info("   ðŸ“Š Holerite EXISTENTE:");
                        log.info("      - Vencimentos: {}", holeriteExistente.getTotalEarnings());
                        log.info("      - Descontos: {}", holeriteExistente.getTotalDeductions());
                        log.info("      - LÃ­quido: {}", holeriteExistente.getNetValue());
                        log.info("      - TableDetails: {} linha(s)",
                                holeriteExistente.getTableDetails() != null ? holeriteExistente.getTableDetails().size()
                                        : 0);
                        log.info("   ðŸ“Š Holerite NOVO:");
                        log.info("      - Vencimentos: {}", payslip.getTotalEarnings());
                        log.info("      - Descontos: {}", payslip.getTotalDeductions());
                        log.info("      - LÃ­quido: {}", payslip.getNetValue());
                        log.info("      - TableDetails: {} linha(s)",
                                payslip.getTableDetails() != null ? payslip.getTableDetails().size() : 0);

                        PayslipComparisonResult comparacao = comparePayslips(holeriteExistente, payslip,
                                hashArquivoOriginal, hashPaginaAtual);

                        log.info("ðŸ” Resultado da comparaÃ§Ã£o: hasChanges={}, total de diferenÃ§as={}",
                                comparacao.hasChanges(), comparacao.getDifferences().size());

                        if (comparacao.hasChanges()) {
                            log.warn(
                                    "ðŸ“ âš ï¸ ALTERAÃ‡Ã•ES FINANCEIRAS DETECTADAS no holerite! Criando nova versÃ£o...");
                            log.warn("ðŸ“‹ DiferenÃ§as encontradas ({}):", comparacao.getDifferences().size());
                            for (int idx = 0; idx < comparacao.getDifferences().size(); idx++) {
                                log.warn("   {}. {}", idx + 1, comparacao.getDifferences().get(idx));
                            }

                            // IMPORTANTE: A versÃ£o anterior serÃ¡ MANTIDA no banco e no sistema de
                            // arquivos
                            // Uma NOVA versÃ£o serÃ¡ criada automaticamente em organizarEmPastas()
                            // baseada nas versÃµes existentes no mesmo caminho (versÃ£o mÃ¡xima + 1)
                            log.info("ðŸ”„ Nova versÃ£o serÃ¡ criada automaticamente durante organizaÃ§Ã£o em pastas");
                            log.info("   âœ… VersÃ£o anterior serÃ¡ preservada - nÃ£o serÃ¡ excluÃ­da ou sobrescrita");
                            log.info("   ðŸ“ Novo arquivo serÃ¡ salvo como: holerite_v{N+1}.pdf");
                            log.info(
                                    "   ðŸ’¾ Novo registro serÃ¡ criado no banco mantendo todos os registros anteriores");
                        } else {
                            log.warn(
                                    "âš ï¸ NENHUMA ALTERAÃ‡ÃƒO DETECTADA - Verificando se valores financeiros ou tableDetails estÃ£o sendo comparados corretamente...");
                            log.warn(
                                    "   Se houver diferenÃ§as visÃ­veis nos valores, pode ser um problema na extraÃ§Ã£o ou comparaÃ§Ã£o");
                            log.warn("   Valores comparados:");
                            log.warn("      Vencimentos: {} vs {}", holeriteExistente.getTotalEarnings(),
                                    payslip.getTotalEarnings());
                            log.warn("      Descontos: {} vs {}", holeriteExistente.getTotalDeductions(),
                                    payslip.getTotalDeductions());
                            log.warn("      LÃ­quido: {} vs {}", holeriteExistente.getNetValue(),
                                    payslip.getNetValue());
                            log.warn("      TableDetails: {} vs {} linhas",
                                    holeriteExistente.getTableDetails() != null
                                            ? holeriteExistente.getTableDetails().size()
                                            : 0,
                                    payslip.getTableDetails() != null ? payslip.getTableDetails().size() : 0);
                            String msg = String.format(
                                    "Holerite idÃªntico jÃ¡ processado. NÃ£o hÃ¡ alteraÃ§Ãµes detectadas. Empresa CNPJ %s, CPF %s, Setor %s, mÃªs %d, ano %d. Pulando pÃ¡gina %d.",
                                    payslip.getCompanyCnpj() != null ? payslip.getCompanyCnpj() : "nÃ£o informado",
                                    payslip.getCpf(),
                                    payslip.getWorkPostName() != null ? payslip.getWorkPostName() : "nÃ£o informado",
                                    payslip.getMonth(),
                                    payslip.getYear(),
                                    pageNumber);
                            log.warn(msg);
                            return false; // Retornar false indicando que foi pulado por duplicidade
                        }
                    } else {
                        log.info(
                                "âœ… Holerite nÃ£o duplicado - permitindo importaÃ§Ã£o (Empresa CNPJ: {}, CPF: {}, Setor: {}, PerÃ­odo: {}/{})",
                                payslip.getCompanyCnpj() != null ? payslip.getCompanyCnpj() : "nÃ£o informado",
                                payslip.getCpf(),
                                payslip.getWorkPostName() != null ? payslip.getWorkPostName() : "nÃ£o informado",
                                payslip.getMonth(),
                                payslip.getYear());
                    }
                } catch (Exception e) {
                    log.warn("âš ï¸ Erro ao verificar duplicidade e comparar holerites, continuando processamento: {}",
                            e.getMessage(), e);
                }

                // Organizar em pastas e salvar PDF individual (jÃ¡ define versao,
                // hash_conteudo, arquivo_caminho)
                String caminhoPdf = organizarEmPastas(document, pageNumber, payslip);

                // Salvar ou atualizar funcionÃ¡rio no banco
                salvarFuncionario(payslip, caminhoPdf);

                // Salvar dados extraÃ­dos na tabela tb_extract_data_holerites
                salvarDadosExtraidos(payslip);

                // Save to payslip database (versao, hash_conteudo e arquivo_caminho jÃ¡ foram
                // definidos em organizarEmPastas)
                payslip = payslipRepository.save(payslip);
                processedPayslips.add(payslip);

                log.info("âœ… Holerite salvo: ID={}, VersÃ£o={}, Hash={}...",
                        payslip.getId(),
                        payslip.getVersao(),
                        payslip.getHashConteudo() != null
                                ? payslip.getHashConteudo().substring(0,
                                        Math.min(16, payslip.getHashConteudo().length()))
                                : "N/A");

                // === CRIAÃ‡ÃƒO AUTOMÃTICA DE USUÃRIO ===
                try {
                    createUserFromPayslip(payslip);
                } catch (Exception userException) {
                    log.warn("âš ï¸ Erro ao criar usuÃ¡rio automÃ¡tico para {}: {}", payslip.getEmployeeName(),
                            userException.getMessage());
                    // NÃ£o interromper processamento por erro na criaÃ§Ã£o de usuÃ¡rio
                }

                log.info("âœ… Holerite processado com sucesso: {} (CPF: {})", payslip.getEmployeeName(),
                        payslip.getCpf());
                return true; // Retornar true indicando que foi processado com sucesso
            } else {
                log.warn("âš ï¸ Holerite invÃ¡lido - nÃ£o serÃ¡ processado");
                return false;
            }
        } catch (Exception e) {
            log.error("âŒ Erro ao processar holerite: {}", e.getMessage(), e);
            return false;
        }
    }

    private Payslip extractPayslipInfo(String text, int pageNumber) {
        return extractPayslipInfo(text, pageNumber, null);
    }

    // Nova versÃ£o principal com suporte a ocrText
    private Payslip extractPayslipInfo(String text, int pageNumber, String ocrText) {
        String method = ocrText != null ? "OCR" : "PDFBox";
        log.info("ðŸ” Tentando extrair informaÃ§Ãµes da pÃ¡gina {} via {}", pageNumber, method);

        // Verificar se o texto estÃ¡ vazio ou muito curto
        if (text == null || text.trim().isEmpty()) {
            log.warn("âš ï¸ Texto extraÃ­do estÃ¡ vazio para pÃ¡gina {} via {}", pageNumber, method);
            return null;
        }

        if (text.trim().length() < 50) {
            log.warn(
                    "âš ï¸ Texto extraÃ­do Ã© muito curto ({} caracteres) para pÃ¡gina {} via {}. Pode indicar PDF escaneado ou corrompido.",
                    text.length(), pageNumber, method);
        }

        // Log do texto para debug (primeiros 1000 caracteres)
        log.debug("Texto extraÃ­do da pÃ¡gina {} via {}: {}", pageNumber, method,
                text.length() > 1000 ? text.substring(0, 1000) + "..." : text);

        // Dividir o texto em linhas para facilitar a busca
        String[] linhas = text.split("\r?\n");
        String nome = "Desconhecido";
        String cpf = null;
        String codigo = null;
        String mes = null;
        String ano = null;
        String empresaNome = null;
        String empresaCnpj = null;
        String workPostName = null;

        // 1. EXTRAÃ‡ÃƒO DE CPF PRIMEIRO (mais confiÃ¡vel)
        // IMPORTANTE: Cada pÃ¡gina contÃ©m as duas vias do holerite (frente e verso do
        // mesmo funcionÃ¡rio)
        // Portanto, deve haver apenas 1 CPF Ãºnico por pÃ¡gina. Se houver mÃºltiplos,
        // usar apenas o primeiro.
        // Melhorado para capturar CPF com ou sem formataÃ§Ã£o: "CPF: 12724178670" ou
        // "CPF: 127.241.786-70"
        Pattern cpfPattern = Pattern.compile("CPF[:\\s]*([0-9]{3}\\.?[0-9]{3}\\.?[0-9]{3}-?[0-9]{2}|[0-9]{11})",
                Pattern.CASE_INSENSITIVE);

        // Contar quantos CPFs diferentes foram encontrados na pÃ¡gina
        Set<String> cpfsEncontrados = new HashSet<>();

        for (int linhaIndex = 0; linhaIndex < linhas.length; linhaIndex++) {
            String linha = linhas[linhaIndex];
            Matcher cpfMatcher = cpfPattern.matcher(linha);
            if (cpfMatcher.find()) {
                String cpfEncontrado = cpfMatcher.group(1).replaceAll("[^0-9]", "");
                if (cpfEncontrado.length() == 11) {
                    cpfsEncontrados.add(cpfEncontrado);

                    // Usar apenas o PRIMEIRO CPF encontrado (frente e verso tÃªm o mesmo CPF)
                    if (cpf == null) {
                        cpf = cpfEncontrado;
                        log.info("âœ… CPF encontrado (primeiro): {} na linha {}: '{}'", cpf, linhaIndex + 1,
                                linha.trim());

                        // Na linha do CPF, tentar extrair cÃ³digo e nome
                        String linhaCpf = linha.trim();

                        // IMPORTANTE: Se nÃ£o encontrar nome na mesma linha, tentar linha anterior
                        // (estrutura comum: linha anterior tem matrÃ­cula e nome, linha atual tem CPF)
                        String linhaAnterior = (linhaIndex > 0) ? linhas[linhaIndex - 1].trim() : null;

                        // PADRÃƒO 2a (TESTAR PRIMEIRO - mais flexÃ­vel): CODIGO NOME CPF ou NOME CPF
                        // Este padrÃ£o captura tudo antes de CPF e depois separa cÃ³digo e nome
                        // Funciona para casos como:
                        // - "000230 JEREMIAS DA COSTA ALMEIDA CPF: 12724178670"
                        // - "MARCO TULIO MENEZES CPF: 11396510648"
                        int cpfIndex2 = linhaCpf.toUpperCase().indexOf("CPF");
                        if (cpfIndex2 > 5) {
                            String textoAntesCpf = linhaCpf.substring(0, cpfIndex2).trim().replaceAll("\\s+", " ");
                            log.debug("ðŸ” PadrÃ£o 2a - Linha completa: '{}'", linhaCpf);
                            log.debug("ðŸ” PadrÃ£o 2a - Texto antes de CPF: '{}'", textoAntesCpf);

                            // Verificar se hÃ¡ cÃ³digo no inÃ­cio (4-6 dÃ­gitos)
                            Pattern codigoPattern = Pattern.compile("^(\\d{4,6})\\s+(.+)$");
                            Matcher codigoMatcher = codigoPattern.matcher(textoAntesCpf);
                            String nomeCandidate;

                            if (codigoMatcher.find()) {
                                // HÃ¡ cÃ³digo no inÃ­cio, extrair cÃ³digo e nome
                                codigo = codigoMatcher.group(1).trim();
                                nomeCandidate = codigoMatcher.group(2).trim();
                                log.debug("ðŸ” PadrÃ£o 2a - CÃ³digo encontrado: '{}', Nome: '{}'", codigo,
                                        nomeCandidate);
                            } else {
                                // NÃ£o hÃ¡ cÃ³digo, usar todo o texto como nome
                                nomeCandidate = textoAntesCpf;
                                log.debug("ðŸ” PadrÃ£o 2a - Sem cÃ³digo, usando todo o texto como nome: '{}'",
                                        nomeCandidate);
                            }

                            // Validar se Ã© um nome vÃ¡lido (pelo menos 5 caracteres, contÃ©m letras)
                            if (nomeCandidate.length() >= 5 && nomeCandidate
                                    .matches(".*[A-ZÃÃ€Ã‚ÃƒÃ„Ã‰ÃˆÃŠÃ‹ÃÃŒÃŽÃÃ“Ã’Ã”Ã•Ã–ÃšÃ™Ã›ÃœÃ‡].*")) {
                                boolean isValid = isValidEmployeeName(nomeCandidate);
                                log.debug("ðŸ” PadrÃ£o 2a - ValidaÃ§Ã£o do nome '{}': isValid={}", nomeCandidate,
                                        isValid);

                                if (isValid) {
                                    nome = nomeCandidate.toUpperCase();
                                    log.info("âœ… PadrÃ£o 2a - CÃ³digo: {}, Nome: {} (extraÃ­do de tudo antes de CPF)",
                                            codigo, nome);
                                    break;
                                } else {
                                    // Se isValidEmployeeName falhou, mas o nome parece vÃ¡lido (tem pelo menos 2
                                    // palavras),
                                    // aceitar mesmo assim (pode ser um caso edge)
                                    String[] palavras = nomeCandidate.split("\\s+");
                                    if (palavras.length >= 2 && palavras[0].length() >= 3) {
                                        nome = nomeCandidate.toUpperCase();
                                        log.warn(
                                                "âš ï¸ PadrÃ£o 2a - Nome aceito mesmo com validaÃ§Ã£o falhando (parece vÃ¡lido): CÃ³digo: {}, Nome: {}",
                                                codigo, nome);
                                        break;
                                    }
                                }
                            } else {
                                log.debug("ðŸ” PadrÃ£o 2a - Nome candidato rejeitado: comprimento={}, tem letras={}",
                                        nomeCandidate.length(), nomeCandidate
                                                .matches(".*[A-ZÃÃ€Ã‚ÃƒÃ„Ã‰ÃˆÃŠÃ‹ÃÃŒÃŽÃÃ“Ã’Ã”Ã•Ã–ÃšÃ™Ã›ÃœÃ‡].*"));
                            }
                        }

                        // PadrÃ£o 1: CODIGO NOME CPF (ex: 000044 ELAINE APARECIDA SOARES PEREIRA CPF:
                        // 073.495.276-75)
                        // Melhorado para aceitar CPF: ou CPF (com ou sem dois pontos)
                        // IMPORTANTE: Usar .+? (non-greedy) mas garantir que capture atÃ© o CPF
                        Pattern linhaCompleta1 = Pattern.compile("(\\d{4,6})\\s+(.+?)\\s+CPF[:\\s]",
                                Pattern.CASE_INSENSITIVE);
                        Matcher lineMatch1 = linhaCompleta1.matcher(linhaCpf);
                        if (lineMatch1.find()) {
                            codigo = lineMatch1.group(1).trim();
                            String nomeCandidate = lineMatch1.group(2).trim().replaceAll("\\s+", " ");

                            // Log detalhado para debug
                            log.debug("ðŸ” PadrÃ£o 1 - Linha completa: '{}'", linhaCpf);
                            log.debug("ðŸ” PadrÃ£o 1 - CÃ³digo extraÃ­do: '{}'", codigo);
                            log.debug("ðŸ” PadrÃ£o 1 - Nome candidato: '{}'", nomeCandidate);

                            if (isValidEmployeeName(nomeCandidate)) {
                                nome = nomeCandidate.toUpperCase();
                                log.info("âœ… PadrÃ£o 1 - CÃ³digo: {}, Nome: {}", codigo, nome);
                                break;
                            } else {
                                log.warn(
                                        "âš ï¸ PadrÃ£o 1 - Nome candidato '{}' nÃ£o passou na validaÃ§Ã£o isValidEmployeeName",
                                        nomeCandidate);
                            }
                        }

                        // PadrÃ£o 2: NOME CPF (sem cÃ³digo no inÃ­cio) - melhorado para capturar melhor
                        // Aceita mÃºltiplos espaÃ§os e diferentes formatos
                        Pattern linhaCompleta2 = Pattern.compile(
                                "([A-ZÃÃ€Ã‚ÃƒÃ„Ã‰ÃˆÃŠÃ‹ÃÃŒÃŽÃÃ“Ã’Ã”Ã•Ã–ÃšÃ™Ã›ÃœÃ‡][A-ZÃÃ€Ã‚ÃƒÃ„Ã‰ÃˆÃŠÃ‹ÃÃŒÃŽÃÃ“Ã’Ã”Ã•Ã–ÃšÃ™Ã›ÃœÃ‡\\s]{4,}?)\\s{1,}CPF",
                                Pattern.CASE_INSENSITIVE);
                        Matcher lineMatch2 = linhaCompleta2.matcher(linhaCpf);
                        if (lineMatch2.find()) {
                            String nomeCandidate = lineMatch2.group(1).trim().replaceAll("\\s+", " ");
                            if (isValidEmployeeName(nomeCandidate)) {
                                nome = nomeCandidate.toUpperCase();
                                log.info("âœ… PadrÃ£o 2 - Nome: {} (sem cÃ³digo)", nome);
                                break;
                            }
                        }

                        // PadrÃ£o 2c: CODIGO NOME CPF (formato: 000224 MARCO TULIO MENEZES CPF:
                        // 11396510648)
                        // Este padrÃ£o Ã© mais especÃ­fico para quando hÃ¡ cÃ³digo antes do nome
                        Pattern linhaCompleta3 = Pattern.compile(
                                "(\\d{4,6})\\s+([A-ZÃÃ€Ã‚ÃƒÃ„Ã‰ÃˆÃŠÃ‹ÃÃŒÃŽÃÃ“Ã’Ã”Ã•Ã–ÃšÃ™Ã›ÃœÃ‡][A-ZÃÃ€Ã‚ÃƒÃ„Ã‰ÃˆÃŠÃ‹ÃÃŒÃŽÃÃ“Ã’Ã”Ã•Ã–ÃšÃ™Ã›ÃœÃ‡\\s]{4,}?)\\s+CPF",
                                Pattern.CASE_INSENSITIVE);
                        Matcher lineMatch3 = linhaCompleta3.matcher(linhaCpf);
                        if (lineMatch3.find()) {
                            codigo = lineMatch3.group(1).trim();
                            String nomeCandidate = lineMatch3.group(2).trim().replaceAll("\\s+", " ");
                            if (isValidEmployeeName(nomeCandidate)) {
                                nome = nomeCandidate.toUpperCase();
                                log.info("âœ… PadrÃ£o 2c - CÃ³digo: {}, Nome: {} (com cÃ³digo antes do nome)", codigo,
                                        nome);
                                break;
                            }
                        }

                        // Se nÃ£o encontrou nome na mesma linha, tentar linha anterior
                        // Estrutura comum: linha anterior = "000224 MARCO TULIO MENEZES", linha atual =
                        // "CPF: 11396510648"
                        if (nome.equals("Desconhecido") && linhaAnterior != null && !linhaAnterior.isEmpty()) {
                            log.info("ðŸ” Nome nÃ£o encontrado na linha do CPF, tentando linha anterior: {}",
                                    linhaAnterior);

                            // PadrÃ£o: MATRÃCULA NOME (ex: 000224 MARCO TULIO MENEZES)
                            Pattern linhaAnteriorPattern = Pattern.compile("(\\d{4,6})\\s+(.+)",
                                    Pattern.CASE_INSENSITIVE);
                            Matcher linhaAnteriorMatch = linhaAnteriorPattern.matcher(linhaAnterior);
                            if (linhaAnteriorMatch.find()) {
                                codigo = linhaAnteriorMatch.group(1).trim();
                                String nomeCandidate = linhaAnteriorMatch.group(2).trim().replaceAll("\\s+", " ");
                                // Remover possÃ­veis sufixos como "CPF", "CNPJ", etc.
                                nomeCandidate = nomeCandidate.replaceAll("\\s+(CPF|CNPJ|MATRICULA|MATRÃCULA).*$", "")
                                        .trim();
                                if (nomeCandidate.length() >= 5 && isValidEmployeeName(nomeCandidate)) {
                                    nome = nomeCandidate.toUpperCase();
                                    log.info("âœ… Nome encontrado na linha anterior - CÃ³digo: {}, Nome: {}", codigo,
                                            nome);
                                    break;
                                }
                            }

                            // PadrÃ£o alternativo: apenas NOME (sem matrÃ­cula)
                            // Verificar se a linha anterior parece ser um nome
                            if (nome.equals("Desconhecido")) {
                                String nomeCandidate = linhaAnterior
                                        .replaceAll("\\s+(CPF|CNPJ|MATRICULA|MATRÃCULA).*$", "").trim();
                                // Verificar se nÃ£o contÃ©m nÃºmeros (exceto se for parte do nome)
                                if (nomeCandidate.length() >= 5 &&
                                        !nomeCandidate.matches(".*\\d{4,}.*") && // NÃ£o deve ter sequÃªncias de 4+
                                                                                 // dÃ­gitos
                                        nomeCandidate.matches(".*[A-ZÃÃ€Ã‚ÃƒÃ„Ã‰ÃˆÃŠÃ‹ÃÃŒÃŽÃÃ“Ã’Ã”Ã•Ã–ÃšÃ™Ã›ÃœÃ‡].*")
                                        &&
                                        isValidEmployeeName(nomeCandidate)) {
                                    nome = nomeCandidate.toUpperCase();
                                    log.info("âœ… Nome encontrado na linha anterior (sem matrÃ­cula): {}", nome);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }

        // ValidaÃ§Ã£o: Se foram encontrados mÃºltiplos CPFs diferentes na mesma
        // pÃ¡gina, avisar
        if (cpfsEncontrados.size() > 1) {
            log.warn("âš ï¸ ATENÃ‡ÃƒO: Foram encontrados {} CPF(s) diferente(s) na pÃ¡gina {}: {}",
                    cpfsEncontrados.size(), pageNumber, cpfsEncontrados);
            log.warn("âš ï¸ Usando apenas o primeiro CPF encontrado: {} (frente e verso devem ter o mesmo CPF)", cpf);
            log.warn(
                    "âš ï¸ Esta pÃ¡gina pode conter mÃºltiplos holerites de funcionÃ¡rios diferentes ou formato inesperado");
            log.warn(
                    "âš ï¸ VERIFICAÃ‡ÃƒO: Cada pÃ¡gina deve conter apenas as duas vias (frente e verso) do MESMO funcionÃ¡rio");
        } else if (cpfsEncontrados.size() == 1 && cpf != null) {
            log.info(
                    "âœ… ValidaÃ§Ã£o OK: Apenas 1 CPF Ãºnico encontrado na pÃ¡gina {}: {} (confirma que a pÃ¡gina contÃ©m apenas as duas vias do mesmo funcionÃ¡rio)",
                    pageNumber, cpf);
        } else if (cpfsEncontrados.size() == 0) {
            log.warn("âš ï¸ Nenhum CPF encontrado na pÃ¡gina {} - pode indicar problema na extraÃ§Ã£o do texto",
                    pageNumber);
        }

        // 1.5. EXTRAÃ‡ÃƒO DO CNPJ DA EMPRESA
        Pattern cnpjPattern = Pattern
                .compile("CNPJ[:\\s]*([0-9]{2}\\.?[0-9]{3}\\.?[0-9]{3}/?[0-9]{4}-?[0-9]{2}|[0-9]{14})");
        for (String linhaCnpj : linhas) {
            Matcher cnpjMatcher = cnpjPattern.matcher(linhaCnpj);
            if (cnpjMatcher.find()) {
                empresaCnpj = cnpjMatcher.group(1).replaceAll("[^0-9]", "");
                log.info("âœ… CNPJ da empresa encontrado: {} na linha: {}", empresaCnpj, linhaCnpj.trim());

                // Tentar extrair nome da empresa da mesma linha ou linhas prÃ³ximas
                // PadrÃ£o comum: NOME_DA_EMPRESA + CNPJ
                // Ou em linhas separadas
                break;
            }
        }

        // Fallback: alguns holerites trazem o CNPJ sem o rÃ³tulo "CNPJ"
        if (empresaCnpj == null) {
            Pattern fallbackCnpjPattern = Pattern.compile("(?<!\\d)(\\d{14})(?!\\d)");
            int limiteLinhas = Math.min(15, linhas.length);
            for (int i = 0; i < limiteLinhas; i++) {
                String linhaCnpjFallback = linhas[i];
                Matcher fallbackMatcher = fallbackCnpjPattern.matcher(linhaCnpjFallback.replaceAll("\\s+", ""));
                if (fallbackMatcher.find()) {
                    empresaCnpj = fallbackMatcher.group(1);
                    log.info("âœ… CNPJ (fallback) encontrado: {} na linha {}", empresaCnpj, linhaCnpjFallback.trim());

                    // Tentar capturar o nome da empresa na mesma linha (removendo nÃºmeros)
                    if (empresaNome == null) {
                        String possibleName = linhaCnpjFallback.replaceAll("\\d", " ").replaceAll("\\s+", " ").trim();
                        if (possibleName.length() > 5) {
                            empresaNome = possibleName;
                            log.info("âœ… Nome da empresa (fallback) identificado: {}", empresaNome);
                        }
                    }
                    break;
                }
            }
        }

        // 1.6. EXTRAÃ‡ÃƒO DO NOME DA EMPRESA
        // Procurar por linhas que contenham palavras-chave de empresa
        for (int i = 0; i < linhas.length; i++) {
            String linhaEmpresa = linhas[i].trim();
            String linhaUpper = linhaEmpresa.toUpperCase();

            // Se encontrar CNPJ na linha, tentar pegar nome da linha anterior ou mesma
            // linha
            if (linhaUpper.contains("CNPJ") && empresaNome == null) {
                // Tentar extrair nome da mesma linha (antes do CNPJ)
                int cnpjIndex = linhaUpper.indexOf("CNPJ");
                if (cnpjIndex > 10) { // Se hÃ¡ texto suficiente antes
                    String possibleName = linhaEmpresa.substring(0, cnpjIndex).trim();
                    // Remover palavras-chave que nÃ£o sÃ£o parte do nome
                    possibleName = possibleName.replaceAll("(?i)(EMPRESA|RAZÃƒO SOCIAL|EMPREGADOR)[:\\s]*", "").trim();
                    if (possibleName.length() > 5 && !possibleName.matches(".*\\d{3}.*")) {
                        empresaNome = possibleName;
                        log.info("âœ… Nome da empresa encontrado (mesma linha CNPJ): {}", empresaNome);
                        break;
                    }
                }

                // Se nÃ£o encontrou, tentar linha anterior
                if (i > 0 && empresaNome == null) {
                    String linhaNterior = linhas[i - 1].trim();
                    if (linhaNterior.length() > 5 && !linhaNterior.matches(".*\\d{3}.*") &&
                            !linhaNterior.toUpperCase().contains("FOLHA") &&
                            !linhaNterior.toUpperCase().contains("PAGAMENTO") &&
                            !linhaNterior.toUpperCase().contains("HOLERITE")) {
                        empresaNome = linhaNterior;
                        log.info("âœ… Nome da empresa encontrado (linha anterior ao CNPJ): {}", empresaNome);
                        break;
                    }
                }
            }

            // Procurar por linhas com "LTDA", "S.A", "ME", etc. que geralmente indicam nome
            // de empresa
            if (empresaNome == null && (linhaUpper.contains("LTDA") || linhaUpper.contains("S.A") ||
                    linhaUpper.contains(" ME ") || linhaUpper.contains("EIRELI")) &&
                    !linhaUpper.contains("FUNCIONARIO") && !linhaUpper.contains("CPF") &&
                    linhaEmpresa.length() > 10 && linhaEmpresa.length() < 150) {
                empresaNome = linhaEmpresa;
                log.info("âœ… Nome da empresa encontrado (por sufixo empresarial): {}", empresaNome);
                break;
            }
        }

        // 2. Se nÃ£o encontrou nome na linha do CPF, procurar em linhas prÃ³ximas
        if (nome.equals("Desconhecido") && cpf != null) {
            log.info("Procurando nome em linhas adjacentes ao CPF...");

            for (int i = 0; i < linhas.length; i++) {
                if (linhas[i].contains("CPF")) {
                    // Verificar linhas anteriores e posteriores (-3 a +3)
                    for (int j = Math.max(0, i - 3); j <= Math.min(linhas.length - 1, i + 3); j++) {
                        String linhaCandidata = linhas[j].trim();

                        // Pular linhas que claramente nÃ£o sÃ£o nomes
                        if (linhaCandidata.isEmpty() ||
                                linhaCandidata.contains("CPF") ||
                                linhaCandidata.contains("CNPJ") ||
                                linhaCandidata.toUpperCase().contains("FOLHA") ||
                                linhaCandidata.toUpperCase().contains("PAGAMENTO") ||
                                linhaCandidata.toUpperCase().contains("EMPRESA") ||
                                linhaCandidata.toUpperCase().contains("LTDA") ||
                                linhaCandidata.length() < 5) {
                            continue;
                        }

                        // Extrair possÃ­vel cÃ³digo + nome
                        Pattern codigoNome = Pattern.compile("(\\d{6})\\s+(.+)");
                        Matcher matchCodigoNome = codigoNome.matcher(linhaCandidata);
                        if (matchCodigoNome.find()) {
                            String possibleCodigo = matchCodigoNome.group(1);
                            String possibleNome = matchCodigoNome.group(2).trim();
                            if (isValidEmployeeName(possibleNome)) {
                                codigo = possibleCodigo;
                                nome = possibleNome;
                                log.info("âœ… Nome encontrado com cÃ³digo: {} - {}", codigo, nome);
                                break;
                            }
                        }

                        // Ou apenas nome (sem cÃ³digo)
                        if (isValidEmployeeName(linhaCandidata)) {
                            nome = linhaCandidata;
                            log.info("âœ… Nome encontrado: {}", nome);
                            break;
                        }
                    }
                    break;
                }
            }
        }

        // 3. EXTRAÃ‡ÃƒO DO PERÃODO DE REFERÃŠNCIA - mÃºltiplos padrÃµes
        log.info("ðŸ” Procurando perÃ­odo de referÃªncia no holerite...");

        // PadrÃ£o 1: "DD/MM/AAAA a DD/MM/AAAA" (perÃ­odo completo)
        Pattern periodoPattern1 = Pattern.compile("(\\d{2})/(\\d{2})/(\\d{4})\\s+a\\s+(\\d{2})/(\\d{2})/(\\d{4})");
        for (int idx = 0; idx < linhas.length; idx++) {
            String linhaPeriodo = linhas[idx];
            Matcher periodoMatcher = periodoPattern1.matcher(linhaPeriodo);
            if (periodoMatcher.find()) {
                mes = periodoMatcher.group(5); // mÃªs da data final (perÃ­odo de referÃªncia)
                ano = periodoMatcher.group(6); // ano da data final (perÃ­odo de referÃªncia)
                log.info("âœ… PerÃ­odo de referÃªncia encontrado (padrÃ£o 1): {}/{} - Linha: {}", mes, ano,
                        linhaPeriodo.trim());
                workPostName = findWorkPostName(linhas, idx, linhaPeriodo.substring(periodoMatcher.end()));
                break;
            }
        }

        // PadrÃ£o 2: "DD/MM/AAAA a DD/MM/AAAA" com espaÃ§os diferentes
        if (mes == null || ano == null) {
            Pattern periodoPattern1b = Pattern
                    .compile("(\\d{2})/(\\d{2})/(\\d{4})\\s+Ã \\s+(\\d{2})/(\\d{2})/(\\d{4})");
            for (int idx = 0; idx < linhas.length; idx++) {
                String linhaPeriodo1b = linhas[idx];
                Matcher periodoMatcher = periodoPattern1b.matcher(linhaPeriodo1b);
                if (periodoMatcher.find()) {
                    mes = periodoMatcher.group(5);
                    ano = periodoMatcher.group(6);
                    log.info("âœ… PerÃ­odo de referÃªncia encontrado (padrÃ£o 1b): {}/{} - Linha: {}", mes, ano,
                            linhaPeriodo1b.trim());
                    if (workPostName == null) {
                        workPostName = findWorkPostName(linhas, idx, linhaPeriodo1b.substring(periodoMatcher.end()));
                    }
                    break;
                }
            }
        }

        // PadrÃ£o 3: "MM/AAAA" direto - encontrar a Ãºltima ocorrÃªncia quando hÃ¡
        // mÃºltiplas datas
        if (mes == null || ano == null) {
            Pattern periodoPattern2 = Pattern.compile("(\\d{2})/(\\d{4})");
            for (int idx = 0; idx < linhas.length; idx++) {
                String linhaPeriodo2 = linhas[idx];
                Matcher periodoMatcher = periodoPattern2.matcher(linhaPeriodo2);
                String lastMatch = null;
                int lastEnd = -1;
                // Encontrar a Ãºltima ocorrÃªncia do padrÃ£o na linha
                while (periodoMatcher.find()) {
                    lastMatch = periodoMatcher.group(1) + "/" + periodoMatcher.group(2);
                    lastEnd = periodoMatcher.end();
                }
                if (lastMatch != null && lastEnd > 0) {
                    // Extrair mÃªs e ano da Ãºltima ocorrÃªncia
                    String[] parts = lastMatch.split("/");
                    mes = parts[0];
                    ano = parts[1];
                    log.info("âœ… PerÃ­odo de referÃªncia encontrado (padrÃ£o 2): {}/{} - Linha: {}", mes, ano,
                            linhaPeriodo2.trim());
                    if (workPostName == null) {
                        workPostName = findWorkPostName(linhas, idx, linhaPeriodo2.substring(lastEnd));
                    }
                    break;
                }
            }
        }

        // PadrÃ£o 4: "DD/MM/AAAA" (data Ãºnica - usar o mÃªs/ano dessa data)
        if (mes == null || ano == null) {
            Pattern periodoPattern3 = Pattern.compile("(\\d{2})/(\\d{2})/(\\d{4})");
            for (int idx = 0; idx < linhas.length; idx++) {
                String linhaPeriodo3 = linhas[idx];
                Matcher periodoMatcher = periodoPattern3.matcher(linhaPeriodo3);
                if (periodoMatcher.find()) {
                    mes = periodoMatcher.group(2);
                    ano = periodoMatcher.group(3);
                    log.info("âœ… PerÃ­odo de referÃªncia encontrado (padrÃ£o 3): {}/{} - Linha: {}", mes, ano,
                            linhaPeriodo3.trim());
                    if (workPostName == null) {
                        workPostName = findWorkPostName(linhas, idx, linhaPeriodo3.substring(periodoMatcher.end()));
                    }
                    break;
                }
            }
        }

        // PadrÃ£o 5: Nomes de meses em portuguÃªs via OCR
        if ((mes == null || ano == null) && ocrText != null) {
            log.info("ðŸ” Tentando extrair perÃ­odo via OCR...");
            String[] meses = { "JANEIRO", "FEVEREIRO", "MARÃ‡O", "ABRIL", "MAIO", "JUNHO",
                    "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO" };
            for (int i = 0; i < meses.length; i++) {
                if (ocrText.toUpperCase().contains(meses[i])) {
                    mes = String.format("%02d", i + 1);
                    // Procurar ano prÃ³ximo (2020-2030)
                    Pattern anoPattern = Pattern.compile("(20[2-3][0-9])");
                    Matcher anoMatcher = anoPattern.matcher(ocrText);
                    if (anoMatcher.find()) {
                        ano = anoMatcher.group(1);
                        log.info("âœ… PerÃ­odo de referÃªncia encontrado via OCR: {}/{} ({})", mes, ano, meses[i]);
                        break;
                    }
                }
            }
        }

        // PadrÃ£o 6: Buscar por "PERÃODO" ou "REFERÃŠNCIA" no texto
        if ((mes == null || ano == null)) {
            log.info("ðŸ” Procurando por palavras-chave de perÃ­odo...");
            for (int idx = 0; idx < linhas.length; idx++) {
                String linhaSetor = linhas[idx];
                String linhaUpper = linhaSetor.toUpperCase();
                if (linhaUpper.contains("PERÃODO") || linhaUpper.contains("REFERÃŠNCIA") ||
                        linhaUpper.contains("COMPETÃŠNCIA") || linhaUpper.contains("MÃŠS")) {

                    // Tentar extrair data dessa linha
                    Pattern dataPattern = Pattern.compile("(\\d{2})/(\\d{2})/(\\d{4})");
                    Matcher dataMatcher = dataPattern.matcher(linhaSetor);
                    if (dataMatcher.find()) {
                        mes = dataMatcher.group(2);
                        ano = dataMatcher.group(3);
                        log.info("âœ… PerÃ­odo de referÃªncia encontrado por palavra-chave: {}/{} - Linha: {}", mes,
                                ano, linhaSetor.trim());
                        if (workPostName == null) {
                            workPostName = findWorkPostName(linhas, idx, linhaSetor.substring(dataMatcher.end()));
                        }
                        break;
                    }
                }
            }
        }

        if (workPostName == null) {
            workPostName = searchForLabeledWorkPost(linhas);
        }

        // 3.5. TASK 02: EXTRAÃ‡ÃƒO DE VALORES FINANCEIROS (Total Vencimentos, Total
        // Descontos, Valor LÃ­quido)
        java.math.BigDecimal totalVencimentos = null;
        java.math.BigDecimal totalDescontos = null;
        java.math.BigDecimal valorLiquido = null;

        // Extrair Total Vencimentos
        // PadrÃµes: "Total Vencimentos: 1.912,65", "TOTAL VENCIMENTOS 1.912,65", "Total
        // Ganhos: 1.912,65"
        // Melhorado para capturar valores com ou sem separadores
        Pattern totalVencimentosPattern = Pattern.compile(
                "(?i)(?:TOTAL\\s+VENCIMENTOS?|VENCIMENTOS?\\s+TOTAL|TOTAL\\s+GANHOS?)\\s*:?\\s*([\\d.]+[,.]?\\d{0,2}|[\\d,]+)",
                Pattern.CASE_INSENSITIVE);
        for (String linhaVencimentos : linhas) {
            Matcher matcher = totalVencimentosPattern.matcher(linhaVencimentos);
            if (matcher.find()) {
                try {
                    String valorStr = matcher.group(1).trim();
                    // Formato brasileiro: 1.912,65 -> 1912.65
                    // Se tem ponto e vÃ­rgula: remover pontos e substituir vÃ­rgula por ponto
                    if (valorStr.contains(",") && valorStr.contains(".")) {
                        valorStr = valorStr.replace(".", "").replace(",", ".");
                    } else if (valorStr.contains(",") && !valorStr.contains(".")) {
                        // Apenas vÃ­rgula: substituir por ponto
                        valorStr = valorStr.replace(",", ".");
                    }
                    // Remover espaÃ§os e garantir que Ã© um nÃºmero vÃ¡lido
                    valorStr = valorStr.replaceAll("\\s+", "");
                    if (!valorStr.isEmpty() && valorStr.matches("\\d+(\\.\\d+)?")) {
                        totalVencimentos = new java.math.BigDecimal(valorStr);
                        log.info("âœ… Total Vencimentos encontrado: {} (linha: {})", totalVencimentos,
                                linhaVencimentos.trim());
                        break;
                    }
                } catch (Exception e) {
                    log.warn("âš ï¸ Erro ao extrair Total Vencimentos da linha '{}': {}", linhaVencimentos.trim(),
                            e.getMessage());
                }
            }
        }

        // Extrair Total Descontos
        // PadrÃµes: "Total Descontos: 500,65", "TOTAL DESCONTOS 500,65"
        Pattern totalDescontosPattern = Pattern.compile(
                "(?i)(?:TOTAL\\s+DESCONTOS?|DESCONTOS?\\s+TOTAL)\\s*:?\\s*([\\d.]+[,.]?\\d{0,2}|[\\d,]+)",
                Pattern.CASE_INSENSITIVE);
        for (String linhaDescontos : linhas) {
            Matcher matcher = totalDescontosPattern.matcher(linhaDescontos);
            if (matcher.find()) {
                try {
                    String valorStr = matcher.group(1).trim();
                    // Formato brasileiro: 500,65 -> 500.65
                    if (valorStr.contains(",") && valorStr.contains(".")) {
                        valorStr = valorStr.replace(".", "").replace(",", ".");
                    } else if (valorStr.contains(",") && !valorStr.contains(".")) {
                        valorStr = valorStr.replace(",", ".");
                    }
                    // Remover espaÃ§os e garantir que Ã© um nÃºmero vÃ¡lido
                    valorStr = valorStr.replaceAll("\\s+", "");
                    if (!valorStr.isEmpty() && valorStr.matches("\\d+(\\.\\d+)?")) {
                        totalDescontos = new java.math.BigDecimal(valorStr);
                        log.info("âœ… Total Descontos encontrado: {} (linha: {})", totalDescontos,
                                linhaDescontos.trim());
                        break;
                    }
                } catch (Exception e) {
                    log.warn("âš ï¸ Erro ao extrair Total Descontos da linha '{}': {}", linhaDescontos.trim(),
                            e.getMessage());
                }
            }
        }

        // Extrair Valor LÃ­quido
        // PadrÃµes: "Valor LÃ­quido: 1.412,00", "VALOR LÃQUIDO 1.412,00", "LÃ­quido:
        // 1.412,00"
        Pattern valorLiquidoPattern = Pattern.compile(
                "(?i)(?:VALOR\\s+L[IÃ]QUIDO|L[IÃ]QUIDO|VALOR\\s+FINAL|VALOR\\s+A\\s+RECEBER)\\s*:?\\s*([\\d.]+[,.]?\\d{0,2}|[\\d,]+)",
                Pattern.CASE_INSENSITIVE);
        for (String linhaLiquido : linhas) {
            Matcher matcher = valorLiquidoPattern.matcher(linhaLiquido);
            if (matcher.find()) {
                try {
                    String valorStr = matcher.group(1).trim();
                    // Formato brasileiro: 1.412,00 -> 1412.00
                    if (valorStr.contains(",") && valorStr.contains(".")) {
                        valorStr = valorStr.replace(".", "").replace(",", ".");
                    } else if (valorStr.contains(",") && !valorStr.contains(".")) {
                        valorStr = valorStr.replace(",", ".");
                    }
                    // Remover espaÃ§os e garantir que Ã© um nÃºmero vÃ¡lido
                    valorStr = valorStr.replaceAll("\\s+", "");
                    if (!valorStr.isEmpty() && valorStr.matches("\\d+(\\.\\d+)?")) {
                        valorLiquido = new java.math.BigDecimal(valorStr);
                        log.info("âœ… Valor LÃ­quido encontrado: {} (linha: {})", valorLiquido, linhaLiquido.trim());
                        break;
                    }
                } catch (Exception e) {
                    log.warn("âš ï¸ Erro ao extrair Valor LÃ­quido da linha '{}': {}", linhaLiquido.trim(),
                            e.getMessage());
                }
            }
        }

        // Se nÃ£o encontrou Valor LÃ­quido diretamente, calcular como diferenÃ§a (Total
        // Vencimentos - Total Descontos)
        if (valorLiquido == null && totalVencimentos != null && totalDescontos != null) {
            valorLiquido = totalVencimentos.subtract(totalDescontos);
            log.info("ðŸ“Š Valor LÃ­quido calculado: {} ({} - {})", valorLiquido, totalVencimentos, totalDescontos);
        }

        // 4. VALIDAÃ‡Ã•ES DE CAMPOS OBRIGATÃ“RIOS
        // Campos obrigatÃ³rios: Empresa, CNPJ, PerÃ­odo, Setor, Nome do FuncionÃ¡rio,
        // CPF
        List<String> camposFaltantes = new ArrayList<>();

        if (cpf == null || cpf.length() != 11) {
            camposFaltantes.add("CPF");
            log.warn("âŒ CPF invÃ¡lido ou nÃ£o encontrado - PÃ¡gina: {}, CPF extraÃ­do: {}", pageNumber, cpf);
        }

        if (nome.equals("Desconhecido") || nome.trim().isEmpty()) {
            camposFaltantes.add("Nome do FuncionÃ¡rio");
            log.warn("âŒ Nome nÃ£o encontrado - PÃ¡gina: {}", pageNumber);
        }

        if (empresaNome == null || empresaNome.trim().isEmpty()) {
            camposFaltantes.add("Empresa");
            log.warn("âŒ Nome da empresa nÃ£o encontrado - PÃ¡gina: {}", pageNumber);
        }

        if (empresaCnpj == null || empresaCnpj.trim().isEmpty()
                || empresaCnpj.replaceAll("[^0-9]", "").length() != 14) {
            camposFaltantes.add("CNPJ");
            log.warn("âŒ CNPJ invÃ¡lido ou nÃ£o encontrado - PÃ¡gina: {}, CNPJ extraÃ­do: {}", pageNumber,
                    empresaCnpj);
        }

        if (workPostName == null || workPostName.trim().isEmpty()) {
            camposFaltantes.add("Setor/Posto de Trabalho");
            log.warn("âŒ Setor/Posto de trabalho nÃ£o encontrado - PÃ¡gina: {}", pageNumber);
        }

        if (mes == null || ano == null) {
            camposFaltantes.add("PerÃ­odo (MÃªs/Ano)");
            log.warn("âŒ MÃªs/ano de referÃªncia nÃ£o encontrados - PÃ¡gina: {}", pageNumber);
        }

        // Se algum campo obrigatÃ³rio estiver faltando, retornar null
        if (!camposFaltantes.isEmpty()) {
            log.error("âŒ CAMPOS OBRIGATÃ“RIOS FALTANDO na pÃ¡gina {}: {}", pageNumber,
                    String.join(", ", camposFaltantes));
            log.error(
                    "âŒ Holerite nÃ£o serÃ¡ processado. Campos obrigatÃ³rios: Empresa, CNPJ, PerÃ­odo, Setor, Nome do FuncionÃ¡rio, CPF");
            return null;
        }

        // Validar se o mÃªs estÃ¡ entre 1 e 12
        try {
            int mesInt = Integer.parseInt(mes);
            int anoInt = Integer.parseInt(ano);

            if (mesInt < 1 || mesInt > 12) {
                log.warn("âŒ MÃªs invÃ¡lido: {} - PÃ¡gina: {}", mes, pageNumber);
                return null;
            }

            if (anoInt < 2020 || anoInt > 2030) {
                log.warn("âŒ Ano invÃ¡lido: {} - PÃ¡gina: {}", ano, pageNumber);
                return null;
            }

            log.info(
                    "âœ… Dados extraÃ­dos com sucesso - PÃ¡gina: {}, CÃ³digo: {}, Nome: {}, CPF: {}, Empresa: {} (CNPJ: {}), PerÃ­odo de ReferÃªncia: {}/{}",
                    pageNumber, codigo, nome, cpf, empresaNome, empresaCnpj, mes, ano);

            if (totalVencimentos != null || totalDescontos != null || valorLiquido != null) {
                log.info("ðŸ’° Valores financeiros extraÃ­dos - Vencimentos: {}, Descontos: {}, LÃ­quido: {}",
                        totalVencimentos, totalDescontos, valorLiquido);
            }

            // Extrair dados detalhados da tabela (CÃ³d, DescriÃ§Ã£o, ReferÃªncia,
            // Vencimentos, Descontos)
            List<com.z7design.fleet_manager.dto.PayslipTableRow> tableDetails = extractTableDetails(linhas);
            if (!tableDetails.isEmpty()) {
                log.info("ðŸ“‹ Dados detalhados da tabela extraÃ­dos: {} linha(s)", tableDetails.size());
            }

            return Payslip.builder()
                    .employeeName(nome)
                    .cpf(cpf)
                    .companyName(empresaNome)
                    .companyCnpj(empresaCnpj)
                    .workPostName(workPostName)
                    .month(mesInt)
                    .year(anoInt)
                    .totalEarnings(totalVencimentos)
                    .totalDeductions(totalDescontos)
                    .netValue(valorLiquido)
                    .tableDetails(tableDetails)
                    .build();

        } catch (NumberFormatException e) {
            log.warn("âŒ Erro ao converter mÃªs/ano para nÃºmero - MÃªs: {}, Ano: {}, PÃ¡gina: {}", mes, ano,
                    pageNumber);
            return null;
        }
    }

    private void enrichCompanyData(Payslip payslip) {
        if (payslip == null) {
            return;
        }

        String normalizedCnpj = normalizeCnpj(payslip.getCompanyCnpj());
        payslip.setCompanyCnpj(normalizedCnpj);

        if (normalizedCnpj == null || normalizedCnpj.isEmpty()) {
            return;
        }

        try {
            List<Company> companies = companyRepository.findByNormalizedCnpj(normalizedCnpj);
            if (companies.isEmpty()) {
                log.debug("Nenhuma empresa encontrada para o CNPJ normalizado {}", normalizedCnpj);
                return;
            }

            Company company = companies.get(0);
            payslip.setCompany(company);
            payslip.setCompanySigla(company.getSigla());

            if (payslip.getCompanyName() == null || payslip.getCompanyName().isBlank()) {
                payslip.setCompanyName(company.getName());
            }
        } catch (Exception e) {
            log.warn("âš ï¸ Erro ao vincular empresa para CNPJ {}: {}", normalizedCnpj, e.getMessage());
        }
    }

    private String normalizeCnpj(String rawCnpj) {
        if (rawCnpj == null) {
            return null;
        }
        String digitsOnly = rawCnpj.replaceAll("\\D", "");
        return digitsOnly.length() == 14 ? digitsOnly : null;
    }

    private String findWorkPostName(String[] lines, int currentIndex, String trailingText) {
        // Primeiro, tentar extrair do texto que vem apÃ³s o perÃ­odo na mesma linha
        if (trailingText != null && !trailingText.trim().isEmpty()) {
            String candidate = sanitizeWorkPostCandidate(trailingText);
            if (candidate != null) {
                log.info("âœ… Setor encontrado no texto apÃ³s o perÃ­odo: {}", candidate);
                return candidate;
            }
            // Se nÃ£o encontrou, tentar extrair removendo possÃ­veis prefixos comuns
            String cleaned = trailingText.trim();
            // Remover "FOLHA DE PAGAMENTO" se estiver presente
            cleaned = cleaned.replaceAll("(?i)\\s*FOLHA\\s+DE\\s+PAGAMENTO.*$", "").trim();
            if (!cleaned.isEmpty()) {
                candidate = sanitizeWorkPostCandidate(cleaned);
                if (candidate != null) {
                    log.info("âœ… Setor encontrado apÃ³s limpeza do texto: {}", candidate);
                    return candidate;
                }
            }
        }

        // Se nÃ£o encontrou na mesma linha, procurar nas prÃ³ximas 2 linhas
        for (int offset = 1; offset <= 2; offset++) {
            int idx = currentIndex + offset;
            if (idx < lines.length) {
                String candidate = sanitizeWorkPostCandidate(lines[idx]);
                if (candidate != null) {
                    log.info("âœ… Setor encontrado na linha {} (offset {}): {}", idx, offset, candidate);
                    return candidate;
                }
            }
        }

        log.warn("âš ï¸ Setor nÃ£o encontrado apÃ³s o perÃ­odo na linha {}", currentIndex);
        return null;
    }

    private String searchForLabeledWorkPost(String[] lines) {
        Pattern labeledPattern = Pattern.compile("(?i)(setor|posto|local(?: de trabalho)?)[:\\s]+(.{3,})");
        for (String line : lines) {
            Matcher matcher = labeledPattern.matcher(line);
            if (matcher.find()) {
                String candidate = sanitizeWorkPostCandidate(matcher.group(2));
                if (candidate != null) {
                    return candidate;
                }
            }
        }
        return null;
    }

    private String sanitizeWorkPostCandidate(String candidate) {
        if (candidate == null) {
            return null;
        }
        String cleaned = candidate.replaceAll("[\\p{Cntrl}]", " ").trim();
        if (cleaned.isEmpty()) {
            return null;
        }

        // Se houver rÃ³tulo "SETOR: ..." manter apenas o que vem depois dos dois pontos
        int colonIndex = cleaned.indexOf(':');
        if (colonIndex >= 0 && colonIndex < cleaned.length() - 1) {
            cleaned = cleaned.substring(colonIndex + 1).trim();
        }

        // Remover "FOLHA DE PAGAMENTO" se estiver no final
        cleaned = cleaned.replaceAll("(?i)\\s*FOLHA\\s+DE\\s+PAGAMENTO.*$", "").trim();

        cleaned = cleaned.replaceAll("[â€¢Â·]+", " ");
        cleaned = cleaned.replaceAll("[\\s]+", " ").trim();
        cleaned = cleaned.replaceAll("[.,;]+$", "").trim();

        if (cleaned.length() < 3) {
            return null;
        }

        String upper = cleaned.toUpperCase(java.util.Locale.ROOT);

        // Tokens que SEMPRE invalidam (nÃ£o devem aparecer em setores)
        String[] alwaysInvalidTokens = {
                "CPF", "CNPJ", "DEMONSTRATIVO", "PAGAMENTO", "FOLHA", "HOLERITE",
                "ENDERECO", "ENDEREÃ‡O", "RUA", "AVENIDA", "TELEFONE"
        };

        for (String token : alwaysInvalidTokens) {
            if (upper.contains(token)) {
                return null;
            }
        }

        // Tokens da empresa principal que invalidam (PROMOVER VIGILANCIA PATRIMONIAL)
        String[] empresaPrincipalTokens = {
                "PROMOVER", "VIGILANCIA", "PATRIMONIAL"
        };

        boolean isEmpresaPrincipal = false;
        for (String token : empresaPrincipalTokens) {
            if (upper.contains(token)) {
                isEmpresaPrincipal = true;
                break;
            }
        }

        // Se contÃ©m tokens da empresa principal E "LTDA" ou "EMPRESA", Ã© a empresa
        // principal, nÃ£o um setor
        if (isEmpresaPrincipal && (upper.contains("LTDA") || upper.contains("EMPRESA"))) {
            return null;
        }

        // Permitir "LTDA", "S.A", "ME", "EIRELI" em setores (alguns setores sÃ£o
        // empresas)
        // Mas rejeitar se for apenas "LTDA" ou "S.A" sozinho
        if (upper.matches("^(LTDA|S\\.A|ME|EIRELI)$")) {
            return null;
        }

        // Rejeitar se contÃ©m apenas nÃºmeros ou caracteres especiais
        if (!upper.matches(".*[A-Z].*")) {
            return null;
        }

        // Rejeitar se contÃ©m vÃ­rgulas ou asteriscos (geralmente sÃ£o listas ou
        // formataÃ§Ã£o)
        if (upper.contains(",") || upper.contains("*")) {
            return null;
        }

        // Se passou todas as validaÃ§Ãµes, retornar o setor normalizado
        return upper;
    }

    private boolean isValidEmployeeName(String name) {
        if (name == null || name.trim().isEmpty() || name.length() < 5) {
            log.debug("âš ï¸ Nome invÃ¡lido: null, vazio ou muito curto (< 5 caracteres)");
            return false;
        }

        String nameUpper = name.toUpperCase().trim();

        // Filtrar tÃ­tulos e cargos (mas apenas se for o nome completo, nÃ£o se for
        // parte do nome)
        String[] invalidNames = {
                "FOLHA", "PAGAMENTO", "DEMONSTRATIVO", "HOLERITE", "CONTRACHEQUE",
                "PORTEIRO", "CONTROLADOR", "VIGIA", "AUXILIAR", "SERVICOS", "SEGURANCA",
                "EMPRESA", "LTDA", "ME", "EIRELI", "S.A", "CNPJ", "ENDERECO", "TELEFONE",
                "PERIODO", "REFERENCIA", "FUNCIONARIO", "COLABORADOR", "SALARIO"
        };

        // Verificar se o nome completo Ã© exatamente um dos nomes invÃ¡lidos
        for (String invalid : invalidNames) {
            if (nameUpper.equals(invalid)) {
                log.debug("âš ï¸ Nome invÃ¡lido: Ã© exatamente '{}' (tÃ­tulo/cargo)", invalid);
                return false;
            }
        }

        // Verificar se contÃ©m apenas letras, espaÃ§os e acentos (permitir
        // preposiÃ§Ãµes como DA, DE, DOS, etc.)
        if (!nameUpper.matches("^[A-ZÃÃ€Ã‚ÃƒÃ„Ã‰ÃˆÃŠÃ‹ÃÃŒÃŽÃÃ“Ã’Ã”Ã•Ã–ÃšÃ™Ã›ÃœÃ‡ ]+$")) {
            log.debug("âš ï¸ Nome invÃ¡lido: contÃ©m caracteres invÃ¡lidos. Nome: '{}'", nameUpper);
            return false;
        }

        // Deve ter pelo menos 2 palavras (primeiro nome e sobrenome)
        String[] palavras = nameUpper.split("\\s+");
        if (palavras.length < 2) {
            log.debug("âš ï¸ Nome invÃ¡lido: tem menos de 2 palavras. Nome: '{}'", nameUpper);
            return false;
        }

        // Primeira palavra deve ter pelo menos 3 caracteres
        if (palavras[0].length() < 3) {
            log.debug("âš ï¸ Nome invÃ¡lido: primeira palavra muito curta. Nome: '{}'", nameUpper);
            return false;
        }

        log.debug("âœ… Nome vÃ¡lido: '{}'", nameUpper);
        return true;
    }

    /**
     * Gerar email Ãºnico para cada funcionÃ¡rio baseado no CPF
     */
    private String generateUniqueEmail(String cpf, String nome) {
        // Formato principal: colaborador.CPF@promovervigilancia.com.br
        String baseEmail = String.format("colaborador.%s@promovervigilancia.com.br", cpf);

        // Verificar se jÃ¡ existe
        if (!userRepository.findByEmail(baseEmail).isPresent()) {
            return baseEmail;
        }

        // Se jÃ¡ existe, gerar alternativo com timestamp
        String timestamp = String.valueOf(System.currentTimeMillis()).substring(8); // Ãºltimos 5 dÃ­gitos
        String alternativeEmail = String.format("colaborador.%s.%s@promovervigilancia.com.br", cpf, timestamp);

        log.warn("âš ï¸ Email {} jÃ¡ existe, usando alternativo: {}", baseEmail, alternativeEmail);
        return alternativeEmail;
    }

    /**
     * Criar usuÃ¡rio automaticamente a partir dos dados do holerite
     */
    private void createUserFromPayslip(Payslip payslip) {
        String username = payslip.getCpf();
        String email = generateUniqueEmail(payslip.getCpf(), payslip.getEmployeeName());
        String password = payslip.getCpf() + "@2025"; // Senha padrÃ£o exigida: cpf@2025
        String name = payslip.getEmployeeName();

        log.info("ðŸ” INÃCIO - Verificando se usuÃ¡rio existe para funcionÃ¡rio: {} (CPF: {})", name, username);

        try {
            // VERIFICAÃ‡ÃƒO DO AMBIENTE
            log.info("ðŸ”§ VERIFICAÃ‡ÃƒO DE AMBIENTE:");
            log.info("   UserRepository: {}", userRepository.getClass().getSimpleName());
            log.info("   RoleRepository: {}", roleRepository.getClass().getSimpleName());

            // Verificar se jÃ¡ existe usuÃ¡rio com este CPF (username)
            Optional<com.z7design.fleet_manager.model.User> existingUser = userRepository.findByUsername(username);
            if (existingUser.isPresent()) {
                log.info("ðŸ‘¤ UsuÃ¡rio jÃ¡ existe para CPF: {} - PULANDO criaÃ§Ã£o", username);
                return;
            }

            log.info("ðŸ†• UsuÃ¡rio nÃ£o existe - PROSSEGUINDO com criaÃ§Ã£o para CPF: {}", username);

            // Buscar role COLABORADOR
            log.info("ðŸ” Buscando role COLABORADOR no banco de dados...");
            Optional<com.z7design.fleet_manager.model.Role> colaboradorRole = roleRepository.findByName("COLABORADOR");
            if (colaboradorRole.isEmpty()) {
                log.error("âŒ Role COLABORADOR nÃ£o encontrado no banco de dados!");
                log.error("   Para criar o role COLABORADOR, execute:");
                log.error(
                        "   INSERT INTO roles (id, name, description) VALUES (gen_random_uuid(), 'COLABORADOR', 'FuncionÃ¡rio colaborador');");
                throw new IllegalArgumentException(
                        "Role COLABORADOR nÃ£o encontrado. Consulte os logs para instruÃ§Ãµes de criaÃ§Ã£o.");
            }

            log.info("âœ… Role COLABORADOR encontrado: {}", colaboradorRole.get().getName());

            // Criar novo usuÃ¡rio
            log.info("ðŸ‘¤ Criando novo usuÃ¡rio com dados:");
            log.info("   Username: {}", username);
            log.info("   Email: {}", email);
            log.info("   Nome: {}", name);
            log.info("   Password: {} (serÃ¡ criptografada)", password);

            com.z7design.fleet_manager.model.User novoUser = new com.z7design.fleet_manager.model.User();
            novoUser.setUsername(username);
            novoUser.setPassword(password);
            novoUser.setEmail(email);
            novoUser.setName(name);
            novoUser.setStatus(com.z7design.fleet_manager.model.enums.UserStatus.ACTIVE);
            novoUser.setActive(true);

            // Associar role COLABORADOR
            java.util.Set<com.z7design.fleet_manager.model.Role> roles = new java.util.HashSet<>();
            roles.add(colaboradorRole.get());
            novoUser.setRoles(roles);

            log.info("ðŸ” Chamando userService.create()...");

            // Usar o UserService para criar (aplica validaÃ§Ãµes e criptografia)
            com.z7design.fleet_manager.model.User usuarioCriado = userService.create(novoUser);

            log.info("âœ… SUCESSO - UsuÃ¡rio criado automaticamente!");
            log.info("   ID: {}", usuarioCriado.getId());
            log.info("   Username: {}", usuarioCriado.getUsername());
            log.info("   Nome: {}", usuarioCriado.getName());
            log.info("   Email: {}", usuarioCriado.getEmail());
            log.info("   Status: {}", usuarioCriado.getStatus());
            log.info("   Roles: {}", usuarioCriado.getRoles().stream().map(r -> r.getName()).toList());

            // VERIFICAÃ‡ÃƒO ADICIONAL - Confirmar se foi salvo no banco
            log.info("ðŸ” VERIFICAÃ‡ÃƒO - Buscando usuÃ¡rio recÃ©m-criado no banco...");
            Optional<com.z7design.fleet_manager.model.User> verificacao = userRepository.findByUsername(username);
            if (verificacao.isPresent()) {
                log.info("âœ… CONFIRMADO - UsuÃ¡rio encontrado no banco de dados!");
                log.info("   ID no banco: {}", verificacao.get().getId());
                log.info("   Nome no banco: {}", verificacao.get().getName());
            } else {
                log.error("âŒ PROBLEMA - UsuÃ¡rio NÃƒO foi encontrado no banco apÃ³s criaÃ§Ã£o!");
                log.error("   PossÃ­vel problema de transaÃ§Ã£o ou commit!");
            }

        } catch (Exception e) {
            log.error("âŒ ERRO DETALHADO ao criar usuÃ¡rio para {}: {}", name, e.getMessage());
            log.error("   Tipo do erro: {}", e.getClass().getSimpleName());
            log.error("   Stack trace completo: ", e);
            throw e;
        }
    }

    private Payslip extractPayslipInfoWithOCR(PDDocument document, int pageNumber) {
        log.info("ðŸ” Tentando extrair informaÃ§Ãµes da pÃ¡gina {} via OCR", pageNumber);
        try {
            File imageFile = convertPdfPageToImage(document, pageNumber);
            log.debug("ðŸ“¸ Imagem criada para OCR: {}", imageFile.getAbsolutePath());

            String text = tesseractService.extractTextFromImage(imageFile);

            if (text == null || text.trim().isEmpty()) {
                log.warn("âš ï¸ OCR nÃ£o extraiu nenhum texto da pÃ¡gina {}", pageNumber);
                imageFile.delete();
                return null;
            }

            log.info("âœ… Texto extraÃ­do via OCR da pÃ¡gina {}: {} caracteres", pageNumber, text.length());
            log.debug("Primeiros 500 caracteres do texto OCR: {}", text.substring(0, Math.min(500, text.length())));

            // Limpar o arquivo temporÃ¡rio
            imageFile.delete();

            // Passar o texto OCR como parÃ¢metro para tentar extrair o perÃ­odo se
            // necessÃ¡rio
            Payslip payslip = extractPayslipInfo(text, pageNumber, text);

            // Garantir que os dados da tabela foram extraÃ­dos
            if (payslip != null && (payslip.getTableDetails() == null || payslip.getTableDetails().isEmpty())) {
                log.warn(
                        "âš ï¸ OCR extraiu dados bÃ¡sicos mas nÃ£o encontrou dados da tabela. Tentando re-extrair...");
                String[] linhas = text.split("\r?\n");
                List<com.z7design.fleet_manager.dto.PayslipTableRow> tableDetails = extractTableDetails(linhas);
                if (!tableDetails.isEmpty()) {
                    payslip.setTableDetails(tableDetails);
                    log.info("âœ… Dados da tabela re-extraÃ­dos via OCR: {} linha(s)", tableDetails.size());
                } else {
                    log.warn("âš ï¸ NÃ£o foi possÃ­vel extrair dados da tabela mesmo com re-tentativa");
                }
            }

            return payslip;
        } catch (TesseractException | IOException e) {
            log.error("âŒ Falha no processamento OCR da pÃ¡gina {}: {}", pageNumber, e.getMessage(), e);
            return null;
        } catch (Exception e) {
            log.error("âŒ Erro inesperado durante OCR da pÃ¡gina {}: {}", pageNumber, e.getMessage(), e);
            return null;
        }
    }

    private File convertPdfPageToImage(PDDocument document, int pageNumber) throws IOException {
        PDFRenderer pdfRenderer = new PDFRenderer(document);
        BufferedImage image = pdfRenderer.renderImageWithDPI(pageNumber - 1, 300); // 300 DPI para melhor qualidade

        File tempFile = File.createTempFile("page_" + pageNumber, ".png");
        ImageIO.write(image, "png", tempFile);

        log.debug("PÃ¡gina {} convertida para imagem: {}", pageNumber, tempFile.getAbsolutePath());
        return tempFile;
    }

    private String generateFileName(Payslip payslip) {
        return generateFileName(payslip, null);
    }

    private String generateFileName(Payslip payslip, String versionSuffix) {
        // Gerar nome do arquivo: NOME_FUNCIONARIO_CPF_MES_ANO[_VERSÃƒO].pdf
        // O nome do funcionÃ¡rio e CPF sÃ£o obrigatÃ³rios para identificar o holerite
        StringBuilder fileName = new StringBuilder();

        // Normalizar nome do funcionÃ¡rio para uso em nome de arquivo
        String nomeFuncionario = normalizeFolderName(
                payslip.getEmployeeName() != null ? payslip.getEmployeeName() : "FUNCIONARIO_NAO_INFORMADO");
        String cpf = payslip.getCpf() != null ? payslip.getCpf() : "CPF_NAO_INFORMADO";

        // Adicionar nome do funcionÃ¡rio
        fileName.append(nomeFuncionario);

        // Adicionar CPF
        fileName.append("_").append(cpf);

        // Adicionar perÃ­odo
        fileName.append("_").append(payslip.getMonth());
        fileName.append("_").append(payslip.getYear());

        // Adicionar sufixo de versÃ£o se fornecido (para holerites com alteraÃ§Ãµes)
        if (versionSuffix != null && !versionSuffix.isEmpty()) {
            fileName.append("_").append(versionSuffix);
        }

        // ExtensÃ£o
        fileName.append(".pdf");

        return fileName.toString();
    }

    @Transactional(readOnly = true)
    public List<PayslipProcessedFileResponse> getProcessedPayslipFiles() {
        log.info("ðŸ“‚ PayslipService.getProcessedPayslipFiles: Buscando todos os payslips no banco...");
        List<Payslip> payslips = payslipRepository.findAll();
        log.info("ðŸ“‚ PayslipService.getProcessedPayslipFiles: Encontrados {} payslips no banco", payslips.size());

        if (payslips.isEmpty()) {
            log.warn("âš ï¸ PayslipService.getProcessedPayslipFiles: Nenhum payslip encontrado no banco de dados");
            return Collections.emptyList();
        }

        return payslips.stream()
                .sorted(Comparator.comparing(Payslip::getProcessedAt).reversed())
                .map(payslip -> {
                    String directory = String.format("%s-%s", payslip.getMonth(), payslip.getYear());
                    Path path = Paths.get(OUTPUT_DIR, directory, payslip.getFileName());
                    String normalizedPath = path.toString().replace('\\', '/');

                    return PayslipProcessedFileResponse.builder()
                            .id(payslip.getId())
                            .fileName(payslip.getFileName())
                            .employeeName(payslip.getEmployeeName())
                            .cpf(payslip.getCpf())
                            .month(payslip.getMonth())
                            .year(payslip.getYear())
                            .companyName(payslip.getCompanyName())
                            .companySigla(payslip.getCompanySigla())
                            .companyCnpj(payslip.getCompanyCnpj())
                            .companyId(payslip.getCompanyId())
                            .path(normalizedPath)
                            .processedAt(payslip.getProcessedAt())
                            .build();
                })
                .collect(Collectors.toList());
    }

    private String organizarEmPastas(PDDocument document, int pageNumber, Payslip payslip) throws IOException {
        // PRD: Estrutura de pastas:
        // {empresa-cnpj}/{setor-normalizado}/{ano-mes}/{funcionario-cpf}/

        // 1. Empresa: usar CNPJ normalizado (apenas nÃºmeros)
        String empresaCnpj = normalizeCnpj(payslip.getCompanyCnpj());
        if (empresaCnpj == null || empresaCnpj.isEmpty()) {
            empresaCnpj = "EMPRESA_NAO_INFORMADA";
            log.warn("âš ï¸ CNPJ da empresa nÃ£o encontrado, usando fallback: {}", empresaCnpj);
        }

        // 2. Setor: normalizar removendo acentos e caracteres especiais
        String setorNome = normalizeSectorName(payslip.getWorkPostName());

        // 3. PerÃ­odo: formato ano-mes (ex: 2025-10)
        String periodo = String.format("%d-%02d", payslip.getYear(), payslip.getMonth());

        // 4. FuncionÃ¡rio: usar NOME e CPF normalizado
        String funcionarioNome = payslip.getEmployeeName() != null ? normalizeEmployeeName(payslip.getEmployeeName())
                : null;
        String funcionarioCpf = payslip.getCpf() != null ? payslip.getCpf().replaceAll("[^0-9]", "") : null;

        if (funcionarioNome == null || funcionarioNome.isEmpty()) {
            funcionarioNome = "FUNCIONARIO_NAO_INFORMADO";
            log.warn("âš ï¸ Nome do funcionÃ¡rio nÃ£o encontrado, usando fallback: {}", funcionarioNome);
        }
        if (funcionarioCpf == null || funcionarioCpf.isEmpty()) {
            funcionarioCpf = "00000000000";
            log.warn("âš ï¸ CPF do funcionÃ¡rio nÃ£o encontrado, usando fallback: {}", funcionarioCpf);
        }

        // Criar pasta do funcionÃ¡rio: nome_funcionario_cpf (ex:
        // MARCO_TULIO_MENEZES_11396510648)
        String pastaFuncionario = String.format("%s_%s", funcionarioNome, funcionarioCpf);

        // Criar caminho completo conforme PRD:
        // empresa-cnpj/setor/ano-mes/nome_funcionario_cpf/
        Path pastaCompleta = Paths.get(OUTPUT_DIR, empresaCnpj, setorNome, periodo, pastaFuncionario);

        // Criar diretÃ³rio se nÃ£o existir
        if (!Files.exists(pastaCompleta)) {
            Files.createDirectories(pastaCompleta);
            log.info("ðŸ“ Estrutura de pastas criada conforme PRD: {}", pastaCompleta);
        }

        // 5. Versionamento: buscar versÃµes existentes no mesmo caminho e determinar
        // prÃ³xima versÃ£o
        int proximaVersao = determinarProximaVersao(pastaCompleta, payslip);
        payslip.setVersao(proximaVersao);

        // 6. Nome do arquivo conforme PRD atualizado: NOME_CPF_V1.pdf, NOME_CPF_V2.pdf,
        // etc.
        String nomeArquivo = String.format("%s_V%d.pdf", pastaFuncionario, proximaVersao);
        Path caminhoCompleto = pastaCompleta.resolve(nomeArquivo);

        // 7. Calcular hash do arquivo PDF antes de salvar (usar hash do PDF, nÃ£o do
        // texto)
        // Isso garante comparaÃ§Ã£o mais confiÃ¡vel quando verificar duplicatas
        String hashConteudo = calculatePagePdfHash(document, pageNumber);
        if (hashConteudo == null) {
            // Fallback: usar hash do texto se nÃ£o conseguir calcular do PDF
            log.warn("âš ï¸ NÃ£o foi possÃ­vel calcular hash do PDF, usando hash do texto como fallback");
            String pageText = extractPageText(document, pageNumber);
            hashConteudo = calculatePageHash(pageText);
        }
        payslip.setHashConteudo(hashConteudo);
        payslip.setFileName(nomeArquivo);
        payslip.setArquivoCaminho(caminhoCompleto.toString().replace('\\', '/'));

        // Salvar PDF individual
        try (PDDocument newDoc = new PDDocument()) {
            newDoc.addPage(document.getPage(pageNumber - 1));
            newDoc.save(caminhoCompleto.toString());
            log.info("ðŸ“„ PDF salvo conforme PRD: {} (versÃ£o {})", caminhoCompleto, proximaVersao);
        }

        return caminhoCompleto.toString();
    }

    /**
     * Determina a prÃ³xima versÃ£o do holerite verificando arquivos existentes no
     * diretÃ³rio e no banco
     * 
     * IMPORTANTE: Este mÃ©todo NUNCA exclui ou sobrescreve versÃµes anteriores.
     * Ele apenas determina qual serÃ¡ o nÃºmero da prÃ³xima versÃ£o (versÃ£o
     * mÃ¡xima + 1).
     * 
     * Comportamento:
     * - MantÃ©m TODAS as versÃµes anteriores intactas (arquivos fÃ­sicos e
     * registros no banco)
     * - Cria uma NOVA versÃ£o com nÃºmero sequencial incremental
     * - Retorna a versÃ£o mais alta encontrada + 1, ou 1 se nÃ£o houver versÃµes
     * anteriores
     * 
     * @param pastaCompleta Caminho completo da pasta onde os holerites sÃ£o
     *                      armazenados
     * @param payslip       Payslip que serÃ¡ versionado (usado para buscar versÃµes
     *                      existentes no banco)
     * @return NÃºmero da prÃ³xima versÃ£o (ex: se mÃ¡ximo Ã© 2, retorna 3)
     */
    private int determinarProximaVersao(Path pastaCompleta, Payslip payslip) {
        try {
            if (!Files.exists(pastaCompleta)) {
                log.info("ðŸ“ DiretÃ³rio nÃ£o existe - serÃ¡ criado. Primeira versÃ£o: v1");
                return 1; // Primeira versÃ£o
            }

            // Buscar todos os arquivos holerite_v*.pdf no diretÃ³rio
            // IMPORTANTE: Apenas LÃŠ os arquivos - nÃ£o os exclui ou modifica
            Pattern versaoPattern = Pattern.compile(".*_V(\\d+)\\.pdf", Pattern.CASE_INSENSITIVE);
            Pattern versaoFallbackPattern = Pattern.compile("holerite_v(\\d+)\\.pdf", Pattern.CASE_INSENSITIVE);
            int versaoMaxima = 0;

            try (var stream = Files.list(pastaCompleta)) {
                versaoMaxima = stream
                        .filter(Files::isRegularFile)
                        .map(path -> path.getFileName().toString())
                        .map(path -> {
                            Matcher matcher = versaoPattern.matcher(path);
                            if (matcher.matches()) {
                                return matcher.group(1);
                            }
                            Matcher fallbackMatcher = versaoFallbackPattern.matcher(path);
                            if (fallbackMatcher.matches()) {
                                return fallbackMatcher.group(1);
                            }
                            return null;
                        })
                        .filter(Objects::nonNull)
                        .mapToInt(Integer::parseInt)
                        .max()
                        .orElse(0);
            }

            // Buscar tambÃ©m no banco de dados para garantir consistÃªncia
            // IMPORTANTE: VersÃµes anteriores no banco serÃ£o MANTIDAS - apenas consultamos
            // para determinar prÃ³xima versÃ£o
            // (pode haver arquivos que nÃ£o estÃ£o mais no disco mas estÃ£o no banco)
            if (payslip.getCompanyCnpj() != null && payslip.getCpf() != null && payslip.getWorkPostName() != null) {
                List<Payslip> holeritesExistentes = payslipRepository
                        .findByCompanyCnpjAndCpfAndWorkPostNameAndMonthAndYear(
                                payslip.getCompanyCnpj(),
                                payslip.getCpf(),
                                payslip.getWorkPostName(),
                                payslip.getMonth(),
                                payslip.getYear());

                int versaoMaximaBanco = holeritesExistentes.stream()
                        .filter(h -> h.getVersao() != null)
                        .mapToInt(Payslip::getVersao)
                        .max()
                        .orElse(0);

                versaoMaxima = Math.max(versaoMaxima, versaoMaximaBanco);

                log.info(
                        "ðŸ“Š VersÃµes existentes encontradas: {} arquivo(s) no disco, {} registro(s) no banco (mÃ¡xima: v{})",
                        versaoMaxima > 0 ? "atÃ© v" + versaoMaxima : "nenhum",
                        holeritesExistentes.size(),
                        versaoMaxima);
            }

            int proximaVersao = versaoMaxima + 1;
            log.info("ðŸ”¢ PrÃ³xima versÃ£o determinada: v{} (versÃ£o mÃ¡xima encontrada: v{})", proximaVersao,
                    versaoMaxima);
            log.info("   âœ… Todas as versÃµes anteriores serÃ£o preservadas (nÃ£o serÃ£o excluÃ­das ou sobrescritas)");
            log.info("   ðŸ“„ Novo arquivo serÃ¡ salvo como: holerite_v{}.pdf", proximaVersao);
            log.info("   ðŸ’¾ Novo registro serÃ¡ criado no banco mantendo {} registro(s) anterior(es)", versaoMaxima);
            return proximaVersao;

        } catch (Exception e) {
            log.warn("âš ï¸ Erro ao determinar prÃ³xima versÃ£o, usando versÃ£o 1: {}", e.getMessage());
            return 1;
        }
    }

    /**
     * Extrai o texto de uma pÃ¡gina especÃ­fica do documento
     */
    private String extractPageText(PDDocument document, int pageNumber) {
        try {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setStartPage(pageNumber);
            stripper.setEndPage(pageNumber);
            return stripper.getText(document);
        } catch (Exception e) {
            log.warn("âš ï¸ Erro ao extrair texto da pÃ¡gina {}: {}", pageNumber, e.getMessage());
            return "";
        }
    }

    private void salvarFuncionario(Payslip payslip, String caminhoPdf) {
        try {
            // Verificar se jÃ¡ existe funcionÃ¡rio com este CPF/documento
            Optional<Employee> employeeExistente = employeeRepository.findByDocument(payslip.getCpf());
            if (employeeExistente.isPresent()) {
                // Atualizar funcionÃ¡rio existente
                Employee employee = employeeExistente.get();
                // employee.setCaminhoPdf(caminhoPdf); // Campo comentado temporariamente
                // employee.setMesReferencia(String.valueOf(payslip.getMonth())); // Campo
                // comentado temporariamente
                // employee.setAnoReferencia(String.valueOf(payslip.getYear())); // Campo
                // comentado temporariamente
                employee.setUpdatedAt(LocalDateTime.now());
                employeeRepository.save(employee);
                log.info("ðŸ”„ FuncionÃ¡rio atualizado: {} - CPF: {}", employee.getName(), employee.getDocument());
            } else {
                // Para funcionÃ¡rios criados via processamento de holerites,
                // vamos apenas registrar na tabela de dados extraÃ­dos
                // e nÃ£o criar um Employee completo pois faltam dados obrigatÃ³rios
                log.info("ðŸ“‹ FuncionÃ¡rio nÃ£o existe na base. Dados salvos apenas na tabela de dados extraÃ­dos.");
                log.info("   Para criar funcionÃ¡rio completo, use o formulÃ¡rio de cadastro de funcionÃ¡rios.");
                log.info("   Nome extraÃ­do: {} - CPF: {}", payslip.getEmployeeName(), payslip.getCpf());
            }
        } catch (Exception e) {
            log.error("âŒ Erro ao processar funcionÃ¡rio: {}", e.getMessage());
            // NÃ£o interromper o processamento por erro na tabela de funcionÃ¡rios
        }
    }

    /**
     * Salvar dados extraÃ­dos na tabela tb_extract_data_holerites
     */
    private void salvarDadosExtraidos(Payslip payslip) {
        try {
            // Extrair cÃ³digo do CPF se for um cÃ³digo (comeÃ§a com "COD")
            String codigo = null;
            if (payslip.getCpf().startsWith("COD")) {
                codigo = payslip.getCpf().substring(3); // Remove o prefixo "COD"
            }
            // Se nÃ£o extraiu cÃ³digo do CPF, tentar extrair do nome do arquivo
            if (codigo == null && payslip.getFileName() != null) {
                // Verificar se o nome do arquivo contÃ©m um cÃ³digo no formato esperado
                String fileName = payslip.getFileName();
                Pattern codigoPattern = Pattern.compile(".*_(\\d{6})_.*");
                Matcher matcher = codigoPattern.matcher(fileName);
                if (matcher.find()) {
                    codigo = matcher.group(1);
                    log.debug("CÃ³digo extraÃ­do do nome do arquivo: {}", codigo);
                }
            }

            // Converter ano para Integer
            Integer anoReferencia = payslip.getYear();

            // Salvar na tabela de dados extraÃ­dos
            extractDataHoleritesService.saveExtractData(
                    payslip.getEmployeeName(),
                    payslip.getCpf(),
                    codigo,
                    String.valueOf(payslip.getMonth()),
                    anoReferencia);

            log.info(
                    "ðŸ’¾ Dados extraÃ­dos salvos na tabela tb_extract_data_holerites: {} - CPF: {} - CÃ³digo: {} - PerÃ­odo: {}/{}",
                    payslip.getEmployeeName(), payslip.getCpf(), codigo, payslip.getMonth(), payslip.getYear());

        } catch (Exception e) {
            log.error("âŒ Erro ao salvar dados extraÃ­dos na tabela tb_extract_data_holerites: {}", e.getMessage());
            // NÃ£o interromper o processamento por erro na tabela de dados extraÃ­dos
        }
    }

    public Map<String, Object> debugPayslipContent(MultipartFile file) throws IOException {
        log.info("ðŸ” Iniciando debug do arquivo: {}", file.getOriginalFilename());

        Map<String, Object> debugInfo = new java.util.HashMap<>();
        debugInfo.put("fileName", file.getOriginalFilename());
        debugInfo.put("fileSize", file.getSize());
        debugInfo.put("contentType", file.getContentType());

        List<Map<String, Object>> pagesInfo = new ArrayList<>();

        try (PDDocument document = PDDocument.load(file.getInputStream())) {
            if (document.isEncrypted()) {
                debugInfo.put("error", "PDF estÃ¡ criptografado");
                return debugInfo;
            }

            PDFTextStripper stripper = new PDFTextStripper();
            int pageCount = document.getNumberOfPages();
            debugInfo.put("totalPages", pageCount);

            // Analisar apenas as primeiras 3 pÃ¡ginas para debug
            int pagesToAnalyze = Math.min(3, pageCount);

            for (int i = 1; i <= pagesToAnalyze; i++) {
                Map<String, Object> pageInfo = new java.util.HashMap<>();
                pageInfo.put("pageNumber", i);

                stripper.setStartPage(i);
                stripper.setEndPage(i);
                String pageText = stripper.getText(document);

                pageInfo.put("textLength", pageText.length());
                pageInfo.put("textPreview", pageText.substring(0, Math.min(1000, pageText.length())));
                pageInfo.put("hasText", !pageText.trim().isEmpty());

                // Tentar extrair informaÃ§Ãµes
                Payslip payslip = extractPayslipInfo(pageText, i);
                if (payslip != null) {
                    pageInfo.put("extractionSuccess", true);
                    pageInfo.put("extractedName", payslip.getEmployeeName());
                    pageInfo.put("extractedCpf", payslip.getCpf());
                    pageInfo.put("extractedMonth", payslip.getMonth());
                    pageInfo.put("extractedYear", payslip.getYear());
                } else {
                    pageInfo.put("extractionSuccess", false);
                    pageInfo.put("extractionError", "NÃ£o foi possÃ­vel extrair dados vÃ¡lidos");
                }

                pagesInfo.add(pageInfo);
            }
        }

        debugInfo.put("pages", pagesInfo);
        return debugInfo;
    }

    public List<Payslip> getAllPayslips() {
        log.info("ðŸ” Buscando todos os payslips no repositÃ³rio...");
        List<Payslip> payslips = payslipRepository.findAll();
        log.info("âœ… RepositÃ³rio retornou {} payslips", payslips.size());
        if (payslips.size() > 0) {
            log.info("ðŸ“‹ Primeiro registro: ID={}, Nome={}, CPF={}, MÃªs={}, Ano={}",
                    payslips.get(0).getId(), payslips.get(0).getEmployeeName(),
                    payslips.get(0).getCpf(), payslips.get(0).getMonth(), payslips.get(0).getYear());
        }
        return payslips;
    }

    public List<Payslip> getPayslipsByCpf(String cpf) {
        return payslipRepository.findAllByCpf(cpf);
    }

    public Payslip getPayslipById(java.util.UUID id) {
        log.info("ðŸ” Buscando payslip pelo ID: {}", id);
        return payslipRepository.findById(id)
                .orElse(null);
    }

    public Payslip getPayslipByFileName(String fileName) {
        log.info("ðŸ” Buscando payslip pelo nome do arquivo: {}", fileName);
        // Pode haver mÃºltiplos holerites com o mesmo nome de arquivo (em diferentes
        // setores/empresas)
        // Retornar o mais recente
        Payslip payslip = payslipRepository.findFirstByFileNameOrderByProcessedAtDesc(fileName);
        if (payslip == null) {
            log.warn("âš ï¸ Nenhum payslip encontrado para o arquivo: {}", fileName);
            // Tentar buscar sem a extensÃ£o .pdf
            if (fileName.endsWith(".pdf")) {
                String fileNameWithoutExt = fileName.substring(0, fileName.length() - 4);
                log.info("ðŸ” Tentando buscar sem extensÃ£o: {}", fileNameWithoutExt);
                payslip = payslipRepository.findFirstByFileNameOrderByProcessedAtDesc(fileNameWithoutExt);
            }
            if (payslip == null) {
                log.error("âŒ Payslip nÃ£o encontrado para o arquivo: {} (tentativas esgotadas)", fileName);
            }
        } else {
            log.info("âœ… Payslip encontrado: ID={}, CPF={}, Nome={}, Arquivo={}",
                    payslip.getId(), payslip.getCpf(), payslip.getEmployeeName(), payslip.getFileName());
        }
        return payslip;
    }

    public Optional<String> resolvePayslipPathByCpfMonthYear(String cpf, Integer month, Integer year) {
        Payslip payslip = payslipRepository.findFirstByCpfAndMonthAndYear(cpf, month, year);
        if (payslip == null) {
            return Optional.empty();
        }

        // PRIORIDADE 1: Usar arquivo_caminho se disponÃ­vel (nova estrutura PRD)
        if (payslip.getArquivoCaminho() != null && !payslip.getArquivoCaminho().isEmpty()) {
            Path candidate = Paths.get(payslip.getArquivoCaminho());
            if (Files.exists(candidate)) {
                log.debug("ðŸ“„ Usando arquivo_caminho do banco: {}", candidate);
                return Optional.of(candidate.toString());
            } else {
                log.warn("âš ï¸ arquivo_caminho do banco nÃ£o existe: {}", payslip.getArquivoCaminho());
            }
        }

        // PRIORIDADE 2: Tentar construir caminho conforme nova estrutura PRD
        if (payslip.getCompanyCnpj() != null && payslip.getWorkPostName() != null) {
            String empresaCnpj = normalizeCnpj(payslip.getCompanyCnpj());
            String setorNome = normalizeSectorName(payslip.getWorkPostName());
            String periodo = String.format("%d-%02d", payslip.getYear(), payslip.getMonth());
            String funcionarioNome = payslip.getEmployeeName() != null
                    ? normalizeEmployeeName(payslip.getEmployeeName())
                    : null;
            String funcionarioCpf = payslip.getCpf() != null ? payslip.getCpf().replaceAll("[^0-9]", "") : null;

            if (empresaCnpj != null && setorNome != null && funcionarioNome != null && funcionarioCpf != null) {
                String pastaFuncionario = String.format("%s_%s", funcionarioNome, funcionarioCpf);
                Path candidate = Paths.get(OUTPUT_DIR, empresaCnpj, setorNome, periodo, pastaFuncionario,
                        payslip.getFileName());
                if (Files.exists(candidate)) {
                    log.debug("ðŸ“„ Arquivo encontrado na nova estrutura PRD: {}", candidate);
                    return Optional.of(candidate.toString());
                }
            }
        }

        // PRIORIDADE 3: Fallback - estrutura antiga
        String mesAno = String.format("%s-%s", payslip.getMonth(), payslip.getYear());
        Path candidate = Paths.get(OUTPUT_DIR, mesAno, payslip.getFileName());
        if (Files.exists(candidate)) {
            log.debug("ðŸ“„ Arquivo encontrado na estrutura antiga: {}", candidate);
            return Optional.of(candidate.toString());
        }

        // PRIORIDADE 4: Outros fallbacks
        String pastaReferencia = String.format("%02d_%d", payslip.getMonth(), payslip.getYear());
        Path alt1 = Paths.get("uploads", "holerites_processados", pastaReferencia, payslip.getFileName());
        if (Files.exists(alt1)) {
            return Optional.of(alt1.toString());
        }
        Path alt2 = Paths.get(System.getProperty("payslips.upload.dir", "uploads/payslips"), payslip.getFileName());
        if (Files.exists(alt2)) {
            return Optional.of(alt2.toString());
        }
        Path alt3 = Paths.get("backend/payslips_output", payslip.getFileName());
        if (Files.exists(alt3)) {
            return Optional.of(alt3.toString());
        }

        log.warn("âš ï¸ Arquivo nÃ£o encontrado em nenhum caminho conhecido para: {}", payslip.getFileName());
        return Optional.empty();
    }

    // ExclusÃ£o individual de payslip
    public void deletePayslip(UUID id) {
        Payslip payslip = payslipRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Payslip nÃ£o encontrado para o ID: " + id));

        // Usar arquivo_caminho se disponÃ­vel (nova estrutura PRD)
        Path arquivo = null;
        if (payslip.getArquivoCaminho() != null && !payslip.getArquivoCaminho().isEmpty()) {
            arquivo = Paths.get(payslip.getArquivoCaminho());
            log.info("ðŸ—‘ï¸ Usando caminho do banco de dados: {}", arquivo.toAbsolutePath());
        } else {
            // Fallback: tentar construir caminho conforme nova estrutura PRD
            String empresaCnpj = normalizeCnpj(payslip.getCompanyCnpj());
            String setorNome = normalizeSectorName(payslip.getWorkPostName());
            String periodo = String.format("%d-%02d", payslip.getYear(), payslip.getMonth());
            String funcionarioNome = payslip.getEmployeeName() != null
                    ? normalizeEmployeeName(payslip.getEmployeeName())
                    : null;
            String funcionarioCpf = payslip.getCpf() != null ? payslip.getCpf().replaceAll("[^0-9]", "") : null;

            if (empresaCnpj != null && setorNome != null && funcionarioNome != null && funcionarioCpf != null) {
                String pastaFuncionario = String.format("%s_%s", funcionarioNome, funcionarioCpf);
                arquivo = Paths.get(OUTPUT_DIR, empresaCnpj, setorNome, periodo, pastaFuncionario,
                        payslip.getFileName());
                log.info("ðŸ—‘ï¸ Construindo caminho conforme PRD: {}", arquivo.toAbsolutePath());
            } else {
                // Fallback final: estrutura antiga
                String mesAno = String.format("%s-%s", payslip.getMonth(), payslip.getYear());
                Path pastaMesAno = Paths.get(OUTPUT_DIR, mesAno);
                arquivo = pastaMesAno.resolve(payslip.getFileName());
                log.warn("âš ï¸ Usando estrutura antiga (fallback): {}", arquivo.toAbsolutePath());
            }
        }

        log.info("ðŸ—‘ï¸ Tentando remover o arquivo: {}", arquivo.toAbsolutePath());
        try {
            if (arquivo != null && Files.exists(arquivo)) {
                Files.delete(arquivo);
                log.info("âœ… Arquivo removido com sucesso: {}", arquivo.toAbsolutePath());

                // Verificar se a pasta do funcionÃ¡rio ficou vazia (nova estrutura)
                Path pastaFuncionario = arquivo.getParent();
                if (pastaFuncionario != null && Files.exists(pastaFuncionario)) {
                    try {
                        boolean pastaVazia;
                        try (var stream = Files.list(pastaFuncionario)) {
                            pastaVazia = stream.findAny().isEmpty();
                        }
                        if (pastaVazia) {
                            log.info("ðŸ“ Pasta do funcionÃ¡rio estÃ¡ vazia, removendo: {}",
                                    pastaFuncionario.toAbsolutePath());
                            Files.delete(pastaFuncionario);

                            // Verificar se a pasta do perÃ­odo ficou vazia
                            Path pastaPeriodo = pastaFuncionario.getParent();
                            if (pastaPeriodo != null && Files.exists(pastaPeriodo)) {
                                boolean periodoVazio;
                                try (var stream = Files.list(pastaPeriodo)) {
                                    periodoVazio = stream.findAny().isEmpty();
                                }
                                if (periodoVazio) {
                                    log.info("ðŸ“ Pasta do perÃ­odo estÃ¡ vazia, removendo: {}",
                                            pastaPeriodo.toAbsolutePath());
                                    Files.delete(pastaPeriodo);

                                    // Verificar se a pasta do setor ficou vazia
                                    Path pastaSetor = pastaPeriodo.getParent();
                                    if (pastaSetor != null && Files.exists(pastaSetor)) {
                                        boolean setorVazio;
                                        try (var stream = Files.list(pastaSetor)) {
                                            setorVazio = stream.findAny().isEmpty();
                                        }
                                        if (setorVazio) {
                                            log.info("ðŸ“ Pasta do setor estÃ¡ vazia, removendo: {}",
                                                    pastaSetor.toAbsolutePath());
                                            Files.delete(pastaSetor);

                                            // Verificar se a pasta da empresa ficou vazia
                                            Path pastaEmpresa = pastaSetor.getParent();
                                            if (pastaEmpresa != null && Files.exists(pastaEmpresa)) {
                                                boolean empresaVazia;
                                                try (var stream = Files.list(pastaEmpresa)) {
                                                    empresaVazia = stream.findAny().isEmpty();
                                                }
                                                if (empresaVazia) {
                                                    log.info("ðŸ“ Pasta da empresa estÃ¡ vazia, removendo: {}",
                                                            pastaEmpresa.toAbsolutePath());
                                                    Files.delete(pastaEmpresa);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } catch (Exception e) {
                        log.warn("âš ï¸ Erro ao verificar/remover pastas vazias: {}", e.getMessage());
                    }
                }
            } else {
                log.warn("âš ï¸ Arquivo nÃ£o encontrado: {}", arquivo != null ? arquivo.toAbsolutePath() : "null");
            }
        } catch (Exception e) {
            log.error("âŒ Erro ao remover o arquivo: {} - {}", arquivo != null ? arquivo.toAbsolutePath() : "null",
                    e.getMessage());
        }

        // Excluir do banco de dados
        payslipRepository.deleteById(id);
        log.info("âœ… Registro excluÃ­do do banco de dados: ID {}", id);
    }

    // ExclusÃ£o em massa de payslips
    public Map<String, Object> deleteMultiplePayslips(List<UUID> ids) {
        int deleted = 0;
        int failed = 0;
        List<String> errors = new ArrayList<>();
        List<Path> arquivosParaRemover = new ArrayList<>();

        log.info("ðŸ—‘ï¸ Iniciando exclusÃ£o em massa de {} payslips", ids.size());

        // Primeiro, coletar informaÃ§Ãµes de todos os payslips
        for (UUID id : ids) {
            try {
                Payslip payslip = payslipRepository.findById(id)
                        .orElseThrow(() -> new IllegalArgumentException("Payslip nÃ£o encontrado para o ID: " + id));

                // Usar arquivo_caminho se disponÃ­vel (nova estrutura PRD)
                Path arquivo = null;
                if (payslip.getArquivoCaminho() != null && !payslip.getArquivoCaminho().isEmpty()) {
                    arquivo = Paths.get(payslip.getArquivoCaminho());
                } else {
                    // Fallback: tentar construir caminho conforme nova estrutura PRD
                    String empresaCnpj = normalizeCnpj(payslip.getCompanyCnpj());
                    String setorNome = normalizeSectorName(payslip.getWorkPostName());
                    String periodo = String.format("%d-%02d", payslip.getYear(), payslip.getMonth());
                    String funcionarioNome = payslip.getEmployeeName() != null
                            ? normalizeEmployeeName(payslip.getEmployeeName())
                            : null;
                    String funcionarioCpf = payslip.getCpf() != null ? payslip.getCpf().replaceAll("[^0-9]", "") : null;

                    if (empresaCnpj != null && setorNome != null && funcionarioNome != null && funcionarioCpf != null) {
                        String pastaFuncionario = String.format("%s_%s", funcionarioNome, funcionarioCpf);
                        arquivo = Paths.get(OUTPUT_DIR, empresaCnpj, setorNome, periodo, pastaFuncionario,
                                payslip.getFileName());
                    } else {
                        // Fallback final: estrutura antiga
                        String mesAno = String.format("%s-%s", payslip.getMonth(), payslip.getYear());
                        Path pastaMesAno = Paths.get(OUTPUT_DIR, mesAno);
                        arquivo = pastaMesAno.resolve(payslip.getFileName());
                    }
                }

                if (arquivo != null) {
                    arquivosParaRemover.add(arquivo);
                }

                // Excluir do banco de dados
                payslipRepository.deleteById(id);
                deleted++;
            } catch (Exception e) {
                failed++;
                errors.add("ID " + id + ": " + e.getMessage());
                log.error("âŒ Erro ao processar exclusÃ£o do payslip {}: {}", id, e.getMessage());
            }
        }

        // Remover todos os arquivos
        Set<Path> pastasParaVerificar = new HashSet<>();
        for (Path arquivo : arquivosParaRemover) {
            log.info("ðŸ—‘ï¸ Tentando remover o arquivo: {}", arquivo.toAbsolutePath());
            try {
                if (Files.exists(arquivo)) {
                    Files.delete(arquivo);
                    log.info("âœ… Arquivo removido com sucesso: {}", arquivo.toAbsolutePath());

                    // Coletar pastas para verificar se ficaram vazias
                    Path pastaAtual = arquivo.getParent();
                    while (pastaAtual != null && !pastaAtual.equals(Paths.get(OUTPUT_DIR))) {
                        pastasParaVerificar.add(pastaAtual);
                        pastaAtual = pastaAtual.getParent();
                    }
                } else {
                    log.warn("âš ï¸ Arquivo nÃ£o encontrado: {}", arquivo.toAbsolutePath());
                }
            } catch (Exception e) {
                log.error("âŒ Erro ao remover o arquivo: {} - {}", arquivo.toAbsolutePath(), e.getMessage());
            }
        }

        // Verificar e remover pastas vazias (da mais especÃ­fica para a mais geral)
        List<Path> pastasOrdenadas = new ArrayList<>(pastasParaVerificar);
        pastasOrdenadas.sort((a, b) -> Integer.compare(b.getNameCount(), a.getNameCount())); // Mais profunda primeiro

        for (Path pasta : pastasOrdenadas) {
            try {
                if (Files.exists(pasta) && Files.isDirectory(pasta)) {
                    boolean pastaVazia;
                    try (var stream = Files.list(pasta)) {
                        pastaVazia = stream.findAny().isEmpty();
                    }
                    if (pastaVazia) {
                        Files.delete(pasta);
                        log.info("ðŸ“ Pasta vazia removida: {}", pasta.toAbsolutePath());
                    }
                }
            } catch (Exception e) {
                log.warn("âš ï¸ Erro ao verificar/remover pasta: {} - {}", pasta.toAbsolutePath(), e.getMessage());
            }
        }

        Map<String, Object> result = new java.util.HashMap<>();
        result.put("deleted", deleted);
        result.put("failed", failed);
        result.put("errors", errors);

        log.info("âœ… ExclusÃ£o em massa concluÃ­da: {} excluÃ­dos, {} falhas", deleted, failed);
        return result;
    }

    public PayslipOrganizationResponse organizePayslipsByCompany(List<Payslip> payslips) {
        PayslipOrganizationResponse response = new PayslipOrganizationResponse();
        response.setGeneratedAt(LocalDateTime.now());

        try {
            List<Payslip> effectivePayslips = payslips != null ? payslips : Collections.emptyList();
            response.setTotalPayslips(effectivePayslips.size());

            if (effectivePayslips.isEmpty()) {
                response.setCompanies(Collections.emptyList());
                response.setTotalCompanies(0);
                response.setTotalSectors(0);
                return response;
            }

            // Filtrar payslips null antes de processar
            List<Payslip> validPayslips = effectivePayslips.stream()
                    .filter(p -> p != null)
                    .collect(Collectors.toList());

            if (validPayslips.isEmpty()) {
                response.setCompanies(Collections.emptyList());
                response.setTotalCompanies(0);
                response.setTotalSectors(0);
                return response;
            }

            Map<String, List<Payslip>> companyGroups = validPayslips.stream()
                    .collect(Collectors.groupingBy(this::buildCompanyKey, LinkedHashMap::new, Collectors.toList()));

            Set<String> uniqueSectorKeys = new HashSet<>();
            List<PayslipOrganizationResponse.CompanyGroup> companyResponses = new ArrayList<>();

            for (List<Payslip> companyPayslips : companyGroups.values()) {
                if (companyPayslips.isEmpty()) {
                    continue;
                }

                // CORREÃ‡ÃƒO: Como agora agrupamos por CNPJ, escolher o nome de empresa mais
                // comum ou mais recente
                // para garantir consistÃªncia na exibiÃ§Ã£o
                String companyName = resolveBestCompanyName(companyPayslips);
                String companyCnpj = normalizeCnpj(companyPayslips.get(0).getCompanyCnpj());

                Payslip sample = companyPayslips.get(0);
                PayslipOrganizationResponse.CompanyGroup companyGroup = new PayslipOrganizationResponse.CompanyGroup();
                String companySigla = resolveCompanySigla(sample);
                companyGroup.setCompanySigla(companySigla);
                companyGroup.setCompanyName(defaultString(companyName, "Empresa nÃ£o informada"));
                companyGroup.setCompanyCnpj(defaultString(companyCnpj, ""));
                companyGroup.setCompanyId(sample.getCompanyId());
                companyGroup.setTotalPayslips(companyPayslips.size());

                Map<String, List<Payslip>> sectorGroups = companyPayslips.stream()
                        .collect(Collectors.groupingBy(this::buildSectorKey, LinkedHashMap::new, Collectors.toList()));

                List<PayslipOrganizationResponse.SectorGroup> sectors = new ArrayList<>();

                for (Map.Entry<String, List<Payslip>> sectorEntry : sectorGroups.entrySet()) {
                    List<Payslip> sectorPayslips = sectorEntry.getValue();
                    if (sectorPayslips.isEmpty()) {
                        continue;
                    }

                    PayslipOrganizationResponse.SectorGroup sectorGroup = new PayslipOrganizationResponse.SectorGroup();
                    String sectorDisplayName = resolveSectorName(sectorPayslips.get(0));
                    sectorGroup.setSectorName(sectorDisplayName);
                    sectorGroup.setNormalizedSectorName(sectorEntry.getKey());
                    sectorGroup.setTotalPayslips(sectorPayslips.size());

                    uniqueSectorKeys.add(companySigla + "|" + sectorEntry.getKey());

                    Map<String, List<Payslip>> periodGroups = sectorPayslips.stream()
                            .collect(Collectors.groupingBy(this::buildPeriodKey, LinkedHashMap::new,
                                    Collectors.toList()));

                    List<String> sortedPeriods = new ArrayList<>(periodGroups.keySet());
                    sortedPeriods.sort(Comparator.reverseOrder());

                    List<PayslipOrganizationResponse.PeriodGroup> periods = new ArrayList<>();
                    for (String periodKey : sortedPeriods) {
                        List<Payslip> periodPayslips = periodGroups.get(periodKey);
                        if (periodPayslips == null || periodPayslips.isEmpty()) {
                            continue;
                        }

                        int year = extractYear(periodKey);
                        int month = extractMonth(periodKey);

                        List<Payslip> consistentPayslips = periodPayslips.stream()
                                .filter(p -> Objects.equals(p.getYear(), year) && Objects.equals(p.getMonth(), month))
                                .collect(Collectors.toList());

                        if (consistentPayslips.isEmpty()) {
                            log.warn(
                                    "âš ï¸ Nenhum holerite com mÃªs/ano ({}/{}) consistente no perÃ­odo {}. Ignorando grupo.",
                                    month, year, periodKey);
                            continue;
                        }

                        PayslipOrganizationResponse.PeriodGroup periodGroup = new PayslipOrganizationResponse.PeriodGroup();
                        periodGroup.setYear(year);
                        periodGroup.setMonth(month);
                        periodGroup.setFormattedPeriod(formatPeriodLabel(month, year));

                        List<PayslipOrganizationResponse.PayslipEntry> entries = consistentPayslips.stream()
                                .sorted(Comparator.comparing(p -> defaultString(p.getEmployeeName(), ""),
                                        String.CASE_INSENSITIVE_ORDER))
                                .map(payslip -> {
                                    PayslipOrganizationResponse.PayslipEntry entry = toPayslipEntry(payslip);
                                    entry.setSectorName(sectorDisplayName);
                                    return entry;
                                })
                                .collect(Collectors.toList());

                        periodGroup.setPayslips(entries);
                        periodGroup.setTotalPayslips(entries.size());
                        periods.add(periodGroup);
                    }

                    sectorGroup.setPeriods(periods);
                    sectors.add(sectorGroup);
                }

                sectors.sort(Comparator.comparing(PayslipOrganizationResponse.SectorGroup::getSectorName,
                        String.CASE_INSENSITIVE_ORDER));
                companyGroup.setSectors(sectors);
                companyResponses.add(companyGroup);
            }

            companyResponses.sort(this::compareCompanyGroups);

            response.setCompanies(companyResponses);
            response.setTotalCompanies(companyResponses.size());
            response.setTotalSectors(uniqueSectorKeys.size());
            return response;
        } catch (Exception e) {
            log.error("Erro ao organizar holerites por empresa: {}", e.getMessage(), e);
            // Retornar resposta vazia em caso de erro
            response.setCompanies(Collections.emptyList());
            response.setTotalCompanies(0);
            response.setTotalSectors(0);
            response.setTotalPayslips(0);
            return response;
        }
    }

    private String buildCompanyKey(Payslip payslip) {
        // CORREÃ‡ÃƒO: Agrupar PRIMARIAMENTE pelo CNPJ normalizado, que Ã© o
        // identificador Ãºnico da empresa
        // O nome pode variar na extraÃ§Ã£o, mas o CNPJ Ã© sempre o mesmo para a mesma
        // empresa
        String normalizedCnpj = normalizeCnpj(payslip.getCompanyCnpj());

        // Se nÃ£o tiver CNPJ, usar nome + sigla como fallback
        if (normalizedCnpj == null || normalizedCnpj.isEmpty()) {
            String sigla = resolveCompanySigla(payslip);
            String name = defaultString(payslip.getCompanyName(), "Empresa nÃ£o informada").trim().toUpperCase();
            String companyId = payslip.getCompanyId() != null ? payslip.getCompanyId().toString() : "";
            return String.join("|", "NO_CNPJ", sigla, name, companyId);
        }

        // CORREÃ‡ÃƒO: Usar CNPJ normalizado como chave primÃ¡ria, ignorando variaÃ§Ãµes
        // no nome
        // O nome serÃ¡ resolvido depois para exibiÃ§Ã£o, usando o mais comum ou mais
        // recente
        String sigla = resolveCompanySigla(payslip);
        String companyId = payslip.getCompanyId() != null ? payslip.getCompanyId().toString() : "";
        return String.join("|", normalizedCnpj, sigla, companyId);
    }

    private String resolveCompanySigla(Payslip payslip) {
        String sigla = defaultString(payslip.getCompanySigla(), "");
        if (!StringUtils.hasText(sigla) && payslip.getCompany() != null) {
            sigla = defaultString(payslip.getCompany().getSigla(), "");
        }
        if (!StringUtils.hasText(sigla)) {
            sigla = "OUTROS";
        }
        return sigla.trim().toUpperCase();
    }

    /**
     * CORREÃ‡ÃƒO: Resolve o melhor nome da empresa entre vÃ¡rios payslips agrupados
     * pelo mesmo CNPJ
     * Prefere o nome mais comum, ou o mais longo (completo), ou o primeiro nÃ£o
     * vazio
     */
    private String resolveBestCompanyName(List<Payslip> payslips) {
        if (payslips == null || payslips.isEmpty()) {
            return "Empresa nÃ£o informada";
        }

        // Filtrar apenas nomes nÃ£o vazios e normalizar
        Map<String, Integer> nameFrequency = new HashMap<>();
        Map<String, String> normalizedToOriginal = new HashMap<>();

        for (Payslip p : payslips) {
            String name = p.getCompanyName();
            if (name != null && !name.trim().isEmpty()) {
                String normalized = name.trim().toUpperCase();
                nameFrequency.put(normalized, nameFrequency.getOrDefault(normalized, 0) + 1);
                // Manter o original mais longo/completo
                if (!normalizedToOriginal.containsKey(normalized) ||
                        name.length() > normalizedToOriginal.get(normalized).length()) {
                    normalizedToOriginal.put(normalized, name);
                }
            }
        }

        if (nameFrequency.isEmpty()) {
            return "Empresa nÃ£o informada";
        }

        // Encontrar o nome mais frequente
        String mostCommonNormalized = nameFrequency.entrySet().stream()
                .max(Map.Entry.<String, Integer>comparingByValue()
                        .thenComparing((e1, e2) -> Integer.compare(
                                normalizedToOriginal.get(e2.getKey()).length(),
                                normalizedToOriginal.get(e1.getKey()).length()))) // Preferir mais longo em caso de
                                                                                  // empate
                .map(Map.Entry::getKey)
                .orElse(null);

        if (mostCommonNormalized != null) {
            return normalizedToOriginal.get(mostCommonNormalized);
        }

        // Fallback: retornar o primeiro nome nÃ£o vazio encontrado
        return payslips.stream()
                .map(Payslip::getCompanyName)
                .filter(n -> n != null && !n.trim().isEmpty())
                .findFirst()
                .orElse("Empresa nÃ£o informada");
    }

    private String buildSectorKey(Payslip payslip) {
        return normalizeSectorName(resolveSectorName(payslip));
    }

    private String resolveSectorName(Payslip payslip) {
        if (payslip == null) {
            return "Setor nÃ£o informado";
        }
        String sector = payslip.getWorkPostName();
        if (!StringUtils.hasText(sector)) {
            return "Setor nÃ£o informado";
        }
        return sector.trim();
    }

    private String normalizeSectorName(String sector) {
        if (!StringUtils.hasText(sector)) {
            return "SETOR_NAO_INFORMADO";
        }
        String upper = sector.trim().toUpperCase();
        String normalized = Normalizer.normalize(upper, Normalizer.Form.NFD)
                .replaceAll("[\\p{M}]", "")
                .replaceAll("[^A-Z0-9]+", "_")
                .replaceAll("^_+", "")
                .replaceAll("_+$", "");
        return StringUtils.hasText(normalized) ? normalized : "SETOR_NAO_INFORMADO";
    }

    /**
     * Normaliza nome do funcionÃ¡rio para uso em pastas do sistema de arquivos
     * Remove acentos, caracteres especiais e limita tamanho
     */
    private String normalizeEmployeeName(String name) {
        if (!StringUtils.hasText(name)) {
            return "FUNCIONARIO_NAO_INFORMADO";
        }
        String upper = name.trim().toUpperCase();
        String normalized = Normalizer.normalize(upper, Normalizer.Form.NFD)
                .replaceAll("[\\p{M}]", "")
                .replaceAll("[^A-Z0-9]+", "_")
                .replaceAll("^_+", "")
                .replaceAll("_+$", "");

        // Limitar tamanho para evitar problemas com sistemas de arquivos (mÃ¡ximo 100
        // caracteres)
        if (normalized.length() > 100) {
            normalized = normalized.substring(0, 100);
        }

        return StringUtils.hasText(normalized) ? normalized : "FUNCIONARIO_NAO_INFORMADO";
    }

    /**
     * Normaliza nome para uso em pastas do sistema de arquivos
     * Remove acentos, caracteres especiais e limita tamanho
     */
    private String normalizeFolderName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return "NAO_INFORMADO";
        }
        // Remover acentos
        String normalized = Normalizer.normalize(name.trim(), Normalizer.Form.NFD)
                .replaceAll("[\\p{M}]", "");
        // Substituir caracteres especiais por underscore e manter apenas letras,
        // nÃºmeros e espaÃ§os
        normalized = normalized.replaceAll("[^a-zA-Z0-9\\s]", "_");
        // Substituir mÃºltiplos espaÃ§os/underscores por um Ãºnico underscore
        normalized = normalized.replaceAll("[\\s_]+", "_");
        // Remover underscores no inÃ­cio e fim
        normalized = normalized.replaceAll("^_+", "").replaceAll("_+$", "");
        // Limitar tamanho (mÃ¡ximo 100 caracteres para evitar problemas com sistemas de
        // arquivos)
        if (normalized.length() > 100) {
            normalized = normalized.substring(0, 100);
        }
        // Se ficou vazio apÃ³s normalizaÃ§Ã£o, usar valor padrÃ£o
        if (normalized.isEmpty()) {
            return "NAO_INFORMADO";
        }
        return normalized.toUpperCase();
    }

    private String buildPeriodKey(Payslip payslip) {
        Integer year = payslip != null ? payslip.getYear() : null;
        Integer month = payslip != null ? payslip.getMonth() : null;
        if (year == null || month == null) {
            return "0000-00";
        }
        return String.format("%04d-%02d", year, month);
    }

    private int extractYear(String periodKey) {
        try {
            return Integer.parseInt(periodKey.substring(0, 4));
        } catch (Exception e) {
            return 0;
        }
    }

    private int extractMonth(String periodKey) {
        try {
            return Integer.parseInt(periodKey.substring(5, 7));
        } catch (Exception e) {
            return 0;
        }
    }

    private String formatPeriodLabel(int month, int year) {
        if (month <= 0 || year <= 0) {
            return "PerÃ­odo nÃ£o informado";
        }
        try {
            Month monthEnum = Month.of(month);
            String monthName = monthEnum.getDisplayName(java.time.format.TextStyle.FULL, new Locale("pt", "BR"));
            return String.format("%s %d", capitalize(monthName), year);
        } catch (Exception e) {
            return String.format("%02d/%04d", month, year);
        }
    }

    private PayslipOrganizationResponse.PayslipEntry toPayslipEntry(Payslip payslip) {
        PayslipOrganizationResponse.PayslipEntry entry = new PayslipOrganizationResponse.PayslipEntry();
        entry.setId(payslip.getId());
        entry.setEmployeeName(defaultString(payslip.getEmployeeName(), "FuncionÃ¡rio nÃ£o informado"));
        entry.setCpf(defaultString(payslip.getCpf(), ""));
        entry.setMonth(payslip.getMonth());
        entry.setYear(payslip.getYear());
        entry.setFileName(payslip.getFileName());
        entry.setCompanySigla(resolveCompanySigla(payslip));
        entry.setCompanyName(defaultString(payslip.getCompanyName(), "Empresa nÃ£o informada"));
        entry.setCompanyCnpj(defaultString(payslip.getCompanyCnpj(), ""));
        entry.setWorkPostName(payslip.getWorkPostName());
        entry.setSectorName(resolveSectorName(payslip));
        entry.setProcessedAt(payslip.getProcessedAt());
        return entry;
    }

    private int compareCompanyGroups(PayslipOrganizationResponse.CompanyGroup a,
            PayslipOrganizationResponse.CompanyGroup b) {
        int orderA = resolveCompanyPriority(a.getCompanySigla());
        int orderB = resolveCompanyPriority(b.getCompanySigla());
        if (orderA != orderB) {
            return Integer.compare(orderA, orderB);
        }
        return defaultString(a.getCompanyName(), "").compareToIgnoreCase(defaultString(b.getCompanyName(), ""));
    }

    private int resolveCompanyPriority(String sigla) {
        String normalized = sigla != null ? sigla.toUpperCase() : "";
        int index = COMPANY_SIGLA_PRIORITY.indexOf(normalized);
        return index >= 0 ? index : COMPANY_SIGLA_PRIORITY.size();
    }

    private String defaultString(String value, String fallback) {
        if (StringUtils.hasText(value)) {
            return value.trim();
        }
        return fallback != null ? fallback : "";
    }

    private String capitalize(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }
        return value.substring(0, 1).toUpperCase() + value.substring(1);
    }

    /**
     * TASK 02: Calcula hash SHA-256 do conteÃºdo da pÃ¡gina para comparaÃ§Ã£o com
     * arquivos anteriores
     */
    /**
     * Calcula hash SHA-256 do conteÃºdo em formato hexadecimal (64 caracteres)
     * Conforme PRD: hash_conteudo VARCHAR(64)
     */
    /**
     * Calcula hash do texto extraÃ­do (mÃ©todo legado - mantido para
     * compatibilidade)
     * 
     * @deprecated Use calculatePagePdfHash para comparaÃ§Ã£o mais confiÃ¡vel
     */
    private String calculatePageHash(String pageText) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(pageText.getBytes(StandardCharsets.UTF_8));
            // Converter para hexadecimal (64 caracteres)
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            log.warn("âš ï¸ Erro ao calcular hash da pÃ¡gina: {}", e.getMessage());
            // Retornar hash simples baseado no tamanho do texto como fallback
            return String.format("%064x", pageText != null ? pageText.hashCode() : 0);
        }
    }

    /**
     * Calcula hash SHA-256 do arquivo completo (bytes do arquivo)
     * Usado para verificar se o arquivo completo jÃ¡ foi processado anteriormente
     */
    public String calculateFileHash(byte[] fileBytes) {
        try {
            if (fileBytes == null || fileBytes.length == 0) {
                log.warn("âš ï¸ Arquivo vazio - nÃ£o Ã© possÃ­vel calcular hash");
                return null;
            }

            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(fileBytes);

            // Converter para hexadecimal (64 caracteres)
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }

            return hexString.toString();
        } catch (Exception e) {
            log.error("âŒ Erro ao calcular hash do arquivo completo: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Verifica se o arquivo completo jÃ¡ foi processado anteriormente
     * Para arquivos multi-pÃ¡gina, verifica se todas as pÃ¡ginas jÃ¡ foram
     * processadas
     * Retorna true se jÃ¡ foi processado e nÃ£o foi excluÃ­do
     */
    public boolean isFileAlreadyProcessed(byte[] fileBytes, String originalFilename) {
        if (fileBytes == null || fileBytes.length == 0) {
            return false;
        }

        try {
            // Carregar o documento para verificar pÃ¡ginas
            PDDocument document = PDDocument.load(new java.io.ByteArrayInputStream(fileBytes));
            int pageCount = document.getNumberOfPages();

            log.info("ðŸ” Verificando se arquivo '{}' jÃ¡ foi processado ({} pÃ¡gina(s))...", originalFilename,
                    pageCount);

            // Verificar cada pÃ¡gina do arquivo
            int pagesAlreadyProcessed = 0;
            int pagesWithNonDeletedPayslips = 0;

            for (int pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
                // Calcular hash da pÃ¡gina
                String pageHash = calculatePagePdfHash(document, pageNumber);
                if (pageHash == null) {
                    // Fallback: usar hash do texto
                    PDFTextStripper stripper = new PDFTextStripper();
                    stripper.setStartPage(pageNumber);
                    stripper.setEndPage(pageNumber);
                    String pageText = stripper.getText(document);
                    pageHash = calculatePageHash(pageText);
                }

                if (pageHash != null && !pageHash.isEmpty()) {
                    log.debug("   ðŸ“„ PÃ¡gina {}: Hash calculado = {}...", pageNumber,
                            pageHash.substring(0, Math.min(16, pageHash.length())));

                    // Verificar se existe holerite com este hash
                    List<Payslip> existing = payslipRepository.findByHashConteudo(pageHash);
                    log.debug("   ðŸ“Š PÃ¡gina {}: Encontrados {} holerite(s) com este hash", pageNumber,
                            existing.size());

                    if (!existing.isEmpty()) {
                        pagesAlreadyProcessed++;
                        log.info("   âœ… PÃ¡gina {}: JÃ¡ foi processada anteriormente", pageNumber);

                        // Verificar se pelo menos um holerite nÃ£o foi excluÃ­do
                        boolean hasNonDeleted = existing.stream()
                                .anyMatch(p -> {
                                    try {
                                        boolean exists = p.getArquivoCaminho() != null &&
                                                java.nio.file.Files
                                                        .exists(java.nio.file.Paths.get(p.getArquivoCaminho()));
                                        if (exists) {
                                            log.debug("      âœ… Holerite ID {}: Arquivo fÃ­sico existe em {}",
                                                    p.getId(), p.getArquivoCaminho());
                                        } else {
                                            log.debug(
                                                    "      âš ï¸ Holerite ID {}: Arquivo fÃ­sico NÃƒO existe (foi excluÃ­do)",
                                                    p.getId());
                                        }
                                        return exists;
                                    } catch (Exception e) {
                                        log.warn("      âš ï¸ Erro ao verificar arquivo fÃ­sico do holerite ID {}: {}",
                                                p.getId(), e.getMessage());
                                        return false;
                                    }
                                });
                        if (hasNonDeleted) {
                            pagesWithNonDeletedPayslips++;
                            log.info("      âœ… PÃ¡gina {}: Pelo menos um holerite nÃ£o foi excluÃ­do", pageNumber);
                        } else {
                            log.warn("      âš ï¸ PÃ¡gina {}: Todos os holerites foram excluÃ­dos", pageNumber);
                        }
                    } else {
                        log.info(
                                "   âŒ PÃ¡gina {}: Hash nÃ£o encontrado no banco. Tentando verificaÃ§Ã£o alternativa por CPF/perÃ­odo...",
                                pageNumber);

                        // VERIFICAÃ‡ÃƒO ALTERNATIVA: Se hash nÃ£o foi encontrado, tentar extrair dados
                        // da pÃ¡gina
                        // e verificar se jÃ¡ existe holerite com mesmo CPF, perÃ­odo, empresa e setor
                        try {
                            PDFTextStripper stripper = new PDFTextStripper();
                            stripper.setStartPage(pageNumber);
                            stripper.setEndPage(pageNumber);
                            String pageText = stripper.getText(document);

                            if (pageText == null || pageText.trim().isEmpty()) {
                                log.debug(
                                        "   âš ï¸ PÃ¡gina {}: Texto vazio, nÃ£o Ã© possÃ­vel fazer verificaÃ§Ã£o alternativa",
                                        pageNumber);
                            } else {
                                // Extrair dados bÃ¡sicos da pÃ¡gina
                                Payslip tempPayslip = extractPayslipInfo(pageText, pageNumber);
                                if (tempPayslip != null && tempPayslip.getCpf() != null &&
                                        tempPayslip.getMonth() != null && tempPayslip.getYear() != null) {

                                    log.debug(
                                            "   ðŸ“‹ PÃ¡gina {}: Dados extraÃ­dos - CPF: {}, PerÃ­odo: {}/{}, Empresa: {}, Setor: {}",
                                            pageNumber, tempPayslip.getCpf(), tempPayslip.getMonth(),
                                            tempPayslip.getYear(),
                                            tempPayslip.getCompanyCnpj(), tempPayslip.getWorkPostName());

                                    // Buscar holerites existentes com mesmo CPF, perÃ­odo, empresa e setor
                                    List<Payslip> existingByData = payslipRepository
                                            .findByCompanyCnpjAndCpfAndWorkPostNameAndMonthAndYear(
                                                    tempPayslip.getCompanyCnpj(),
                                                    tempPayslip.getCpf(),
                                                    tempPayslip.getWorkPostName(),
                                                    tempPayslip.getMonth(),
                                                    tempPayslip.getYear());

                                    log.debug(
                                            "   ðŸ” PÃ¡gina {}: VerificaÃ§Ã£o alternativa encontrou {} holerite(s) com dados idÃªnticos",
                                            pageNumber, existingByData.size());

                                    if (!existingByData.isEmpty()) {
                                        // Verificar se pelo menos um holerite nÃ£o foi excluÃ­do
                                        boolean hasNonDeleted = existingByData.stream()
                                                .anyMatch(p -> {
                                                    try {
                                                        boolean exists = p.getArquivoCaminho() != null &&
                                                                java.nio.file.Files.exists(
                                                                        java.nio.file.Paths.get(p.getArquivoCaminho()));
                                                        if (exists) {
                                                            log.debug(
                                                                    "      âœ… Holerite ID {}: Arquivo fÃ­sico existe em {}",
                                                                    p.getId(), p.getArquivoCaminho());
                                                        } else {
                                                            log.debug(
                                                                    "      âš ï¸ Holerite ID {}: Arquivo fÃ­sico NÃƒO existe (foi excluÃ­do)",
                                                                    p.getId());
                                                        }
                                                        return exists;
                                                    } catch (Exception e) {
                                                        log.warn(
                                                                "      âš ï¸ Erro ao verificar arquivo fÃ­sico do holerite ID {}: {}",
                                                                p.getId(), e.getMessage());
                                                        return false;
                                                    }
                                                });

                                        if (hasNonDeleted) {
                                            log.warn(
                                                    "   âš ï¸ PÃ¡gina {}: Encontrado holerite existente por CPF/perÃ­odo/empresa (CPF: {}, PerÃ­odo: {}/{}, Empresa: {}, Setor: {})",
                                                    pageNumber, tempPayslip.getCpf(), tempPayslip.getMonth(),
                                                    tempPayslip.getYear(),
                                                    tempPayslip.getCompanyCnpj(), tempPayslip.getWorkPostName());
                                            log.warn(
                                                    "      Hash diferente, mas dados idÃªnticos - considerando como jÃ¡ processado");
                                            pagesAlreadyProcessed++;
                                            pagesWithNonDeletedPayslips++;
                                        } else {
                                            log.debug(
                                                    "   âš ï¸ PÃ¡gina {}: Holerites encontrados por dados, mas todos foram excluÃ­dos",
                                                    pageNumber);
                                        }
                                    } else {
                                        log.debug(
                                                "   âœ… PÃ¡gina {}: Nenhum holerite encontrado com dados idÃªnticos - pÃ¡gina nÃ£o foi processada anteriormente",
                                                pageNumber);
                                    }
                                } else {
                                    log.debug(
                                            "   âš ï¸ PÃ¡gina {}: NÃ£o foi possÃ­vel extrair dados suficientes (CPF, mÃªs ou ano) para verificaÃ§Ã£o alternativa completa",
                                            pageNumber);
                                    // CORREÃ‡ÃƒO: Tentar verificaÃ§Ã£o alternativa mais simples apenas por
                                    // CPF/perÃ­odo
                                    // mesmo sem empresa/setor para aumentar chances de detectar duplicatas
                                    try {
                                        if (tempPayslip != null && tempPayslip.getCpf() != null &&
                                                tempPayslip.getMonth() != null && tempPayslip.getYear() != null) {

                                            // Buscar holerites existentes apenas por CPF/perÃ­odo (sem empresa/setor)
                                            List<Payslip> existingByCpfPeriod = payslipRepository
                                                    .findByCompanyCnpjAndCpfAndWorkPostNameAndMonthAndYear(
                                                            null, // Empresa nÃ£o informada - buscar qualquer
                                                            tempPayslip.getCpf(),
                                                            null, // Setor nÃ£o informado - buscar qualquer
                                                            tempPayslip.getMonth(),
                                                            tempPayslip.getYear());

                                            if (!existingByCpfPeriod.isEmpty()) {
                                                // Verificar se pelo menos um holerite nÃ£o foi excluÃ­do
                                                boolean hasNonDeleted = existingByCpfPeriod.stream()
                                                        .anyMatch(p -> {
                                                            try {
                                                                return p.getArquivoCaminho() != null &&
                                                                        java.nio.file.Files.exists(java.nio.file.Paths
                                                                                .get(p.getArquivoCaminho()));
                                                            } catch (Exception ex) {
                                                                return false;
                                                            }
                                                        });

                                                if (hasNonDeleted) {
                                                    log.warn(
                                                            "   âš ï¸ PÃ¡gina {}: Encontrado holerite existente por CPF/perÃ­odo (sem empresa/setor) - CPF: {}, PerÃ­odo: {}/{}",
                                                            pageNumber, tempPayslip.getCpf(), tempPayslip.getMonth(),
                                                            tempPayslip.getYear());
                                                    log.warn(
                                                            "      Considerando como jÃ¡ processado para evitar duplicaÃ§Ã£o");
                                                    pagesAlreadyProcessed++;
                                                    pagesWithNonDeletedPayslips++;
                                                }
                                            }
                                        }
                                    } catch (Exception e2) {
                                        log.debug(
                                                "   âš ï¸ Erro na verificaÃ§Ã£o alternativa simplificada da pÃ¡gina {}: {}",
                                                pageNumber, e2.getMessage());
                                    }
                                }
                            }
                        } catch (Exception e) {
                            log.warn("   âš ï¸ Erro ao fazer verificaÃ§Ã£o alternativa da pÃ¡gina {}: {}", pageNumber,
                                    e.getMessage());
                            // NÃ£o logar stack trace completo para nÃ£o poluir logs - erro jÃ¡ foi
                            // registrado
                        }
                    }
                } else {
                    log.warn("   âš ï¸ PÃ¡gina {}: NÃ£o foi possÃ­vel calcular hash", pageNumber);
                }
            }

            document.close();

            log.info("ðŸ“Š RESUMO DA VERIFICAÃ‡ÃƒO DO ARQUIVO '{}':", originalFilename);
            log.info("   Total de pÃ¡ginas: {}", pageCount);
            log.info("   PÃ¡ginas jÃ¡ processadas: {}", pagesAlreadyProcessed);
            log.info("   PÃ¡ginas com holerites nÃ£o excluÃ­dos: {}", pagesWithNonDeletedPayslips);
            log.info(
                    "   CondiÃ§Ã£o para bloquear: pagesAlreadyProcessed == pageCount ({}) && pagesWithNonDeletedPayslips == pageCount ({})",
                    pagesAlreadyProcessed == pageCount, pagesWithNonDeletedPayslips == pageCount);

            // CORREÃ‡ÃƒO: Se todas as pÃ¡ginas jÃ¡ foram processadas e nÃ£o foram
            // excluÃ­das, arquivo jÃ¡ foi processado
            if (pagesAlreadyProcessed == pageCount && pagesWithNonDeletedPayslips == pageCount) {
                log.warn(
                        "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
                log.warn("âš ï¸ ARQUIVO '{}' JÃ FOI PROCESSADO ANTERIORMENTE!", originalFilename);
                log.warn("   Todas as {} pÃ¡gina(s) jÃ¡ foram processadas e nÃ£o foram excluÃ­das.", pageCount);
                log.warn("   O arquivo NÃƒO serÃ¡ processado novamente.");
                log.warn(
                        "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
                return true;
            }
            // CORREÃ‡ÃƒO: Se TODAS as pÃ¡ginas foram processadas mas algumas foram
            // excluÃ­das, ainda assim considerar como jÃ¡ processado
            // para evitar reprocessar o mesmo arquivo e somar na contagem
            else if (pagesAlreadyProcessed == pageCount && pagesWithNonDeletedPayslips < pageCount) {
                log.warn(
                        "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
                log.warn("âš ï¸ ARQUIVO '{}' JÃ FOI PROCESSADO ANTERIORMENTE!", originalFilename);
                log.warn("   Todas as {} pÃ¡gina(s) jÃ¡ foram processadas, mas {} foram excluÃ­das.",
                        pageCount, pageCount - pagesWithNonDeletedPayslips);
                log.warn("   Para evitar duplicaÃ§Ã£o na contagem, o arquivo NÃƒO serÃ¡ processado novamente.");
                log.warn("   Se necessÃ¡rio reprocessar, exclua os registros existentes primeiro.");
                log.warn(
                        "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
                return true; // CORREÃ‡ÃƒO: Retornar true para bloquear reprocessamento
            }
            // CORREÃ‡ÃƒO: Se a maioria das pÃ¡ginas jÃ¡ foi processada (>80%), considerar
            // como jÃ¡ processado
            // para evitar reprocessar parcialmente e somar na contagem incorretamente
            else if (pagesAlreadyProcessed > 0 && pagesWithNonDeletedPayslips > 0) {
                double percentProcessed = (double) pagesWithNonDeletedPayslips / pageCount * 100.0;
                if (percentProcessed >= 80.0) {
                    log.warn(
                            "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
                    log.warn("âš ï¸ ARQUIVO '{}' PARCIALMENTE PROCESSADO E BLOQUEADO!", originalFilename);
                    log.warn("   {}/{} pÃ¡gina(s) jÃ¡ foram processadas ({:.1f}%).",
                            pagesWithNonDeletedPayslips, pageCount, percentProcessed);
                    log.warn("   Para evitar duplicaÃ§Ã£o na contagem, o arquivo NÃƒO serÃ¡ processado novamente.");
                    log.warn("   Se necessÃ¡rio reprocessar, exclua os registros existentes primeiro.");
                    log.warn(
                            "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
                    return true; // CORREÃ‡ÃƒO: Retornar true para bloquear reprocessamento quando maioria jÃ¡
                                 // processada
                } else {
                    log.warn(
                            "âš ï¸ Arquivo '{}' parcialmente processado: {}/{} pÃ¡gina(s) ({:.1f}%). Permitindo processar pÃ¡ginas faltantes...",
                            originalFilename, pagesAlreadyProcessed, pageCount, percentProcessed);
                    return false;
                }
            } else if (pagesAlreadyProcessed == 0) {
                log.info(
                        "âœ… Arquivo '{}' nÃ£o foi processado anteriormente. Todas as {} pÃ¡gina(s) serÃ£o processadas.",
                        originalFilename, pageCount);
                return false;
            } else {
                log.warn(
                        "âš ï¸ SituaÃ§Ã£o inesperada: pagesAlreadyProcessed={}, pagesWithNonDeletedPayslips={}, pageCount={}",
                        pagesAlreadyProcessed, pagesWithNonDeletedPayslips, pageCount);
                log.warn("   Por seguranÃ§a, permitindo processamento...");
                return false;
            }
        } catch (Exception e) {
            log.error("âŒ Erro ao verificar se arquivo jÃ¡ foi processado: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Calcula hash do arquivo PDF de uma pÃ¡gina especÃ­fica (mÃ©todo recomendado
     * para comparaÃ§Ã£o)
     * Este mÃ©todo extrai a pÃ¡gina do PDF, cria um documento temporÃ¡rio e calcula
     * o hash dos bytes
     * Isso garante comparaÃ§Ã£o mais confiÃ¡vel do que comparar apenas o texto
     * extraÃ­do
     */
    private String calculatePagePdfHash(PDDocument document, int pageNumber) {
        try {
            if (document == null || pageNumber < 1 || pageNumber > document.getNumberOfPages()) {
                log.warn("âš ï¸ ParÃ¢metros invÃ¡lidos para calcular hash do PDF: document={}, pageNumber={}",
                        document != null, pageNumber);
                return null;
            }

            // Criar um novo documento com apenas a pÃ¡gina desejada
            try (PDDocument singlePageDoc = new PDDocument()) {
                PDPage page = document.getPage(pageNumber - 1);
                singlePageDoc.addPage(page);

                // Salvar em um ByteArrayOutputStream para obter os bytes
                java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
                singlePageDoc.save(baos);
                byte[] pdfBytes = baos.toByteArray();

                // Calcular hash SHA-256 dos bytes do PDF
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                byte[] hashBytes = digest.digest(pdfBytes);

                // Converter para hexadecimal (64 caracteres)
                StringBuilder hexString = new StringBuilder();
                for (byte b : hashBytes) {
                    String hex = Integer.toHexString(0xff & b);
                    if (hex.length() == 1) {
                        hexString.append('0');
                    }
                    hexString.append(hex);
                }

                String hash = hexString.toString();
                log.debug("ðŸ” Hash do PDF da pÃ¡gina {} calculado: {}...", pageNumber,
                        hash.substring(0, Math.min(16, hash.length())));
                return hash;
            }
        } catch (Exception e) {
            log.warn("âš ï¸ Erro ao calcular hash do PDF da pÃ¡gina {}: {}", pageNumber, e.getMessage());
            return null;
        }
    }

    /**
     * TASK 02: ObtÃ©m hash do arquivo PDF salvo (se existir) para comparaÃ§Ã£o
     * Usa arquivo_caminho se disponÃ­vel, senÃ£o tenta construir o caminho conforme
     * nova estrutura
     */
    private String getPayslipFileHash(Payslip payslip) {
        try {
            if (payslip == null || payslip.getFileName() == null) {
                return null;
            }

            Path candidatePath = null;

            // 1. Tentar usar arquivo_caminho se disponÃ­vel (nova estrutura)
            if (payslip.getArquivoCaminho() != null && !payslip.getArquivoCaminho().isEmpty()) {
                candidatePath = Paths.get(payslip.getArquivoCaminho());
                if (Files.exists(candidatePath)) {
                    log.debug("ðŸ“„ Usando arquivo_caminho do banco: {}", candidatePath);
                } else {
                    candidatePath = null; // Tentar outras opÃ§Ãµes
                }
            }

            // 2. Se nÃ£o encontrou, tentar construir caminho conforme nova estrutura PRD
            if (candidatePath == null || !Files.exists(candidatePath)) {
                String empresaCnpj = normalizeCnpj(payslip.getCompanyCnpj());
                String setorNome = normalizeSectorName(payslip.getWorkPostName());
                String periodo = String.format("%d-%02d", payslip.getYear(), payslip.getMonth());
                String funcionarioNome = payslip.getEmployeeName() != null
                        ? normalizeEmployeeName(payslip.getEmployeeName())
                        : null;
                String funcionarioCpf = payslip.getCpf() != null ? payslip.getCpf().replaceAll("[^0-9]", "") : null;

                if (empresaCnpj != null && setorNome != null && funcionarioNome != null && funcionarioCpf != null) {
                    String pastaFuncionario = String.format("%s_%s", funcionarioNome, funcionarioCpf);
                    candidatePath = Paths.get(OUTPUT_DIR, empresaCnpj, setorNome, periodo, pastaFuncionario,
                            payslip.getFileName());
                    if (Files.exists(candidatePath)) {
                        log.debug("ðŸ“„ Arquivo encontrado na nova estrutura: {}", candidatePath);
                    } else {
                        candidatePath = null;
                    }
                }
            }

            // 3. Fallback: tentar estrutura antiga
            if (candidatePath == null || !Files.exists(candidatePath)) {
                String mesAno = String.format("%s-%s", payslip.getMonth(), payslip.getYear());
                candidatePath = Paths.get(OUTPUT_DIR, mesAno, payslip.getFileName());
                if (Files.exists(candidatePath)) {
                    log.debug("ðŸ“„ Arquivo encontrado na estrutura antiga: {}", candidatePath);
                } else {
                    Optional<String> pathOpt = resolvePayslipPathByCpfMonthYear(payslip.getCpf(), payslip.getMonth(),
                            payslip.getYear());
                    if (pathOpt.isPresent()) {
                        candidatePath = Paths.get(pathOpt.get());
                    }
                }
            }

            if (candidatePath == null || !Files.exists(candidatePath)) {
                log.debug("ðŸ“„ Arquivo PDF nÃ£o encontrado para calcular hash: {}", payslip.getFileName());
                return null;
            }

            // Ler conteÃºdo do arquivo e calcular hash SHA-256 em hexadecimal
            byte[] fileBytes = Files.readAllBytes(candidatePath);
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(fileBytes);
            // Converter para hexadecimal (64 caracteres)
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            String hash = hexString.toString();

            log.debug("ðŸ” Hash calculado do arquivo original {}: {}...", payslip.getFileName(),
                    hash.substring(0, Math.min(16, hash.length())));
            return hash;
        } catch (Exception e) {
            log.warn("âš ï¸ Erro ao obter hash do arquivo salvo {}: {}",
                    payslip != null ? payslip.getFileName() : "null", e.getMessage());
            return null;
        }
    }

    /**
     * TASK 02: Compara dois holerites e detecta alteraÃ§Ãµes (dados extraÃ­dos e
     * conteÃºdo do arquivo)
     */
    private PayslipComparisonResult comparePayslips(Payslip existing, Payslip newPayslip, String hashArquivoOriginal,
            String hashPaginaAtual) {
        PayslipComparisonResult result = PayslipComparisonResult.builder()
                .hasChanges(false)
                .differences(new ArrayList<>())
                .build();

        if (existing == null || newPayslip == null) {
            if (existing == null && newPayslip != null) {
                result.addDifference("Holerite novo", "nÃ£o existia", "criado");
            }
            return result;
        }

        // 1. Comparar hash do arquivo (mais confiÃ¡vel para detectar mudanÃ§as no PDF
        // original)
        // IMPORTANTE: Se o hash do PDF for idÃªntico, nÃ£o hÃ¡ alteraÃ§Ãµes reais -
        // nÃ£o criar nova versÃ£o
        boolean hashIdentico = false;
        if (hashArquivoOriginal != null && hashPaginaAtual != null) {
            if (hashArquivoOriginal.equals(hashPaginaAtual)) {
                hashIdentico = true;
                log.info(
                        "âœ… Hash do arquivo PDF idÃªntico - conteÃºdo do PDF nÃ£o mudou. NÃ£o serÃ¡ criada nova versÃ£o.");
                // Se o hash Ã© idÃªntico, nÃ£o hÃ¡ alteraÃ§Ãµes reais - retornar sem verificar
                // outras coisas
                return result; // Retorna hasChanges=false
            } else {
                // Hash diferente - mas vamos verificar APENAS os dados financeiros
                // NÃ£o adicionar diferenÃ§a ainda - vamos verificar os dados financeiros
                // primeiro
                log.info(
                        "ðŸ” Hash do arquivo diferente detectado - verificando dados financeiros para determinar se cria versÃ£o");
            }
        } else if (hashArquivoOriginal == null && hashPaginaAtual != null) {
            // Se nÃ£o temos hash do original mas temos do novo, continuar verificando dados
            // financeiros
            log.warn("âš ï¸ Hash do arquivo original nÃ£o disponÃ­vel - verificando dados financeiros");
        } else if (hashArquivoOriginal != null && hashPaginaAtual == null) {
            log.warn("âš ï¸ Hash da pÃ¡gina atual nÃ£o disponÃ­vel - verificando dados financeiros");
        }

        // 2. REGRA CRÃTICA: Comparar APENAS valores financeiros para determinar se
        // cria versÃ£o
        // NÃƒO comparar outros campos (nome, CPF, setor, etc.) - esses nÃ£o devem criar
        // versÃ£o
        // Esta Ã© uma verificaÃ§Ã£o CRÃTICA - qualquer diferenÃ§a nos valores
        // financeiros deve ser detectada
        log.info("ðŸ” Comparando APENAS valores financeiros para determinar se cria versÃ£o...");

        // Declarar variÃ¡veis para verificar diferenÃ§as financeiras
        boolean hasFinancialDifferences = false;
        boolean hasTableDetailsDifferences = false;

        // Comparar Total Vencimentos
        if (existing.getTotalEarnings() != null && newPayslip.getTotalEarnings() != null) {
            int comparison = existing.getTotalEarnings().compareTo(newPayslip.getTotalEarnings());
            if (comparison != 0) {
                hasFinancialDifferences = true;
                log.warn("ðŸ’° ALTERAÃ‡ÃƒO DETECTADA em Total Vencimentos: {} -> {}",
                        existing.getTotalEarnings(), newPayslip.getTotalEarnings());
            } else {
                log.debug("âœ… Total Vencimentos idÃªntico: {}", existing.getTotalEarnings());
            }
        } else if (existing.getTotalEarnings() == null ^ newPayslip.getTotalEarnings() != null) {
            hasFinancialDifferences = true;
            log.warn("ðŸ’° Total Vencimentos: {} -> {}",
                    existing.getTotalEarnings() != null ? existing.getTotalEarnings() : "nÃ£o disponÃ­vel",
                    newPayslip.getTotalEarnings() != null ? newPayslip.getTotalEarnings() : "nÃ£o disponÃ­vel");
        } else {
            log.debug("âš ï¸ Total Vencimentos nÃ£o disponÃ­vel em ambos os holerites");
        }

        // Comparar Total Descontos
        if (!hasFinancialDifferences && existing.getTotalDeductions() != null
                && newPayslip.getTotalDeductions() != null) {
            int comparison = existing.getTotalDeductions().compareTo(newPayslip.getTotalDeductions());
            if (comparison != 0) {
                hasFinancialDifferences = true;
                log.warn("ðŸ’° ALTERAÃ‡ÃƒO DETECTADA em Total Descontos: {} -> {}",
                        existing.getTotalDeductions(), newPayslip.getTotalDeductions());
            } else {
                log.debug("âœ… Total Descontos idÃªntico: {}", existing.getTotalDeductions());
            }
        } else if (!hasFinancialDifferences
                && (existing.getTotalDeductions() == null ^ newPayslip.getTotalDeductions() != null)) {
            hasFinancialDifferences = true;
            log.warn("ðŸ’° Total Descontos: {} -> {}",
                    existing.getTotalDeductions() != null ? existing.getTotalDeductions() : "nÃ£o disponÃ­vel",
                    newPayslip.getTotalDeductions() != null ? newPayslip.getTotalDeductions() : "nÃ£o disponÃ­vel");
        } else if (!hasFinancialDifferences) {
            log.debug("âš ï¸ Total Descontos nÃ£o disponÃ­vel em ambos os holerites");
        }

        // Comparar Valor LÃ­quido
        if (!hasFinancialDifferences && existing.getNetValue() != null && newPayslip.getNetValue() != null) {
            int comparison = existing.getNetValue().compareTo(newPayslip.getNetValue());
            if (comparison != 0) {
                hasFinancialDifferences = true;
                log.warn("ðŸ’° ALTERAÃ‡ÃƒO DETECTADA em Valor LÃ­quido: {} -> {}",
                        existing.getNetValue(), newPayslip.getNetValue());
            } else {
                log.debug("âœ… Valor LÃ­quido idÃªntico: {}", existing.getNetValue());
            }
        } else if (!hasFinancialDifferences && (existing.getNetValue() == null ^ newPayslip.getNetValue() != null)) {
            hasFinancialDifferences = true;
            log.warn("ðŸ’° Valor LÃ­quido: {} -> {}",
                    existing.getNetValue() != null ? existing.getNetValue() : "nÃ£o disponÃ­vel",
                    newPayslip.getNetValue() != null ? newPayslip.getNetValue() : "nÃ£o disponÃ­vel");
        } else if (!hasFinancialDifferences) {
            log.debug("âš ï¸ Valor LÃ­quido nÃ£o disponÃ­vel em ambos os holerites");
        }

        // Comparar dados detalhados da tabela (CÃ³d, DescriÃ§Ã£o, ReferÃªncia,
        // Vencimentos, Descontos)
        log.debug("ðŸ” Comparando dados detalhados da tabela...");
        log.debug("   Holerite existente: {} linhas",
                existing.getTableDetails() != null ? existing.getTableDetails().size() : 0);
        log.debug("   Holerite novo: {} linhas",
                newPayslip.getTableDetails() != null ? newPayslip.getTableDetails().size() : 0);

        if (existing.getTableDetails() != null && newPayslip.getTableDetails() != null) {
            if (existing.getTableDetails().size() != newPayslip.getTableDetails().size()) {
                hasTableDetailsDifferences = true;
                log.warn("ðŸ“‹ NÃºmero de linhas diferente: {} vs {}",
                        existing.getTableDetails().size(), newPayslip.getTableDetails().size());
            } else {
                // Comparar conteÃºdo das linhas
                for (int i = 0; i < existing.getTableDetails().size(); i++) {
                    var existingRow = existing.getTableDetails().get(i);
                    var newRow = newPayslip.getTableDetails().get(i);
                    if (!Objects.equals(existingRow.getCodigo(), newRow.getCodigo()) ||
                            !Objects.equals(existingRow.getDescricao(), newRow.getDescricao()) ||
                            !Objects.equals(existingRow.getReferencia(), newRow.getReferencia()) ||
                            (existingRow.getVencimentos() != null && newRow.getVencimentos() != null &&
                                    existingRow.getVencimentos().compareTo(newRow.getVencimentos()) != 0)
                            ||
                            (existingRow.getDescontos() != null && newRow.getDescontos() != null &&
                                    existingRow.getDescontos().compareTo(newRow.getDescontos()) != 0)) {
                        hasTableDetailsDifferences = true;
                        log.warn("ðŸ“‹ Linha {} diferente: CÃ³d={}, Desc={}, Venc={}, Desc={}",
                                i, existingRow.getCodigo(), existingRow.getDescricao(),
                                existingRow.getVencimentos(), existingRow.getDescontos());
                        break;
                    }
                }
            }
        } else if (existing.getTableDetails() == null ^ newPayslip.getTableDetails() == null) {
            hasTableDetailsDifferences = true;
            log.warn("ðŸ“‹ TableDetails: {} -> {}",
                    existing.getTableDetails() != null ? existing.getTableDetails().size() + " linhas"
                            : "nÃ£o disponÃ­vel",
                    newPayslip.getTableDetails() != null ? newPayslip.getTableDetails().size() + " linhas"
                            : "nÃ£o disponÃ­vel");
        } else {
            log.debug("âš ï¸ Dados da tabela nÃ£o disponÃ­veis em ambos os holerites");
        }

        // VerificaÃ§Ã£o final: Se o hash for diferente mas todos os dados extraÃ­dos
        // forem idÃªnticos,
        // provavelmente Ã© apenas diferenÃ§a em metadados do PDF (data de criaÃ§Ã£o,
        // etc.) - considerar como duplicado
        if (!hashIdentico && hashArquivoOriginal != null && hashPaginaAtual != null &&
                !hashArquivoOriginal.equals(hashPaginaAtual)) {
            // Hash diferente, mas vamos verificar se os dados sÃ£o realmente idÃªnticos
            // Verificar diretamente os dados, nÃ£o atravÃ©s do result.getDifferences() que
            // pode jÃ¡ ter diferenÃ§as
            boolean dadosIdenticos = !hasFinancialDifferences && !hasTableDetailsDifferences;

            // Verificar tambÃ©m se nÃ£o hÃ¡ diferenÃ§as nos campos bÃ¡sicos (nome, CPF,
            // setor, etc.)
            boolean camposBasicosIdenticos = Objects.equals(normalizeString(existing.getEmployeeName()),
                    normalizeString(newPayslip.getEmployeeName())) &&
                    Objects.equals(normalizeString(existing.getCpf()), normalizeString(newPayslip.getCpf())) &&
                    Objects.equals(normalizeString(existing.getCompanyCnpj()),
                            normalizeString(newPayslip.getCompanyCnpj()))
                    &&
                    Objects.equals(normalizeString(existing.getWorkPostName()),
                            normalizeString(newPayslip.getWorkPostName()))
                    &&
                    Objects.equals(existing.getMonth(), newPayslip.getMonth()) &&
                    Objects.equals(existing.getYear(), newPayslip.getYear());

            if (dadosIdenticos && camposBasicosIdenticos) {
                log.info("âœ… Hash do PDF diferente, mas todos os dados extraÃ­dos sÃ£o idÃªnticos.");
                log.info("   Provavelmente Ã© apenas diferenÃ§a em metadados do PDF (data de criaÃ§Ã£o, etc.).");
                log.info("   Considerando como duplicado - nÃ£o serÃ¡ criada nova versÃ£o.");
                // Limpar diferenÃ§as e retornar sem alteraÃ§Ãµes
                result = PayslipComparisonResult.builder()
                        .hasChanges(false)
                        .differences(new ArrayList<>())
                        .build();
                return result;
            } else {
                // Hash diferente E dados diferentes - realmente houve alteraÃ§Ã£o
                if (!result.getDifferences().stream().anyMatch(d -> d.contains("Hash do arquivo"))) {
                    result.addDifference("Hash do arquivo", "diferente", "arquivo foi modificado");
                }
                log.info("ðŸ” Hash do arquivo diferente E dados diferentes - alteraÃ§Ã£o real detectada");
                if (!dadosIdenticos) {
                    log.info("   DiferenÃ§as detectadas: financeiras={}, tableDetails={}", hasFinancialDifferences,
                            hasTableDetailsDifferences);
                }
                if (!camposBasicosIdenticos) {
                    log.info("   DiferenÃ§as detectadas nos campos bÃ¡sicos");
                }
            }
        }

        // REGRA CRÃTICA: SÃ³ criar versÃ£o se houver diferenÃ§as nos DADOS FINANCEIROS
        // NÃ£o criar versÃ£o por diferenÃ§as em outros campos (nome do arquivo, hash,
        // etc.)
        // Se nÃ£o hÃ¡ diferenÃ§as financeiras, considerar como duplicado mesmo que hash
        // seja diferente
        if (!hasFinancialDifferences && !hasTableDetailsDifferences) {
            // NÃ£o hÃ¡ diferenÃ§as financeiras - nÃ£o criar nova versÃ£o
            log.info("âœ… Nenhuma diferenÃ§a financeira detectada - nÃ£o serÃ¡ criada nova versÃ£o");
            log.info("   Total Vencimentos: {} (idÃªntico)",
                    existing.getTotalEarnings() != null ? existing.getTotalEarnings() : "N/A");
            log.info("   Total Descontos: {} (idÃªntico)",
                    existing.getTotalDeductions() != null ? existing.getTotalDeductions() : "N/A");
            log.info("   Valor LÃ­quido: {} (idÃªntico)",
                    existing.getNetValue() != null ? existing.getNetValue() : "N/A");
            log.info("   TableDetails: {} linhas (idÃªntico)",
                    existing.getTableDetails() != null ? existing.getTableDetails().size() : 0);

            // Limpar diferenÃ§as e retornar sem alteraÃ§Ãµes
            result = PayslipComparisonResult.builder()
                    .hasChanges(false)
                    .differences(new ArrayList<>())
                    .build();
            return result;
        }

        // Se detectou diferenÃ§as financeiras ou em tableDetails, marcar como
        // alteraÃ§Ã£o
        if (hasFinancialDifferences || hasTableDetailsDifferences) {
            if (!result.hasChanges()) {
                log.warn("âš ï¸ DIFERENÃ‡AS FINANCEIRAS DETECTADAS - FORÃ‡ANDO hasChanges=true");
                if (hasFinancialDifferences) {
                    result.addDifference("Valores financeiros", "diferentes", "detectado na verificaÃ§Ã£o adicional");
                }
                if (hasTableDetailsDifferences) {
                    result.addDifference("Dados da tabela", "diferentes", "detectado na verificaÃ§Ã£o adicional");
                }
            }
        }

        // Log final do resultado da comparaÃ§Ã£o
        log.info("ðŸ” ComparaÃ§Ã£o concluÃ­da: hasChanges={}, total de diferenÃ§as={}",
                result.hasChanges(), result.getDifferences().size());
        if (result.hasChanges()) {
            log.warn("ðŸ“ RESUMO DAS ALTERAÃ‡Ã•ES DETECTADAS:");
            for (int idx = 0; idx < result.getDifferences().size(); idx++) {
                log.warn("   {}. {}", idx + 1, result.getDifferences().get(idx));
            }
        } else {
            log.info("âœ… Nenhuma alteraÃ§Ã£o detectada - holerites sÃ£o idÃªnticos");
        }

        return result;
    }

    /**
     * Compara os dados detalhados da tabela de dois holerites
     * Retorna true se houver diferenÃ§as
     */
    private boolean compareTableDetails(
            List<com.z7design.fleet_manager.dto.PayslipTableRow> existingDetails,
            List<com.z7design.fleet_manager.dto.PayslipTableRow> newDetails,
            PayslipComparisonResult result) {

        if (existingDetails == null || newDetails == null) {
            log.debug("âš ï¸ compareTableDetails: existingDetails ou newDetails Ã© null");
            return false;
        }

        boolean hasChanges = false;

        log.debug("ðŸ” Comparando tableDetails: {} linhas existentes vs {} linhas novas",
                existingDetails.size(), newDetails.size());

        // Se o nÃºmero de linhas Ã© diferente, jÃ¡ hÃ¡ mudanÃ§as
        if (existingDetails.size() != newDetails.size()) {
            result.addDifference("NÃºmero de linhas na tabela",
                    String.valueOf(existingDetails.size()),
                    String.valueOf(newDetails.size()));
            hasChanges = true;
            log.warn("ðŸ“‹ NÃºmero de linhas diferente: {} vs {}", existingDetails.size(), newDetails.size());
        }

        // Criar mapas por cÃ³digo para comparaÃ§Ã£o mais eficiente
        Map<String, com.z7design.fleet_manager.dto.PayslipTableRow> existingMap = new HashMap<>();
        Map<String, com.z7design.fleet_manager.dto.PayslipTableRow> newMap = new HashMap<>();

        for (com.z7design.fleet_manager.dto.PayslipTableRow row : existingDetails) {
            if (row.getCodigo() != null) {
                existingMap.put(row.getCodigo(), row);
            }
        }

        for (com.z7design.fleet_manager.dto.PayslipTableRow row : newDetails) {
            if (row.getCodigo() != null) {
                newMap.put(row.getCodigo(), row);
            }
        }

        // Verificar linhas que foram adicionadas ou removidas
        Set<String> allCodes = new HashSet<>(existingMap.keySet());
        allCodes.addAll(newMap.keySet());

        log.debug("ðŸ” Comparando {} cÃ³digos Ãºnicos", allCodes.size());

        for (String codigo : allCodes) {
            com.z7design.fleet_manager.dto.PayslipTableRow existingRow = existingMap.get(codigo);
            com.z7design.fleet_manager.dto.PayslipTableRow newRow = newMap.get(codigo);

            if (existingRow == null && newRow != null) {
                result.addDifference("Linha adicionada",
                        "nÃ£o existia",
                        String.format("CÃ³d: %s, Desc: %s, Ref: %s, Venc: %s, Desc: %s",
                                newRow.getCodigo(), newRow.getDescricao(), newRow.getReferencia(),
                                newRow.getVencimentos(), newRow.getDescontos()));
                hasChanges = true;
                log.warn("ðŸ“‹ Linha ADICIONADA: CÃ³digo {}", codigo);
            } else if (existingRow != null && newRow == null) {
                result.addDifference("Linha removida",
                        String.format("CÃ³d: %s, Desc: %s, Ref: %s, Venc: %s, Desc: %s",
                                existingRow.getCodigo(), existingRow.getDescricao(), existingRow.getReferencia(),
                                existingRow.getVencimentos(), existingRow.getDescontos()),
                        "nÃ£o existe mais");
                hasChanges = true;
                log.warn("ðŸ“‹ Linha REMOVIDA: CÃ³digo {}", codigo);
            } else if (existingRow != null && newRow != null) {
                // Comparar campos da linha
                boolean rowChanged = false;

                if (!Objects.equals(normalizeString(existingRow.getDescricao()),
                        normalizeString(newRow.getDescricao()))) {
                    result.addDifference(String.format("DescriÃ§Ã£o (CÃ³d: %s)", codigo),
                            existingRow.getDescricao() != null ? existingRow.getDescricao() : "null",
                            newRow.getDescricao() != null ? newRow.getDescricao() : "null");
                    hasChanges = true;
                    rowChanged = true;
                    log.warn("ðŸ“‹ DescriÃ§Ã£o alterada para cÃ³digo {}: '{}' -> '{}'", codigo,
                            existingRow.getDescricao(), newRow.getDescricao());
                }

                if (!Objects.equals(normalizeString(existingRow.getReferencia()),
                        normalizeString(newRow.getReferencia()))) {
                    result.addDifference(String.format("ReferÃªncia (CÃ³d: %s)", codigo),
                            existingRow.getReferencia() != null ? existingRow.getReferencia() : "null",
                            newRow.getReferencia() != null ? newRow.getReferencia() : "null");
                    hasChanges = true;
                    rowChanged = true;
                    log.warn("ðŸ“‹ ReferÃªncia alterada para cÃ³digo {}: '{}' -> '{}'", codigo,
                            existingRow.getReferencia(), newRow.getReferencia());
                }

                if (existingRow.getVencimentos() != null && newRow.getVencimentos() != null) {
                    if (existingRow.getVencimentos().compareTo(newRow.getVencimentos()) != 0) {
                        result.addDifference(String.format("Vencimentos (CÃ³d: %s)", codigo),
                                existingRow.getVencimentos().toString(), newRow.getVencimentos().toString());
                        hasChanges = true;
                        rowChanged = true;
                        log.warn("ðŸ“‹ Vencimentos alterados para cÃ³digo {}: {} -> {}", codigo,
                                existingRow.getVencimentos(), newRow.getVencimentos());
                    }
                } else if (existingRow.getVencimentos() == null && newRow.getVencimentos() != null) {
                    result.addDifference(String.format("Vencimentos (CÃ³d: %s)", codigo),
                            "nÃ£o disponÃ­vel", newRow.getVencimentos().toString());
                    hasChanges = true;
                    rowChanged = true;
                    log.warn("ðŸ“‹ Vencimentos adicionados para cÃ³digo {}: {}", codigo, newRow.getVencimentos());
                } else if (existingRow.getVencimentos() != null && newRow.getVencimentos() == null) {
                    result.addDifference(String.format("Vencimentos (CÃ³d: %s)", codigo),
                            existingRow.getVencimentos().toString(), "nÃ£o disponÃ­vel");
                    hasChanges = true;
                    rowChanged = true;
                    log.warn("ðŸ“‹ Vencimentos removidos para cÃ³digo {}: {}", codigo, existingRow.getVencimentos());
                }

                if (existingRow.getDescontos() != null && newRow.getDescontos() != null) {
                    if (existingRow.getDescontos().compareTo(newRow.getDescontos()) != 0) {
                        result.addDifference(String.format("Descontos (CÃ³d: %s)", codigo),
                                existingRow.getDescontos().toString(), newRow.getDescontos().toString());
                        hasChanges = true;
                        rowChanged = true;
                        log.warn("ðŸ“‹ Descontos alterados para cÃ³digo {}: {} -> {}", codigo,
                                existingRow.getDescontos(), newRow.getDescontos());
                    }
                } else if (existingRow.getDescontos() == null && newRow.getDescontos() != null) {
                    result.addDifference(String.format("Descontos (CÃ³d: %s)", codigo),
                            "nÃ£o disponÃ­vel", newRow.getDescontos().toString());
                    hasChanges = true;
                    rowChanged = true;
                    log.warn("ðŸ“‹ Descontos adicionados para cÃ³digo {}: {}", codigo, newRow.getDescontos());
                } else if (existingRow.getDescontos() != null && newRow.getDescontos() == null) {
                    result.addDifference(String.format("Descontos (CÃ³d: %s)", codigo),
                            existingRow.getDescontos().toString(), "nÃ£o disponÃ­vel");
                    hasChanges = true;
                    rowChanged = true;
                    log.warn("ðŸ“‹ Descontos removidos para cÃ³digo {}: {}", codigo, existingRow.getDescontos());
                }

                if (!rowChanged) {
                    log.debug("âœ… Linha com cÃ³digo {} idÃªntica", codigo);
                }
            }
        }

        log.info("ðŸ“‹ ComparaÃ§Ã£o de tableDetails concluÃ­da: hasChanges={}", hasChanges);
        return hasChanges;
    }

    /**
     * Extrai os dados detalhados da tabela de vencimentos/descontos do holerite
     * Procura por linhas que seguem o padrÃ£o: CÃ³d | DescriÃ§Ã£o | ReferÃªncia |
     * Vencimentos | Descontos
     * Funciona tanto com texto extraÃ­do via PDFBox quanto via OCR
     */
    private List<com.z7design.fleet_manager.dto.PayslipTableRow> extractTableDetails(String[] linhas) {
        List<com.z7design.fleet_manager.dto.PayslipTableRow> tableRows = new ArrayList<>();

        if (linhas == null || linhas.length == 0) {
            log.warn("âš ï¸ Nenhuma linha disponÃ­vel para extrair dados da tabela");
            return tableRows;
        }

        boolean inTableSection = false;
        int linhaIndex = 0;

        log.debug("ðŸ” Iniciando extraÃ§Ã£o de dados da tabela de {} linha(s)", linhas.length);

        for (String linha : linhas) {
            linhaIndex++;
            String linhaTrimmed = linha.trim();

            // Detectar inÃ­cio da tabela (linha com cabeÃ§alho) - mais flexÃ­vel
            String linhaUpper = linhaTrimmed.toUpperCase();
            if (linhaUpper.contains("CÃ“D") || linhaUpper.contains("COD") ||
                    linhaUpper.contains("DESCRIÃ‡ÃƒO") || linhaUpper.contains("DESCRICAO") ||
                    linhaUpper.contains("REFERÃŠNCIA") || linhaUpper.contains("REFERENCIA") ||
                    linhaUpper.contains("VENCIMENTOS") || linhaUpper.contains("VENCIMENTO") ||
                    linhaUpper.contains("DESCONTOS") || linhaUpper.contains("DESCONTO")) {
                inTableSection = true;
                log.debug("ðŸ“‹ InÃ­cio da tabela detectado na linha {}: {}", linhaIndex, linhaTrimmed);
                continue;
            }

            // Detectar fim da tabela (linha com totais)
            if (inTableSection && (linhaUpper.contains("TOTAL") ||
                    linhaUpper.contains("VALOR LÃQUIDO") || linhaUpper.contains("VALOR LIQUIDO") ||
                    linhaUpper.contains("LÃQUIDO") || linhaUpper.contains("LIQUIDO") ||
                    linhaUpper.contains("SALDO BASE") ||
                    linhaUpper.contains("BASE CÃLC") || linhaUpper.contains("BASE CALC"))) {
                log.debug("ðŸ“‹ Fim da tabela detectado na linha {}: {}", linhaIndex, linhaTrimmed);
                break;
            }

            if (inTableSection && linhaTrimmed.length() > 5) {
                // PadrÃ£o 1: CÃ³digo de 3 dÃ­gitos no inÃ­cio (mais comum)
                // Exemplo: "001 SalÃ¡rio Base 30,00 1.649,12" ou "903 INSS Folha 7,62 % 125,65"
                Pattern pattern1 = Pattern.compile(
                        "^(\\d{3})\\s+" + // CÃ³digo (3 dÃ­gitos)
                                "([A-ZÃÃ€Ã‚ÃƒÃ„Ã‰ÃˆÃŠÃ‹ÃÃŒÃŽÃÃ“Ã’Ã”Ã•Ã–ÃšÃ™Ã›ÃœÃ‡a-zÃ¡Ã Ã¢Ã£Ã¤Ã©Ã¨ÃªÃ«Ã­Ã¬Ã®Ã¯Ã³Ã²Ã´ÃµÃ¶ÃºÃ¹Ã»Ã¼Ã§\\s]+?)\\s+"
                                + // DescriÃ§Ã£o
                                "([\\d.,%\\s]+?)\\s+" + // ReferÃªncia
                                "([\\d.,]+)?\\s*" + // Vencimentos (opcional)
                                "([\\d.,]+)?$" // Descontos (opcional)
                );

                // PadrÃ£o 2: Mais flexÃ­vel para OCR (pode ter espaÃ§os extras ou caracteres
                // estranhos)
                Pattern pattern2 = Pattern.compile(
                        "^(\\d{3})[\\s|]+" + // CÃ³digo seguido de espaÃ§o ou pipe
                                "([A-ZÃÃ€Ã‚ÃƒÃ„Ã‰ÃˆÃŠÃ‹ÃÃŒÃŽÃÃ“Ã’Ã”Ã•Ã–ÃšÃ™Ã›ÃœÃ‡a-zÃ¡Ã Ã¢Ã£Ã¤Ã©Ã¨ÃªÃ«Ã­Ã¬Ã®Ã¯Ã³Ã²Ã´ÃµÃ¶ÃºÃ¹Ã»Ã¼Ã§\\s]+?)[\\s|]+"
                                + // DescriÃ§Ã£o
                                "([\\d.,%\\s]+?)[\\s|]+" + // ReferÃªncia
                                "([\\d.,]+)?[\\s|]*" + // Vencimentos (opcional)
                                "([\\d.,]+)?$" // Descontos (opcional)
                );

                // PadrÃ£o 3: Ainda mais flexÃ­vel - apenas cÃ³digo e descriÃ§Ã£o obrigatÃ³rios
                Pattern pattern3 = Pattern.compile(
                        "^(\\d{3})\\s+" + // CÃ³digo
                                "(.+?)\\s+" + // DescriÃ§Ã£o (qualquer coisa)
                                "([\\d.,%\\s]*?)\\s*" + // ReferÃªncia (opcional)
                                "([\\d.,]+)?\\s*" + // Vencimentos (opcional)
                                "([\\d.,]+)?$" // Descontos (opcional)
                );

                Matcher matcher = pattern1.matcher(linhaTrimmed);
                if (!matcher.find()) {
                    matcher = pattern2.matcher(linhaTrimmed);
                }
                if (!matcher.find()) {
                    matcher = pattern3.matcher(linhaTrimmed);
                }

                if (matcher.find()) {
                    try {
                        String codigo = matcher.group(1);
                        String descricao = matcher.group(2).trim();
                        String referencia = matcher.groupCount() >= 3 && matcher.group(3) != null
                                ? matcher.group(3).trim()
                                : "";
                        String vencimentosStr = matcher.groupCount() >= 4 && matcher.group(4) != null
                                ? matcher.group(4).trim()
                                : null;
                        String descontosStr = matcher.groupCount() >= 5 && matcher.group(5) != null
                                ? matcher.group(5).trim()
                                : null;

                        // Limpar descriÃ§Ã£o (remover caracteres estranhos do OCR)
                        descricao = descricao.replaceAll("[|\\|]", " ").replaceAll("\\s+", " ").trim();

                        // Converter valores monetÃ¡rios
                        java.math.BigDecimal vencimentos = parseMonetaryValue(vencimentosStr);
                        java.math.BigDecimal descontos = parseMonetaryValue(descontosStr);

                        // Validar cÃ³digo (deve ser 3 dÃ­gitos)
                        if (codigo != null && codigo.matches("\\d{3}") &&
                                descricao != null && !descricao.isEmpty() && descricao.length() >= 3) {

                            com.z7design.fleet_manager.dto.PayslipTableRow row = com.z7design.fleet_manager.dto.PayslipTableRow
                                    .builder()
                                    .codigo(codigo)
                                    .descricao(descricao)
                                    .referencia(referencia)
                                    .vencimentos(vencimentos)
                                    .descontos(descontos)
                                    .build();

                            tableRows.add(row);
                            log.debug("ðŸ“‹ Linha {} extraÃ­da: CÃ³d: {}, Desc: {}, Ref: {}, Venc: {}, Desc: {}",
                                    linhaIndex, codigo, descricao, referencia, vencimentos, descontos);
                        } else {
                            log.debug("âš ï¸ Linha {} ignorada (validaÃ§Ã£o falhou): {}", linhaIndex, linhaTrimmed);
                        }
                    } catch (Exception e) {
                        log.debug("âš ï¸ Erro ao extrair linha {} da tabela: {} - {}", linhaIndex, linhaTrimmed,
                                e.getMessage());
                    }
                } else {
                    // Se nÃ£o encontrou padrÃ£o, mas estÃ¡ na seÃ§Ã£o da tabela e tem cÃ³digo de 3
                    // dÃ­gitos, tentar extrair manualmente
                    if (linhaTrimmed.matches("^\\d{3}.*")) {
                        log.debug("âš ï¸ Linha {} na seÃ§Ã£o da tabela mas nÃ£o correspondeu ao padrÃ£o: {}",
                                linhaIndex, linhaTrimmed);
                    }
                }
            }
        }

        if (tableRows.isEmpty() && inTableSection) {
            log.warn("âš ï¸ SeÃ§Ã£o da tabela detectada mas nenhuma linha foi extraÃ­da. Verifique o formato do PDF.");
        } else if (!inTableSection) {
            log.warn("âš ï¸ SeÃ§Ã£o da tabela nÃ£o foi detectada. Tentando busca alternativa...");
            // Tentar busca alternativa sem detectar seÃ§Ã£o
            tableRows = extractTableDetailsAlternative(linhas);
        }

        log.info("ðŸ“‹ ExtraÃ§Ã£o da tabela concluÃ­da: {} linha(s) extraÃ­da(s)", tableRows.size());
        return tableRows;
    }

    /**
     * MÃ©todo alternativo para extrair dados da tabela quando a seÃ§Ã£o nÃ£o foi
     * detectada
     * Procura por linhas que comeÃ§am com cÃ³digo de 3 dÃ­gitos em qualquer lugar
     * do texto
     */
    private List<com.z7design.fleet_manager.dto.PayslipTableRow> extractTableDetailsAlternative(String[] linhas) {
        List<com.z7design.fleet_manager.dto.PayslipTableRow> tableRows = new ArrayList<>();

        log.debug("ðŸ” Tentando extraÃ§Ã£o alternativa da tabela...");

        for (int i = 0; i < linhas.length; i++) {
            String linha = linhas[i].trim();

            // Procurar por linhas que comeÃ§am com cÃ³digo de 3 dÃ­gitos seguido de texto
            Pattern altPattern = Pattern.compile("^(\\d{3})\\s+(.+)$");
            Matcher matcher = altPattern.matcher(linha);

            if (matcher.find() && linha.length() > 10) {
                try {
                    String codigo = matcher.group(1);
                    String resto = matcher.group(2);

                    // Tentar extrair descriÃ§Ã£o e valores do resto
                    String[] partes = resto.split("\\s+");
                    if (partes.length >= 1) {
                        StringBuilder descricao = new StringBuilder();
                        String referencia = "";
                        String vencimentosStr = null;
                        String descontosStr = null;

                        int idx = 0;
                        // Primeiras palavras sÃ£o a descriÃ§Ã£o
                        while (idx < partes.length && !partes[idx].matches("^[\\d.,]+$")
                                && !partes[idx].contains("%")) {
                            if (descricao.length() > 0)
                                descricao.append(" ");
                            descricao.append(partes[idx]);
                            idx++;
                        }

                        // PrÃ³xima parte pode ser referÃªncia
                        if (idx < partes.length) {
                            referencia = partes[idx];
                            idx++;
                        }

                        // PrÃ³ximas partes podem ser vencimentos e descontos
                        if (idx < partes.length) {
                            vencimentosStr = partes[idx];
                            idx++;
                        }
                        if (idx < partes.length) {
                            descontosStr = partes[idx];
                        }

                        java.math.BigDecimal vencimentos = parseMonetaryValue(vencimentosStr);
                        java.math.BigDecimal descontos = parseMonetaryValue(descontosStr);

                        if (descricao.length() >= 3) {
                            com.z7design.fleet_manager.dto.PayslipTableRow row = com.z7design.fleet_manager.dto.PayslipTableRow
                                    .builder()
                                    .codigo(codigo)
                                    .descricao(descricao.toString())
                                    .referencia(referencia)
                                    .vencimentos(vencimentos)
                                    .descontos(descontos)
                                    .build();

                            tableRows.add(row);
                            log.debug("ðŸ“‹ Linha alternativa extraÃ­da: CÃ³d: {}, Desc: {}", codigo,
                                    descricao.toString());
                        }
                    }
                } catch (Exception e) {
                    log.debug("âš ï¸ Erro na extraÃ§Ã£o alternativa da linha {}: {}", i, e.getMessage());
                }
            }
        }

        return tableRows;
    }

    /**
     * Converte string monetÃ¡ria brasileira para BigDecimal
     * Ex: "1.649,12" -> 1649.12
     */
    private java.math.BigDecimal parseMonetaryValue(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }

        try {
            String cleaned = value.replace(".", "").replace(",", ".");
            return new java.math.BigDecimal(cleaned);
        } catch (Exception e) {
            log.debug("âš ï¸ Erro ao converter valor monetÃ¡rio: {}", value);
            return null;
        }
    }

    /**
     * Normaliza string para comparaÃ§Ã£o (remove espaÃ§os, converte para
     * maiÃºsculas, trata null)
     */
    private String normalizeString(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().toUpperCase().replaceAll("\\s+", " ");
    }

    /**
     * TASK 04: Organiza holerites por tipo de empresa (TerceirizaÃ§Ã£o vs
     * VigilÃ¢ncia e ADM)
     * Estrutura: Tipo â†’ Empresa â†’ Setor â†’ PerÃ­odo
     */
    public CompanyTypeOrganizationResponse organizePayslipsByCompanyType(List<Payslip> payslips) {
        CompanyTypeOrganizationResponse response = new CompanyTypeOrganizationResponse();
        response.setGeneratedAt(LocalDateTime.now());

        try {
            // Primeiro organizar por empresa (reutilizar mÃ©todo existente)
            PayslipOrganizationResponse companyOrganization = organizePayslipsByCompany(payslips);
            response.setTotalPayslips(companyOrganization.getTotalPayslips());
            response.setTotalCompanies(companyOrganization.getTotalCompanies());
            response.setTotalSectors(companyOrganization.getTotalSectors());

            // Separar empresas por tipo
            List<CompanyTypeOrganizationResponse.CompanyGroup> terceirizacaoCompanies = new ArrayList<>();
            List<CompanyTypeOrganizationResponse.CompanyGroup> vigilanciaCompanies = new ArrayList<>();
            List<CompanyTypeOrganizationResponse.CompanyGroup> administrativoCompanies = new ArrayList<>();

            Set<String> terceirizacaoSectorKeys = new HashSet<>();
            Set<String> vigilanciaSectorKeys = new HashSet<>();
            Set<String> administrativoSectorKeys = new HashSet<>();
            long terceirizacaoTotalPayslips = 0;
            long vigilanciaTotalPayslips = 0;
            long administrativoTotalPayslips = 0;

            for (PayslipOrganizationResponse.CompanyGroup company : companyOrganization.getCompanies()) {
                String sigla = company.getCompanySigla() != null ? company.getCompanySigla().toUpperCase() : "";

                // Determinar tipo de empresa: TERC = TerceirizaÃ§Ã£o, VIG = VigilÃ¢ncia, ADM =
                // Administrativo
                boolean isTerceirizacao = sigla.equals("TERC");
                boolean isVigilancia = sigla.equals("VIG");
                boolean isAdministrativo = sigla.equals("ADM") || sigla.isEmpty() || sigla.equals("OUTROS");

                // Converter para CompanyTypeOrganizationResponse.CompanyGroup
                CompanyTypeOrganizationResponse.CompanyGroup typeCompanyGroup = convertToCompanyTypeGroup(company);

                if (isTerceirizacao) {
                    terceirizacaoCompanies.add(typeCompanyGroup);
                    terceirizacaoTotalPayslips += company.getTotalPayslips();

                    // Contar setores Ãºnicos
                    if (company.getSectors() != null) {
                        for (PayslipOrganizationResponse.SectorGroup sector : company.getSectors()) {
                            terceirizacaoSectorKeys
                                    .add(company.getCompanySigla() + "|" + sector.getNormalizedSectorName());
                        }
                    }
                } else if (isVigilancia) {
                    // VIG = VigilÃ¢ncia
                    vigilanciaCompanies.add(typeCompanyGroup);
                    vigilanciaTotalPayslips += company.getTotalPayslips();

                    // Contar setores Ãºnicos
                    if (company.getSectors() != null) {
                        for (PayslipOrganizationResponse.SectorGroup sector : company.getSectors()) {
                            vigilanciaSectorKeys
                                    .add(company.getCompanySigla() + "|" + sector.getNormalizedSectorName());
                        }
                    }
                } else if (isAdministrativo) {
                    // ADM ou OUTROS = Administrativo
                    administrativoCompanies.add(typeCompanyGroup);
                    administrativoTotalPayslips += company.getTotalPayslips();

                    // Contar setores Ãºnicos
                    if (company.getSectors() != null) {
                        for (PayslipOrganizationResponse.SectorGroup sector : company.getSectors()) {
                            administrativoSectorKeys
                                    .add(company.getCompanySigla() + "|" + sector.getNormalizedSectorName());
                        }
                    }
                }
            }

            // Ordenar empresas por sigla e nome
            terceirizacaoCompanies.sort((a, b) -> {
                int siglaCompare = defaultString(a.getCompanySigla(), "")
                        .compareToIgnoreCase(defaultString(b.getCompanySigla(), ""));
                if (siglaCompare != 0)
                    return siglaCompare;
                return defaultString(a.getCompanyName(), "").compareToIgnoreCase(defaultString(b.getCompanyName(), ""));
            });

            vigilanciaCompanies.sort((a, b) -> {
                int siglaCompare = defaultString(a.getCompanySigla(), "")
                        .compareToIgnoreCase(defaultString(b.getCompanySigla(), ""));
                if (siglaCompare != 0)
                    return siglaCompare;
                return defaultString(a.getCompanyName(), "").compareToIgnoreCase(defaultString(b.getCompanyName(), ""));
            });

            administrativoCompanies.sort((a, b) -> {
                int siglaCompare = defaultString(a.getCompanySigla(), "")
                        .compareToIgnoreCase(defaultString(b.getCompanySigla(), ""));
                if (siglaCompare != 0)
                    return siglaCompare;
                return defaultString(a.getCompanyName(), "").compareToIgnoreCase(defaultString(b.getCompanyName(), ""));
            });

            // Criar grupos de tipo
            CompanyTypeOrganizationResponse.CompanyTypeGroup terceirizacaoGroup = new CompanyTypeOrganizationResponse.CompanyTypeGroup();
            terceirizacaoGroup.setTypeName("TerceirizaÃ§Ã£o");
            terceirizacaoGroup.setTypeCode("TERCEIRIZACAO");
            terceirizacaoGroup.setTotalCompanies(terceirizacaoCompanies.size());
            terceirizacaoGroup.setTotalPayslips(terceirizacaoTotalPayslips);
            terceirizacaoGroup.setTotalSectors(terceirizacaoSectorKeys.size());
            terceirizacaoGroup.setCompanies(terceirizacaoCompanies);

            CompanyTypeOrganizationResponse.CompanyTypeGroup vigilanciaGroup = new CompanyTypeOrganizationResponse.CompanyTypeGroup();
            vigilanciaGroup.setTypeName("VigilÃ¢ncia");
            vigilanciaGroup.setTypeCode("VIGILANCIA");
            vigilanciaGroup.setTotalCompanies(vigilanciaCompanies.size());
            vigilanciaGroup.setTotalPayslips(vigilanciaTotalPayslips);
            vigilanciaGroup.setTotalSectors(vigilanciaSectorKeys.size());
            vigilanciaGroup.setCompanies(vigilanciaCompanies);

            CompanyTypeOrganizationResponse.CompanyTypeGroup administrativoGroup = new CompanyTypeOrganizationResponse.CompanyTypeGroup();
            administrativoGroup.setTypeName("Administrativo");
            administrativoGroup.setTypeCode("ADMINISTRATIVO");
            administrativoGroup.setTotalCompanies(administrativoCompanies.size());
            administrativoGroup.setTotalPayslips(administrativoTotalPayslips);
            administrativoGroup.setTotalSectors(administrativoSectorKeys.size());
            administrativoGroup.setCompanies(administrativoCompanies);

            response.setTerceirizacao(terceirizacaoGroup);
            response.setVigilancia(vigilanciaGroup);
            response.setAdministrativo(administrativoGroup);

            log.info("ðŸ“Š OrganizaÃ§Ã£o por tipo concluÃ­da:");
            log.info("   TerceirizaÃ§Ã£o: {} empresa(s), {} setor(es), {} holerite(s)",
                    terceirizacaoGroup.getTotalCompanies(), terceirizacaoGroup.getTotalSectors(),
                    terceirizacaoGroup.getTotalPayslips());
            log.info("   VigilÃ¢ncia: {} empresa(s), {} setor(es), {} holerite(s)",
                    vigilanciaGroup.getTotalCompanies(), vigilanciaGroup.getTotalSectors(),
                    vigilanciaGroup.getTotalPayslips());
            log.info("   Administrativo: {} empresa(s), {} setor(es), {} holerite(s)",
                    administrativoGroup.getTotalCompanies(), administrativoGroup.getTotalSectors(),
                    administrativoGroup.getTotalPayslips());

            return response;
        } catch (Exception e) {
            log.error("Erro ao organizar holerites por tipo de empresa: {}", e.getMessage(), e);
            // Retornar resposta vazia em caso de erro
            CompanyTypeOrganizationResponse.CompanyTypeGroup emptyTerceirizacao = new CompanyTypeOrganizationResponse.CompanyTypeGroup();
            emptyTerceirizacao.setTypeName("TerceirizaÃ§Ã£o");
            emptyTerceirizacao.setTypeCode("TERCEIRIZACAO");
            emptyTerceirizacao.setTotalCompanies(0);
            emptyTerceirizacao.setTotalPayslips(0);
            emptyTerceirizacao.setTotalSectors(0);
            emptyTerceirizacao.setCompanies(Collections.emptyList());

            CompanyTypeOrganizationResponse.CompanyTypeGroup emptyVigilancia = new CompanyTypeOrganizationResponse.CompanyTypeGroup();
            emptyVigilancia.setTypeName("VigilÃ¢ncia");
            emptyVigilancia.setTypeCode("VIGILANCIA");
            emptyVigilancia.setTotalCompanies(0);
            emptyVigilancia.setTotalPayslips(0);
            emptyVigilancia.setTotalSectors(0);
            emptyVigilancia.setCompanies(Collections.emptyList());

            CompanyTypeOrganizationResponse.CompanyTypeGroup emptyAdministrativo = new CompanyTypeOrganizationResponse.CompanyTypeGroup();
            emptyAdministrativo.setTypeName("Administrativo");
            emptyAdministrativo.setTypeCode("ADMINISTRATIVO");
            emptyAdministrativo.setTotalCompanies(0);
            emptyAdministrativo.setTotalPayslips(0);
            emptyAdministrativo.setTotalSectors(0);
            emptyAdministrativo.setCompanies(Collections.emptyList());

            response.setTerceirizacao(emptyTerceirizacao);
            response.setVigilancia(emptyVigilancia);
            response.setAdministrativo(emptyAdministrativo);
            response.setTotalPayslips(0);
            response.setTotalCompanies(0);
            response.setTotalSectors(0);
            return response;
        }
    }

    /**
     * Converte PayslipOrganizationResponse.CompanyGroup para
     * CompanyTypeOrganizationResponse.CompanyGroup
     */
    private CompanyTypeOrganizationResponse.CompanyGroup convertToCompanyTypeGroup(
            PayslipOrganizationResponse.CompanyGroup company) {
        CompanyTypeOrganizationResponse.CompanyGroup typeGroup = new CompanyTypeOrganizationResponse.CompanyGroup();
        typeGroup.setCompanyId(company.getCompanyId());
        typeGroup.setCompanySigla(company.getCompanySigla());
        typeGroup.setCompanyName(company.getCompanyName());
        typeGroup.setCompanyCnpj(company.getCompanyCnpj());
        typeGroup.setTotalPayslips(company.getTotalPayslips());
        typeGroup.setTotalSectors(company.getSectors() != null ? company.getSectors().size() : 0);

        // Converter setores
        List<CompanyTypeOrganizationResponse.SectorGroup> typeSectors = new ArrayList<>();
        if (company.getSectors() != null) {
            for (PayslipOrganizationResponse.SectorGroup sector : company.getSectors()) {
                CompanyTypeOrganizationResponse.SectorGroup typeSector = new CompanyTypeOrganizationResponse.SectorGroup();
                typeSector.setSectorName(sector.getSectorName());
                typeSector.setNormalizedSectorName(sector.getNormalizedSectorName());
                typeSector.setTotalPayslips(sector.getTotalPayslips());

                // Converter perÃ­odos
                List<CompanyTypeOrganizationResponse.PeriodGroup> typePeriods = new ArrayList<>();
                if (sector.getPeriods() != null) {
                    for (PayslipOrganizationResponse.PeriodGroup period : sector.getPeriods()) {
                        CompanyTypeOrganizationResponse.PeriodGroup typePeriod = new CompanyTypeOrganizationResponse.PeriodGroup();
                        typePeriod.setMonth(period.getMonth());
                        typePeriod.setYear(period.getYear());
                        typePeriod.setFormattedPeriod(period.getFormattedPeriod());
                        typePeriod.setTotalPayslips(period.getTotalPayslips());

                        // Converter holerites
                        List<CompanyTypeOrganizationResponse.PayslipEntry> typeEntries = new ArrayList<>();
                        if (period.getPayslips() != null) {
                            for (PayslipOrganizationResponse.PayslipEntry entry : period.getPayslips()) {
                                CompanyTypeOrganizationResponse.PayslipEntry typeEntry = new CompanyTypeOrganizationResponse.PayslipEntry();
                                typeEntry.setId(entry.getId());
                                typeEntry.setEmployeeName(entry.getEmployeeName());
                                typeEntry.setCpf(entry.getCpf());
                                typeEntry.setMonth(entry.getMonth());
                                typeEntry.setYear(entry.getYear());
                                typeEntry.setFileName(entry.getFileName());
                                typeEntry.setCompanySigla(entry.getCompanySigla());
                                typeEntry.setCompanyName(entry.getCompanyName());
                                typeEntry.setCompanyCnpj(entry.getCompanyCnpj());
                                typeEntry.setSectorName(entry.getSectorName());
                                typeEntry.setWorkPostName(entry.getWorkPostName());
                                typeEntry.setProcessedAt(entry.getProcessedAt());
                                typeEntries.add(typeEntry);
                            }
                        }
                        typePeriod.setPayslips(typeEntries);
                        typePeriods.add(typePeriod);
                    }
                }
                typeSector.setPeriods(typePeriods);
                typeSectors.add(typeSector);
            }
        }
        typeGroup.setSectors(typeSectors);
        return typeGroup;
    }

    /**
     * Atualiza holerites existentes que nÃ£o tÃªm empresa ou setor, extraindo essas
     * informaÃ§Ãµes dos PDFs salvos
     */
    @Transactional
    public Map<String, Object> updateMissingCompanyAndSectorData() {
        Map<String, Object> result = new HashMap<>();
        int totalProcessed = 0;
        int updated = 0;
        int failed = 0;
        List<String> errors = new ArrayList<>();

        try {
            // Buscar todos os holerites que nÃ£o tÃªm empresa ou setor
            List<Payslip> payslips = payslipRepository.findAll();
            List<Payslip> payslipsToUpdate = payslips.stream()
                    .filter(p -> (p.getCompanyName() == null || p.getCompanyName().trim().isEmpty() ||
                            p.getCompanyCnpj() == null || p.getCompanyCnpj().trim().isEmpty() ||
                            p.getWorkPostName() == null || p.getWorkPostName().trim().isEmpty()) &&
                            p.getArquivoCaminho() != null && !p.getArquivoCaminho().trim().isEmpty())
                    .collect(Collectors.toList());

            log.info("ðŸ” Encontrados {} holerites para atualizar (de {} total)", payslipsToUpdate.size(),
                    payslips.size());

            for (Payslip payslip : payslipsToUpdate) {
                totalProcessed++;
                try {
                    // Extrair texto do PDF
                    String pdfText = extractTextFromPdf(payslip.getArquivoCaminho());
                    if (pdfText == null || pdfText.trim().isEmpty()) {
                        log.warn("âš ï¸ NÃ£o foi possÃ­vel extrair texto do PDF: {}", payslip.getArquivoCaminho());
                        failed++;
                        errors.add("Payslip " + payslip.getId() + ": NÃ£o foi possÃ­vel extrair texto do PDF");
                        continue;
                    }

                    boolean updatedFlag = false;

                    // Extrair empresa e setor do texto
                    if (payslip.getCompanyName() == null || payslip.getCompanyName().trim().isEmpty() ||
                            payslip.getCompanyCnpj() == null || payslip.getCompanyCnpj().trim().isEmpty()) {
                        String companyName = extractCompanyNameFromText(pdfText);
                        String companyCnpj = extractCompanyCnpjFromText(pdfText);

                        if (companyName != null && !companyName.trim().isEmpty()) {
                            payslip.setCompanyName(companyName);
                            updatedFlag = true;
                        }
                        if (companyCnpj != null && !companyCnpj.trim().isEmpty()) {
                            payslip.setCompanyCnpj(companyCnpj);
                            updatedFlag = true;
                            // Tentar enriquecer com dados da empresa
                            enrichCompanyData(payslip);
                        }
                    }

                    if (payslip.getWorkPostName() == null || payslip.getWorkPostName().trim().isEmpty()) {
                        String workPostName = extractSectorFromText(pdfText);
                        if (workPostName != null && !workPostName.trim().isEmpty()) {
                            payslip.setWorkPostName(workPostName);
                            updatedFlag = true;
                        }
                    }

                    if (updatedFlag) {
                        payslipRepository.save(payslip);
                        updated++;
                        log.info("âœ… Atualizado payslip {}: Empresa={}, CNPJ={}, Setor={}",
                                payslip.getId(), payslip.getCompanyName(), payslip.getCompanyCnpj(),
                                payslip.getWorkPostName());
                    }

                } catch (Exception e) {
                    log.error("âŒ Erro ao atualizar payslip {}: {}", payslip.getId(), e.getMessage(), e);
                    failed++;
                    errors.add("Payslip " + payslip.getId() + ": " + e.getMessage());
                }
            }

            result.put("totalProcessed", totalProcessed);
            result.put("updated", updated);
            result.put("failed", failed);
            result.put("errors", errors);
            result.put("success", true);

            log.info("âœ… AtualizaÃ§Ã£o concluÃ­da: {} processados, {} atualizados, {} falharam",
                    totalProcessed, updated, failed);

        } catch (Exception e) {
            log.error("âŒ Erro ao atualizar holerites: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }

        return result;
    }

    private String extractTextFromPdf(String filePath) {
        try {
            java.io.File pdfFile = new java.io.File(filePath);
            if (!pdfFile.exists()) {
                log.warn("âš ï¸ Arquivo nÃ£o encontrado: {}", filePath);
                return null;
            }

            try (org.apache.pdfbox.pdmodel.PDDocument document = org.apache.pdfbox.pdmodel.PDDocument.load(pdfFile)) {
                org.apache.pdfbox.text.PDFTextStripper stripper = new org.apache.pdfbox.text.PDFTextStripper();
                stripper.setStartPage(1);
                stripper.setEndPage(Math.min(2, document.getNumberOfPages())); // Primeiras 2 pÃ¡ginas
                return stripper.getText(document);
            }
        } catch (Exception e) {
            log.error("âŒ Erro ao extrair texto do PDF {}: {}", filePath, e.getMessage(), e);
            return null;
        }
    }

    private String extractCompanyNameFromText(String text) {
        if (text == null || text.trim().isEmpty()) {
            return null;
        }

        String[] linhas = text.split("\r?\n");

        // PadrÃ£o 1: Procurar por CNPJ e pegar nome da mesma linha ou linha anterior
        Pattern cnpjPattern = Pattern.compile(
                "CNPJ[:\\s]*([0-9]{2}\\.?[0-9]{3}\\.?[0-9]{3}/?[0-9]{4}-?[0-9]{2}|[0-9]{14})",
                Pattern.CASE_INSENSITIVE);
        for (int i = 0; i < linhas.length; i++) {
            String linha = linhas[i].trim();
            Matcher cnpjMatcher = cnpjPattern.matcher(linha);
            if (cnpjMatcher.find()) {
                int cnpjIndex = linha.toUpperCase().indexOf("CNPJ");
                if (cnpjIndex > 10) {
                    String possibleName = linha.substring(0, cnpjIndex).trim();
                    possibleName = possibleName.replaceAll("(?i)(EMPRESA|RAZÃƒO SOCIAL|EMPREGADOR)[:\\s]*", "").trim();
                    if (possibleName.length() > 5 && !possibleName.matches(".*\\d{3}.*")) {
                        return possibleName.toUpperCase();
                    }
                }

                if (i > 0) {
                    String linhaAnterior = linhas[i - 1].trim();
                    if (linhaAnterior.length() > 5 && !linhaAnterior.matches(".*\\d{3}.*") &&
                            !linhaAnterior.toUpperCase().contains("FOLHA") &&
                            !linhaAnterior.toUpperCase().contains("PAGAMENTO") &&
                            !linhaAnterior.toUpperCase().contains("HOLERITE")) {
                        return linhaAnterior.toUpperCase();
                    }
                }
            }
        }

        // PadrÃ£o 2: Procurar por linhas com "LTDA", "S.A", "ME", etc.
        for (String linha : linhas) {
            String linhaUpper = linha.toUpperCase();
            if ((linhaUpper.contains("LTDA") || linhaUpper.contains("S.A") ||
                    linhaUpper.contains(" ME ") || linhaUpper.contains("EIRELI")) &&
                    !linhaUpper.contains("FUNCIONARIO") && !linhaUpper.contains("CPF") &&
                    linha.length() > 10 && linha.length() < 150) {
                return linha.trim().toUpperCase();
            }
        }

        // PadrÃ£o 3: CÃ³digo + Nome + CNPJ na mesma linha
        Pattern empresaPattern = Pattern.compile("^(\\d{4})\\s+(.+?)\\s+(\\d{14})$");
        for (String linha : linhas) {
            Matcher matcher = empresaPattern.matcher(linha);
            if (matcher.find()) {
                String nome = matcher.group(2).trim();
                if (nome.length() > 5) {
                    return nome.toUpperCase();
                }
            }
        }

        return null;
    }

    private String extractCompanyCnpjFromText(String text) {
        if (text == null || text.trim().isEmpty()) {
            return null;
        }

        Pattern cnpjPattern = Pattern.compile(
                "CNPJ[:\\s]*([0-9]{2}\\.?[0-9]{3}\\.?[0-9]{3}/?[0-9]{4}-?[0-9]{2}|[0-9]{14})",
                Pattern.CASE_INSENSITIVE);
        Matcher matcher = cnpjPattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(1).replaceAll("[^0-9]", "");
        }

        Pattern fallbackPattern = Pattern.compile("(?<!\\d)(\\d{14})(?!\\d)");
        matcher = fallbackPattern.matcher(text.replaceAll("\\s+", ""));
        if (matcher.find()) {
            return matcher.group(1);
        }

        return null;
    }

    private String extractSectorFromText(String text) {
        if (text == null || text.trim().isEmpty()) {
            return null;
        }

        String[] linhas = text.split("\r?\n");

        // PadrÃ£o 1: Procurar por "Setor:", "Cargo:", "Local:", "Posto de Trabalho:"
        Pattern sectorPattern = Pattern.compile("(?i)(?:setor|cargo|local|posto\\s+de\\s+trabalho)[:\\s]+(.+)");
        for (String linha : linhas) {
            Matcher matcher = sectorPattern.matcher(linha);
            if (matcher.find()) {
                String setor = matcher.group(1).trim();
                if (setor.length() > 2 && setor.length() < 100) {
                    return setor.toUpperCase();
                }
            }
        }

        // PadrÃ£o 2: Procurar setor na linha do perÃ­odo
        Pattern periodoSetorPattern = Pattern.compile("(\\d{2}/\\d{2}/\\d{4})\\s+a\\s+(\\d{2}/\\d{2}/\\d{4})\\s+(.+)");
        for (String linha : linhas) {
            Matcher matcher = periodoSetorPattern.matcher(linha);
            if (matcher.find()) {
                String setor = matcher.group(3).trim();
                setor = setor.replaceAll("\\s+\\d{2}/\\d{4}$", "").trim();
                if (setor.length() > 2 && setor.length() < 100 && !setor.matches(".*\\d{4}.*")) {
                    return setor.toUpperCase();
                }
            }
        }

        return null;
    }
}
