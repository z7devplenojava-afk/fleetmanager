package br.com.fleetmanager.service;

import br.com.fleetmanager.model.Payslip;
import br.com.fleetmanager.repository.PayslipRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.sourceforge.tess4j.TesseractException;
import org.apache.pdfbox.pdmodel.PDDocument;
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
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.Set;

import br.com.fleetmanager.model.Employee;
import br.com.fleetmanager.repository.EmployeeRepository;
import br.com.fleetmanager.service.UserService;
import br.com.fleetmanager.model.User;
import br.com.fleetmanager.model.enums.UserStatus;
import br.com.fleetmanager.model.Role;
import java.util.HashSet;
import br.com.fleetmanager.validation.CpfValidator;
import java.util.UUID;
import br.com.fleetmanager.exception.DuplicatePayslipException;
import br.com.fleetmanager.repository.RoleRepository;
import br.com.fleetmanager.repository.UserRepository;
import br.com.fleetmanager.service.TesseractService;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayslipService {

    private final PayslipRepository payslipRepository;
    private final TesseractService tesseractService;
    private final ExtractDataHoleritesService extractDataHoleritesService;
    private final EmployeeRepository employeeRepository;
    private final UserService userService;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private static final String OUTPUT_DIR = "backend/holerites";

    public List<Payslip> processPayslipPDF(MultipartFile file) throws IOException {
        log.info("Iniciando processamento do arquivo: {}", file.getOriginalFilename());
        
        if (file.isEmpty()) {
            throw new IllegalArgumentException("O arquivo está vazio");
        }

        if (!file.getContentType().equals("application/pdf")) {
            throw new IllegalArgumentException("O arquivo deve ser um PDF");
        }

        List<Payslip> processedPayslips = new ArrayList<>();
        
        // Create output directory if it doesn't exist
        Path outputPath = Paths.get(OUTPUT_DIR);
        if (!Files.exists(outputPath)) {
            Files.createDirectories(outputPath);
        }

        try (PDDocument document = PDDocument.load(file.getInputStream())) {
            if (document.isEncrypted()) {
                throw new IllegalArgumentException("O PDF está criptografado");
            }

            PDFTextStripper stripper = new PDFTextStripper();
            int pageCount = document.getNumberOfPages();
            log.info("PDF contém {} páginas", pageCount);

            for (int i = 1; i <= pageCount; i++) {
                log.info("=== Processando página {} ===", i);
                stripper.setStartPage(i);
                stripper.setEndPage(i);
                String pageText = stripper.getText(document);
                
                // Log do texto extraído para debug
                log.debug("Texto extraído da página {}: {}", i, pageText.substring(0, Math.min(500, pageText.length())));

                try {
                    // Try to extract information using PDFBox first
                    Payslip payslip = extractPayslipInfo(pageText, i);
                    
                    // If extraction failed, try OCR
                    if (payslip == null || payslip.getEmployeeName().equals("Desconhecido")) {
                        log.info("Extração via PDFBox falhou, tentando OCR para página {}", i);
                        payslip = extractPayslipInfoWithOCR(document, i);
                    }

                    if (payslip != null && !payslip.getEmployeeName().equals("Desconhecido") && payslip.getCpf() != null) {
                        // Evitar duplicidade de holerite para o mesmo CPF, mês e ano
                        try {
                            if (payslipRepository.existsByCpfAndMonthAndYearCustom(payslip.getCpf(), payslip.getMonth(), payslip.getYear())) {
                                String msg = String.format("Já existe holerite para CPF %s, mês %d, ano %d. Pulando página %d.", payslip.getCpf(), payslip.getMonth(), payslip.getYear(), i);
                                log.warn(msg);
                                continue; // Pular para próxima página ao invés de falhar
                            }
                        } catch (Exception e) {
                            log.warn("⚠️ Erro ao verificar duplicidade, continuando processamento: {}", e.getMessage());
                        }
                        // Organizar em pastas e salvar PDF individual
                        String caminhoPdf = organizarEmPastas(document, i, payslip);
                        
                        // Salvar ou atualizar funcionário no banco
                        salvarFuncionario(payslip, caminhoPdf);
                        
                        // Salvar dados extraídos na tabela tb_extract_data_holerites
                        salvarDadosExtraidos(payslip);
                        
                        // Save to payslip database - usar apenas o nome do arquivo
                        String nomeArquivo = Paths.get(caminhoPdf).getFileName().toString();
                        payslip.setFileName(nomeArquivo);
                        payslip = payslipRepository.save(payslip);
                        processedPayslips.add(payslip);

                        // === CRIAÇÃO AUTOMÁTICA DE USUÁRIO ===
                        try {
                            createUserFromPayslip(payslip);
                        } catch (Exception userException) {
                            log.warn("⚠️ Erro ao criar usuário automático para {}: {}", payslip.getEmployeeName(), userException.getMessage());
                            // Não interromper processamento por erro na criação de usuário
                        }

                        log.info("✅ Página {} processada com sucesso: {}", i, payslip.getEmployeeName());
                    } else {
                        log.warn("⚠️ Não foi possível extrair informações válidas da página {}", i);
                        log.debug("Dados extraídos da página {}: Nome={}, CPF={}", i, 
                                 payslip != null ? payslip.getEmployeeName() : "null", 
                                 payslip != null ? payslip.getCpf() : "null");
                    }
                } catch (Exception pageException) {
                    log.error("❌ Erro ao processar página {}: {}", i, pageException.getMessage());
                    log.debug("Stack trace da página {}: ", i, pageException);
                    // Continuar processando próximas páginas
                    continue;
                }
            }
        }

        log.info("🎉 Processamento concluído. {} holerites processados com sucesso", processedPayslips.size());
        return processedPayslips;
    }

    private Payslip extractPayslipInfo(String text, int pageNumber) {
        return extractPayslipInfo(text, pageNumber, null);
    }

    // Nova versão principal com suporte a ocrText
    private Payslip extractPayslipInfo(String text, int pageNumber, String ocrText) {
        log.info("Tentando extrair informações da página {} via PDFBox", pageNumber);

        // Log do texto para debug (primeiros 1000 caracteres)
        log.debug("Texto extraído da página {}: {}", pageNumber, 
                 text.length() > 1000 ? text.substring(0, 1000) + "..." : text);

        // Dividir o texto em linhas para facilitar a busca
        String[] linhas = text.split("\r?\n");
        String nome = "Desconhecido";
        String cpf = null;
        String codigo = null;
        String mes = null;
        String ano = null;

        // 1. EXTRAÇÃO DE CPF PRIMEIRO (mais confiável)
        Pattern cpfPattern = Pattern.compile("CPF[:\\s]*([0-9]{3}\\.?[0-9]{3}\\.?[0-9]{3}-?[0-9]{2})");
        for (String linha : linhas) {
            Matcher cpfMatcher = cpfPattern.matcher(linha);
            if (cpfMatcher.find()) {
                cpf = cpfMatcher.group(1).replaceAll("[^0-9]", "");
                log.info("✅ CPF encontrado: {} na linha: {}", cpf, linha.trim());
                
                // Na linha do CPF, tentar extrair código e nome
                String linhaCpf = linha.trim();
                
                // Padrão 1: CODIGO NOME CPF (ex: 000044 ELAINE APARECIDA SOARES PEREIRA CPF: 073.495.276-75)
                Pattern linhaCompleta1 = Pattern.compile("(\\d{6})\\s+(.+?)\\s+CPF");
                Matcher lineMatch1 = linhaCompleta1.matcher(linhaCpf);
                if (lineMatch1.find()) {
                    codigo = lineMatch1.group(1).trim();
                    String nomeCandidate = lineMatch1.group(2).trim();
                    if (isValidEmployeeName(nomeCandidate)) {
                        nome = nomeCandidate;
                        log.info("✅ Padrão 1 - Código: {}, Nome: {}", codigo, nome);
                        break;
                    }
                }
                
                // Padrão 2: NOME CPF (sem código no início)
                Pattern linhaCompleta2 = Pattern.compile("([A-ZÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ ]{5,})\\s+CPF");
                Matcher lineMatch2 = linhaCompleta2.matcher(linhaCpf);
                if (lineMatch2.find()) {
                    String nomeCandidate = lineMatch2.group(1).trim();
                    if (isValidEmployeeName(nomeCandidate)) {
                        nome = nomeCandidate;
                        log.info("✅ Padrão 2 - Nome: {} (sem código)", nome);
                        break;
                    }
                }
                break;
            }
        }

        // 2. Se não encontrou nome na linha do CPF, procurar em linhas próximas
        if (nome.equals("Desconhecido") && cpf != null) {
            log.info("Procurando nome em linhas adjacentes ao CPF...");
            
            for (int i = 0; i < linhas.length; i++) {
                if (linhas[i].contains("CPF")) {
                    // Verificar linhas anteriores e posteriores (-3 a +3)
                    for (int j = Math.max(0, i-3); j <= Math.min(linhas.length-1, i+3); j++) {
                        String linhaCandidata = linhas[j].trim();
                        
                        // Pular linhas que claramente não são nomes
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
                        
                        // Extrair possível código + nome
                        Pattern codigoNome = Pattern.compile("(\\d{6})\\s+(.+)");
                        Matcher matchCodigoNome = codigoNome.matcher(linhaCandidata);
                        if (matchCodigoNome.find()) {
                            String possibleCodigo = matchCodigoNome.group(1);
                            String possibleNome = matchCodigoNome.group(2).trim();
                            if (isValidEmployeeName(possibleNome)) {
                                codigo = possibleCodigo;
                                nome = possibleNome;
                                log.info("✅ Nome encontrado com código: {} - {}", codigo, nome);
                                break;
                            }
                        }
                        
                        // Ou apenas nome (sem código)
                        if (isValidEmployeeName(linhaCandidata)) {
                            nome = linhaCandidata;
                            log.info("✅ Nome encontrado: {}", nome);
                            break;
                        }
                    }
                    break;
                }
            }
        }

        // 3. EXTRAÇÃO DO PERÍODO DE REFERÊNCIA - múltiplos padrões
        log.info("🔍 Procurando período de referência no holerite...");
        
        // Padrão 1: "DD/MM/AAAA a DD/MM/AAAA" (período completo)
        Pattern periodoPattern1 = Pattern.compile("(\\d{2})/(\\d{2})/(\\d{4})\\s+a\\s+(\\d{2})/(\\d{2})/(\\d{4})");
        for (String linha : linhas) {
            Matcher periodoMatcher = periodoPattern1.matcher(linha);
            if (periodoMatcher.find()) {
                mes = periodoMatcher.group(5); // mês da data final (período de referência)
                ano = periodoMatcher.group(6); // ano da data final (período de referência)
                log.info("✅ Período de referência encontrado (padrão 1): {}/{} - Linha: {}", mes, ano, linha.trim());
                break;
            }
        }

        // Padrão 2: "DD/MM/AAAA a DD/MM/AAAA" com espaços diferentes
        if (mes == null || ano == null) {
            Pattern periodoPattern1b = Pattern.compile("(\\d{2})/(\\d{2})/(\\d{4})\\s+à\\s+(\\d{2})/(\\d{2})/(\\d{4})");
            for (String linha : linhas) {
                Matcher periodoMatcher = periodoPattern1b.matcher(linha);
                if (periodoMatcher.find()) {
                    mes = periodoMatcher.group(5);
                    ano = periodoMatcher.group(6);
                    log.info("✅ Período de referência encontrado (padrão 1b): {}/{} - Linha: {}", mes, ano, linha.trim());
                    break;
                }
            }
        }

        // Padrão 3: "MM/AAAA" direto
        if (mes == null || ano == null) {
            Pattern periodoPattern2 = Pattern.compile("(\\d{2})/(\\d{4})");
            for (String linha : linhas) {
                Matcher periodoMatcher = periodoPattern2.matcher(linha);
                if (periodoMatcher.find()) {
                    mes = periodoMatcher.group(1);
                    ano = periodoMatcher.group(2);
                    log.info("✅ Período de referência encontrado (padrão 2): {}/{} - Linha: {}", mes, ano, linha.trim());
                    break;
                }
            }
        }

        // Padrão 4: "DD/MM/AAAA" (data única - usar o mês/ano dessa data)
        if (mes == null || ano == null) {
            Pattern periodoPattern3 = Pattern.compile("(\\d{2})/(\\d{2})/(\\d{4})");
            for (String linha : linhas) {
                Matcher periodoMatcher = periodoPattern3.matcher(linha);
                if (periodoMatcher.find()) {
                    mes = periodoMatcher.group(2);
                    ano = periodoMatcher.group(3);
                    log.info("✅ Período de referência encontrado (padrão 3): {}/{} - Linha: {}", mes, ano, linha.trim());
                    break;
                }
            }
        }

        // Padrão 5: Nomes de meses em português via OCR
        if ((mes == null || ano == null) && ocrText != null) {
            log.info("🔍 Tentando extrair período via OCR...");
            String[] meses = {"JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", 
                             "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"};
            for (int i = 0; i < meses.length; i++) {
                if (ocrText.toUpperCase().contains(meses[i])) {
                    mes = String.format("%02d", i + 1);
                    // Procurar ano próximo (2020-2030)
                    Pattern anoPattern = Pattern.compile("(20[2-3][0-9])");
                    Matcher anoMatcher = anoPattern.matcher(ocrText);
                    if (anoMatcher.find()) {
                        ano = anoMatcher.group(1);
                        log.info("✅ Período de referência encontrado via OCR: {}/{} ({})", mes, ano, meses[i]);
                        break;
                    }
                }
            }
        }

        // Padrão 6: Buscar por "PERÍODO" ou "REFERÊNCIA" no texto
        if ((mes == null || ano == null)) {
            log.info("🔍 Procurando por palavras-chave de período...");
            for (String linha : linhas) {
                String linhaUpper = linha.toUpperCase();
                if (linhaUpper.contains("PERÍODO") || linhaUpper.contains("REFERÊNCIA") || 
                    linhaUpper.contains("COMPETÊNCIA") || linhaUpper.contains("MÊS")) {
                    
                    // Tentar extrair data dessa linha
                    Pattern dataPattern = Pattern.compile("(\\d{2})/(\\d{2})/(\\d{4})");
                    Matcher dataMatcher = dataPattern.matcher(linha);
                    if (dataMatcher.find()) {
                        mes = dataMatcher.group(2);
                        ano = dataMatcher.group(3);
                        log.info("✅ Período de referência encontrado por palavra-chave: {}/{} - Linha: {}", mes, ano, linha.trim());
                        break;
                    }
                }
            }
        }

        // 4. VALIDAÇÕES FINAIS
        if (cpf == null || cpf.length() != 11) {
            log.warn("❌ CPF inválido ou não encontrado - Página: {}, CPF extraído: {}", pageNumber, cpf);
            return null;
        }
        
        if (nome.equals("Desconhecido") || nome.trim().isEmpty()) {
            log.warn("❌ Nome não encontrado - Página: {}", pageNumber);
            return null;
        }
        
        if (mes == null || ano == null) {
            log.warn("❌ Mês/ano de referência não encontrados - Página: {}", pageNumber);
            return null;
        }

        // Validar se o mês está entre 1 e 12
        try {
            int mesInt = Integer.parseInt(mes);
            int anoInt = Integer.parseInt(ano);
            
            if (mesInt < 1 || mesInt > 12) {
                log.warn("❌ Mês inválido: {} - Página: {}", mes, pageNumber);
                return null;
            }
            
            if (anoInt < 2020 || anoInt > 2030) {
                log.warn("❌ Ano inválido: {} - Página: {}", ano, pageNumber);
                return null;
            }
            
            log.info("✅ Dados extraídos com sucesso - Página: {}, Código: {}, Nome: {}, CPF: {}, Período de Referência: {}/{}", 
                    pageNumber, codigo, nome, cpf, mes, ano);

            return Payslip.builder()
                    .employeeName(nome)
                    .cpf(cpf)
                    .month(mesInt)
                    .year(anoInt)
                    .build();
                    
        } catch (NumberFormatException e) {
            log.warn("❌ Erro ao converter mês/ano para número - Mês: {}, Ano: {}, Página: {}", mes, ano, pageNumber);
            return null;
        }
    }

    private boolean isValidEmployeeName(String name) {
        if (name == null || name.trim().isEmpty() || name.length() < 5) {
            return false;
        }
        
        String nameUpper = name.toUpperCase().trim();
        
        // Filtrar títulos e cargos
        String[] invalidNames = {
            "FOLHA", "PAGAMENTO", "DEMONSTRATIVO", "HOLERITE", "CONTRACHEQUE",
            "PORTEIRO", "CONTROLADOR", "VIGIA", "AUXILIAR", "SERVICOS", "SEGURANCA",
            "EMPRESA", "LTDA", "ME", "EIRELI", "S.A", "CNPJ", "ENDERECO", "TELEFONE",
            "PERIODO", "REFERENCIA", "FUNCIONARIO", "COLABORADOR", "SALARIO"
        };
        
        for (String invalid : invalidNames) {
            if (nameUpper.contains(invalid)) {
                return false;
            }
        }
        
        // Deve conter apenas letras, espaços e acentos
        return nameUpper.matches("^[A-ZÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ ]+$");
    }

    /**
     * Gerar email único para cada funcionário baseado no CPF
     */
    private String generateUniqueEmail(String cpf, String nome) {
        // Formato principal: colaborador.CPF@promovervigilancia.com.br
        String baseEmail = String.format("colaborador.%s@promovervigilancia.com.br", cpf);
        
        // Verificar se já existe
        if (!userRepository.findByEmail(baseEmail).isPresent()) {
            return baseEmail;
        }
        
        // Se já existe, gerar alternativo com timestamp
        String timestamp = String.valueOf(System.currentTimeMillis()).substring(8); // últimos 5 dígitos
        String alternativeEmail = String.format("colaborador.%s.%s@promovervigilancia.com.br", cpf, timestamp);
        
        log.warn("⚠️ Email {} já existe, usando alternativo: {}", baseEmail, alternativeEmail);
        return alternativeEmail;
    }

    /**
     * Criar usuário automaticamente a partir dos dados do holerite
     */
    private void createUserFromPayslip(Payslip payslip) {
        String username = payslip.getCpf();
        String email = generateUniqueEmail(payslip.getCpf(), payslip.getEmployeeName());
        String password = "Colaboradores@2025"; // Ajustado para passar na validação (maiúscula obrigatória)
        String name = payslip.getEmployeeName();

        log.info("🔐 INÍCIO - Verificando se usuário existe para funcionário: {} (CPF: {})", name, username);

        try {
            // VERIFICAÇÃO DO AMBIENTE
            log.info("🔧 VERIFICAÇÃO DE AMBIENTE:");
            log.info("   UserRepository: {}", userRepository.getClass().getSimpleName());
            log.info("   RoleRepository: {}", roleRepository.getClass().getSimpleName());
            
            // Verificar se já existe usuário com este CPF (username)
            Optional<br.com.fleetmanager.model.User> existingUser = userRepository.findByUsername(username);
            if (existingUser.isPresent()) {
                log.info("👤 Usuário já existe para CPF: {} - PULANDO criação", username);
                return;
            }
            
            log.info("🆕 Usuário não existe - PROSSEGUINDO com criação para CPF: {}", username);

            // Buscar role COLABORADOR
            log.info("🔍 Buscando role COLABORADOR no banco de dados...");
            Optional<br.com.fleetmanager.model.Role> colaboradorRole = roleRepository.findByName("COLABORADOR");
            if (colaboradorRole.isEmpty()) {
                log.error("❌ Role COLABORADOR não encontrado no banco de dados!");
                log.error("   Para criar o role COLABORADOR, execute:");
                log.error("   INSERT INTO roles (id, name, description) VALUES (gen_random_uuid(), 'COLABORADOR', 'Funcionário colaborador');");
                throw new IllegalArgumentException("Role COLABORADOR não encontrado. Consulte os logs para instruções de criação.");
            }
            
            log.info("✅ Role COLABORADOR encontrado: {}", colaboradorRole.get().getName());

            // Criar novo usuário
            log.info("👤 Criando novo usuário com dados:");
            log.info("   Username: {}", username);
            log.info("   Email: {}", email);
            log.info("   Nome: {}", name);
            log.info("   Password: {} (será criptografada)", password);
            
            br.com.fleetmanager.model.User novoUser = new br.com.fleetmanager.model.User();
            novoUser.setUsername(username);
            novoUser.setPassword(password);
            novoUser.setEmail(email);
            novoUser.setName(name);
            novoUser.setStatus(br.com.fleetmanager.model.enums.UserStatus.ACTIVE);
            novoUser.setActive(true);

            // Associar role COLABORADOR
            java.util.Set<br.com.fleetmanager.model.Role> roles = new java.util.HashSet<>();
            roles.add(colaboradorRole.get());
            novoUser.setRoles(roles);
            
            log.info("🔐 Chamando userService.create()...");

            // Usar o UserService para criar (aplica validações e criptografia)
            br.com.fleetmanager.model.User usuarioCriado = userService.create(novoUser);
            
            log.info("✅ SUCESSO - Usuário criado automaticamente!");
            log.info("   ID: {}", usuarioCriado.getId());
            log.info("   Username: {}", usuarioCriado.getUsername());
            log.info("   Nome: {}", usuarioCriado.getName());
            log.info("   Email: {}", usuarioCriado.getEmail());
            log.info("   Status: {}", usuarioCriado.getStatus());
            log.info("   Roles: {}", usuarioCriado.getRoles().stream().map(r -> r.getName()).toList());
            
            // VERIFICAÇÃO ADICIONAL - Confirmar se foi salvo no banco
            log.info("🔍 VERIFICAÇÃO - Buscando usuário recém-criado no banco...");
            Optional<br.com.fleetmanager.model.User> verificacao = userRepository.findByUsername(username);
            if (verificacao.isPresent()) {
                log.info("✅ CONFIRMADO - Usuário encontrado no banco de dados!");
                log.info("   ID no banco: {}", verificacao.get().getId());
                log.info("   Nome no banco: {}", verificacao.get().getName());
            } else {
                log.error("❌ PROBLEMA - Usuário NÃO foi encontrado no banco após criação!");
                log.error("   Possível problema de transação ou commit!");
            }
            
        } catch (Exception e) {
            log.error("❌ ERRO DETALHADO ao criar usuário para {}: {}", name, e.getMessage());
            log.error("   Tipo do erro: {}", e.getClass().getSimpleName());
            log.error("   Stack trace completo: ", e);
            throw e;
        }
    }

    private Payslip extractPayslipInfoWithOCR(PDDocument document, int pageNumber) {
        log.info("Tentando extrair informações da página {} via OCR", pageNumber);
        try {
            File imageFile = convertPdfPageToImage(document, pageNumber);
            String text = tesseractService.extractTextFromImage(imageFile);
            
            log.debug("Texto extraído via OCR da página {}: {}", pageNumber, text.substring(0, Math.min(500, text.length())));
            
            // Limpar o arquivo temporário
            imageFile.delete();
            
            // Passar o texto OCR como parâmetro para tentar extrair o período se necessário
            return extractPayslipInfo(text, pageNumber, text);
        } catch (TesseractException | IOException e) {
            log.error("❌ Falha no processamento OCR da página {}: {}", pageNumber, e.getMessage());
            return null;
        }
    }

    private File convertPdfPageToImage(PDDocument document, int pageNumber) throws IOException {
        PDFRenderer pdfRenderer = new PDFRenderer(document);
        BufferedImage image = pdfRenderer.renderImageWithDPI(pageNumber - 1, 300); // 300 DPI para melhor qualidade
        
        File tempFile = File.createTempFile("page_" + pageNumber, ".png");
        ImageIO.write(image, "png", tempFile);
        
        log.debug("Página {} convertida para imagem: {}", pageNumber, tempFile.getAbsolutePath());
        return tempFile;
    }

    private String generateFileName(Payslip payslip) {
        // Tentar extrair código do texto original do PDF se disponível
        String codigo = null;
        
        // Se o CPF for na verdade um código, usar ele
        if (payslip.getCpf().startsWith("COD")) {
            codigo = payslip.getCpf().substring(3);
        } else {
            // Tentar encontrar um código padrão de 6 dígitos
            // Isso será implementado quando tivermos o código disponível
            codigo = ""; // Por enquanto vazio
        }
        
        // Gerar nome do arquivo: NOME_FUNCIONARIO_CODIGO_CPF_MES_ANO.pdf
        StringBuilder fileName = new StringBuilder();
        
        // Nome do funcionário (limpar e substituir espaços)
        String nomeArquivo = payslip.getEmployeeName()
                .replaceAll("[^A-Za-z0-9\\s]", "") // Remove caracteres especiais
                .replaceAll("\\s+", "_") // Substitui espaços por underscore
                .toUpperCase();
        
        fileName.append(nomeArquivo);
        
        // Adicionar código se disponível
        if (codigo != null && !codigo.isEmpty()) {
            fileName.append("_").append(codigo);
        }
        
        // Adicionar CPF
        fileName.append("_").append(payslip.getCpf());
        
        // Adicionar período
        fileName.append("_").append(payslip.getMonth());
        fileName.append("_").append(payslip.getYear());
        
        // Extensão
        fileName.append(".pdf");
        
        return fileName.toString();
    }

    private String organizarEmPastas(PDDocument document, int pageNumber, Payslip payslip) throws IOException {
        // Criar estrutura de pastas: /holerites/MM-YYYY/
        String mesAno = String.format("%s-%s", payslip.getMonth(), payslip.getYear());
        Path pastaMesAno = Paths.get(OUTPUT_DIR, mesAno);
        // Criar diretório se não existir
        if (!Files.exists(pastaMesAno)) {
            Files.createDirectories(pastaMesAno);
        }
        // Salvar PDF individual com nome formatado
        String nomeArquivo = generateFileName(payslip);
        Path caminhoCompleto = pastaMesAno.resolve(nomeArquivo);
        try (PDDocument newDoc = new PDDocument()) {
            newDoc.addPage(document.getPage(pageNumber - 1));
            newDoc.save(caminhoCompleto.toString());
            log.info("📄 PDF individual salvo: {}", caminhoCompleto);
        }
        return caminhoCompleto.toString();
    }
    
    private void salvarFuncionario(Payslip payslip, String caminhoPdf) {
        try {
            // Verificar se já existe funcionário com este CPF/documento
            Optional<Employee> employeeExistente = employeeRepository.findByDocument(payslip.getCpf());
            if (employeeExistente.isPresent()) {
                // Atualizar funcionário existente
                Employee employee = employeeExistente.get();
                // employee.setCaminhoPdf(caminhoPdf); // Campo comentado temporariamente
                // employee.setMesReferencia(String.valueOf(payslip.getMonth())); // Campo comentado temporariamente
                // employee.setAnoReferencia(String.valueOf(payslip.getYear())); // Campo comentado temporariamente
                employee.setUpdatedAt(LocalDateTime.now());
                employeeRepository.save(employee);
                log.info("🔄 Funcionário atualizado: {} - CPF: {}", employee.getName(), employee.getDocument());
            } else {
                // Para funcionários criados via processamento de holerites, 
                // vamos apenas registrar na tabela de dados extraídos
                // e não criar um Employee completo pois faltam dados obrigatórios
                log.info("📋 Funcionário não existe na base. Dados salvos apenas na tabela de dados extraídos.");
                log.info("   Para criar funcionário completo, use o formulário de cadastro de funcionários.");
                log.info("   Nome extraído: {} - CPF: {}", payslip.getEmployeeName(), payslip.getCpf());
            }
        } catch (Exception e) {
            log.error("❌ Erro ao processar funcionário: {}", e.getMessage());
            // Não interromper o processamento por erro na tabela de funcionários
        }
    }

    /**
     * Salvar dados extraídos na tabela tb_extract_data_holerites
     */
    private void salvarDadosExtraidos(Payslip payslip) {
        try {
            // Extrair código do CPF se for um código (começa com "COD")
            String codigo = null;
            if (payslip.getCpf().startsWith("COD")) {
                codigo = payslip.getCpf().substring(3); // Remove o prefixo "COD"
            }
            // Se não extraiu código do CPF, tentar extrair do nome do arquivo
            if (codigo == null && payslip.getFileName() != null) {
                // Verificar se o nome do arquivo contém um código no formato esperado
                String fileName = payslip.getFileName();
                Pattern codigoPattern = Pattern.compile(".*_(\\d{6})_.*");
                Matcher matcher = codigoPattern.matcher(fileName);
                if (matcher.find()) {
                    codigo = matcher.group(1);
                    log.debug("Código extraído do nome do arquivo: {}", codigo);
                }
            }
            
            // Converter ano para Integer
            Integer anoReferencia = payslip.getYear();
            
            // Salvar na tabela de dados extraídos
            extractDataHoleritesService.saveExtractData(
                payslip.getEmployeeName(),
                payslip.getCpf(),
                codigo,
                String.valueOf(payslip.getMonth()),
                anoReferencia
            );
            
            log.info("💾 Dados extraídos salvos na tabela tb_extract_data_holerites: {} - CPF: {} - Código: {} - Período: {}/{}", 
                    payslip.getEmployeeName(), payslip.getCpf(), codigo, payslip.getMonth(), payslip.getYear());
                    
        } catch (Exception e) {
            log.error("❌ Erro ao salvar dados extraídos na tabela tb_extract_data_holerites: {}", e.getMessage());
            // Não interromper o processamento por erro na tabela de dados extraídos
        }
    }

    public Map<String, Object> debugPayslipContent(MultipartFile file) throws IOException {
        log.info("🔍 Iniciando debug do arquivo: {}", file.getOriginalFilename());
        
        Map<String, Object> debugInfo = new java.util.HashMap<>();
        debugInfo.put("fileName", file.getOriginalFilename());
        debugInfo.put("fileSize", file.getSize());
        debugInfo.put("contentType", file.getContentType());
        
        List<Map<String, Object>> pagesInfo = new ArrayList<>();
        
        try (PDDocument document = PDDocument.load(file.getInputStream())) {
            if (document.isEncrypted()) {
                debugInfo.put("error", "PDF está criptografado");
                return debugInfo;
            }

            PDFTextStripper stripper = new PDFTextStripper();
            int pageCount = document.getNumberOfPages();
            debugInfo.put("totalPages", pageCount);
            
            // Analisar apenas as primeiras 3 páginas para debug
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
                
                // Tentar extrair informações
                Payslip payslip = extractPayslipInfo(pageText, i);
                if (payslip != null) {
                    pageInfo.put("extractionSuccess", true);
                    pageInfo.put("extractedName", payslip.getEmployeeName());
                    pageInfo.put("extractedCpf", payslip.getCpf());
                    pageInfo.put("extractedMonth", payslip.getMonth());
                    pageInfo.put("extractedYear", payslip.getYear());
                } else {
                    pageInfo.put("extractionSuccess", false);
                    pageInfo.put("extractionError", "Não foi possível extrair dados válidos");
                }
                
                pagesInfo.add(pageInfo);
            }
        }
        
        debugInfo.put("pages", pagesInfo);
        return debugInfo;
    }

    public List<Payslip> getAllPayslips() {
        log.info("🔍 Buscando todos os payslips no repositório...");
        List<Payslip> payslips = payslipRepository.findAll();
        log.info("✅ Repositório retornou {} payslips", payslips.size());
        if (payslips.size() > 0) {
            log.info("📋 Primeiro registro: ID={}, Nome={}, CPF={}, Mês={}, Ano={}", 
                payslips.get(0).getId(), payslips.get(0).getEmployeeName(), 
                payslips.get(0).getCpf(), payslips.get(0).getMonth(), payslips.get(0).getYear());
        }
        return payslips;
    }

    public List<Payslip> getPayslipsByCpf(String cpf) {
        return payslipRepository.findAllByCpf(cpf);
    }

    public Payslip getPayslipByFileName(String fileName) {
        return payslipRepository.findByFileName(fileName);
    }

    // Exclusão individual de payslip
    public void deletePayslip(UUID id) {
        Payslip payslip = payslipRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Payslip não encontrado para o ID: " + id));
        String mesAno = String.format("%s-%s", payslip.getMonth(), payslip.getYear());
        Path pastaMesAno = Paths.get(OUTPUT_DIR, mesAno);
        String nomeArquivo = generateFileName(payslip);
        Path arquivo = pastaMesAno.resolve(nomeArquivo);
        log.info("Tentando remover o arquivo do funcionário: {}", arquivo.toAbsolutePath());
        try {
            if (Files.exists(arquivo)) {
                Files.delete(arquivo);
                log.info("Arquivo removido com sucesso: {}", arquivo.toAbsolutePath());
            } else {
                log.warn("Arquivo não existe: {}", arquivo.toAbsolutePath());
            }
            // Se a pasta do mês ficar vazia, remove também
            if (Files.exists(pastaMesAno) && Files.list(pastaMesAno).findAny().isEmpty()) {
                Files.delete(pastaMesAno);
                log.info("Pasta do mês removida (vazia): {}", pastaMesAno.toAbsolutePath());
            }
        } catch (Exception e) {
            log.error("Erro ao remover o arquivo ou pasta: {} - {}", arquivo.toAbsolutePath(), e.getMessage());
        }
        payslipRepository.deleteById(id);
    }

    // Exclusão em massa de payslips
    public Map<String, Object> deleteMultiplePayslips(List<UUID> ids) {
        int deleted = 0;
        int failed = 0;
        List<String> errors = new ArrayList<>();
        List<Path> arquivosParaRemover = new ArrayList<>();
        List<Path> pastasMes = new ArrayList<>();
        for (UUID id : ids) {
            try {
                Payslip payslip = payslipRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Payslip não encontrado para o ID: " + id));
                String mesAno = String.format("%s-%s", payslip.getMonth(), payslip.getYear());
                Path pastaMesAno = Paths.get(OUTPUT_DIR, mesAno);
                String nomeArquivo = generateFileName(payslip);
                Path arquivo = pastaMesAno.resolve(nomeArquivo);
                arquivosParaRemover.add(arquivo);
                pastasMes.add(pastaMesAno);
                payslipRepository.deleteById(id);
                deleted++;
            } catch (Exception e) {
                failed++;
                errors.add("ID " + id + ": " + e.getMessage());
            }
        }
        // Remover todos os arquivos
        for (Path arquivo : arquivosParaRemover) {
            log.info("Tentando remover o arquivo: {}", arquivo.toAbsolutePath());
            try {
                if (Files.exists(arquivo)) {
                    Files.delete(arquivo);
                    log.info("Arquivo removido com sucesso: {}", arquivo.toAbsolutePath());
                } else {
                    log.warn("Arquivo não existe: {}", arquivo.toAbsolutePath());
                }
            } catch (Exception e) {
                log.error("Erro ao remover o arquivo: {} - {}", arquivo.toAbsolutePath(), e.getMessage());
            }
        }
        // Remover pastas do mês se ficarem vazias
        Set<Path> pastasMesUnicas = new java.util.HashSet<>(pastasMes);
        for (Path pastaMes : pastasMesUnicas) {
            try {
                if (Files.exists(pastaMes) && Files.list(pastaMes).findAny().isEmpty()) {
                    Files.delete(pastaMes);
                    log.info("Pasta do mês removida (vazia): {}", pastaMes.toAbsolutePath());
                }
            } catch (Exception e) {
                log.warn("Erro ao remover a pasta do mês: {} - {}", pastaMes.toAbsolutePath(), e.getMessage());
            }
        }
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("deleted", deleted);
        result.put("failed", failed);
        result.put("errors", errors);
        return result;
    }
} 