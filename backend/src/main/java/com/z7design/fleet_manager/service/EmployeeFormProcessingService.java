package com.z7design.fleet_manager.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeFormProcessingService {

    private final com.z7design.fleet_manager.repository.CompanyRepository companyRepository;

    public Map<String, Object> processEmployeeForm(MultipartFile file) throws IOException {
        validatePdf(file);
        String text = extractText(file);
        return parseFields(text);
    }

    private void validatePdf(MultipartFile file) {
        if (file.isEmpty()) throw new IllegalArgumentException("Arquivo vazio");
        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            throw new IllegalArgumentException("O arquivo deve ser um PDF");
        }
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("Arquivo muito grande. Máximo 10MB");
        }
    }

    private String extractText(MultipartFile file) throws IOException {
        try (PDDocument document = PDDocument.load(file.getInputStream())) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            return stripper.getText(document);
        }
    }

    private Map<String, Object> parseFields(String text) {
        Map<String, Object> out = new HashMap<>();

        // Helpers
        java.util.function.BiConsumer<String, String> grab = (key, patternStr) -> {
            Matcher m = Pattern.compile(patternStr, Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE).matcher(text);
            if (m.find()) {
                String val = m.groupCount() >= 2 && m.group(2) != null ? m.group(2) : m.group(1);
                out.put(key, val != null ? val.trim() : null);
            }
        };

        // Empresa (cabeçalho)
        grab.accept("empresaNome", "(?:Da\\s+firma|Empresa|Razão\\s*Social|Empregador)[:\\s]+([^\\n\\r]+)");
        grab.accept("empresaEndereco", "Endere[çc]o[:\\s]+([^\\n\\r]+)");
        grab.accept("empresaCnpj", "(?:CNPJ(?:\\s*/\\s*(?:CEI|MF))?|C\\.?N\\.?P\\.?J\\.?(?:\\s*/\\s*(?:CEI|MF))?|CEI|Inscrição\\s*(?:Federal|do\\s*Empregador))\\s*[:\\s]+([\\d./-]+)");

        // Fallback para CNPJ caso não encontre por rótulo
        if (!out.containsKey("empresaCnpj") || out.get("empresaCnpj") == null || ((String) out.get("empresaCnpj")).replaceAll("[^0-9]", "").length() < 11) {
            Matcher cnpjM = Pattern.compile("(\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2})").matcher(text);
            if (cnpjM.find()) {
                out.put("empresaCnpj", cnpjM.group(1));
            }
        }

        // IdentificaÃ§Ã£o
        grab.accept("name", "Nome[:\\s]+([^\\n\\r]+)");
        grab.accept("cpf", "CPF[./\\s:]*([\\d.-]+)");
        grab.accept("rg", "(C\\.\\s*Identidade|RG)[:\\s]+([^\\n\\r]+)");
        grab.accept("carteiraIdentidadeOrgaoEmissor", "[Ã“O]rg[Ã£a]o\\s*Emissor[:\\s]+([^\\n\\r]+)");
        grab.accept("carteiraIdentidadeDataEmissao", "C\\.\\s*Identidade.*?Data[:\\s]+([^\\n\\r]+)");
        grab.accept("birthDate", "Data de Nascimento[:\\s]+([^\\n\\r]+)");
        grab.accept("address", "Resid[Ãªe]ncia|Endere[Ã§c]o[:\\s]+([^\\n\\r]+)");
        grab.accept("cep", "CEP[:\\s]+([^\\n\\r]+)");
        grab.accept("city", "Cidade[:\\s]+([^\\n\\r]+)");
        grab.accept("nationality", "Nacionalidade[:\\s]+([^\\n\\r]+)");
        grab.accept("maritalStatus", "Estado\\s*civil[:\\s]+([^\\n\\r]+)");
        grab.accept("fatherName", "Filho de[:\\s]+([^\\n\\r]+)");
        grab.accept("motherName", "e de[:\\s]+([^\\n\\r]+)");

        // Emprego
        grab.accept("position", "fun[cÃ§][aÃ£]o(?: de)?[:\\s]+([^\\n\\r]+)");
        grab.accept("cbo", "CBO[:\\s]+([\\d.]+)");
        grab.accept("hireDate", "(foi admitido em|Admiss[aÃ£]o)[:\\s]+([^\\n\\r]+)");
        grab.accept("salary", "Sal[aÃ¡]rio[:\\s]+([^\\n\\r]+)");
        grab.accept("horarioTrabalho", "(Jornada de Trabalho|hor[Ã¡a]rio de trabalho)[:\\s]+([^\\n\\r]+)");
        grab.accept("folgaSemanal", "FOLGA\\s+SEMANAL[:\\s]+([^\\n\\r]+)");

        // FGTS
        grab.accept("fgtsDataOpcao", "Data da op[cÃ§][aÃ£]o[:\\s]+([^\\n\\r]+)");
        grab.accept("fgtsDataRetratacao", "Data da retrata[cÃ§][aÃ£]o[:\\s]+([^\\n\\r]+)");
        grab.accept("fgtsBancoDepositario", "Banco deposit[Ã¡a]rio[:\\s]+([^\\n\\r]+)");
        Matcher fgtsOpt = Pattern.compile("optante\\?\\s*(Sim|N[aÃ£]o)", Pattern.CASE_INSENSITIVE).matcher(text);
        if (fgtsOpt.find()) out.put("fgtsOptante", fgtsOpt.group(1).toLowerCase().contains("sim"));

        // PIS
        grab.accept("pisDataCadastro", "Cadastrado\\s*em[:\\s]+([^\\n\\r]+)");
        grab.accept("pis", "sob\\s*n[Âºo]\\s*[:\\s]+([^\\n\\r]+)");
        grab.accept("pisBancoDepositario", "dep\\.\\s*no\\s*Banco[:\\s]+([^\\n\\r]+)");
        grab.accept("pisEnderecoBanco", "Endere[Ã§c]o[:\\s]+([^\\n\\r]+)");
        grab.accept("pisCodigoBanco", "C[Ã³o]digo\\s*Banco[:\\s]+([^\\n\\r]+)");
        grab.accept("pisCodigoAgencia", "C[Ã³o]digo\\s*ag[Ãªe]ncia[:\\s]+([^\\n\\r]+)");

        // CNH
        grab.accept("cnhNumber", "(Cart\\.\\s*Nac\\.\\s*Habilita[Ã§c][aÃ£]o.*?n[Âºo]|CNH)[:\\s]+([^\\n\\r]+)");
        grab.accept("cnhCategory", "Cat\\.?:\\s*([^\\n\\r]+)");
        grab.accept("cnhExpirationDate", "Validade[:\\s]+([^\\n\\r]+)");

        // Diversos
        grab.accept("notes", "Observa[Ã§c][Ãµo]es[:\\s]+([^\\n\\r]+)");

        // TÃ­tulo de eleitor
        grab.accept("tituloEleitor", "T[Ã­i]tulo de Eleitor\\s*n\\.?[:\\s]+([^\\n\\r]+)");
        grab.accept("tituloEleitorZona", "zona[:\\s]+([^\\n\\r]+)");
        grab.accept("tituloEleitorSecao", "se[cÃ§][aÃ£]o[:\\s]+([^\\n\\r]+)");

        // Estrangeiro
        grab.accept("carteiraModelo19", "Carteira modelo\\s*19\\s*n\\.?[:\\s]+([^\\n\\r]+)");
        grab.accept("registroGeralEstrangeiro", "n\\.?\\s*Registro Geral[:\\s]+([^\\n\\r]+)");
        grab.accept("casadoBrasileiro", "Casado\\(a\\) c\\/ bras\\.\\?[:\\s]+([^\\n\\r]+)");
        grab.accept("spouseName", "Nome do C[oÃ´]njuge[:\\s]+([^\\n\\r]+)");
        grab.accept("temFilhosBrasileiros", "Tem filhos brasileiros\\?[:\\s]+([^\\n\\r]+)");
        grab.accept("quantidadeFilhosBrasileiros", "Quantos[:\\s]+([^\\n\\r]+)");
        grab.accept("dataChegadaBrasil", "Data de chegada ao Brasil[:\\s]+([^\\n\\r]+)");
        grab.accept("naturalizado", "Naturalizado[:\\s]+([^\\n\\r]+)");
        grab.accept("decretoNaturalizacao", "Decreto\\s*n\\.?[:\\s]+([^\\n\\r]+)");

        // NÃºmero da ficha (cabeÃ§alho)
        grab.accept("fichaNumero", "FICHA\\s+DE\\s+REGISTRO\\s+DOS\\s+EMPREGADOS\\s*N[Âºo]\\s*([0-9]+)");

        log.debug("Campos extraÃ­dos: {}", out.keySet());

        // Estruturar por blocos
        Map<String, Object> employer = new HashMap<>();
        employer.put("companyName", out.get("empresaNome"));
        employer.put("cnpj", out.get("empresaCnpj"));
        employer.put("address", out.get("empresaEndereco"));
        employer.put("recordNumber", out.get("fichaNumero"));

        // Identificar e associar Empresa do Banco de Dados a partir do CNPJ da ficha
        String cnpjStr = (String) out.get("empresaCnpj");
        String nomeEmpresaStr = (String) out.get("empresaNome");
        if (cnpjStr != null) {
            String sanitizedCnpj = cnpjStr.replaceAll("[^0-9]", "");
            if (sanitizedCnpj.length() == 14 || sanitizedCnpj.length() == 11) {
                var found = companyRepository.findByNormalizedCnpj(sanitizedCnpj);
                if (!found.isEmpty()) {
                    var comp = found.get(0);
                    employer.put("companyId", comp.getId());
                    employer.put("companyName", comp.getName());
                    employer.put("cnpj", comp.getCnpj() != null ? comp.getCnpj() : cnpjStr);
                    out.put("companyId", comp.getId());
                } else {
                    var optComp = companyRepository.findByCnpj(cnpjStr);
                    if (optComp.isEmpty()) {
                        optComp = companyRepository.findByCnpj(sanitizedCnpj);
                    }
                    if (optComp.isPresent()) {
                        var comp = optComp.get();
                        employer.put("companyId", comp.getId());
                        employer.put("companyName", comp.getName());
                        employer.put("cnpj", comp.getCnpj() != null ? comp.getCnpj() : cnpjStr);
                        out.put("companyId", comp.getId());
                    }
                }
            }
        }
        if (!employer.containsKey("companyId") && nomeEmpresaStr != null && !nomeEmpresaStr.isBlank()) {
            var optComp = companyRepository.findByNormalizedName(nomeEmpresaStr.trim());
            if (optComp.isPresent()) {
                var comp = optComp.get();
                employer.put("companyId", comp.getId());
                employer.put("companyName", comp.getName());
                out.put("companyId", comp.getId());
            }
        }

        Map<String, Object> employee = new HashMap<>();
        employee.put("name", out.get("name"));
        employee.put("cpf", out.get("cpf"));
        employee.put("rg", out.get("rg"));
        employee.put("issuingAuthority", out.get("carteiraIdentidadeOrgaoEmissor"));
        employee.put("rgIssueDate", out.get("carteiraIdentidadeDataEmissao"));
        employee.put("birthDate", out.get("birthDate"));
        employee.put("nationality", out.get("nationality"));
        employee.put("maritalStatus", out.get("maritalStatus"));
        employee.put("fatherName", out.get("fatherName"));
        employee.put("motherName", out.get("motherName"));
        employee.put("address", out.get("address"));
        employee.put("cep", out.get("cep"));
        employee.put("city", out.get("city"));

        Map<String, Object> contract = new HashMap<>();
        contract.put("admissionDate", out.get("hireDate"));
        contract.put("position", out.get("position"));
        contract.put("cbo", out.get("cbo"));
        contract.put("salary", out.get("salary"));
        contract.put("paymentPeriod", out.get("periodoPagamento"));
        contract.put("workSchedule", out.get("horarioTrabalho"));
        contract.put("weeklyRest", out.get("folgaSemanal"));

        Map<String, Object> fgts = new HashMap<>();
        fgts.put("optante", out.get("fgtsOptante"));
        fgts.put("optionDate", out.get("fgtsDataOpcao"));
        fgts.put("retractionDate", out.get("fgtsDataRetratacao"));
        fgts.put("bank", out.get("fgtsBancoDepositario"));

        Map<String, Object> pis = new HashMap<>();
        pis.put("number", out.get("pis"));
        pis.put("registeredAt", out.get("pisDataCadastro"));
        pis.put("bank", out.get("pisBancoDepositario"));
        pis.put("address", out.get("pisEnderecoBanco"));
        pis.put("bankCode", out.get("pisCodigoBanco"));
        pis.put("agencyCode", out.get("pisCodigoAgencia"));

        Map<String, Object> voter = new HashMap<>();
        voter.put("titulo", out.get("tituloEleitor"));
        voter.put("zona", out.get("tituloEleitorZona"));
        voter.put("secao", out.get("tituloEleitorSecao"));

        Map<String, Object> foreigner = new HashMap<>();
        foreigner.put("carteiraModelo19", out.get("carteiraModelo19"));
        foreigner.put("registroGeral", out.get("registroGeralEstrangeiro"));
        foreigner.put("casadoComBrasileiro", out.get("casadoBrasileiro"));
        foreigner.put("spouseName", out.get("spouseName"));
        foreigner.put("temFilhosBrasileiros", out.get("temFilhosBrasileiros"));
        foreigner.put("quantidadeFilhosBrasileiros", out.get("quantidadeFilhosBrasileiros"));
        foreigner.put("dataChegadaBrasil", out.get("dataChegadaBrasil"));
        foreigner.put("naturalizado", out.get("naturalizado"));
        foreigner.put("decreto", out.get("decretoNaturalizacao"));

        Map<String, Object> result = new HashMap<>();
        result.put("employer", employer);
        result.put("employee", employee);
        result.put("contract", contract);
        result.put("fgts", fgts);
        result.put("pis", pis);
        result.put("voter", voter);
        result.put("foreigner", foreigner);
        result.put("notes", out.get("notes"));
        // Compatibilidade: tambÃ©m retornamos os campos planos
        result.putAll(out);
        return result;
    }
}



