package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.EmployeeDTO;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmployeeExcelImportService {

    private final EmployeeService employeeService;
    private final CompanyRepository companyRepository;

    // Mapeamento de colunas possÃ­veis da planilha para campos da entidade
    private static final Map<String, String> COLUMN_MAPPING = new HashMap<>();

    static {
        // InformaÃ§Ãµes bÃ¡sicas
        COLUMN_MAPPING.put("nome", "name");
        COLUMN_MAPPING.put("nome completo", "name");
        COLUMN_MAPPING.put("name", "name");
        COLUMN_MAPPING.put("cpf", "cpf");
        COLUMN_MAPPING.put("documento", "cpf");
        COLUMN_MAPPING.put("rg", "rg");
        COLUMN_MAPPING.put("carteira identidade", "rg");
        COLUMN_MAPPING.put("email", "email");
        COLUMN_MAPPING.put("e-mail", "email");
        COLUMN_MAPPING.put("telefone", "phone");
        COLUMN_MAPPING.put("whatsapp", "phone");
        COLUMN_MAPPING.put("celular", "phone");
        COLUMN_MAPPING.put("data nascimento", "birthDate");
        COLUMN_MAPPING.put("data de nascimento", "birthDate");
        COLUMN_MAPPING.put("nascimento", "birthDate");
        COLUMN_MAPPING.put("birthdate", "birthDate");
        COLUMN_MAPPING.put("sexo", "sexo");
        COLUMN_MAPPING.put("genero", "sexo");
        COLUMN_MAPPING.put("municipio nascimento", "municipioNascimento");
        COLUMN_MAPPING.put("municÃ­pio nascimento", "municipioNascimento");
        COLUMN_MAPPING.put("cidade nascimento", "municipioNascimento");
        COLUMN_MAPPING.put("estado nascimento", "estadoNascimento");
        COLUMN_MAPPING.put("uf nascimento", "estadoNascimento");
        COLUMN_MAPPING.put("grau instrucao", "grauInstrucao");
        COLUMN_MAPPING.put("escolaridade", "grauInstrucao");
        COLUMN_MAPPING.put("matricula esocial", "matriculaEsocial");
        COLUMN_MAPPING.put("matrÃ­cula esocial", "matriculaEsocial");
        COLUMN_MAPPING.put("matricula e social", "matriculaEsocial");
        COLUMN_MAPPING.put("matrÃ­cula e social", "matriculaEsocial");
        COLUMN_MAPPING.put("matricula", "matriculaEsocial");

        // EndereÃ§o
        COLUMN_MAPPING.put("endereco", "enderecoRua");
        COLUMN_MAPPING.put("endereÃ§o", "enderecoRua");
        COLUMN_MAPPING.put("rua", "enderecoRua");
        COLUMN_MAPPING.put("logradouro", "enderecoRua");
        COLUMN_MAPPING.put("numero", "enderecoNumero");
        COLUMN_MAPPING.put("nÃºmero", "enderecoNumero");
        COLUMN_MAPPING.put("complemento", "enderecoComplemento");
        COLUMN_MAPPING.put("bairro", "enderecoBairro");
        COLUMN_MAPPING.put("cidade", "enderecoCidade");
        COLUMN_MAPPING.put("municipio", "enderecoCidade");
        COLUMN_MAPPING.put("estado", "enderecoEstado");
        COLUMN_MAPPING.put("uf", "enderecoEstado");
        COLUMN_MAPPING.put("cep", "enderecoCep");

        // Dados profissionais
        COLUMN_MAPPING.put("data admissao", "hireDate");
        COLUMN_MAPPING.put("data de admissÃ£o", "hireDate");
        COLUMN_MAPPING.put("admissao", "hireDate");
        COLUMN_MAPPING.put("matricula", "registrationNumber");
        COLUMN_MAPPING.put("matrÃ­cula", "registrationNumber");
        COLUMN_MAPPING.put("status", "status");
        COLUMN_MAPPING.put("situacao", "status");

        // Dados familiares
        COLUMN_MAPPING.put("nome pai", "nomePai");
        COLUMN_MAPPING.put("pai", "nomePai");
        COLUMN_MAPPING.put("nome mae", "nomeMae");
        COLUMN_MAPPING.put("mae", "nomeMae");
        COLUMN_MAPPING.put("mÃ£e", "nomeMae");

        // Estado civil
        COLUMN_MAPPING.put("estado civil", "maritalStatus");
        COLUMN_MAPPING.put("nacionalidade", "nationality");
    }

    @Transactional
    public ImportResult importEmployees(MultipartFile file) {
        log.info("ðŸ“¥ Iniciando importaÃ§Ã£o de funcionÃ¡rios do Excel: {}", file.getOriginalFilename());

        ImportResult result = new ImportResult();

        try {
            // Validar arquivo
            if (file.isEmpty()) {
                result.addError("Arquivo vazio");
                return result;
            }

            if (!file.getOriginalFilename().endsWith(".xlsx") &&
                    !file.getOriginalFilename().endsWith(".xls")) {
                result.addError("Apenas arquivos Excel (.xlsx ou .xls) sÃ£o aceitos");
                return result;
            }

            // Ler planilha
            Workbook workbook = WorkbookFactory.create(file.getInputStream());
            Sheet sheet = workbook.getSheetAt(0); // Primeira aba

            if (sheet == null || sheet.getPhysicalNumberOfRows() < 2) {
                result.addError("Planilha vazia ou sem dados");
                workbook.close();
                return result;
            }

            // Encontrar linha do cabeÃ§alho (nem sempre Ã© a primeira linha)
            int headerRowIndex = findHeaderRow(sheet);
            if (headerRowIndex < 0) {
                result.addError(
                        "CabeÃ§alho nÃ£o encontrado na planilha. Verifique se a linha contÃ©m os nomes das colunas.");
                workbook.close();
                return result;
            }

            Row headerRow = sheet.getRow(headerRowIndex);
            if (headerRow == null) {
                result.addError("CabeÃ§alho nÃ£o encontrado na planilha");
                workbook.close();
                return result;
            }

            Map<String, Integer> columnIndexMap = new HashMap<>();
            int companyCnpjColumnIndex = -1;
            String fixedCompanyCnpj = null;

            // Mapear colunas do cabeÃ§alho
            for (int i = 0; i < headerRow.getLastCellNum(); i++) {
                Cell cell = headerRow.getCell(i);
                if (cell != null) {
                    String columnName = getCellValueAsString(cell).toLowerCase().trim();

                    // Verificar se Ã© coluna de empresa (CNPJ)
                    if (columnName.contains("cnpj") && columnName.contains("empresa")) {
                        companyCnpjColumnIndex = i;
                        log.info("ðŸ“‹ Coluna CNPJ da empresa encontrada na coluna: {}", i);
                    }

                    // Mapear colunas de funcionÃ¡rio
                    for (Map.Entry<String, String> entry : COLUMN_MAPPING.entrySet()) {
                        if (columnName.contains(entry.getKey())) {
                            columnIndexMap.put(entry.getValue(), i);
                            log.debug("ðŸ“‹ Coluna '{}' mapeada para campo '{}' na posiÃ§Ã£o {}",
                                    columnName, entry.getValue(), i);
                        }
                    }
                }
            }

            // Validar se encontrou CNPJ da empresa
            if (companyCnpjColumnIndex == -1) {
                fixedCompanyCnpj = findCompanyCnpjInSheet(sheet, headerRowIndex);
                if (fixedCompanyCnpj == null || fixedCompanyCnpj.isEmpty()) {
                    result.addError(
                            "Coluna 'CNPJ Empresa' nÃ£o encontrada na planilha. Ã‰ necessÃ¡rio uma coluna contendo o CNPJ da empresa.");
                    workbook.close();
                    return result;
                }
                log.info("ðŸ“‹ CNPJ da empresa encontrado no cabeÃ§alho: {}", fixedCompanyCnpj);
            }

            // Buscar empresa do primeiro registro (todos devem ser da mesma empresa)
            Row firstDataRow = sheet.getRow(headerRowIndex + 1);
            if (firstDataRow == null) {
                result.addError("Nenhum dado encontrado na planilha");
                workbook.close();
                return result;
            }

            String companyCnpj;
            if (fixedCompanyCnpj != null) {
                companyCnpj = fixedCompanyCnpj;
            } else {
                Cell cnpjCell = firstDataRow.getCell(companyCnpjColumnIndex);
                companyCnpj = getCellValueAsString(cnpjCell);
            }

            if (companyCnpj == null || companyCnpj.trim().isEmpty()) {
                result.addError("CNPJ da empresa nÃ£o encontrado na primeira linha de dados");
                workbook.close();
                return result;
            }

            // Normalizar CNPJ (remover caracteres nÃ£o numÃ©ricos)
            String normalizedCnpj = companyCnpj.replaceAll("[^0-9]", "");
            log.info("ðŸ” Buscando empresa com CNPJ normalizado: {}", normalizedCnpj);

            // Buscar empresa no banco
            List<Company> companies = companyRepository.findByNormalizedCnpj(normalizedCnpj);
            if (companies.isEmpty()) {
                log.error("❌ Empresa não encontrada. CNPJ Original: '{}', CNPJ Normalizado: '{}'", companyCnpj,
                        normalizedCnpj);
                result.addError("Empresa não encontrada no banco de dados com o CNPJ: " + companyCnpj +
                        " (Normalizado: " + normalizedCnpj
                        + "). Certifique-se de que a empresa está cadastrada no sistema antes de importar.");
                workbook.close();
                return result;
            }

            Company company = companies.get(0);
            log.info("âœ… Empresa encontrada: {} (ID: {}, Sigla: {})",
                    company.getName(), company.getId(), company.getSigla());

            // Processar linhas de dados
            int totalRows = sheet.getPhysicalNumberOfRows();
            log.info("ðŸ“Š Processando {} linhas de dados", totalRows - (headerRowIndex + 1));

            for (int rowIndex = headerRowIndex + 1; rowIndex < totalRows; rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                if (row == null)
                    continue;

                try {
                    // Verificar se a linha tem dados
                    if (isRowEmpty(row))
                        continue;

                    // Validar se o CNPJ da empresa Ã© o mesmo (quando existe coluna de CNPJ)
                    if (companyCnpjColumnIndex != -1) {
                        Cell rowCnpjCell = row.getCell(companyCnpjColumnIndex);
                        String rowCnpj = getCellValueAsString(rowCnpjCell);
                        String rowNormalizedCnpj = rowCnpj != null ? rowCnpj.replaceAll("[^0-9]", "") : "";

                        if (!rowNormalizedCnpj.equals(normalizedCnpj)) {
                            result.addWarning("Linha " + (rowIndex + 1) +
                                    ": CNPJ diferente do esperado. Ignorando linha.");
                            continue;
                        }
                    }

                    // Criar DTO do funcionÃ¡rio a partir da linha
                    EmployeeDTO employeeDTO = createEmployeeDTOFromRow(row, columnIndexMap, company);

                    // Validar campos obrigatÃ³rios
                    if (employeeDTO.getName() == null || employeeDTO.getName().trim().isEmpty()) {
                        result.addWarning("Linha " + (rowIndex + 1) + ": Nome nÃ£o informado. Ignorando linha.");
                        continue;
                    }

                    if (employeeDTO.getCpf() == null || employeeDTO.getCpf().trim().isEmpty()) {
                        result.addWarning("Linha " + (rowIndex + 1) + ": CPF nÃ£o informado. Ignorando linha.");
                        continue;
                    }

                    // Verificar se funcionÃ¡rio jÃ¡ existe (por CPF)
                    String normalizedCpf = employeeDTO.getCpf().replaceAll("[^0-9]", "");
                    Optional<Employee> existingEmployee = employeeService.findByCpfExact(normalizedCpf);

                    if (existingEmployee.isPresent()) {
                        log.info("âš ï¸ FuncionÃ¡rio jÃ¡ existe (CPF: {}). Atualizando...", normalizedCpf);
                        // Atualizar funcionÃ¡rio existente
                        employeeDTO.setId(existingEmployee.get().getId());
                        employeeService.update(existingEmployee.get().getId(), employeeDTO);
                        result.incrementUpdated();
                    } else {
                        // Criar novo funcionÃ¡rio
                        employeeService.create(employeeDTO);
                        result.incrementCreated();
                    }

                } catch (Exception e) {
                    log.error("âŒ Erro ao processar linha {}: {}", rowIndex + 1, e.getMessage(), e);
                    result.addError("Linha " + (rowIndex + 1) + ": " + e.getMessage());
                }
            }

            workbook.close();

            log.info("âœ… ImportaÃ§Ã£o concluÃ­da: {} criados, {} atualizados, {} erros",
                    result.getCreated(), result.getUpdated(), result.getErrors().size());

        } catch (IOException e) {
            log.error("âŒ Erro ao ler arquivo Excel: {}", e.getMessage(), e);
            result.addError("Erro ao ler arquivo: " + e.getMessage());
        } catch (Exception e) {
            log.error("âŒ Erro inesperado na importaÃ§Ã£o: {}", e.getMessage(), e);
            result.addError("Erro inesperado: " + e.getMessage());
        }

        return result;
    }

    private EmployeeDTO createEmployeeDTOFromRow(Row row, Map<String, Integer> columnIndexMap, Company company) {
        EmployeeDTO dto = new EmployeeDTO();

        // Vincular empresa
        if (company != null) {
            EmployeeDTO.IdOnlyDTO companyDTO = new EmployeeDTO.IdOnlyDTO();
            companyDTO.setId(company.getId());
            companyDTO.setName(company.getName());
            dto.setCompany(companyDTO);
        }

        // Mapear campos da planilha
        for (Map.Entry<String, Integer> entry : columnIndexMap.entrySet()) {
            String fieldName = entry.getKey();
            int columnIndex = entry.getValue();

            Cell cell = row.getCell(columnIndex);
            if (cell == null)
                continue;

            String cellValue = getCellValueAsString(cell);
            if (cellValue == null || cellValue.trim().isEmpty())
                continue;

            try {
                switch (fieldName) {
                    case "name":
                        dto.setName(cellValue.trim());
                        break;
                    case "cpf":
                        dto.setCpf(cellValue.replaceAll("[^0-9]", ""));
                        break;
                    case "rg":
                        dto.setRg(cellValue.trim());
                        break;
                    case "email":
                        dto.setEmail(cellValue.trim());
                        break;
                    case "phone":
                        dto.setPhone(cellValue.replaceAll("[^0-9]", ""));
                        break;
                    case "birthDate":
                        dto.setBirthDate(parseDate(cellValue));
                        break;
                    case "sexo":
                        dto.setSexo(normalizeSexo(cellValue));
                        break;
                    case "municipioNascimento":
                        dto.setMunicipioNascimento(cellValue.trim());
                        break;
                    case "estadoNascimento":
                        dto.setEstadoNascimento(
                                cellValue.trim().toUpperCase().substring(0, Math.min(2, cellValue.length())));
                        break;
                    case "grauInstrucao":
                        dto.setGrauInstrucao(cellValue.trim());
                        break;
                    case "matriculaEsocial":
                        dto.setMatriculaEsocial(cellValue.trim());
                        break;
                    case "enderecoRua":
                        dto.setEnderecoRua(cellValue.trim());
                        break;
                    case "enderecoNumero":
                        dto.setEnderecoNumero(cellValue.trim());
                        break;
                    case "enderecoComplemento":
                        dto.setEnderecoComplemento(cellValue.trim());
                        break;
                    case "enderecoBairro":
                        dto.setEnderecoBairro(cellValue.trim());
                        break;
                    case "enderecoCidade":
                        dto.setEnderecoCidade(cellValue.trim());
                        break;
                    case "enderecoEstado":
                        dto.setEnderecoEstado(
                                cellValue.trim().toUpperCase().substring(0, Math.min(2, cellValue.length())));
                        break;
                    case "enderecoCep":
                        dto.setEnderecoCep(cellValue.replaceAll("[^0-9]", ""));
                        break;
                    case "hireDate":
                        dto.setHireDate(parseDate(cellValue));
                        break;
                    case "registrationNumber":
                        dto.setRegistrationNumber(cellValue.trim());
                        break;
                    case "status":
                        dto.setStatus(normalizeStatus(cellValue));
                        break;
                    case "nomePai":
                        dto.setNomePai(cellValue.trim());
                        break;
                    case "nomeMae":
                        dto.setNomeMae(cellValue.trim());
                        break;
                    case "maritalStatus":
                        dto.setMaritalStatus(normalizeMaritalStatus(cellValue));
                        break;
                    case "nationality":
                        dto.setNationality(cellValue.trim());
                        break;
                }
            } catch (Exception e) {
                log.warn("âš ï¸ Erro ao mapear campo '{}' com valor '{}': {}", fieldName, cellValue, e.getMessage());
            }
        }

        // Valores padrÃ£o
        if (dto.getStatus() == null || dto.getStatus().isEmpty()) {
            dto.setStatus("ACTIVE");
        }
        if (dto.getMaritalStatus() == null || dto.getMaritalStatus().isEmpty()) {
            dto.setMaritalStatus("SINGLE");
        }
        if (dto.getNationality() == null || dto.getNationality().isEmpty()) {
            dto.setNationality("Brasileiro");
        }

        // Criar objeto AddressDTO se houver dados de endereÃ§o
        if (dto.getEnderecoRua() != null || dto.getEnderecoNumero() != null ||
                dto.getEnderecoBairro() != null || dto.getEnderecoCidade() != null) {
            EmployeeDTO.AddressDTO address = new EmployeeDTO.AddressDTO();
            address.setStreet(dto.getEnderecoRua());
            address.setNumber(dto.getEnderecoNumero());
            address.setComplement(dto.getEnderecoComplemento());
            address.setNeighborhood(dto.getEnderecoBairro());
            address.setCity(dto.getEnderecoCidade());
            address.setState(dto.getEnderecoEstado());
            address.setZipCode(dto.getEnderecoCep());
            dto.setAddress(address);
        }

        return dto;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null)
            return null;

        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                } else {
                    // Evitar notaÃ§Ã£o cientÃ­fica
                    double numericValue = cell.getNumericCellValue();
                    if (numericValue == Math.floor(numericValue)) {
                        return String.valueOf((long) numericValue);
                    } else {
                        return String.valueOf(numericValue);
                    }
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try {
                    return cell.getStringCellValue();
                } catch (Exception e) {
                    return String.valueOf(cell.getNumericCellValue());
                }
            default:
                return null;
        }
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty())
            return null;

        // Tentar diferentes formatos de data
        String[] formats = {
                "yyyy-MM-dd",
                "dd/MM/yyyy",
                "dd-MM-yyyy",
                "dd.MM.yyyy",
                "yyyy/MM/dd",
                "MM/dd/yyyy"
        };

        for (String format : formats) {
            try {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern(format);
                return LocalDate.parse(dateStr.trim(), formatter);
            } catch (DateTimeParseException e) {
                // Tentar prÃ³ximo formato
            }
        }

        log.warn("âš ï¸ NÃ£o foi possÃ­vel fazer parse da data: {}", dateStr);
        return null;
    }

    private String normalizeSexo(String sexo) {
        if (sexo == null)
            return null;
        String normalized = sexo.trim().toUpperCase();
        if (normalized.contains("MASCULINO") || normalized.contains("M") || normalized.contains("HOMEM")) {
            return "MASCULINO";
        } else if (normalized.contains("FEMININO") || normalized.contains("F") || normalized.contains("MULHER")) {
            return "FEMININO";
        } else {
            return "OUTRO";
        }
    }

    private String normalizeStatus(String status) {
        if (status == null)
            return "ACTIVE";
        String normalized = status.trim().toUpperCase();
        if (normalized.contains("ATIVO") || normalized.contains("ACTIVE")) {
            return "ACTIVE";
        } else if (normalized.contains("INATIVO") || normalized.contains("INACTIVE")) {
            return "INACTIVE";
        } else if (normalized.contains("DEMITIDO") || normalized.contains("TERMINATED")) {
            return "TERMINATED";
        }
        return "ACTIVE";
    }

    private String normalizeMaritalStatus(String status) {
        if (status == null)
            return "SINGLE";
        String normalized = status.trim().toUpperCase();
        if (normalized.contains("SOLTEIRO") || normalized.contains("SINGLE")) {
            return "SINGLE";
        } else if (normalized.contains("CASADO") || normalized.contains("MARRIED")) {
            return "MARRIED";
        } else if (normalized.contains("DIVORCIADO") || normalized.contains("DIVORCED")) {
            return "DIVORCED";
        } else if (normalized.contains("VIÃšVO") || normalized.contains("WIDOWED")) {
            return "WIDOWED";
        }
        return "SINGLE";
    }

    private boolean isRowEmpty(Row row) {
        if (row == null)
            return true;
        for (int i = 0; i < row.getLastCellNum(); i++) {
            Cell cell = row.getCell(i);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                String value = getCellValueAsString(cell);
                if (value != null && !value.trim().isEmpty()) {
                    return false;
                }
            }
        }
        return true;
    }

    private int findHeaderRow(Sheet sheet) {
        int maxRow = Math.min(20, sheet.getLastRowNum());
        int bestRow = -1;
        int bestScore = 0;
        for (int rowIndex = 0; rowIndex <= maxRow; rowIndex++) {
            Row row = sheet.getRow(rowIndex);
            if (row == null || isRowEmpty(row))
                continue;
            int score = countHeaderMatches(row);
            if (score > bestScore) {
                bestScore = score;
                bestRow = rowIndex;
            }
        }
        return bestScore >= 2 ? bestRow : -1;
    }

    private int countHeaderMatches(Row row) {
        int score = 0;
        for (int i = 0; i < row.getLastCellNum(); i++) {
            Cell cell = row.getCell(i);
            if (cell == null)
                continue;
            String columnName = getCellValueAsString(cell);
            if (columnName == null)
                continue;
            String normalized = columnName.toLowerCase().trim();
            if (normalized.contains("cnpj") && normalized.contains("empresa")) {
                score += 2;
                continue;
            }
            for (String key : COLUMN_MAPPING.keySet()) {
                if (normalized.contains(key)) {
                    score += 1;
                    break;
                }
            }
        }
        return score;
    }

    private String findCompanyCnpjInSheet(Sheet sheet, int headerRowIndex) {
        int maxRow = Math.min(headerRowIndex, sheet.getLastRowNum());
        for (int rowIndex = 0; rowIndex <= maxRow; rowIndex++) {
            Row row = sheet.getRow(rowIndex);
            if (row == null)
                continue;
            for (int cellIndex = 0; cellIndex < row.getLastCellNum(); cellIndex++) {
                Cell cell = row.getCell(cellIndex);
                if (cell == null)
                    continue;
                String value = getCellValueAsString(cell);
                if (value == null)
                    continue;
                String normalized = value.toLowerCase();
                if (normalized.contains("cnpj")) {
                    String extracted = extractDigits(value);
                    if (extracted.length() >= 14) {
                        return extracted;
                    }
                    Cell nextCell = row.getCell(cellIndex + 1);
                    String nextValue = getCellValueAsString(nextCell);
                    String nextDigits = extractDigits(nextValue);
                    if (nextDigits.length() >= 14) {
                        return nextDigits;
                    }
                }
            }
        }
        return null;
    }

    private String extractDigits(String value) {
        if (value == null)
            return "";
        return value.replaceAll("[^0-9]", "");
    }

    public static class ImportResult {
        private int created = 0;
        private int updated = 0;
        private List<String> errors = new ArrayList<>();
        private List<String> warnings = new ArrayList<>();

        public void incrementCreated() {
            created++;
        }

        public void incrementUpdated() {
            updated++;
        }

        public void addError(String error) {
            errors.add(error);
        }

        public void addWarning(String warning) {
            warnings.add(warning);
        }

        public int getCreated() {
            return created;
        }

        public int getUpdated() {
            return updated;
        }

        public List<String> getErrors() {
            return errors;
        }

        public List<String> getWarnings() {
            return warnings;
        }

        public boolean isSuccess() {
            return errors.isEmpty() && (created > 0 || updated > 0);
        }

        public String getSummary() {
            return String.format("Criados: %d, Atualizados: %d, Erros: %d, Avisos: %d",
                    created, updated, errors.size(), warnings.size());
        }
    }
}
