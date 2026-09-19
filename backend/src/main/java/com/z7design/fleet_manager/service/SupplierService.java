package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.ImportResultDto;
import com.z7design.fleet_manager.dto.SupplierDTO;
import com.z7design.fleet_manager.model.Supplier;
import com.z7design.fleet_manager.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.ss.usermodel.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.text.Normalizer;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SupplierService {
    
    private final SupplierRepository supplierRepository;
    private final UserCompanyResolver userCompanyResolver;
    
    public List<Supplier> findAll() {
        return supplierRepository.findAll();
    }
    
    public Page<Supplier> findAll(Pageable pageable) {
        return supplierRepository.findAll(pageable);
    }
    
    public List<Supplier> findActiveSuppliers() {
        return supplierRepository.findByIsActiveTrue();
    }
    
    public Page<Supplier> findActiveSuppliers(Pageable pageable) {
        return supplierRepository.findByIsActiveTrue(pageable);
    }
    
    public Optional<Supplier> findById(UUID id) {
        return supplierRepository.findById(id);
    }
    
    public Optional<Supplier> findByCnpj(String cnpj) {
        return supplierRepository.findByCnpj(cnpj);
    }
    
    public Optional<Supplier> findByEmail(String email) {
        return supplierRepository.findByEmail(email);
    }
    
    public List<Supplier> findByNameContaining(String name) {
        return supplierRepository.findByNameContainingIgnoreCase(name);
    }
    
    public Page<Supplier> findByNameContaining(String name, Pageable pageable) {
        return supplierRepository.findByNameContainingIgnoreCase(name, pageable);
    }
    
    public List<Supplier> findByCity(String city) {
        return supplierRepository.findByCityIgnoreCase(city);
    }
    
    public List<Supplier> findByState(String state) {
        return supplierRepository.findByStateIgnoreCase(state);
    }
    
    public Page<Supplier> findByFilters(String name, String cnpj, String city, String state, Boolean isActive, Pageable pageable) {
        return supplierRepository.findByFilters(name, cnpj, city, state, isActive, pageable);
    }
    
    public Supplier save(Supplier supplier) {
        return supplierRepository.save(supplier);
    }
    
    public Supplier create(SupplierDTO supplierDTO) {
        // Verificações prévias para evitar 500 por violação de constraint
        if (supplierDTO.getCnpj() != null) {
            String cnpjTrimmed = supplierDTO.getCnpj().trim();
            supplierRepository.findByCnpj(cnpjTrimmed).ifPresent(existing -> {
                throw new com.z7design.fleet_manager.exception.BusinessException("Já existe um fornecedor com este CNPJ.");
            });
        }

        Supplier supplier = new Supplier();
        updateSupplierFromDTO(supplier, supplierDTO);
        if (supplier.getCompanyId() == null) {
            supplier.setCompanyId(userCompanyResolver.resolveCurrentCompanyId());
        }
        return supplierRepository.save(supplier);
    }
    
    public Supplier update(UUID id, SupplierDTO supplierDTO) {
        return supplierRepository.findById(id)
                .map(supplier -> {
                    // Verificar se o CNPJ está sendo alterado e se já existe outro fornecedor com esse CNPJ
                    if (supplierDTO.getCnpj() != null) {
                        String cnpjTrimmed = supplierDTO.getCnpj().trim();
                        supplierRepository.findByCnpj(cnpjTrimmed).ifPresent(existing -> {
                            // Se o CNPJ encontrado não é o próprio fornecedor, lançar exceção
                            if (!existing.getId().equals(id)) {
                                throw new com.z7design.fleet_manager.exception.BusinessException("Já existe um fornecedor com este CNPJ.");
                            }
                        });
                    }
                    updateSupplierFromDTO(supplier, supplierDTO);
                    return supplierRepository.save(supplier);
                })
                .orElseThrow(() -> new RuntimeException("Fornecedor não encontrado"));
    }
    
    public void deleteById(UUID id) {
        supplierRepository.deleteById(id);
    }
    
    public void deactivate(UUID id) {
        supplierRepository.findById(id)
                .ifPresent(supplier -> {
                    supplier.setIsActive(false);
                    supplierRepository.save(supplier);
                });
    }
    
    public void activate(UUID id) {
        supplierRepository.findById(id)
                .ifPresent(supplier -> {
                    supplier.setIsActive(true);
                    supplierRepository.save(supplier);
                });
    }
    
    public long countActiveSuppliers() {
        return supplierRepository.countByIsActiveTrue();
    }
    
    public long countInactiveSuppliers() {
        return supplierRepository.countByIsActiveFalse();
    }

    /**
     * Importa uma lista de DTOs de fornecedores em lote (vindos de parsing frontend ou backend).
     */
    public ImportResultDto importBatch(List<SupplierDTO> suppliersList) {
        ImportResultDto result = ImportResultDto.empty();
        if (suppliersList == null || suppliersList.isEmpty()) {
            return result;
        }

        UUID tenantCompanyId = userCompanyResolver.resolveCurrentCompanyId();
        int inserted = 0;
        int updated = 0;

        for (int i = 0; i < suppliersList.size(); i++) {
            SupplierDTO dto = suppliersList.get(i);
            result.setTotalRows(result.getTotalRows() + 1);

            if (dto.getName() == null || dto.getName().isBlank()) {
                result.setSkipped(result.getSkipped() + 1);
                continue;
            }

            try {
                String rawDoc = dto.getCnpj() != null ? dto.getCnpj().replaceAll("\\D", "") : null;
                String formattedDoc = formatCpfCnpj(rawDoc != null && !rawDoc.isBlank() ? rawDoc : dto.getCnpj());

                Optional<Supplier> existingOpt = Optional.empty();
                if (formattedDoc != null && !formattedDoc.isBlank()) {
                    existingOpt = supplierRepository.findByCnpj(formattedDoc);
                    if (existingOpt.isEmpty() && rawDoc != null && !rawDoc.isBlank()) {
                        existingOpt = supplierRepository.findByCnpj(rawDoc);
                    }
                }
                if (existingOpt.isEmpty() && dto.getName() != null) {
                    List<Supplier> byName = supplierRepository.findByNameContainingIgnoreCase(dto.getName().trim());
                    existingOpt = byName.stream()
                            .filter(s -> s.getName() != null && s.getName().equalsIgnoreCase(dto.getName().trim()))
                            .findFirst();
                }

                if (existingOpt.isPresent()) {
                    Supplier s = existingOpt.get();
                    if (dto.getName() != null && !dto.getName().isBlank()) s.setName(dto.getName().trim());
                    if (dto.getTradeName() != null && !dto.getTradeName().isBlank()) s.setTradeName(dto.getTradeName().trim());
                    if (dto.getContactName() != null && !dto.getContactName().isBlank()) s.setContactName(dto.getContactName().trim());
                    if (dto.getRegistrationNumber() != null && !dto.getRegistrationNumber().isBlank()) s.setRegistrationNumber(dto.getRegistrationNumber().trim());
                    if (formattedDoc != null && !formattedDoc.isBlank()) s.setCnpj(formattedDoc);
                    if (dto.getEmail() != null && !dto.getEmail().isBlank()) s.setEmail(dto.getEmail().trim());
                    if (dto.getPhone() != null && !dto.getPhone().isBlank()) s.setPhone(dto.getPhone().trim());
                    if (dto.getAddress() != null && !dto.getAddress().isBlank()) s.setAddress(dto.getAddress().trim());
                    if (dto.getCity() != null && !dto.getCity().isBlank()) s.setCity(dto.getCity().trim());
                    if (dto.getState() != null && !dto.getState().isBlank()) s.setState(normalizeState(dto.getState()));
                    if (dto.getZipCode() != null && !dto.getZipCode().isBlank()) s.setZipCode(dto.getZipCode().trim());
                    if (dto.getNotes() != null && !dto.getNotes().isBlank()) s.setNotes(dto.getNotes().trim());
                    if (s.getCompanyId() == null && tenantCompanyId != null) s.setCompanyId(tenantCompanyId);
                    supplierRepository.save(s);
                    updated++;
                } else {
                    Supplier s = new Supplier();
                    s.setName(dto.getName().trim());
                    s.setTradeName(dto.getTradeName() != null ? dto.getTradeName().trim() : null);
                    s.setContactName(dto.getContactName() != null ? dto.getContactName().trim() : null);
                    s.setRegistrationNumber(dto.getRegistrationNumber() != null ? dto.getRegistrationNumber().trim() : null);
                    s.setCnpj(formattedDoc);
                    s.setEmail(dto.getEmail() != null ? dto.getEmail().trim() : null);
                    s.setPhone(dto.getPhone() != null ? dto.getPhone().trim() : null);
                    s.setAddress(dto.getAddress() != null ? dto.getAddress().trim() : null);
                    s.setCity(dto.getCity() != null ? dto.getCity().trim() : null);
                    s.setState(dto.getState() != null ? normalizeState(dto.getState()) : null);
                    s.setZipCode(dto.getZipCode() != null ? dto.getZipCode().trim() : null);
                    s.setNotes(dto.getNotes() != null ? dto.getNotes().trim() : null);
                    s.setIsActive(true);
                    s.setCompanyId(tenantCompanyId);
                    supplierRepository.save(s);
                    inserted++;
                }
            } catch (Exception e) {
                log.warn("Erro ao importar fornecedor {}: {}", dto.getName(), e.getMessage());
                result.setSkipped(result.getSkipped() + 1);
                result.getErrors().add(String.format("Item %d (%s): %s", i + 1, dto.getName(), e.getMessage()));
            }
        }

        result.setInserted(inserted);
        result.setUpdated(updated);
        return result;
    }

    /**
     * Importa fornecedores a partir de arquivo (PDF, Excel ou CSV).
     */
    public ImportResultDto importFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo vazio ou não enviado.");
        }
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        if (filename.endsWith(".pdf")) {
            return importPdf(file);
        }
        return importExcel(file);
    }

    /**
     * Importa fornecedores a partir de arquivo PDF.
     */
    public ImportResultDto importPdf(MultipartFile file) {
        ImportResultDto result = ImportResultDto.empty();
        List<SupplierDTO> parsedList = new ArrayList<>();

        try (InputStream is = file.getInputStream();
             PDDocument document = PDDocument.load(is)) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);

            String[] lines = text.split("\\r?\\n");
            for (String rawLine : lines) {
                String line = rawLine.trim();
                if (line.isEmpty()) continue;
                if (line.toUpperCase().contains("NOME") && line.toUpperCase().contains("CPFCNPJ")) continue;

                // Tentar identificar padrão: Nome | CPF/CNPJ | Endereço | Telefone
                // Exemplo: ARAXA TRUCK CENTER (KAMILA FLAVIA RODRIGUES DONADELI) 54426642000186
                // Exemplo: 040 MOTORS CENTRO AUTOMOTIVO LTDA 66603500000126 3135813532
                java.util.regex.Matcher m = java.util.regex.Pattern.compile("^(.*?)\\s+([0-9]{11,14}|[0-9]{2,3}\\.[0-9]{3}\\.[0-9]{3}(?:/[0-9]{4}-[0-9]{2}|-[0-9]{2}))(?:\\s+(.*?))?(?:\\s+([0-9()\\s-]{8,20}))?$").matcher(line);
                if (m.find()) {
                    String name = m.group(1).trim();
                    String doc = m.group(2).trim();
                    String addr = m.group(3) != null ? m.group(3).trim() : null;
                    String phone = m.group(4) != null ? m.group(4).trim() : null;

                    SupplierDTO dto = new SupplierDTO();
                    dto.setName(name);
                    dto.setCnpj(doc);
                    dto.setAddress(addr);
                    dto.setPhone(phone);
                    parsedList.add(dto);
                } else {
                    // Linha genérica com apenas nome
                    if (line.length() >= 3 && !line.startsWith("---") && !line.startsWith("Página")) {
                        SupplierDTO dto = new SupplierDTO();
                        dto.setName(line);
                        parsedList.add(dto);
                    }
                }
            }

            return importBatch(parsedList);
        } catch (Exception e) {
            log.error("Erro ao ler arquivo PDF de fornecedores: ", e);
            result.getErrors().add("Falha ao ler PDF: " + e.getMessage());
            return result;
        }
    }

    /**
     * Importa fornecedores a partir de planilha Excel (.xlsx / .xls / .csv).
     * Associa automaticamente à empresa do usuário logado / tenant.
     */
    public ImportResultDto importExcel(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo vazio ou não enviado.");
        }

        ImportResultDto result = ImportResultDto.empty();
        UUID tenantCompanyId = userCompanyResolver.resolveCurrentCompanyId();
        log.info("📥 [IMPORT-SUPPLIERS] Iniciando importação - arquivo: {}, empresa: {}",
                file.getOriginalFilename(), tenantCompanyId);

        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null || sheet.getPhysicalNumberOfRows() < 2) {
                result.getErrors().add("Planilha vazia ou sem linhas de dados.");
                return result;
            }

            int headerRowIndex = findHeaderRow(sheet);
            if (headerRowIndex < 0) {
                result.getErrors().add("Cabeçalho não identificado na planilha.");
                return result;
            }

            Row headerRow = sheet.getRow(headerRowIndex);
            Map<Integer, String> colMap = mapHeaders(headerRow);
            if (!colMap.containsValue("NAME") && !colMap.containsValue("TRADE_NAME")) {
                result.getErrors().add("Coluna de Nome/Razão Social do Fornecedor não encontrada.");
                return result;
            }

            int lastRow = sheet.getLastRowNum();
            List<SupplierDTO> listToImport = new ArrayList<>();

            for (int r = headerRowIndex + 1; r <= lastRow; r++) {
                Row row = sheet.getRow(r);
                if (row == null || isRowEmpty(row)) continue;

                try {
                    String name = null;
                    String tradeName = null;
                    String contactName = null;
                    String regNumber = null;
                    String cnpj = null;
                    String email = null;
                    String phone = null;
                    String address = null;
                    String city = null;
                    String state = null;
                    String zipCode = null;
                    String notes = null;

                    for (Map.Entry<Integer, String> entry : colMap.entrySet()) {
                        Cell cell = row.getCell(entry.getKey());
                        String val = getCellValueAsString(cell);
                        if (val == null || val.isBlank()) continue;
                        val = val.trim();

                        switch (entry.getValue()) {
                            case "NAME": name = val; break;
                            case "TRADE_NAME": tradeName = val; break;
                            case "CONTACT_NAME": contactName = val; break;
                            case "REG_NUM": regNumber = val; break;
                            case "CNPJ": cnpj = val; break;
                            case "EMAIL": email = val; break;
                            case "PHONE": phone = val; break;
                            case "ADDRESS": address = val; break;
                            case "CITY": city = val; break;
                            case "STATE": state = normalizeState(val); break;
                            case "ZIP_CODE": zipCode = val.replaceAll("\\D", ""); break;
                            case "NOTES": notes = val; break;
                        }
                    }

                    if (name == null || name.isBlank()) {
                        name = tradeName;
                    }

                    if (name != null && !name.isBlank()) {
                        SupplierDTO dto = new SupplierDTO();
                        dto.setName(name);
                        dto.setTradeName(tradeName);
                        dto.setContactName(contactName);
                        dto.setRegistrationNumber(regNumber);
                        dto.setCnpj(cnpj);
                        dto.setEmail(email);
                        dto.setPhone(phone);
                        dto.setAddress(address);
                        dto.setCity(city);
                        dto.setState(state);
                        dto.setZipCode(zipCode);
                        dto.setNotes(notes);
                        listToImport.add(dto);
                    }
                } catch (Exception e) {
                    log.warn("Erro ao ler linha {} de fornecedores: {}", r + 1, e.getMessage());
                    result.getErrors().add(String.format("Linha %d: %s", r + 1, e.getMessage()));
                }
            }

            return importBatch(listToImport);

        } catch (Exception e) {
            log.error("Erro ao ler planilha de fornecedores: ", e);
            result.getErrors().add("Falha ao ler planilha: " + e.getMessage());
            return result;
        }
    }

    private int findHeaderRow(Sheet sheet) {
        int first = sheet.getFirstRowNum();
        int last = Math.min(first + 10, sheet.getLastRowNum());
        for (int r = first; r <= last; r++) {
            Row row = sheet.getRow(r);
            if (row == null) continue;
            Map<Integer, String> m = mapHeaders(row);
            if (m.containsValue("NAME") || m.containsValue("TRADE_NAME") || (m.containsValue("CNPJ") && m.size() >= 2)) {
                return r;
            }
        }
        return -1;
    }

    private Map<Integer, String> mapHeaders(Row row) {
        Map<Integer, String> map = new HashMap<>();
        for (Cell c : row) {
            String val = getCellValueAsString(c);
            if (val == null || val.isBlank()) continue;
            String norm = normalizeText(val);

            if (norm.equals("razao social") || norm.equals("razaosocial") || norm.contains("fantasia")) {
                map.put(c.getColumnIndex(), "TRADE_NAME");
            } else if (norm.contains("razao") || norm.contains("fornecedor") || norm.equals("nome") || norm.startsWith("nome")) {
                map.put(c.getColumnIndex(), "NAME");
            } else if (norm.contains("numcad") || norm.contains("inscricao") || norm.contains("cod_fornec") || norm.contains("codigo")) {
                map.put(c.getColumnIndex(), "REG_NUM");
            } else if (norm.contains("cnpj") || norm.contains("cpf") || norm.contains("documento")) {
                map.put(c.getColumnIndex(), "CNPJ");
            } else if (norm.contains("email") || norm.contains("e-mail")) {
                map.put(c.getColumnIndex(), "EMAIL");
            } else if (norm.contains("telefone") || norm.contains("celular") || norm.contains("fone") || norm.contains("contato")) {
                map.put(c.getColumnIndex(), "PHONE");
            } else if (norm.contains("endereco") || norm.contains("endereço") || norm.contains("rua") || norm.contains("logradouro")) {
                map.put(c.getColumnIndex(), "ADDRESS");
            } else if (norm.contains("cidade") || norm.contains("municipio")) {
                map.put(c.getColumnIndex(), "CITY");
            } else if (norm.contains("uf") || norm.contains("estado")) {
                map.put(c.getColumnIndex(), "STATE");
            } else if (norm.contains("cep")) {
                map.put(c.getColumnIndex(), "ZIP_CODE");
            } else if (norm.contains("observ") || norm.contains("obs") || norm.contains("nota") || norm.contains("descricao")) {
                map.put(c.getColumnIndex(), "NOTES");
            }
        }
        return map;
    }

    private boolean isRowEmpty(Row row) {
        if (row == null) return true;
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                String val = getCellValueAsString(cell);
                if (val != null && !val.isBlank()) return false;
            }
        }
        return true;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        CellType type = cell.getCellType();
        if (type == CellType.FORMULA) {
            type = cell.getCachedFormulaResultType();
        }
        switch (type) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                double num = cell.getNumericCellValue();
                if (num == Math.floor(num)) {
                    return String.format("%.0f", num);
                }
                return String.valueOf(num);
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            default:
                return "";
        }
    }

    private String normalizeText(String text) {
        if (text == null) return "";
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "").toLowerCase().trim();
    }
    
    public static String formatCpfCnpj(String raw) {
        if (raw == null) return null;
        String digits = raw.replaceAll("\\D", "");
        if (digits.length() == 14) {
            return String.format("%s.%s.%s/%s-%s",
                    digits.substring(0, 2),
                    digits.substring(2, 5),
                    digits.substring(5, 8),
                    digits.substring(8, 12),
                    digits.substring(12, 14));
        } else if (digits.length() == 11) {
            return String.format("%s.%s.%s-%s",
                    digits.substring(0, 3),
                    digits.substring(3, 6),
                    digits.substring(6, 9),
                    digits.substring(9, 11));
        }
        return raw.trim().isEmpty() ? null : raw.trim();
    }
    
    private void updateSupplierFromDTO(Supplier supplier, SupplierDTO dto) {
        supplier.setName(dto.getName());
        supplier.setTradeName(dto.getTradeName());
        supplier.setContactName(dto.getContactName());
        supplier.setRegistrationNumber(dto.getRegistrationNumber());
        supplier.setCnpj(formatCpfCnpj(dto.getCnpj()));
        supplier.setEmail(dto.getEmail());
        supplier.setPhone(dto.getPhone());
        supplier.setAddress(dto.getAddress());
        supplier.setCity(dto.getCity());
        supplier.setState(normalizeState(dto.getState()));
        supplier.setZipCode(dto.getZipCode());
        supplier.setNotes(dto.getNotes());
        supplier.setSinceDate(dto.getSinceDate());
        if (dto.getDocumentType() != null && !dto.getDocumentType().isBlank()) {
            supplier.setDocumentType(dto.getDocumentType().toUpperCase());
        } else if (dto.getCnpj() != null && !dto.getCnpj().isBlank()) {
            String digits = dto.getCnpj().replaceAll("\\D", "");
            supplier.setDocumentType(digits.length() <= 11 ? "CPF" : "CNPJ");
        }
        if (dto.getIsActive() != null) {
            supplier.setIsActive(dto.getIsActive());
        }
    }

    private String normalizeState(String state) {
        if (state == null) return null;
        String s = state.trim();
        if (s.isEmpty()) return null;
        String upper = s.toUpperCase();
        // Mapear nomes completos comuns para UF
        switch (upper) {
            case "ACRE": return "AC";
            case "ALAGOAS": return "AL";
            case "AMAPA":
            case "AMAPÁ": return "AP";
            case "AMAZONAS": return "AM";
            case "BAHIA": return "BA";
            case "CEARA":
            case "CEARÁ": return "CE";
            case "DISTRITO FEDERAL": return "DF";
            case "ESPIRITO SANTO":
            case "ESPÍRITO SANTO": return "ES";
            case "GOIAS":
            case "GOIÁS": return "GO";
            case "MARANHAO":
            case "MARANHÃO": return "MA";
            case "MATO GROSSO": return "MT";
            case "MATO GROSSO DO SUL": return "MS";
            case "MINAS GERAIS": return "MG";
            case "PARA":
            case "PARÁ": return "PA";
            case "PARAIBA":
            case "PARAÍBA": return "PB";
            case "PARANA":
            case "PARANÁ": return "PR";
            case "PERNAMBUCO": return "PE";
            case "PIAUI":
            case "PIAUÍ": return "PI";
            case "RIO DE JANEIRO": return "RJ";
            case "RIO GRANDE DO NORTE": return "RN";
            case "RIO GRANDE DO SUL": return "RS";
            case "RONDONIA":
            case "RONDÔNIA": return "RO";
            case "RORAIMA": return "RR";
            case "SANTA CATARINA": return "SC";
            case "SAO PAULO":
            case "SÃO PAULO": return "SP";
            case "SERGIPE": return "SE";
            case "TOCANTINS": return "TO";
            default:
                // Se já tiver 2 caracteres, devolver upper; caso contrário, tenta as 2 primeiras letras
                if (upper.length() >= 2) return upper.substring(0, 2);
                return upper;
        }
    }
}
