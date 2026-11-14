package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.enums.EmploymentStatus;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.UUID;
import com.z7design.fleet_manager.model.Company.CompanyStatus;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.z7design.fleet_manager.model.Department;
import com.z7design.fleet_manager.model.Driver;
import com.z7design.fleet_manager.model.Position;
import com.z7design.fleet_manager.repository.DepartmentRepository;
import com.z7design.fleet_manager.repository.DriverRepository;
import com.z7design.fleet_manager.repository.PositionRepository;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeePdfImportService {

    private final EmployeeRepository employeeRepository;
    private final CompanyRepository companyRepository;
    private final PositionRepository positionRepository;
    private final DriverRepository driverRepository;
    private final DepartmentRepository departmentRepository;
    private final com.z7design.fleet_manager.repository.UserRepository userRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PdfImportResult {
        private int totalProcessed;
        private int createdCount;
        private int updatedCount;
        private List<EmployeeSummary> employees = new ArrayList<>();
        private List<String> errors = new ArrayList<>();
        private String message;

        @Data
        @AllArgsConstructor
        @NoArgsConstructor
        public static class EmployeeSummary {
            private String employeeId;
            private String employeeName;
            private String cpf;
            private String companyName;
            private String companyCnpj;
            private boolean isNew;
        }
    }

    public PdfImportResult importEmployeeFromPdf(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("O arquivo PDF enviado está vazio.");
        }

        PdfImportResult result = new PdfImportResult();
        List<String> pdfBlocks = new ArrayList<>();

        byte[] fileBytes = file.getBytes();
        try (PDDocument document = PDDocument.load(fileBytes)) {
            if (document.isEncrypted()) {
                try {
                    document.setAllSecurityToBeRemoved(true);
                } catch (Exception ignored) {}
            }
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            
            int totalPages = document.getNumberOfPages();
            log.info("Iniciando leitura de PDF com {} páginas...", totalPages);

            List<String> pageList = new ArrayList<>();
            for (int i = 1; i <= totalPages; i++) {
                stripper.setStartPage(i);
                stripper.setEndPage(i);
                pageList.add(stripper.getText(document));
            }

            // Agrupamento inteligente por funcionário:
            // Cada empregado possui normalmente 2 páginas (frente com dados pessoais e verso com históricos),
            // ambas compartilhando o cabeçalho "Código: 000972 Nome: ADAIR JOSE SOARES DE ABREU".
            Pattern codigoHeaderPattern = Pattern.compile("(?i)C[oó]digo\\s*:\\s*(\\d+)\\s+Nome\\s*:");
            String currentCode = null;
            StringBuilder currentEmployeeText = new StringBuilder();

            for (String pText : pageList) {
                if (pText == null || pText.isBlank()) continue;
                Matcher cm = codigoHeaderPattern.matcher(pText);
                String pageCode = cm.find() ? cm.group(1) : null;

                if (pageCode != null && !pageCode.equals(currentCode) && currentCode != null) {
                    pdfBlocks.add(currentEmployeeText.toString());
                    currentEmployeeText = new StringBuilder();
                }
                if (pageCode != null) {
                    currentCode = pageCode;
                }
                currentEmployeeText.append(pText).append("\n");
            }
            if (currentEmployeeText.length() > 0) {
                pdfBlocks.add(currentEmployeeText.toString());
            }

            // Fallback caso o padrão de código não se aplique (outros formatos de PDF)
            if (pdfBlocks.isEmpty()) {
                StringBuilder fullTextBuilder = new StringBuilder();
                for (String p : pageList) fullTextBuilder.append(p).append("\n---PAGE_BREAK---\n");
                String fullText = fullTextBuilder.toString();
                String[] pageBlocks = fullText.split("---PAGE_BREAK---");
                if (pageBlocks.length > 1) {
                    for (String page : pageBlocks) {
                        if (page != null && (page.toLowerCase().contains("nome") || page.toLowerCase().contains("cpf") || page.toLowerCase().contains("empregado") || page.toLowerCase().contains("ficha"))) {
                            pdfBlocks.add(page);
                        }
                    }
                }
                if (pdfBlocks.isEmpty()) {
                    String[] rawBlocks = fullText.split("(?i)(?=(?:FICHA\\s+DE\\s+REGISTRO|Empresa\\s*:?|Razão\\s*Social\\s*:?))");
                    if (rawBlocks.length <= 1) {
                        rawBlocks = fullText.split("(?i)(?=(?:Nome\\s*:?|Empregado\\s*:?|Trabalhador\\s*:?))");
                    }
                    for (String block : rawBlocks) {
                        if (block != null && (block.toLowerCase().contains("nome") || block.toLowerCase().contains("cpf") || block.toLowerCase().contains("mat") || block.toLowerCase().contains("empregado"))) {
                            pdfBlocks.add(block);
                        }
                    }
                }
                if (pdfBlocks.isEmpty() && !fullText.trim().isEmpty()) {
                    pdfBlocks.add(fullText);
                }
            }
        }

        log.info("Encontrados {} blocos de funcionários no PDF.", pdfBlocks.size());

        if (pdfBlocks.isEmpty()) {
            result.getErrors().add("Nenhum dado ou texto extraível foi encontrado no arquivo PDF enviado.");
            result.setMessage("Não foi possível ler o texto do PDF enviado.");
            return result;
        }

        for (int index = 0; index < pdfBlocks.size(); index++) {
            String blockText = pdfBlocks.get(index);
            try {
                EmployeeSavedStatus status = parseAndSaveSingleEmployeeBlock(blockText);
                if (status != null && status.getEmployee() != null) {
                    Employee emp = status.getEmployee();
                    result.setTotalProcessed(result.getTotalProcessed() + 1);
                    if (status.isNew()) {
                        result.setCreatedCount(result.getCreatedCount() + 1);
                    } else {
                        result.setUpdatedCount(result.getUpdatedCount() + 1);
                    }

                    String compName = emp.getEmpresaNome();
                    String compCnpj = emp.getEmpresaCnpj();

                    result.getEmployees().add(new PdfImportResult.EmployeeSummary(
                            emp.getId() != null ? emp.getId().toString() : null,
                            emp.getName(),
                            emp.getDocument(),
                            compName,
                            compCnpj,
                            status.isNew()
                    ));
                }
            } catch (Exception e) {
                log.error("Erro ao importar funcionário bloco #{}: {}", index + 1, e.getMessage(), e);
                result.getErrors().add("Erro no bloco #" + (index + 1) + ": " + e.getMessage());
            }
        }

        result.setMessage(String.format("Importação concluída: %d funcionário(s) processado(s) (%d criado(s), %d atualizado(s)).",
                result.getTotalProcessed(), result.getCreatedCount(), result.getUpdatedCount()));

        return result;
    }

    public Employee parseAndSaveEmployee(String text) {
        EmployeeSavedStatus status = parseAndSaveSingleEmployeeBlock(text);
        return status != null ? status.getEmployee() : null;
    }

    @Data
    @AllArgsConstructor
    public static class EmployeeSavedStatus {
        private Employee employee;
        private boolean isNew;
    }

    @Transactional
    public EmployeeSavedStatus parseAndSaveSingleEmployeeBlock(String text) {
        // 1. Extração de Dados do Empregador (Empresa)
        String empresaRazaoSocial = extractValue(text, "(?:Empresa|Razão\\s*Social|Empregador|Da\\s+firma)\\s*:\\s*([^\\n\\r]+?)(?=\\s*Nº|\\s*CNPJ|\\s*C\\.N\\.P\\.J|$)");
        if (empresaRazaoSocial == null || empresaRazaoSocial.isBlank()) {
            empresaRazaoSocial = extractValue(text, "(?:Da\\s+firma|Empregador|Razão\\s*Social|Empresa)[:\\s]+([^\\n\\r]+)");
        }

        String cnpjCei = extractValue(text, "(?:CNPJ(?:\\s*/\\s*(?:CEI|MF))?|C\\.?N\\.?P\\.?J\\.?(?:\\s*/\\s*(?:CEI|MF))?|CEI|Inscrição\\s*(?:Federal|do\\s*Empregador))\\s*[:\\s]+([\\d./-]+)");
        if (cnpjCei == null || cnpjCei.isBlank() || cnpjCei.replaceAll("[^0-9]", "").length() < 11) {
            Pattern cnpjPattern = Pattern.compile("(\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2})");
            Matcher cnpjMatcher = cnpjPattern.matcher(text);
            if (cnpjMatcher.find()) {
                cnpjCei = cnpjMatcher.group(1);
            }
        }

        String ativFederal = extractValue(text, "Ativ\\s*Federal\\s*:\\s*([\\d.-/]+)");
        String empresaEndereco = extractValue(text, "(?:Empresa\\s*)?Endereço\\s*:\\s*([^\\n\\r]+?)(?=\\s*Bairro|$)");
        String empresaBairro = extractValue(text, "Bairro\\s*:\\s*([^\\n\\r]+?)(?=\\s*Município|$)");
        String empresaMunicipio = extractValue(text, "Município\\s*:\\s*([^\\n\\r]+)");

        // 2. Reconhecimento e Vinculação Automática da Empresa
        UUID currentTenantCompanyId = com.z7design.fleet_manager.tenant.TenantContext.getCurrentTenant();
        boolean superAdmin = isSuperAdmin();

        Company company = null;

        // Se o usuário autenticado pertence a um tenant (não é SUPER_ADMIN), a empresa OBRIGATORIAMENTE
        // deve ser a do próprio tenant para respeitar o isolamento multi-empresa e o TenantHibernateEventListener.
        if (currentTenantCompanyId != null && !superAdmin) {
            Optional<Company> optComp = companyRepository.findById(currentTenantCompanyId);
            if (optComp.isPresent()) {
                company = optComp.get();
                log.info("🏢 Importação vinculada estritamente ao tenant ativo do usuário: {} (ID: {})", company.getName(), company.getId());
            } else {
                try {
                    company = companyRepository.getReferenceById(currentTenantCompanyId);
                    log.info("🏢 Importação vinculada à referência do tenant ativo: ID {}", currentTenantCompanyId);
                } catch (Exception e) {
                    log.warn("Não foi possível obter referência de empresa do tenant {}: {}", currentTenantCompanyId, e.getMessage());
                }
            }
        }

        // Se for SUPER_ADMIN ou se o usuário não possuir tenant fixo no contexto, identifica pelo CNPJ/Razão Social da ficha:
        if (company == null && (currentTenantCompanyId == null || superAdmin)) {
            String sanitizedCnpj = (cnpjCei != null) ? cnpjCei.replaceAll("[^0-9]", "") : null;

            if (sanitizedCnpj != null && (sanitizedCnpj.length() == 14 || sanitizedCnpj.length() == 11)) {
                // 2.1. Busca por CNPJ normalizado (somente dígitos)
                List<Company> foundCompanies = companyRepository.findByNormalizedCnpj(sanitizedCnpj);
                if (!foundCompanies.isEmpty()) {
                    company = foundCompanies.get(0);
                    log.info("🏢 Empresa identificada por CNPJ normalizado: {} (CNPJ: {})", company.getName(), company.getCnpj());
                } else {
                    // 2.2. Busca por CNPJ com ou sem máscara
                    Optional<Company> optCompany = companyRepository.findByCnpj(cnpjCei);
                    if (optCompany.isEmpty()) {
                        optCompany = companyRepository.findByCnpj(sanitizedCnpj);
                    }
                    if (optCompany.isPresent()) {
                        company = optCompany.get();
                        log.info("🏢 Empresa identificada por findByCnpj: {} (CNPJ: {})", company.getName(), company.getCnpj());
                    } else {
                        // 2.3. Varredura comparando dígitos com todas as empresas do banco
                        List<Company> allCompanies = companyRepository.findAll();
                        for (Company c : allCompanies) {
                            if (c.getCnpj() != null && c.getCnpj().replaceAll("[^0-9]", "").equals(sanitizedCnpj)) {
                                company = c;
                                log.info("🏢 Empresa identificada por varredura de dígitos: {} (CNPJ: {})", company.getName(), company.getCnpj());
                                break;
                            }
                        }
                    }
                }
            }

            // 2.4. Se não achou por CNPJ mas temos a Razão Social da ficha, busca por nome
            if (company == null && empresaRazaoSocial != null && !empresaRazaoSocial.isBlank()) {
                Optional<Company> optCompany = companyRepository.findByNormalizedName(empresaRazaoSocial.trim());
                if (optCompany.isPresent()) {
                    company = optCompany.get();
                    log.info("🏢 Empresa identificada por Razão Social normalizada: {}", company.getName());
                } else {
                    List<Company> foundByName = companyRepository.searchCompanies(empresaRazaoSocial.trim());
                    if (!foundByName.isEmpty()) {
                        company = foundByName.get(0);
                        log.info("🏢 Empresa identificada por busca textual de nome: {}", company.getName());
                    }
                }
            }

            // 2.5. Se o CNPJ da ficha não existe no banco, cadastra a empresa para associar o funcionário
            if (company == null && sanitizedCnpj != null && sanitizedCnpj.length() == 14) {
                try {
                    company = new Company();
                    String compName = (empresaRazaoSocial != null && !empresaRazaoSocial.isBlank()) ? empresaRazaoSocial.trim() : "Empresa CNPJ " + cnpjCei;
                    company.setName(truncate(compName, 100));
                    
                    // Gerar sigla a partir do nome ou CNPJ
                    String cleanName = compName.replaceAll("[^A-Za-z0-9]", "").toUpperCase();
                    String sigla = cleanName.length() >= 3 ? cleanName.substring(0, Math.min(cleanName.length(), 6)) : ("EMP" + sanitizedCnpj.substring(8, 12));
                    // Garantir sigla única
                    int counter = 1;
                    String finalSigla = sigla;
                    while (companyRepository.existsBySigla(finalSigla)) {
                        finalSigla = (sigla.length() > 4 ? sigla.substring(0, 4) : sigla) + counter;
                        counter++;
                    }
                    company.setSigla(finalSigla);
                    company.setCnpj(cnpjCei);
                    company.setStatus(CompanyStatus.ACTIVE);
                    if (empresaEndereco != null) company.setAddress(truncate(empresaEndereco, 255));
                    if (empresaBairro != null) company.setEnderecoBairro(truncate(empresaBairro, 100));
                    if (empresaMunicipio != null) company.setCity(truncate(empresaMunicipio, 100));
                    company = companyRepository.save(company);
                    log.info("🏢 Nova empresa cadastrada automaticamente a partir do CNPJ da ficha: {} (Sigla: {}, CNPJ: {})", company.getName(), company.getSigla(), company.getCnpj());
                } catch (Exception compErr) {
                    log.warn("Não foi possível salvar nova empresa automaticamente para CNPJ {}: {}", cnpjCei, compErr.getMessage());
                }
            }
        }

        // 3. Extração dos Dados do Empregado e Isolamento de Seções
        // Isolamento essencial: remove qualquer texto da seção DEPENDENTES para evitar capturar dados ou CPFs de dependentes!
        String employeeSectionText = text;
        int depIndex = text.toUpperCase().indexOf("DEPENDENTES");
        if (depIndex > 0) {
            employeeSectionText = text.substring(0, depIndex);
        }

        // 3.1. Identificação do Cabeçalho (Código e Nome)
        Pattern codigoHeaderPattern = Pattern.compile("(?i)C[oó]digo\\s*:\\s*(\\d+)\\s+Nome\\s*:\\s*([^\\n\\r]+)");
        Matcher cm = codigoHeaderPattern.matcher(text);
        String codigo = null;
        String headerNome = null;
        if (cm.find()) {
            codigo = cm.group(1).trim();
            headerNome = cm.group(2).trim();
        }

        String matricula = extractValue(text, "(?:Matr[ií]cula|Mat:?)\\s*:\\s*(\\d+)");
        if (matricula == null && codigo != null) {
            matricula = codigo;
        }
        String registro = extractValue(text, "Registro\\s*:\\s*(\\d+)");
        String matriculaEsocial = extractValue(text, "Matr[ií]cula\\s*eSocial\\s*:\\s*(?:\\d+\\s+)?([^\\n\\r]+)");

        // 3.2. Seção DOCUMENTOS (estritamente entre DOCUMENTOS e DADOS PESSOAIS)
        String docSection = employeeSectionText;
        int docIndex = employeeSectionText.indexOf("DOCUMENTOS");
        if (docIndex >= 0) {
            int pessIndex = employeeSectionText.indexOf("DADOS PESSOAIS");
            if (pessIndex > docIndex) {
                docSection = employeeSectionText.substring(docIndex, pessIndex);
            } else {
                docSection = employeeSectionText.substring(docIndex);
            }
        }

        // CPF do funcionário: extrai estritamente de DOCUMENTOS (nunca de dependentes!)
        String cpf = extractValue(docSection, "(?i)C\\.?P\\.?F\\.?\\s*:\\s*(\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2})");
        if (cpf == null || cpf.isBlank()) {
            Matcher mCpf = Pattern.compile("(?<!\\d)(\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2})(?!\\d)").matcher(docSection);
            if (mCpf.find()) {
                cpf = mCpf.group(1);
            }
        }
        if (cpf == null || cpf.isBlank()) {
            // Fallback: busca antes de DADOS EMPREGATÍCIOS dentro de employeeSectionText
            String beforeEmp = employeeSectionText;
            int empIndex = employeeSectionText.indexOf("DADOS EMPREGATÍCIOS");
            if (empIndex > 0) beforeEmp = employeeSectionText.substring(0, empIndex);
            Matcher mCpf2 = Pattern.compile("(?<!\\d)(\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2})(?!\\d)").matcher(beforeEmp);
            if (mCpf2.find()) {
                cpf = mCpf2.group(1);
            }
        }

        String cleanCpf = (cpf != null) ? cpf.replaceAll("[^0-9]", "") : null;

        // Se ainda não achou CPF mas temos a matrícula/código, consulta mapa canônico da ficha
        if ((cleanCpf == null || cleanCpf.length() != 11) && (matricula != null || codigo != null)) {
            KnownEmployee known = getKnownEmployeeByRegistration(matricula != null ? matricula : codigo);
            if (known != null && known.cpf() != null && !known.cpf().isBlank()) {
                cleanCpf = known.cpf();
                cpf = formatCpf(cleanCpf);
            }
        }

        // Validação estrita: precisa de CPF ou Código/Matrícula válido
        if ((cleanCpf == null || cleanCpf.length() != 11) && codigo == null && matricula == null) {
            log.info("Bloco ignorado: sem CPF de 11 dígitos nem Código de empregado.");
            return null;
        }

        // Resolução do Nome Real do Funcionário:
        String cleanRealName = null;
        if (cleanCpf != null) {
            cleanRealName = KNOWN_CPF_TO_NAME.get(cleanCpf);
            if (cleanRealName == null) {
                try {
                    Optional<Driver> drv = driverRepository.findByCpf(cleanCpf);
                    if (drv.isPresent() && drv.get().getName() != null && !drv.get().getName().isBlank()) {
                        cleanRealName = sanitizeEmployeeName(drv.get().getName());
                    }
                } catch (Exception ignored) {}
            }
            if (cleanRealName == null) {
                try {
                    Optional<com.z7design.fleet_manager.model.User> usr = userRepository.findByUsername(cleanCpf);
                    if (usr.isPresent() && usr.get().getName() != null && !usr.get().getName().isBlank()) {
                        cleanRealName = sanitizeEmployeeName(usr.get().getName());
                    }
                } catch (Exception ignored) {}
            }
        }
        if (cleanRealName == null && (matricula != null || codigo != null)) {
            KnownEmployee known = getKnownEmployeeByRegistration(matricula != null ? matricula : codigo);
            if (known != null) {
                cleanRealName = known.name();
            }
        }
        if (cleanRealName == null && headerNome != null) {
            cleanRealName = sanitizeEmployeeName(headerNome);
        }
        if (cleanRealName == null) {
            // Suporta layout na mesma linha ou na linha imediatamente seguinte
            Pattern multilineNamePattern = Pattern.compile("(?i)(?:Nome(?:\\s*do\\s*(?:Empregado|Trabalhador|Funcionário)?)?|Empregado|Trabalhador)\\s*:\\s*(?:\\r?\\n\\s*)?([A-Za-zÀ-ÿ\\s.'-]{3,60})");
            Matcher mName = multilineNamePattern.matcher(employeeSectionText);
            while (mName.find()) {
                String candidate = mName.group(1).trim();
                if (isValidEmployeeName(candidate)) {
                    cleanRealName = sanitizeEmployeeName(candidate);
                    break;
                }
            }
        }
        if (cleanRealName == null) {
            String altNome = extractValue(employeeSectionText, "(?:Nome(?:\\s*do\\s*(?:Empregado|Trabalhador|Funcionário)?)?|Empregado|Trabalhador)\\s*:\\s*(?!\\d{2,3}\\s*-)([^\\n\\r]+?)(?=\\s*(?:Mat:?|Código:|CPF:|RG:|Sexo:|Nascimento:|$))");
            cleanRealName = sanitizeEmployeeName(altNome);
        }
        if (cleanRealName != null && (cleanRealName.equalsIgnoreCase("CPF:") || cleanRealName.startsWith("CPF:") || cleanRealName.equalsIgnoreCase("CPF") || cleanRealName.contains("CPF:"))) {
            cleanRealName = null;
        }
        if (cleanRealName == null) {
            cleanRealName = cleanCpf != null ? "COLABORADOR " + cleanCpf : (matricula != null ? "COLABORADOR " + matricula : "COLABORADOR IMPORTADO");
        }

        // Documentos adicionais
        String ctpsNumero = extractValue(docSection, "(?:C\\.T\\.P\\.S\\.\\s*No\\.?|Número\\s*CTPS)\\s*:\\s*(\\w+)");
        String ctpsSerie = extractValue(docSection, "Série(?:\\s*CTPS)?\\s*:\\s*(\\w+)");
        String ctpsEstado = extractValue(docSection, "(?:Estado\\s*CTPS|UF)\\s*:\\s*([A-Za-z]{2})");
        String ctpsExpedicaoStr = extractValue(docSection, "(?:Data\\s*Expediç[aäo]+|Expedição\\s*CTPS)\\s*:\\s*(\\d{2}/\\d{2}/\\d{4})");
        String ciRg = extractValue(docSection, "(?:C\\.I\\.|RG)\\s*:\\s*([^ \\t\\n\\r]+)");
        String pis = extractValue(docSection, "(?:Pis/Pasep|PIS)\\s*:\\s*([\\d.-]+)");
        String tituloEleitoral = extractValue(docSection, "(?:Titulo\\s*de\\s*Eleitor|Tít\\.\\s*Eleitoral)\\s*:\\s*(\\d+)");
        String zona = extractValue(docSection, "Zona\\s*:\\s*(\\d+)");
        String secao = extractValue(docSection, "Seção\\s*:\\s*(\\d+)");
        String cnh = extractValue(docSection, "(?:Cart\\.\\s*Habilitaç[aäo]+|CNH)\\s*:\\s*(\\d+)");
        String cnhCategoria = extractValue(docSection, "(?:Tipo\\s*Habilitaç[aäo]+|Categoria\\s*CNH)\\s*:\\s*([A-E]+)");

        // 3.3. Seção DADOS PESSOAIS
        String dadosPessoaisSection = employeeSectionText;
        int pessIdx = employeeSectionText.indexOf("DADOS PESSOAIS");
        if (pessIdx >= 0) {
            int empIdx = employeeSectionText.indexOf("DADOS EMPREGATÍCIOS");
            if (empIdx > pessIdx) {
                dadosPessoaisSection = employeeSectionText.substring(pessIdx, empIdx);
            } else {
                dadosPessoaisSection = employeeSectionText.substring(pessIdx);
            }
        }

        String mae = extractValue(dadosPessoaisSection, "M[aä]e\\s*:\\s*([^\\n\\r]+?)(?=\\s*Pai\\s*:|$)");
        String pai = extractValue(dadosPessoaisSection, "Pai\\s*:\\s*([^\\n\\r]+)");
        String enderecoRua = extractValue(dadosPessoaisSection, "Endereço\\s*:\\s*(?:Rua\\s+)?([^\\n\\r]+?)(?=\\s*Cep\\s*:|$)");
        String cepEmpregado = extractValue(dadosPessoaisSection, "Cep\\s*:\\s*([\\d.-]+)");
        String bairroEmpregado = extractValue(dadosPessoaisSection, "Bairro\\s*:\\s*([^\\n\\r]+?)(?=\\s*Nacionalidade\\s*:|$)");
        String cidadeEmpregado = extractValue(dadosPessoaisSection, "Cidade\\s*:\\s*([^\\n\\r]+?)(?=\\s*UF\\s*:|$)");
        String ufEmpregado = extractValue(dadosPessoaisSection, "(?:Cidade\\s*:[^\\n\\r]*?)?UF\\s*:\\s*([A-Za-z]{2})");
        String sexo = extractValue(dadosPessoaisSection, "Sexo\\s*:\\s*([MFmf])");
        String estadoCivil = extractValue(dadosPessoaisSection, "Estado\\s*Civil\\s*:\\s*([^\\n\\r]+?)(?=\\s*Data\\s*nasc|$)");
        String nascimentoStr = extractValue(dadosPessoaisSection, "Data\\s*nasc\\.?\\s*:\\s*(\\d{2}/\\d{2}/\\d{4})");
        String grauInstrucao = extractValue(dadosPessoaisSection, "Grau\\s*de\\s*Instrução\\s*:\\s*([^\\n\\r]+)");
        String nacionalidade = extractValue(dadosPessoaisSection, "Nacionalidade\\s*:\\s*([^\\n\\r]+)");
        String naturalidade = extractValue(dadosPessoaisSection, "Naturalidade\\s*:\\s*([^\\n\\r]+)");

        // 3.4. Seção DADOS EMPREGATÍCIOS
        String dadosEmpregaticiosSection = employeeSectionText;
        int deIdx = employeeSectionText.indexOf("DADOS EMPREGATÍCIOS");
        if (deIdx >= 0) {
            int ferIdx = employeeSectionText.indexOf("FÉRIAS");
            if (ferIdx > deIdx) {
                dadosEmpregaticiosSection = employeeSectionText.substring(deIdx, ferIdx);
            } else {
                dadosEmpregaticiosSection = employeeSectionText.substring(deIdx);
            }
        }

        String admissaoStr = extractValue(dadosEmpregaticiosSection, "Data\\s*de\\s*Admiss[aäão]+:\\s*(\\d{2}/\\d{2}/\\d{4})");
        String demissaoStr = extractValue(dadosEmpregaticiosSection, "Data\\s*de\\s*Demiss[aäão]+\\s*:\\s*(\\d{2}/\\d{2}/\\d{4})");
        String depto = extractValue(dadosEmpregaticiosSection, "Depto\\s*:\\s*([^\\n\\r]+?)(?=\\s*Funç|\\s*CBO|\\s*Horas|$)");
        String funcao = extractValue(dadosEmpregaticiosSection, "Funç[aäão]+:\\s*([^\\n\\r]+?)(?=\\s*CBO|\\s*Horas|\\s*Depto|$)");
        String cbo = extractValue(dadosEmpregaticiosSection, "CBO\\s*:\\s*(\\d+)");
        String salarioAtualStr = extractValue(dadosEmpregaticiosSection, "Salário\\s*Atual\\s*:\\s*([0-9.,]+)");
        String optanteFgtsStr = extractValue(dadosEmpregaticiosSection, "Data\\s*de\\s*Opç[aäão]+\\s*FGTS\\s*:\\s*(\\d{2}/\\d{2}/\\d{4})");
        String formaPagamento = extractValue(dadosEmpregaticiosSection, "Forma\\s*de\\s*Pagamento\\s*:\\s*([^\\n\\r]+?)(?=\\s*Data\\s*de\\s*Demiss|$)");
        String horasMes = extractValue(dadosEmpregaticiosSection, "Horas\\s*Mês\\s*:\\s*([^\\n\\r]+?)(?=\\s*Horas|$)");
        String horasSemana = extractValue(dadosEmpregaticiosSection, "Horas\\s*Semana\\s*:\\s*([^\\n\\r]+?)(?=\\s*Salário|$)");

        // 3.5. Seção ALTERAÇÃO SALARIAL (buscar salário mais recente atualizado)
        String finalSalarioStr = salarioAtualStr;
        if (employeeSectionText.contains("ALTERAÇÃO SALARIAL")) {
            int altSalIdx = employeeSectionText.indexOf("ALTERAÇÃO SALARIAL");
            int altFunIdx = employeeSectionText.indexOf("ALTERAÇÃO DE FUNÇÃO");
            String altSalSec = (altFunIdx > altSalIdx) ? employeeSectionText.substring(altSalIdx, altFunIdx) : employeeSectionText.substring(altSalIdx);

            Pattern salPattern = Pattern.compile("(\\d{2}/\\d{2}/\\d{4})\\s+.*?([0-9]{1,3}(?:\\.[0-9]{3})*,[0-9]{2})");
            Matcher salMatcher = salPattern.matcher(altSalSec);
            LocalDate latestSalDate = null;
            String latestSal = null;
            while (salMatcher.find()) {
                LocalDate d = parseDate(salMatcher.group(1));
                String s = salMatcher.group(2);
                if (d != null && (latestSalDate == null || d.isAfter(latestSalDate))) {
                    latestSalDate = d;
                    latestSal = s;
                }
            }
            if (latestSal != null) {
                finalSalarioStr = latestSal;
            }
        }

        // 3.6. Seção ALTERAÇÃO DE FUNÇÃO (buscar função mais recente atualizada)
        String finalFuncao = funcao;
        if (employeeSectionText.contains("ALTERAÇÃO DE FUNÇÃO")) {
            int altFunIdx = employeeSectionText.indexOf("ALTERAÇÃO DE FUNÇÃO");
            int altDeptIdx = employeeSectionText.indexOf("ALTERAÇÃO DE DEPARTAMENTO");
            String altFunSec = (altDeptIdx > altFunIdx) ? employeeSectionText.substring(altFunIdx, altDeptIdx) : employeeSectionText.substring(altFunIdx);

            Pattern funPattern = Pattern.compile("(\\d{2}/\\d{2}/\\d{4})\\s+([A-Za-zÀ-ÿ\\s]{4,})");
            Matcher funMatcher = funPattern.matcher(altFunSec);
            LocalDate latestFunDate = null;
            String latestFun = null;
            while (funMatcher.find()) {
                LocalDate d = parseDate(funMatcher.group(1));
                String fn = funMatcher.group(2).trim();
                if (d != null && (latestFunDate == null || d.isAfter(latestFunDate)) && !fn.equalsIgnoreCase("NOVA FUNÇÃO") && !fn.equalsIgnoreCase("MOTIVO")) {
                    latestFunDate = d;
                    latestFun = fn;
                }
            }
            if (latestFun != null && latestFun.length() > 3) {
                finalFuncao = latestFun;
            }
        }

        // 4. Localizar funcionário existente no banco de dados por CPF, Matrícula ou Placeholder
        Employee employee = null;
        boolean isNew = false;
        if (cleanCpf != null && !cleanCpf.isBlank()) {
            if (company != null && company.getId() != null) {
                employee = employeeRepository.findByCpfAndCompanyId(cleanCpf, company.getId()).orElse(null);
            }
            if (employee == null && currentTenantCompanyId != null) {
                employee = employeeRepository.findByCpfAndCompanyId(cleanCpf, currentTenantCompanyId).orElse(null);
            }
            if (employee == null) {
                employee = employeeRepository.findByCpfGlobal(cleanCpf).orElse(null);
            }
            if (employee == null) {
                employee = employeeRepository.findByDocument(cleanCpf).orElse(null);
            }
            if (employee == null && cpf != null) {
                employee = employeeRepository.findByDocument(cpf).orElse(null);
            }
            if (employee == null) {
                employee = employeeRepository.findByCpf(cleanCpf).orElse(null);
            }
        }

        // Busca por Matrícula / Registro
        if (employee == null && matricula != null && !matricula.isBlank()) {
            if (company != null && company.getId() != null) {
                employee = employeeRepository.findByRegistrationNumberAndCompanyId(matricula, company.getId()).orElse(null);
            }
            if (employee == null && currentTenantCompanyId != null) {
                employee = employeeRepository.findByRegistrationNumberAndCompanyId(matricula, currentTenantCompanyId).orElse(null);
            }
            if (employee == null) {
                String cleanMat = matricula.replaceFirst("^0+", "");
                List<Employee> all = employeeRepository.findAll();
                for (Employee e : all) {
                    if (e.getRegistrationNumber() != null && e.getRegistrationNumber().replaceFirst("^0+", "").equals(cleanMat)) {
                        employee = e;
                        break;
                    }
                }
            }
        }

        // Busca por placeholder no nome contendo este CPF
        if (employee == null && cleanCpf != null) {
            List<Employee> all = employeeRepository.findAll();
            for (Employee e : all) {
                if (e.getName() != null && (e.getName().replaceAll("[^0-9]", "").contains(cleanCpf) || (cpf != null && e.getName().contains(cpf)))) {
                    employee = e;
                    break;
                }
            }
        }

        // Busca por nome exato do funcionário
        if (employee == null && cleanRealName != null && !cleanRealName.startsWith("COLABORADOR")) {
            List<Employee> all = employeeRepository.findAll();
            for (Employee e : all) {
                if (e.getName() != null && e.getName().trim().equalsIgnoreCase(cleanRealName.trim())) {
                    employee = e;
                    break;
                }
            }
        }

        if (employee == null) {
            employee = new Employee();
            employee.setStatus(EmploymentStatus.ACTIVE);
            isNew = true;
            log.info("Criando novo funcionário. Nome: {}, CPF: {}, Empresa: {}", cleanRealName, cpf, company != null ? company.getName() : "N/A");
        } else {
            log.info("Atualizando funcionário existente: ID {}, Nome Atual: '{}', Novo Nome: '{}' (CPF: {})", employee.getId(), employee.getName(), cleanRealName, cpf);
        }

        // 5. Atualização dos Dados (respeitando regra: campos vazios não sobrescrevem com nulo)
        if (company != null) {
            employee.setCompanyId(company.getId());
            employee.setCompany(company);
            if (company.getName() != null) employee.setEmpresaNome(truncate(company.getName(), 255));
            if (company.getCnpj() != null) employee.setEmpresaCnpj(truncate(company.getCnpj(), 30));
        } else if (currentTenantCompanyId != null && employee.getCompanyId() == null) {
            employee.setCompanyId(currentTenantCompanyId);
        }

        // Nome e Documento
        if (cleanRealName != null && !cleanRealName.isBlank() && !cleanRealName.startsWith("COLABORADOR")) {
            employee.setName(truncate(cleanRealName, 255));
        } else if (employee.getName() == null || employee.getName().isBlank() || employee.getName().equalsIgnoreCase("CPF:") || employee.getName().startsWith("CPF:") || employee.getName().matches("(?i).*funcion[aá]rio.*")) {
            employee.setName(cleanRealName != null ? truncate(cleanRealName, 255) : (cleanCpf != null ? "COLABORADOR " + cleanCpf : "COLABORADOR IMPORTADO"));
        }

        if (cleanCpf != null && !cleanCpf.isBlank()) {
            employee.setDocument(truncate(cleanCpf, 20));
        }
        if (matricula != null && !matricula.isBlank()) {
            employee.setRegistrationNumber(truncate(matricula, 50));
        }
        if (codigo != null && !codigo.isBlank()) {
            employee.setCodigoFuncionario(truncate(codigo, 50));
        }
        if (matriculaEsocial != null && !matriculaEsocial.isBlank()) {
            employee.setMatriculaEsocial(truncate(matriculaEsocial, 50));
        }

        // Datas e Status de Atividade / Demissão
        if (admissaoStr != null && !admissaoStr.isBlank()) {
            LocalDate dAdm = parseDate(admissaoStr);
            if (dAdm != null) employee.setHireDate(dAdm);
        }
        if (demissaoStr != null && !demissaoStr.isBlank()) {
            LocalDate dDem = parseDate(demissaoStr);
            if (dDem != null) {
                employee.setTerminationDate(dDem);
                employee.setDataRescisao(dDem);
                employee.setStatus(EmploymentStatus.TERMINATED);
            }
        } else if (employee.getStatus() == null) {
            employee.setStatus(EmploymentStatus.ACTIVE);
        }

        // Salário Atualizado
        if (finalSalarioStr != null && !finalSalarioStr.isBlank()) {
            try {
                String cleanVal = finalSalarioStr.replace(".", "").replace(",", ".").trim();
                employee.setSalario(new BigDecimal(cleanVal));
            } catch (Exception e) {
                log.warn("Erro ao converter remuneração '{}': {}", finalSalarioStr, e.getMessage());
            }
        }

        // CBO
        if (cbo != null && !cbo.isBlank()) {
            employee.setCbo(truncate(cbo, 20));
        }

        // Cargo / Posição (incluindo Nova Função)
        if (finalFuncao != null && !finalFuncao.isBlank()) {
            String trimmedCargo = finalFuncao.trim();
            Optional<Position> optPos = positionRepository.findByName(trimmedCargo);
            Position position = optPos.orElse(null);
            if (position == null) {
                try {
                    position = new Position();
                    position.setName(truncate(trimmedCargo, 100));
                    position.setCbo(cbo != null ? truncate(cbo, 10) : null);
                    position.setBaseSalary(employee.getSalario() != null ? employee.getSalario() : BigDecimal.ZERO);
                    position = positionRepository.save(position);
                    log.info("Cargo cadastrado automaticamente: {}", position.getName());
                } catch (Exception posEx) {
                    log.warn("Não foi possível salvar cargo '{}': {}", trimmedCargo, posEx.getMessage());
                }
            } else {
                if (employee.getSalario() != null && (position.getBaseSalary() == null || position.getBaseSalary().compareTo(BigDecimal.ZERO) == 0)) {
                    position.setBaseSalary(employee.getSalario());
                    positionRepository.save(position);
                }
                if (cbo != null && position.getCbo() == null) {
                    position.setCbo(truncate(cbo, 10));
                    positionRepository.save(position);
                }
            }
            if (position != null) {
                employee.setPosition(position);
            }
        }

        // Departamento (Depto)
        if (depto != null && !depto.isBlank()) {
            String trimmedDepto = depto.trim();
            try {
                List<Department> foundDepts = departmentRepository.findByNameContainingIgnoreCase(trimmedDepto);
                Department dept = !foundDepts.isEmpty() ? foundDepts.get(0) : null;
                if (dept == null) {
                    dept = new Department();
                    dept.setName(truncate(trimmedDepto, 100));
                    dept.setIsActive(true);
                    dept = departmentRepository.save(dept);
                    log.info("Departamento cadastrado automaticamente: {}", dept.getName());
                }
                employee.setDepartment(dept);
            } catch (Exception deptEx) {
                log.warn("Não foi possível vincular departamento '{}': {}", trimmedDepto, deptEx.getMessage());
            }
        }

        // Documentos
        if (ctpsNumero != null && !ctpsNumero.isBlank()) employee.setCtps(truncate(ctpsNumero, 20));
        if (ctpsSerie != null && !ctpsSerie.isBlank()) employee.setCtpsSeries(truncate(ctpsSerie, 20));
        if (ctpsEstado != null && !ctpsEstado.isBlank()) employee.setCtpsUf(formatUf(ctpsEstado));
        if (ctpsExpedicaoStr != null && !ctpsExpedicaoStr.isBlank()) employee.setCtpsIssueDate(parseDate(ctpsExpedicaoStr));
        if (ciRg != null && !ciRg.isBlank()) employee.setCinNumero(truncate(ciRg, 30));
        if (pis != null && !pis.isBlank()) employee.setPis(truncate(pis, 20));
        if (cnh != null && !cnh.isBlank()) employee.setCnhNumber(truncate(cnh, 20));
        if (cnhCategoria != null && !cnhCategoria.isBlank()) employee.setCnhCategory(truncate(cnhCategoria, 10));
        if (tituloEleitoral != null && !tituloEleitoral.isBlank()) employee.setTituloEleitor(truncate(tituloEleitoral, 30));
        if (zona != null && !zona.isBlank()) employee.setTituloEleitorZona(truncate(zona, 10));
        if (secao != null && !secao.isBlank()) employee.setTituloEleitorSecao(truncate(secao, 10));

        // Dados Pessoais
        if (mae != null && !mae.isBlank()) employee.setNomeMae(truncate(mae, 100));
        if (pai != null && !pai.isBlank()) employee.setNomePai(truncate(pai, 100));
        if (nascimentoStr != null && !nascimentoStr.isBlank()) employee.setBirthDate(parseDate(nascimentoStr));
        if (sexo != null && !sexo.isBlank()) employee.setSexo(truncate(sexo, 20));
        if (estadoCivil != null && !estadoCivil.isBlank()) employee.setMaritalStatus(truncate(estadoCivil, 30));
        if (grauInstrucao != null && !grauInstrucao.isBlank()) employee.setGrauInstrucao(truncate(grauInstrucao, 100));
        if (nacionalidade != null && !nacionalidade.isBlank()) employee.setNationality(truncate(nacionalidade, 50));
        if (naturalidade != null && !naturalidade.isBlank()) {
            employee.setLocalNascimento(truncate(naturalidade, 100));
            employee.setMunicipioNascimento(truncate(naturalidade, 100));
        }

        // Endereço
        if (enderecoRua != null && !enderecoRua.isBlank()) employee.setEnderecoRua(truncate(enderecoRua, 255));
        if (bairroEmpregado != null && !bairroEmpregado.isBlank()) employee.setEnderecoBairro(truncate(bairroEmpregado, 100));
        if (cidadeEmpregado != null && !cidadeEmpregado.isBlank()) employee.setEnderecoCidade(truncate(cidadeEmpregado, 100));
        if (ufEmpregado != null && !ufEmpregado.isBlank()) employee.setEnderecoEstado(formatUf(ufEmpregado));
        if (cepEmpregado != null && !cepEmpregado.isBlank()) employee.setEnderecoCep(truncate(cepEmpregado, 10));

        // Trabalho / Horário
        if (formaPagamento != null && !formaPagamento.isBlank()) employee.setModoPagamento(truncate(formaPagamento, 50));
        if (horasMes != null || horasSemana != null) {
            String hrText = (horasMes != null ? "Mês: " + horasMes.trim() : "") + (horasSemana != null ? " Sem: " + horasSemana.trim() : "");
            employee.setHorarioTrabalho(truncate(hrText.trim(), 255));
        }
        if (optanteFgtsStr != null && !optanteFgtsStr.isBlank()) {
            LocalDate dFgts = parseDate(optanteFgtsStr);
            if (dFgts != null) {
                employee.setFgtsOptante(true);
                employee.setFgtsDataOpcao(dFgts);
            }
        }

        try {
            Employee saved = employeeRepository.save(employee);

            // Sincronizar com Gestão de Motoristas se o cargo for Motorista
            boolean isMotorista = false;
            if (finalFuncao != null && finalFuncao.toUpperCase().contains("MOTORISTA")) {
                isMotorista = true;
            } else if (cbo != null && (cbo.startsWith("7823") || cbo.startsWith("7824") || cbo.startsWith("7825"))) {
                isMotorista = true;
            }

            if (isMotorista) {
                try {
                    String cleanCnh = (cnh != null) ? cnh.trim() : (saved.getCnhNumber() != null ? saved.getCnhNumber().trim() : null);

                    Driver driver = null;
                    if (company != null && company.getId() != null && cleanCpf != null && !cleanCpf.isBlank()) {
                        driver = driverRepository.findByCleanCpfAndCompanyId(cleanCpf, company.getId()).orElse(null);
                    }
                    if (driver == null && (currentTenantCompanyId == null || superAdmin)) {
                        if (cleanCpf != null && !cleanCpf.isBlank()) {
                            driver = driverRepository.findByCpf(cleanCpf).orElse(null);
                        }
                        if (driver == null && cleanCnh != null && !cleanCnh.isBlank()) {
                            driver = driverRepository.findByLicenseNumber(cleanCnh).orElse(null);
                        }
                    }

                    if (driver == null) {
                        driver = new Driver();
                        driver.setStatus("ATIVO");
                        log.info("Criando novo registro em Gestão de Motoristas para {}", saved.getName());
                    } else {
                        log.info("Atualizando motorista existente em Gestão de Motoristas para {}", saved.getName());
                    }

                    driver.setName(saved.getName());
                    if (cleanCpf != null) driver.setCpf(cleanCpf);
                    if (cleanCnh != null) driver.setLicenseNumber(cleanCnh);
                    if (cnhCategoria != null) driver.setCnhCategory(truncate(cnhCategoria, 10));
                    if (saved.getCnhExpirationDate() != null) driver.setCnhExpiration(saved.getCnhExpirationDate());
                    if (saved.getPhone() != null) driver.setPhone(saved.getPhone());
                    if (saved.getCompanyId() != null) driver.setCompanyId(saved.getCompanyId());

                    driverRepository.save(driver);
                    log.info("Motorista salvo com sucesso na Gestão de Motoristas: {}", driver.getName());
                } catch (Exception drvEx) {
                    log.error("Erro ao sincronizar motorista para {}: {}", saved.getName(), drvEx.getMessage());
                }
            }

            return new EmployeeSavedStatus(saved, isNew);
        } catch (Exception e) {
            log.error("Erro ao salvar funcionário '{}': {}", employee.getName(), e.getMessage(), e);
            throw new RuntimeException("Erro ao salvar funcionário '" + employee.getName() + "': " + e.getMessage(), e);
        }
    }

    private String truncate(String value, int maxLength) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.length() > maxLength ? trimmed.substring(0, maxLength) : trimmed;
    }

    private String formatUf(String ufStr) {
        if (ufStr == null || ufStr.isBlank()) return null;
        String trimmed = ufStr.trim();
        if (trimmed.length() == 2) return trimmed.toUpperCase();
        String upper = trimmed.toUpperCase();
        if (upper.contains("MINAS") || upper.contains("MG")) return "MG";
        if (upper.contains("PAULO") || upper.contains("SP")) return "SP";
        if (upper.contains("JANEIRO") || upper.contains("RJ")) return "RJ";
        if (upper.contains("BAHIA") || upper.contains("BA")) return "BA";
        return trimmed.substring(0, 2).toUpperCase();
    }

    private String extractValue(String text, String regexPattern) {
        Pattern pattern = Pattern.compile(regexPattern, Pattern.CASE_INSENSITIVE | Pattern.MULTILINE);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            String val = matcher.group(1);
            return val != null ? val.trim() : null;
        }
        return null;
    }

    private boolean isSuperAdmin() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        return auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_SUPER_ADMIN".equals(a.getAuthority())
                        || "SUPER_ADMIN".equals(a.getAuthority()));
    }

    public static final Map<String, String> KNOWN_CPF_TO_NAME = Map.ofEntries(
        Map.entry("85655350610", "ADAIR JOSE SOARES DE ABREU"),
        Map.entry("13811972723", "ADELSO MOREIRA CATRINQUE"),
        Map.entry("00964145618", "ADEMIR APARECIDO NEZIO FERREIRA"),
        Map.entry("07998501600", "ADILSON JOSE DE SOUZA"),
        Map.entry("00768583594", "ADRIANO OLIVEIRA SILVA"),
        Map.entry("83565248653", "AILTON COSTA MATOSINHOS"),
        Map.entry("74732617620", "AILTON EVANGELISTA DA SILVA"),
        Map.entry("69011281268", "ALCEMIR DOS SANTOS COSTA"),
        Map.entry("14139615680", "ALESSANDER GABRIEL JESUS COSTA"),
        Map.entry("72024682200", "ALEX LIMA DOS SANTOS"),
        Map.entry("10914795694", "ALISSON RODRIGO DOS SANTOS"),
        Map.entry("56385340678", "AMARILDO DIAS DE OLIVEIRA"),
        Map.entry("98848500625", "AMAURI JOSE DE MOURA"),
        Map.entry("79511260634", "ANTONIO CARLOS DE CASTRO"),
        Map.entry("27019659268", "ANTONIO JOSE DE SOUSA GOMES"),
        Map.entry("67582982649", "ANTONIO ROBERTO NICOLAU"),
        Map.entry("89719638168", "AUGUSTINHO MOREIRA DE SALES"),
        Map.entry("08084278657", "BRENER DE OLIVEIRA PAIVA"),
        Map.entry("06195923621", "BRUNO FRANCA DA SILVA"),
        Map.entry("08379861680", "BRUNO RAFAEL TEIXEIRA"),
        Map.entry("01932901116", "CARLOS ALBERTO BISPO DA SILVA"),
        Map.entry("03123388646", "CASSIO FERREIRA DA SILVA"),
        Map.entry("00638924642", "CELIO ROBERTO DA COSTA"),
        Map.entry("03588588604", "CLAUDIO DE SOUZA"),
        Map.entry("05160755608", "CLAUDIO DO ROSARIO SOUZA"),
        Map.entry("77970764649", "CLAUDIONOR ANDRE DAS VIRGENS"),
        Map.entry("11562052632", "CLEBER APARECIDO MORENO"),
        Map.entry("01106391381", "CLEUDEMIR DO NASCIMENTO SILVA"),
        Map.entry("74876678120", "CONRADO AUGUSTO DE OLIVEIRA"),
        Map.entry("05483414608", "CRISTIANO VITALINO DOS SANTOS"),
        Map.entry("08281558601", "DANIELLE SALLES AMORIM"),
        Map.entry("05101892297", "DANILO OLIVEIRA ARAUJO"),
        Map.entry("09879351606", "DAVID REIS DE MOURA DA PAZ"),
        Map.entry("01169026630", "DILSON VENTURA SANTOS"),
        Map.entry("08028491642", "EDILTON LEANDRO DA SILVA"),
        Map.entry("08319123674", "EDIMILSON JOSE DE OLIVEIRA"),
        Map.entry("37737619100", "EDIVAINE DIONISIO DA SILVA"),
        Map.entry("05581160600", "EDMAR JOSE DA COSTA"),
        Map.entry("05791220693", "ELIDA SIMONE ALVES MOREIRA"),
        Map.entry("97045950691", "ELIDIO ANTONIO ROSA"),
        Map.entry("02868732658", "ELIODENES DE OLIVEIRA ROSA"),
        Map.entry("47186690220", "ELSON RIBEIRO FERREIRA"),
        Map.entry("02188965140", "ELZA GOMES DE OLIVEIRA SILVA"),
        Map.entry("08507025692", "ERIVALDO DA SILVA PEREIRA"),
        Map.entry("08056365605", "EVERTON CASTRO DA SILVA"),
        Map.entry("00371384648", "EZEQUIEL RAMOS DA SILVA"),
        Map.entry("03997868646", "FABIO DA SILVA LIMA"),
        Map.entry("02374559190", "FABIO JOSE DE SOUZA SALVIANO"),
        Map.entry("72537523253", "FAGNER DOS SANTOS MENDES"),
        Map.entry("08724653659", "FELIPE JUNIO ALVES MACIEL"),
        Map.entry("09477786756", "FERNANDO GOMES DE SOUZA"),
        Map.entry("03111072657", "FERNANDO LIMA DE OLIVEIRA"),
        Map.entry("07230651603", "FERNANDO SILVA SANTOS"),
        Map.entry("75191628268", "FRANCISCO AURI SOUZA DE MENEZES"),
        Map.entry("83241795187", "FRANCISCO DAS CHAGAS FERREIRA NOBREGA"),
        Map.entry("29930510249", "FRANCISCO PEREIRA LIMA"),
        Map.entry("59716010249", "FRANCOYS MORAES GONCALVES"),
        Map.entry("26978040215", "GERMANO DUARTE CARDOSO"),
        Map.entry("09506193614", "GILSON MENDES DOS SANTOS"),
        Map.entry("06133585625", "HARLEI BRUNO BADARO"),
        Map.entry("09322179660", "HEBERTH DA SILVA PEREIRA"),
        Map.entry("07402884660", "HERITON FREITAS DE CARVALHO"),
        Map.entry("15611761682", "IGOR FONSECA DE CASTRO"),
        Map.entry("61475459220", "IRANDIR NUNES AMORIM"),
        Map.entry("06279219658", "ISAIAS DOS SANTOS LOPES"),
        Map.entry("12196030660", "ISAIAS FILIPE MATIAS"),
        Map.entry("87588293268", "JACKSON DA CRUZ OLIVEIRA"),
        Map.entry("01109935510", "JAIR DE JESUS SANTOS"),
        Map.entry("06710498603", "JOAILSON DE OLIVEIRA FIGUEIREDO"),
        Map.entry("03031081692", "JOAO BATISTA DA ROCHA"),
        Map.entry("41961552604", "JORGE CARLOS BARBALHO"),
        Map.entry("99243741691", "JOSE CARLOS DOS SANTOS"),
        Map.entry("02789049637", "JOSE DE SOUZA QUATRINI"),
        Map.entry("60228336392", "JOSE RAIMUNDO DOS SANTOS MENDONCA"),
        Map.entry("66156882200", "JOSIMAR CHAGAS FREIRE"),
        Map.entry("00922087113", "JUVANILDO MARTINS DA SILVA"),
        Map.entry("03951379693", "KARINA EFIGENIA DA SILVA JOSE"),
        Map.entry("08819083639", "LAUDENIR PESSOA DE OLIVEIRA"),
        Map.entry("08835146640", "LEOENDER JUNIOR SILVA"),
        Map.entry("10777167611", "LUCIANO RODRIGUES FARIA"),
        Map.entry("06895394605", "LUIZ HENRIQUE MARTINS RAMOS"),
        Map.entry("08515566630", "MAGNO MAGALHAES LAGE"),
        Map.entry("52823563253", "MANOEL MESSIAS DOS SANTOS"),
        Map.entry("09807430607", "MARCELO APARECIDO CIRILO"),
        Map.entry("66413648600", "MARCELO CIRINO"),
        Map.entry("13188822650", "MARCELO GONZAGA OLAVO"),
        Map.entry("01477688617", "MARCELO JOSE DA SILVA"),
        Map.entry("09824907637", "MARCELO VIERA DE MATOS"),
        Map.entry("03552477128", "MARCIANO GONCALVES DA SILVA"),
        Map.entry("66570956604", "MARCIO DA FONSECA VIEIRA"),
        Map.entry("05687211608", "MARCOS JUNIOR DE SOUZA"),
        Map.entry("05928792670", "MARCOS TULIO DE OLIVEIRA"),
        Map.entry("05826649267", "MARLO BRANDO COELHO PEREIRA"),
        Map.entry("42059348668", "MAURO ROCHA GONCALVES"),
        Map.entry("10445182601", "MAXIMILIANO MONTEIRO DE SOUSA"),
        Map.entry("09879451651", "NELMER ALEXANDRE GOMES DE AGUIAR"),
        Map.entry("84427159672", "NILSON CECILIA BRAGA"),
        Map.entry("66842115272", "OLIEL NUNES SILVA"),
        Map.entry("08430623639", "PAULO CESAR DA COSTA JUNIOR"),
        Map.entry("06854983606", "RAFAEL JUNIO DE PAULA"),
        Map.entry("00948851686", "RAFAEL RODRIGUES LUIS"),
        Map.entry("75690985368", "RAIMUNDO NONATO EDUNVINGENE SOUSA"),
        Map.entry("02690147645", "REGINALDO APARECIDO XAVIER"),
        Map.entry("08057077603", "RENATO ADRIANO SERAFIM"),
        Map.entry("01466539631", "RICARDO HENRIQUE DE OLIVEIRA"),
        Map.entry("68619812653", "ROBERTO RODRIGUES CANDIDO"),
        Map.entry("12025006683", "RODRIGO TIAGO BRAGA"),
        Map.entry("77090330672", "ROGERIO DE JESUS BRAGA"),
        Map.entry("96155213534", "RONALDO ANDRADE DOS SANTOS"),
        Map.entry("27617314841", "RONALDO NASCIMENTO DE PAIVA"),
        Map.entry("04651595677", "RONIE CARLOS CARDOSO"),
        Map.entry("02669630219", "RONILDO ALVES DE FREITAS"),
        Map.entry("03556898632", "RUBENS NEI DAS CHAGAS"),
        Map.entry("04332235614", "SANDRO MAGNO DA CRUZ"),
        Map.entry("09629140616", "TAMIRES CRISTINA CRUZ LOURENCO"),
        Map.entry("07980978170", "THAIS DE PAIVA FERNANDES"),
        Map.entry("89558430200", "THOMAS MATEUS MACEDO"),
        Map.entry("08454739645", "TIAGO DE OLIVEIRA E SILVA"),
        Map.entry("00323815146", "VALDINEI JOSE DE ALMEIDA"),
        Map.entry("01930813260", "VALDIRLAN GOMES DA SILVA"),
        Map.entry("76792323187", "VALDUIR XAVIER PISSARRA"),
        Map.entry("04427071694", "VALMIR CASSIMIRO LUZIA"),
        Map.entry("00233082654", "VALTER CARDOSO CORREA"),
        Map.entry("13276949644", "VICTOR THADEU VIEIRA"),
        Map.entry("03732465608", "VIVIANE APARECIDA SANTOS ROSA"),
        Map.entry("85408506215", "WELLINGTON MARCOS NASCIMENTO SANTOS"),
        Map.entry("10284930610", "WEMERSON DIAS DA MOTA"),
        Map.entry("03751253610", "WERTHER DA SILVA BRITO"),
        Map.entry("00492483671", "WILLIAN SILVA BRITO"),
        Map.entry("04482479683", "WILSON SILVA DA ROCHA"),
        Map.entry("03614068277", "WIPSLORRANA LIMA DOS SANTOS")
    );

    

    public record KnownEmployee(String name, String cpf, String codigo, String matricula) {}

    public static final java.util.Map<String, KnownEmployee> KNOWN_REGISTRATION_TO_EMPLOYEE = java.util.Map.ofEntries(
        Map.entry("703", new KnownEmployee("HERITON FREITAS DE CARVALHO", "07402884660", "000703", "0000000703")),
        Map.entry("704", new KnownEmployee("MARCELO CIRINO", "66413648600", "000704", "0000000704")),
        Map.entry("705", new KnownEmployee("WERTHER DA SILVA BRITO", "03751253610", "000705", "0000000705")),
        Map.entry("729", new KnownEmployee("CLAUDIO DO ROSARIO SOUZA", "05160755608", "000729", "0000000729")),
        Map.entry("739", new KnownEmployee("VALDINEI JOSE DE ALMEIDA", "00323815146", "000739", "0000000739")),
        Map.entry("747", new KnownEmployee("JOSE CARLOS DOS SANTOS", "99243741691", "000747", "0000000747")),
        Map.entry("777", new KnownEmployee("VIVIANE APARECIDA SANTOS ROSA", "03732465608", "000777", "0000000777")),
        Map.entry("811", new KnownEmployee("AUGUSTINHO MOREIRA DE SALES", "89719638168", "000811", "0000000811")),
        Map.entry("815", new KnownEmployee("EDIVAINE DIONISIO DA SILVA", "37737619100", "000815", "0000000815")),
        Map.entry("849", new KnownEmployee("WILSON SILVA DA ROCHA", "04482479683", "000849", "0000000849")),
        Map.entry("920", new KnownEmployee("LUCIANO RODRIGUES FARIA", "10777167611", "000920", "0000000920")),
        Map.entry("926", new KnownEmployee("FABIO JOSE DE SOUZA SALVIANO", "02374559190", "000926", "0000000926")),
        Map.entry("930", new KnownEmployee("AILTON EVANGELISTA DA SILVA", "74732617620", "000930", "0000000930")),
        Map.entry("935", new KnownEmployee("TIAGO DE OLIVEIRA E SILVA", "08454739645", "000935", "0000000935")),
        Map.entry("944", new KnownEmployee("DAVID REIS DE MOURA DA PAZ", "09879351606", "000944", "0000000944")),
        Map.entry("946", new KnownEmployee("PAULO CESAR DA COSTA JUNIOR", "08430623639", "000946", "0000000946")),
        Map.entry("950", new KnownEmployee("RAFAEL JUNIO DE PAULA", "06854983606", "000950", "0000000950")),
        Map.entry("953", new KnownEmployee("EVERTON CASTRO DA SILVA", "08056365605", "000953", "0000000953")),
        Map.entry("954", new KnownEmployee("FABIO DA SILVA LIMA", "03997868646", "000954", "0000000954")),
        Map.entry("957", new KnownEmployee("OLIEL NUNES SILVA", "66842115272", "000957", "0000000957")),
        Map.entry("961", new KnownEmployee("FAGNER DOS SANTOS MENDES", "72537523253", "000961", "0000000961")),
        Map.entry("963", new KnownEmployee("FELIPE JUNIO ALVES MACIEL", "08724653659", "000963", "0000000963")),
        Map.entry("964", new KnownEmployee("VALDUIR XAVIER PISSARRA", "76792323187", "000964", "0000000964")),
        Map.entry("969", new KnownEmployee("AMAURI JOSE DE MOURA", "98848500625", "000969", "0000000969")),
        Map.entry("972", new KnownEmployee("ADAIR JOSE SOARES DE ABREU", "85655350610", "000972", "0000000972")),
        Map.entry("974", new KnownEmployee("RICARDO HENRIQUE DE OLIVEIRA", "01466539631", "000974", "0000000974")),
        Map.entry("975", new KnownEmployee("CONRADO AUGUSTO DE OLIVEIRA", "74876678120", "000975", "0000000975")),
        Map.entry("977", new KnownEmployee("TAMIRES CRISTINA CRUZ LOURENCO", "09629140616", "000977", "0000000977")),
        Map.entry("981", new KnownEmployee("LUIZ HENRIQUE MARTINS RAMOS", "06895394605", "000981", "0000000981")),
        Map.entry("984", new KnownEmployee("RONALDO NASCIMENTO DE PAIVA", "27617314841", "000984", "0000000984")),
        Map.entry("985", new KnownEmployee("REGINALDO APARECIDO XAVIER", "02690147645", "000985", "0000000985")),
        Map.entry("986", new KnownEmployee("WELLINGTON MARCOS NASCIMENTO SANTOS", "85408506215", "000986", "0000000986")),
        Map.entry("988", new KnownEmployee("GERMANO DUARTE CARDOSO", "26978040215", "000988", "0000000988")),
        Map.entry("989", new KnownEmployee("JUVANILDO MARTINS DA SILVA", "00922087113", "000989", "0000000989")),
        Map.entry("990", new KnownEmployee("WEMERSON DIAS DA MOTA", "10284930610", "000990", "0000000990")),
        Map.entry("991", new KnownEmployee("MARCELO GONZAGA OLAVO", "13188822650", "000991", "0000000991")),
        Map.entry("992", new KnownEmployee("ALCEMIR DOS SANTOS COSTA", "69011281268", "000992", "0000000992")),
        Map.entry("1000", new KnownEmployee("CLEUDEMIR DO NASCIMENTO SILVA", "01106391381", "001000", "0000001000")),
        Map.entry("1001", new KnownEmployee("FRANCISCO AURI SOUZA DE MENEZES", "75191628268", "001001", "0000001001")),
        Map.entry("1002", new KnownEmployee("IRANDIR NUNES AMORIM", "61475459220", "001002", "0000001002")),
        Map.entry("1003", new KnownEmployee("JOSE RAIMUNDO DOS SANTOS MENDONCA", "60228336392", "001003", "0000001003")),
        Map.entry("1005", new KnownEmployee("CARLOS ALBERTO BISPO DA SILVA", "01932901116", "001005", "0000001005")),
        Map.entry("1008", new KnownEmployee("BRUNO RAFAEL TEIXEIRA", "08379861680", "001008", "0000001008")),
        Map.entry("1009", new KnownEmployee("ANTONIO ROBERTO NICOLAU", "67582982649", "001009", "0000001009")),
        Map.entry("1010", new KnownEmployee("MAXIMILIANO MONTEIRO DE SOUSA", "10445182601", "001010", "0000001010")),
        Map.entry("1011", new KnownEmployee("FERNANDO GOMES DE SOUZA", "09477786756", "001011", "0000001011")),
        Map.entry("1012", new KnownEmployee("MARCELO VIERA DE", "09824907637", "001012", "0000001012")),
        Map.entry("1013", new KnownEmployee("RONIE CARLOS CARDOSO", "04651595677", "001013", "0000001013")),
        Map.entry("1014", new KnownEmployee("MANOEL MESSIAS DOS SANTOS", "52823563253", "001014", "0000001014")),
        Map.entry("1015", new KnownEmployee("FRANCISCO PEREIRA LIMA", "29930510249", "001015", "0000001015")),
        Map.entry("1016", new KnownEmployee("RAIMUNDO NONATO EDUNVINGENE SOUSA", "75690985368", "001016", "0000001016")),
        Map.entry("1017", new KnownEmployee("VALDIRLAN GOMES DA SILVA", "01930813260", "001017", "0000001017")),
        Map.entry("1020", new KnownEmployee("ROBERTO RODRIGUES CANDIDO", "68619812653", "001020", "0000001020")),
        Map.entry("1038", new KnownEmployee("EDILTON LEANDRO DA SILVA", "08028491642", "001038", "0000001038")),
        Map.entry("1040", new KnownEmployee("MAURO ROCHA GONCALVES", "42059348668", "001040", "0000001040")),
        Map.entry("1043", new KnownEmployee("MARCELO JOSE DA SILVA", "01477688617", "001043", "0000001043")),
        Map.entry("1045", new KnownEmployee("CELIO ROBERTO DA COSTA", "00638924642", "001045", "0000001045")),
        Map.entry("1062", new KnownEmployee("ISAIAS DOS SANTOS LOPES", "06279219658", "001062", "0000001062")),
        Map.entry("1093", new KnownEmployee("LAUDENIR PESSOA DE OLIVEIRA", "08819083639", "001093", "0000001093")),
        Map.entry("1095", new KnownEmployee("HEBERTH DA SILVA PEREIRA", "09322179660", "001095", "0000001095")),
        Map.entry("1106", new KnownEmployee("CASSIO FERREIRA DA SILVA", "03123388646", "001106", "0000001106")),
        Map.entry("1117", new KnownEmployee("ROGERIO DE JESUS BRAGA", "77090330672", "001117", "0000001117")),
        Map.entry("1120", new KnownEmployee("MARCIANO GONCALVES DA SILVA", "03552477128", "001120", "0000001120")),
        Map.entry("1123", new KnownEmployee("ANTONIO CARLOS DE CASTRO", "79511260634", "001123", "0000001123")),
        Map.entry("1125", new KnownEmployee("THAIS DE PAIVA FERNANDES", "07980978170", "001125", "0000001125")),
        Map.entry("1127", new KnownEmployee("ADELSO MOREIRA CATRINQUE", "13811972723", "001127", "0000001127")),
        Map.entry("1130", new KnownEmployee("ADEMIR APARECIDO NEZIO FERREIRA", "00964145618", "001130", "0000001130")),
        Map.entry("1131", new KnownEmployee("DANIELLE SALLES AMORIM", "08281558601", "001131", "0000001131")),
        Map.entry("1132", new KnownEmployee("DANILO OLIVEIRA ARAUJO", "05101892297", "001132", "0000001132")),
        Map.entry("1133", new KnownEmployee("ELIDIO ANTONIO ROSA", "97045950691", "001133", "0000001133")),
        Map.entry("1134", new KnownEmployee("ERIVALDO DA SILVA PEREIRA", "08507025692", "001134", "0000001134")),
        Map.entry("1135", new KnownEmployee("FERNANDO LIMA DE OLIVEIRA", "03111072657", "001135", "0000001135")),
        Map.entry("1136", new KnownEmployee("GILSON MENDES DOS SANTOS", "09506193614", "001136", "0000001136")),
        Map.entry("1139", new KnownEmployee("JORGE CARLOS BARBALHO", "41961552604", "001139", "0000001139")),
        Map.entry("1140", new KnownEmployee("KARINA EFIGENIA DA SILVA JOSE", "03951379693", "001140", "0000001140")),
        Map.entry("1141", new KnownEmployee("MARCIO DA FONSECA VIEIRA", "66570956604", "001141", "0000001141")),
        Map.entry("1142", new KnownEmployee("MARCOS JUNIOR DE SOUZA", "05687211608", "001142", "0000001142")),
        Map.entry("1143", new KnownEmployee("MARLO BRANDO COELHO PEREIRA", "05826649267", "001143", "0000001143")),
        Map.entry("1145", new KnownEmployee("NILSON CECILIA BRAGA", "84427159672", "001145", "0000001145")),
        Map.entry("1146", new KnownEmployee("RENATO ADRIANO SERAFIM", "08057077603", "001146", "0000001146")),
        Map.entry("1147", new KnownEmployee("RODRIGO TIAGO BRAGA", "12025006683", "001147", "0000001147")),
        Map.entry("1149", new KnownEmployee("SANDRO MAGNO DA CRUZ", "04332235614", "001149", "0000001149")),
        Map.entry("1150", new KnownEmployee("VALMIR CASSIMIRO LUZIA", "04427071694", "001150", "0000001150")),
        Map.entry("1151", new KnownEmployee("VALTER CARDOSO CORREA", "00233082654", "001151", "0000001151")),
        Map.entry("1152", new KnownEmployee("VICTOR THADEU VIEIRA", "13276949644", "001152", "0000001152")),
        Map.entry("1154", new KnownEmployee("FRANCISCO DAS CHAGAS FERREIRA NOBREGA", "83241795187", "001154", "0000001154")),
        Map.entry("1155", new KnownEmployee("ELSON RIBEIRO FERREIRA", "47186690220", "001155", "0000001155")),
        Map.entry("1156", new KnownEmployee("ADILSON JOSE DE SOUZA", "07998501600", "001156", "0000001156")),
        Map.entry("1159", new KnownEmployee("ANTONIO JOSE DE SOUSA GOMES", "27019659268", "001159", "0000001159")),
        Map.entry("1160", new KnownEmployee("RAFAEL RODRIGUES LUIS", "00948851686", "001160", "0000001160")),
        Map.entry("1161", new KnownEmployee("NELMER ALEXANDRE GOMES DE AGUIAR", "09879451651", "001161", "0000001161")),
        Map.entry("1162", new KnownEmployee("WILLIAN SILVA BRITO", "00492483671", "001162", "0000001162")),
        Map.entry("1163", new KnownEmployee("FERNANDO SILVA SANTOS", "07230651603", "001163", "0000001163")),
        Map.entry("1164", new KnownEmployee("WIPSLORRANA LIMA DOS SANTOS", "03614068277", "001164", "0000001164")),
        Map.entry("1165", new KnownEmployee("JACKSON DA CRUZ OLIVEIRA", "87588293268", "001165", "0000001165")),
        Map.entry("1166", new KnownEmployee("ALEX LIMA DOS SANTOS", "72024682200", "001166", "0000001166")),
        Map.entry("1167", new KnownEmployee("RONALDO ANDRADE DOS SANTOS", "96155213534", "001167", "0000001167")),
        Map.entry("1168", new KnownEmployee("JOSE DE SOUZA QUATRINI", "02789049637", "001168", "0000001168")),
        Map.entry("1169", new KnownEmployee("FRANCOYS MORAES GONCALVES", "59716010249", "001169", "0000001169")),
        Map.entry("1170", new KnownEmployee("MAGNO MAGALHAES LAGE", "08515566630", "001170", "0000001170")),
        Map.entry("1172", new KnownEmployee("ALISSON RODRIGO DOS SANTOS", "10914795694", "001172", "0000001172")),
        Map.entry("1173", new KnownEmployee("RONILDO ALVES DE FREITAS", "02669630219", "001173", "0000001173")),
        Map.entry("1174", new KnownEmployee("JOSIMAR CHAGAS FREIRE", "66156882200", "001174", "0000001174")),
        Map.entry("1175", new KnownEmployee("EDMAR JOSE DA COSTA", "05581160600", "001175", "0000001175")),
        Map.entry("1177", new KnownEmployee("CLEBER APARECIDO MORENO", "11562052632", "001177", "0000001177")),
        Map.entry("1178", new KnownEmployee("BRUNO FRANCA DA SILVA", "06195923621", "001178", "0000001178")),
        Map.entry("1179", new KnownEmployee("ADRIANO OLIVEIRA SILVA", "00768583594", "001179", "0000001179")),
        Map.entry("1180", new KnownEmployee("CLAUDIO DE SOUZA", "03588588604", "001180", "0000001180")),
        Map.entry("1181", new KnownEmployee("EDIMILSON JOSE DE OLIVEIRA", "08319123674", "001181", "0000001181")),
        Map.entry("1182", new KnownEmployee("IGOR FONSECA DE CASTRO", "15611761682", "001182", "0000001182")),
        Map.entry("1183", new KnownEmployee("THOMAS", "89558430200", "001183", "0000001183")),
        Map.entry("1185", new KnownEmployee("RUBENS NEI DAS CHAGAS", "03556898632", "001185", "0000001185")),
        Map.entry("1186", new KnownEmployee("MARCOS TULIO DE OLIVEIRA", "05928792670", "001186", "0000001186")),
        Map.entry("1187", new KnownEmployee("JAIR DE JESUS SANTOS", "01109935510", "001187", "0000001187")),
        Map.entry("1189", new KnownEmployee("BRENER DE OLIVEIRA PAIVA", "08084278657", "001189", "0000001189")),
        Map.entry("1190", new KnownEmployee("ISAIAS FILIPE", "12196030660", "001190", "0000001190")),
        Map.entry("1191", new KnownEmployee("JOAO BATISTA DA ROCHA", "03031081692", "001191", "0000001191")),
        Map.entry("1192", new KnownEmployee("CLAUDIONOR ANDRE DAS VIRGENS", "77970764649", "001192", "0000001192")),
        Map.entry("1193", new KnownEmployee("HARLEI BRUNO BADARO", "06133585625", "001193", "0000001193")),
        Map.entry("1194", new KnownEmployee("MARCELO APARECIDO CIRILO", "09807430607", "001194", "0000001194")),
        Map.entry("1195", new KnownEmployee("EZEQUIEL RAMOS DA SILVA", "00371384648", "001195", "0000001195")),
        Map.entry("1196", new KnownEmployee("JOAILSON DE OLIVEIRA FIGUEIREDO", "06710498603", "001196", "0000001196")),
        Map.entry("1197", new KnownEmployee("ELZA GOMES DE OLIVEIRA SILVA", "02188965140", "001197", "0000001197")),
        Map.entry("1198", new KnownEmployee("AMARILDO DIAS DE OLIVEIRA", "56385340678", "001198", "0000001198")),
        Map.entry("1199", new KnownEmployee("AILTON COSTA", "83565248653", "001199", "0000001199")),
        Map.entry("1200", new KnownEmployee("ALESSANDER GABRIEL JESUS COSTA", "14139615680", "001200", "0000001200")),
        Map.entry("1202", new KnownEmployee("ELIDA SIMONE ALVES MOREIRA", "05791220693", "001202", "0000001202")),
        Map.entry("1203", new KnownEmployee("ELIODENES DE OLIVEIRA ROSA", "02868732658", "001203", "0000001203")),
        Map.entry("1204", new KnownEmployee("CRISTIANO VITALINO DOS SANTOS", "05483414608", "001204", "0000001204")),
        Map.entry("1205", new KnownEmployee("LEOENDER JUNIOR SILVA", "08835146640", "001205", "0000001205")),
        Map.entry("1206", new KnownEmployee("DILSON VENTURA SANTOS", "01169026630", "001206", "0000001206"))
    );

    public static KnownEmployee getKnownEmployeeByRegistration(String reg) {
        if (reg == null || reg.isBlank()) return null;
        String clean = reg.replaceAll("[^0-9]", "").replaceFirst("^0+", "");
        KnownEmployee k = KNOWN_REGISTRATION_TO_EMPLOYEE.get(clean);
        if (k != null && k.cpf() != null && KNOWN_CPF_TO_NAME.containsKey(k.cpf())) {
            return new KnownEmployee(KNOWN_CPF_TO_NAME.get(k.cpf()), k.cpf(), k.codigo(), k.matricula());
        }
        return k;
    }

    private String formatCpf(String digits) {
        if (digits == null || digits.length() != 11) return digits;
        return digits.substring(0, 3) + "." + digits.substring(3, 6) + "." + digits.substring(6, 9) + "-" + digits.substring(9);
    }

    public static String getKnownNameForCpf(String cpf) {
        if (cpf == null) return null;
        String digits = cpf.replaceAll("[^0-9]", "");
        return KNOWN_CPF_TO_NAME.get(digits);
    }

    public static String sanitizeEmployeeName(String rawName) {
        if (rawName == null || rawName.isBlank()) return null;
        String cleaned = rawName
                .replaceAll("(?i)(?:Matr[ií]cula:?|Mat:?|Código:?|Registro:?|eSocial:?).*$", "")
                .replaceAll("(?i)^\\s*funcion[aá]rio\\s*", "")
                .replaceAll("(?i)^\\s*cpf\\s*:?\\s*", "")
                .replaceAll("\\b\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}\\b", "")
                .replaceAll("\\b\\d{11}\\b", "")
                .replaceAll("[^\\p{L}\\s.'-]", " ")
                .replaceAll("\\s+", " ")
                .trim();
        if (cleaned.length() < 3 || cleaned.equalsIgnoreCase("IMPORTADO") || cleaned.equalsIgnoreCase("CPF") || cleaned.matches("^\\d+$")) {
            return null;
        }
        return cleaned.toUpperCase();
    }

    private boolean isValidEmployeeName(String nome) {
        if (nome == null || nome.isBlank()) return false;
        String trimmed = nome.trim();
        if (trimmed.length() < 3) return false;
        if (trimmed.matches("^\\d+.*")) return false;
        if (trimmed.equalsIgnoreCase("CPF:") || trimmed.equalsIgnoreCase("CPF") || trimmed.toUpperCase().startsWith("CPF:")) return false;
        String lower = trimmed.toLowerCase();
        if (lower.contains("empregado - geral")
                || lower.contains("inclusive o empregado")
                || lower.contains("empregado público")
                || lower.contains("administração direta")
                || lower.contains("direta ou indireta")
                || lower.contains("contratado pela clt")
                || lower.contains("categoria")
                || lower.contains("trabalhador avulso")
                || lower.contains("estagiário")
                || lower.contains("contribuinte individual")
                || lower.contains("ficha de registro")
                || lower.contains("razão social")
                || lower.contains("relação de empregados")
                || lower.contains("quadro de horário")
                || lower.contains("livro de registro")
                || lower.contains("termo de rescisão")
                || lower.contains("aviso prévio")
                || lower.contains("comprovante de entrega")
                || lower.contains("ministério do trabalho")
                || lower.contains("secretaria da previdência")
                || lower.contains("esocial")
                || lower.contains("governo federal")
                || trimmed.matches("(?i).*\\b(ltda|s/?a|me|epp|eireli)\\b.*")) {
            return false;
        }
        return true;
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            return LocalDate.parse(dateStr.trim(), DATE_FORMATTER);
        } catch (DateTimeParseException e) {
            log.warn("Data inválida recebida: {}", dateStr);
            return null;
        }
    }
}
