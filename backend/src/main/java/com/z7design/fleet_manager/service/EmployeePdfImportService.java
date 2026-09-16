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
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeePdfImportService {

    private final EmployeeRepository employeeRepository;
    private final CompanyRepository companyRepository;

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
            PDFTextStripper stripper = new PDFTextStripper();
            
            // Tenta primeiro extrair pagina por pagina
            int totalPages = document.getNumberOfPages();
            StringBuilder fullTextBuilder = new StringBuilder();

            for (int i = 1; i <= totalPages; i++) {
                stripper.setStartPage(i);
                stripper.setEndPage(i);
                String pageText = stripper.getText(document);
                fullTextBuilder.append(pageText).append("\n---PAGE_BREAK---\n");
            }

            String fullText = fullTextBuilder.toString();
            log.info("PDF lido com {} páginas. Tamanho texto total: {} caracteres", totalPages, fullText.length());            // Tentar primeiro por quebras de página se houver mais de uma página
            String[] pageBlocks = fullText.split("---PAGE_BREAK---");
            if (pageBlocks.length > 1) {
                for (String page : pageBlocks) {
                    if (page != null && (page.toLowerCase().contains("nome") || page.toLowerCase().contains("cpf") || page.toLowerCase().contains("empregado") || page.toLowerCase().contains("ficha"))) {
                        pdfBlocks.add(page);
                    }
                }
            }

            if (pdfBlocks.isEmpty()) {
                // Dividir por blocos de empresa / funcionário
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

            // Se ainda não encontrou blocos separados, tratar o texto completo como 1 bloco
            if (pdfBlocks.isEmpty() && !fullText.trim().isEmpty()) {
                pdfBlocks.add(fullText);
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

        // 2. Reconhecimento e Vinculação Automática da Empresa pelo CNPJ da Ficha
        Company company = null;
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

        // 2.6. Fallback para o tenant logado apenas se não foi possível identificar nem criar a empresa
        if (company == null) {
            UUID currentTenantCompanyId = com.z7design.fleet_manager.tenant.TenantContext.getCurrentTenant();
            if (currentTenantCompanyId != null) {
                Optional<Company> optComp = companyRepository.findById(currentTenantCompanyId);
                if (optComp.isPresent()) {
                    company = optComp.get();
                }
            }
        }

        // 3. Extração dos Dados Pessoais do Empregado
        String nome = extractValue(text, "(?:Nome(?:\\s*do\\s*(?:Empregado|Trabalhador|Funcionário)?)?|Empregado|Trabalhador)\\s*:\\s*([^\\n\\r]+?)(?=\\s*(?:Mat:?|Código:|CPF:|RG:|Sexo:|Nascimento:|$))");
        if (nome == null || nome.isBlank()) {
            nome = extractValue(text, "Nome\\s*:\\s*([^\\n\\r]+)");
        }
        if (nome == null || nome.isBlank()) {
            nome = extractValue(text, "Empregado\\s*:\\s*([^\\n\\r]+)");
        }
        if (nome != null) {
            nome = nome.replaceAll("(?i)(Mat:?|Código:).*$", "").trim();
        }

        String matricula = extractValue(text, "(?:Mat:?|Matrícula|Código)\\s*:\\s*(\\d+)");
        String codigo = extractValue(text, "Código\\s*:\\s*(\\d+)");
        String pai = extractValue(text, "Pai\\s*:\\s*([^\\n\\r]+?)(?=\\s*Nr\\.\\s*Recibo:|$)");
        String nrRecibo = extractValue(text, "Nr\\.\\s*Recibo\\s*:\\s*([\\d.]+)");
        String mae = extractValue(text, "Mãe\\s*:\\s*([^\\n\\r]+)");
        String nascimentoStr = extractValue(text, "(?:Nascimento|Data\\s*de\\s*Nasc\\.?)\\s*:\\s*(\\d{2}/\\d{2}/\\d{4})");
        String sexo = extractValue(text, "Sexo\\s*:\\s*([^\\n\\r]+?)(?=\\s*Est\\.\\s*Civil:|$)");
        String estadoCivil = extractValue(text, "Est\\.\\s*Civil\\s*:\\s*([^\\n\\r]+?)(?=\\s*Raça/Cor:|$)");
        String racaCor = extractValue(text, "Raça/Cor\\s*:\\s*([^\\n\\r]+)");
        String naturalidade = extractValue(text, "Naturalidade\\s*:\\s*([^\\n\\r]+?)(?=\\s*Nacionalidade:|$)");
        String nacionalidade = extractValue(text, "Nacionalidade\\s*:\\s*([^\\n\\r]+)");

        // Endereço Empregado
        String enderecoRua = extractValue(text, "Endereço\\s*:\\s*Rua\\s+([^\\n\\r]+?)(?=\\s*Bairro:|$)");
        if (enderecoRua == null) {
            enderecoRua = extractValue(text, "Endereço\\s*:\\s*([^\\n\\r]+?)(?=\\s*Bairro:|$)");
        }
        String bairroEmpregado = extractValue(text, "Bairro\\s*:\\s*([^\\n\\r]+?)(?=\\s*CEP:|$)");
        String cepEmpregado = extractValue(text, "CEP\\s*:\\s*([\\d.-]+)");
        String municipioEmpregado = extractValue(text, "Município\\s*:\\s*([^\\n\\r]+)");

        // Documentos
        String cpf = extractValue(text, "CPF\\s*:?\\s*([\\d.-]+)");
        if (cpf == null || cpf.isBlank()) {
            cpf = extractValue(text, "(?:CPF/CNPJ|Documento)\\s*:?\\s*([\\d.-]{11,14})");
        }
        String rg = extractValue(text, "RG\\s*:\\s*([^\\n\\r]*?)(?=\\s*Órgão:|$)");
        String rgOrgao = extractValue(text, "Órgão\\s*:\\s*([^\\n\\r]*?)(?=\\s*Estado:|$)");
        String rgEstado = extractValue(text, "Estado\\s*:\\s*([^\\n\\r]*?)(?=\\s*Emissão\\s*RG:|$)");
        String rgEmissaoStr = extractValue(text, "Emissão\\s*RG\\s*:\\s*(\\d{2}/\\d{2}/\\d{4})");

        String ctpsNumero = extractValue(text, "Número\\s*CTPS\\s*:\\s*(\\d+)");
        String ctpsSerie = extractValue(text, "Série\\s*CTPS\\s*:\\s*(\\d+)");
        String ctpsEstado = extractValue(text, "Estado\\s*CTPS\\s*:\\s*([A-Za-z]{2})");
        String ctpsExpedicaoStr = extractValue(text, "Expedição\\s*CTPS\\s*:\\s*(\\d{2}/\\d{2}/\\d{4})");

        String pis = extractValue(text, "PIS\\s*:\\s*([\\d.-]+)");
        String pisCadastroStr = extractValue(text, "Cadastro\\s*PIS\\s*:\\s*(\\d{2}/\\d{2}/\\d{4})");
        String instrucao = extractValue(text, "Instrução\\s*:\\s*([^\\n\\r]+)");

        String cnh = extractValue(text, "CNH\\s*:\\s*(\\d+)");
        String cnhCategoria = extractValue(text, "Categoria\\s*CNH\\s*:\\s*([A-E]+)");
        String cnhValidadeStr = extractValue(text, "Validade\\s*CNH\\s*:\\s*(\\d{2}/\\d{2}/\\d{4})");

        String reservista = extractValue(text, "Reservista\\s*:\\s*([^\\n\\r]*?)(?=\\s*Categoria:|$)");
        String reservistaCategoria = extractValue(text, "Categoria\\s*:\\s*([^\\n\\r]*?)(?=\\s*Tít\\.\\s*Eleitoral:|$)");

        String tituloEleitoral = extractValue(text, "Tít\\.\\s*Eleitoral\\s*:\\s*([\\d./-]+)");
        String zona = extractValue(text, "Zona\\s*:\\s*(\\d+)");
        String secao = extractValue(text, "Seção\\s*:\\s*(\\d+)");

        String banco = extractValue(text, "Banco\\s*:\\s*([^\\n\\r]*?)(?=\\s*Conta:|$)");
        String conta = extractValue(text, "Conta\\s*:\\s*([^\\n\\r]*?)(?=\\s*Dígito:|$)");
        String digito = extractValue(text, "Dígito\\s*:\\s*([^\\n\\r]*?)(?=\\s*Agência:|$)");
        String agencia = extractValue(text, "Agência\\s*:\\s*([^\\n\\r]*?)(?=\\s*Sindicato:|$)");

        String sindicato = extractValue(text, "Sindicato\\s*:\\s*([^\\n\\r]+)");
        String consProfis = extractValue(text, "Cons\\.\\s*Profis\\s*:\\s*([^\\n\\r]*?)(?=\\s*Registro\\s*Profis:|$)");
        String registroProfis = extractValue(text, "Registro\\s*Profis\\s*:\\s*([^\\n\\r]*?)(?=\\s*Data\\s*Registro:|$)");
        String dataRegistroProfisStr = extractValue(text, "Data\\s*Registro\\s*:\\s*(\\d{2}/\\d{2}/\\d{4})");

        // 4. Extração do Contrato de Trabalho
        String admissaoStr = extractValue(text, "Admissão\\s*:\\s*(\\d{2}/\\d{2}/\\d{4})");
        String optanteFgtsStr = extractValue(text, "Optante\\s*FGTS\\s*:\\s*(Sim|Não)");
        String fgtsDataOpcaoStr = extractValue(text, "Data\\s*Opção\\s*:\\s*(\\d{2}/\\d{2}/\\d{4})");
        String cargo = extractValue(text, "Cargo\\s*:\\s*([^\\n\\r]+?)(?=\\s*CBO:|$)");
        String cbo = extractValue(text, "CBO\\s*:\\s*(\\d+)");
        String organograma = extractValue(text, "Organograma\\s*:\\s*([^\\n\\r]+)");

        String remuneracaoStr = extractValue(text, "Remuneração\\s*:\\s*([\\d.,]+)");
        String modoPgto = extractValue(text, "Modo\\s*Pgto\\s*:\\s*([^\\n\\r]+?)(?=\\s*Período:|$)");
        String periodoPgto = extractValue(text, "Período\\s*:\\s*([^\\n\\r]+)");
        String escala = extractValue(text, "Escala\\s*:\\s*([^\\n\\r]+)");

        // 5. Extração de Cônjuge / Ficha Familiar
        String spouseName = null;
        LocalDate spouseBirthDate = null;
        Matcher familyMatcher = Pattern.compile("(\\d+)\\s+([A-Z\\s]{3,})\\s+(\\d{2}/\\d{2}/\\d{4})\\s+([A-Za-zçãÕáéíóúÁÉÍÓÚ]+)").matcher(text);
        if (familyMatcher.find()) {
            spouseName = familyMatcher.group(2).trim();
            spouseBirthDate = parseDate(familyMatcher.group(3));
        }

        // 6. Verificar se o funcionário já existe por CPF (na empresa ou no sistema) ou abre novo registro
        Employee employee = null;
        boolean isNew = false;
        if (cpf != null && !cpf.isBlank()) {
            String sanitizedCpf = cpf.replaceAll("[^0-9]", "");
            if (company != null && company.getId() != null) {
                Optional<Employee> existingInCompany = employeeRepository.findByCpfAndCompanyId(sanitizedCpf, company.getId());
                if (existingInCompany.isPresent()) {
                    employee = existingInCompany.get();
                }
            }

            if (employee == null) {
                Optional<Employee> existingOpt = employeeRepository.findByCpf(sanitizedCpf);
                if (existingOpt.isEmpty()) {
                    existingOpt = employeeRepository.findByDocument(sanitizedCpf);
                }
                if (existingOpt.isEmpty()) {
                    existingOpt = employeeRepository.findByDocument(cpf);
                }
                if (existingOpt.isPresent()) {
                    employee = existingOpt.get();
                }
            }

            if (employee != null) {
                log.info("Atualizando funcionário existente ID: {}, CPF: {}, Empresa: {}", employee.getId(), cpf, company != null ? company.getName() : "N/A");
            }
        }

        if (employee == null) {
            employee = new Employee();
            employee.setStatus(EmploymentStatus.ACTIVE);
            isNew = true;
            log.info("Criando novo funcionário. Nome: {}, CPF: {}, Empresa: {}", nome, cpf, company != null ? company.getName() : "N/A");
        }

        // Preenchimento e Vinculação dos dados do Empregador/Empresa
        if (company != null) {
            employee.setCompanyId(company.getId());
            if (company.getName() != null) employee.setEmpresaNome(truncate(company.getName(), 255));
            if (company.getCnpj() != null) employee.setEmpresaCnpj(truncate(company.getCnpj(), 30));
        } else {
            if (empresaRazaoSocial != null) employee.setEmpresaNome(truncate(empresaRazaoSocial, 255));
            if (cnpjCei != null) employee.setEmpresaCnpj(truncate(cnpjCei, 30));
        }
        if (employee.getEmpresaNome() == null && empresaRazaoSocial != null) employee.setEmpresaNome(truncate(empresaRazaoSocial, 255));
        if (employee.getEmpresaCnpj() == null && cnpjCei != null) employee.setEmpresaCnpj(truncate(cnpjCei, 30));
        if (ativFederal != null) employee.setAtivFederal(truncate(ativFederal, 50));
        if (empresaEndereco != null) employee.setEmpresaEndereco(truncate(empresaEndereco, 255));

        // Preenchimento dos dados do Empregado
        if (nome != null && !nome.isBlank()) {
            employee.setName(truncate(nome, 255));
        } else if (employee.getName() == null || employee.getName().isBlank()) {
            if (cpf != null && !cpf.isBlank()) {
                employee.setName("Funcionário " + cpf);
            } else if (matricula != null && !matricula.isBlank()) {
                employee.setName("Funcionário " + matricula);
            } else {
                employee.setName("Funcionário Importado");
            }
        }
        if (cpf != null) employee.setDocument(truncate(cpf.replaceAll("[^0-9]", ""), 20));
        if (matricula != null) employee.setRegistrationNumber(truncate(matricula, 50));
        if (codigo != null) employee.setCodigoFuncionario(truncate(codigo, 50));
        if (pai != null) employee.setNomePai(truncate(pai, 100));
        if (nrRecibo != null) employee.setNumeroRecibo(truncate(nrRecibo, 50));
        if (mae != null) employee.setNomeMae(truncate(mae, 100));

        if (nascimentoStr != null) employee.setBirthDate(parseDate(nascimentoStr));
        if (sexo != null) employee.setSexo(truncate(sexo, 20));
        if (estadoCivil != null) employee.setMaritalStatus(truncate(estadoCivil, 30));
        if (racaCor != null) employee.setRacaCor(truncate(racaCor, 30));

        if (naturalidade != null) {
            employee.setLocalNascimento(truncate(naturalidade, 100));
            employee.setMunicipioNascimento(truncate(naturalidade, 100));
        }
        if (nacionalidade != null) employee.setNationality(truncate(nacionalidade, 50));

        // Endereço
        if (enderecoRua != null) employee.setEnderecoRua(truncate(enderecoRua, 255));
        if (bairroEmpregado != null) employee.setEnderecoBairro(truncate(bairroEmpregado, 100));
        if (cepEmpregado != null) employee.setEnderecoCep(truncate(cepEmpregado, 10));
        if (municipioEmpregado != null) {
            employee.setEnderecoCidade(truncate(municipioEmpregado, 100));
        }

        // Documentos Adicionais
        if (rg != null) employee.setCinNumero(truncate(rg, 30));
        if (rgOrgao != null) employee.setCarteiraIdentidadeOrgaoEmissor(truncate(rgOrgao, 50));
        if (rgEstado != null) employee.setEnderecoEstado(formatUf(rgEstado));
        if (rgEmissaoStr != null) employee.setCarteiraIdentidadeDataEmissao(parseDate(rgEmissaoStr));

        if (ctpsNumero != null) employee.setCtps(truncate(ctpsNumero, 20));
        if (ctpsSerie != null) employee.setCtpsSeries(truncate(ctpsSerie, 20));
        if (ctpsEstado != null) employee.setCtpsUf(formatUf(ctpsEstado));
        if (ctpsExpedicaoStr != null) employee.setCtpsIssueDate(parseDate(ctpsExpedicaoStr));

        if (pis != null) employee.setPis(truncate(pis, 20));
        if (pisCadastroStr != null) employee.setPisDataCadastro(parseDate(pisCadastroStr));
        if (instrucao != null) employee.setGrauInstrucao(truncate(instrucao, 100));

        if (cnh != null) employee.setCnhNumber(truncate(cnh, 20));
        if (cnhCategoria != null) employee.setCnhCategory(truncate(cnhCategoria, 10));
        if (cnhValidadeStr != null) employee.setCnhExpirationDate(parseDate(cnhValidadeStr));

        if (reservista != null) employee.setCertificadoMilitar(truncate(reservista, 30));
        if (reservistaCategoria != null) employee.setReservistaCategoria(truncate(reservistaCategoria, 50));

        if (tituloEleitoral != null) employee.setTituloEleitor(truncate(tituloEleitoral, 30));
        if (zona != null) employee.setTituloEleitorZona(truncate(zona, 10));
        if (secao != null) employee.setTituloEleitorSecao(truncate(secao, 10));

        // Dados Bancários
        if (banco != null) employee.setBanco(truncate(banco, 50));
        if (agencia != null) employee.setAgencia(truncate(agencia, 20));
        if (conta != null) {
            String fullConta = conta.trim() + (digito != null && !digito.isBlank() ? "-" + digito.trim() : "");
            employee.setContaCorrente(truncate(fullConta, 30));
        }

        if (sindicato != null) employee.setSindicato(truncate(sindicato, 100));
        if (consProfis != null) employee.setNomeConselhoRegional(truncate(consProfis, 100));
        if (registroProfis != null) employee.setRegistroProfissional(truncate(registroProfis, 50));
        if (dataRegistroProfisStr != null) employee.setDataRegistroProfissional(parseDate(dataRegistroProfisStr));

        // Contrato de Trabalho
        if (admissaoStr != null) employee.setHireDate(parseDate(admissaoStr));
        if (optanteFgtsStr != null) employee.setFgtsOptante("Sim".equalsIgnoreCase(optanteFgtsStr.trim()));
        if (fgtsDataOpcaoStr != null) employee.setFgtsDataOpcao(parseDate(fgtsDataOpcaoStr));
        if (cbo != null) employee.setCbo(truncate(cbo, 20));
        if (organograma != null) employee.setOrganograma(truncate(organograma, 100));

        if (remuneracaoStr != null) {
            try {
                String cleanVal = remuneracaoStr.replace(".", "").replace(",", ".").trim();
                employee.setSalario(new BigDecimal(cleanVal));
            } catch (Exception e) {
                log.warn("Erro ao converter remuneração '{}'", remuneracaoStr);
            }
        }
        if (modoPgto != null) employee.setModoPagamento(truncate(modoPgto, 50));
        if (periodoPgto != null) employee.setPeriodoPagamento(truncate(periodoPgto, 50));
        if (escala != null) employee.setEscalaTrabalho(truncate(escala, 255));

        // Ficha Familiar
        if (spouseName != null) {
            employee.setSpouseName(truncate(spouseName, 255));
            employee.setSpouseBirthDate(spouseBirthDate);
        }

        try {
            Employee saved = employeeRepository.save(employee);
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
