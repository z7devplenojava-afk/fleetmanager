package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.ImportResultDto;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.model.Vehicle.FuelType;
import com.z7design.fleet_manager.model.Vehicle.VehicleStatus;
import com.z7design.fleet_manager.model.Vehicle.VehicleType;
import com.z7design.fleet_manager.repository.VehicleRepository;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.openxml4j.opc.OPCPackage;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.binary.XSSFBSharedStringsTable;
import org.apache.poi.xssf.binary.XSSFBStylesTable;
import org.apache.poi.xssf.binary.XSSFBSheetHandler;
import org.apache.poi.xssf.eventusermodel.XSSFBReader;
import org.apache.poi.xssf.eventusermodel.XSSFSheetXMLHandler;
import org.apache.poi.xssf.usermodel.XSSFComment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.InputStream;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDate;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class VehicleExcelImportService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(VehicleExcelImportService.class);

    private final VehicleRepository vehicleRepository;
    private final PlatformTransactionManager transactionManager;
    private final UserCompanyResolver userCompanyResolver;

    private static final Pattern YEAR_PATTERN = Pattern.compile("(19\\d{2}|20\\d{2})");

    public ImportResultDto importVehiclesFromExcel(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("O arquivo de importação está vazio ou não foi enviado.");
        }

        ImportResultDto result = ImportResultDto.empty();
        UUID currentCompanyId = userCompanyResolver.resolveCurrentCompanyId();
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "planilha.xlsx";
        log.info("Iniciando importação otimizada de veículos a partir de: {} (CompanyId: {})",
                originalFilename, currentCompanyId);

        // 1. Pré-carregar veículos existentes da empresa atual para busca O(1) em
        // memória
        Map<String, Vehicle> existingMap = new HashMap<>();
        try {
            List<Vehicle> allVehicles = currentCompanyId != null
                    ? vehicleRepository.findByCompanyId(currentCompanyId)
                    : vehicleRepository.findAll();
            for (Vehicle v : allVehicles) {
                if (v.getPlate() != null && !v.getPlate().isBlank()) {
                    existingMap.put(cleanPlate(v.getPlate()), v);
                }
            }
            log.info("Pré-carregados {} veículos da empresa [{}] em memória.", existingMap.size(), currentCompanyId);
        } catch (Exception e) {
            log.warn("Falha ao pré-carregar veículos da empresa: {}", e.getMessage());
        }

        Set<String> processedPlatesInFile = new HashSet<>();
        List<Vehicle> toInsert = new ArrayList<>();
        List<Vehicle> toUpdate = new ArrayList<>();

        boolean isXlsb = originalFilename.toLowerCase().endsWith(".xlsb");

        if (isXlsb) {
            processXlsbFile(file, result, existingMap, processedPlatesInFile, toInsert, toUpdate, currentCompanyId);
        } else {
            try (InputStream is = file.getInputStream();
                    Workbook workbook = WorkbookFactory.create(is)) {
                processWorkbook(workbook, result, existingMap, processedPlatesInFile, toInsert, toUpdate,
                        currentCompanyId);
            } catch (org.apache.poi.xssf.XLSBUnsupportedException e) {
                log.info("Arquivo identificado como XLSB pelo POI. Redirecionando para parser binário XLSB...");
                processXlsbFile(file, result, existingMap, processedPlatesInFile, toInsert, toUpdate, currentCompanyId);
            } catch (Exception e) {
                log.error("Erro crítico ao ler o arquivo Excel de veículos: ", e);
                result.getErrors().add("Falha ao ler arquivo Excel: " + e.getMessage());
            }
        }

        // 2. Persistir no banco de dados com resiliência
        persistVehicles(toInsert, toUpdate, result, currentCompanyId);

        log.info("Importação de veículos concluída. Inseridos: {}, Atualizados: {}, Ignorados: {}, Erros: {}",
                result.getInserted(), result.getUpdated(), result.getSkipped(), result.getErrors().size());

        return result;
    }

    private void processWorkbook(Workbook workbook, ImportResultDto result,
            Map<String, Vehicle> existingMap, Set<String> processedPlatesInFile,
            List<Vehicle> toInsert, List<Vehicle> toUpdate, UUID currentCompanyId) {
        int numberOfSheets = workbook.getNumberOfSheets();
        log.info("Processando arquivo Excel com {} abas", numberOfSheets);

        // Se houver aba de frota própria (PATRIMÔNIO VSS - FROTA), prioriza apenas ela
        List<Integer> targetSheetIndices = new ArrayList<>();
        for (int s = 0; s < numberOfSheets; s++) {
            if (workbook.isSheetHidden(s))
                continue;
            String nameNorm = normalizeText(workbook.getSheetName(s));
            if (nameNorm.contains("vss") || nameNorm.contains("patrimoni") || nameNorm.contains("pratim")) {
                targetSheetIndices.add(s);
            }
        }

        for (int s = 0; s < numberOfSheets; s++) {
            Sheet sheet = workbook.getSheetAt(s);
            String sheetName = sheet.getSheetName();

            if (workbook.isSheetHidden(s) || sheet.getPhysicalNumberOfRows() == 0) {
                continue;
            }

            // Se identificou abas com VSS/PATRIMÔNIO, processa apenas elas
            if (!targetSheetIndices.isEmpty() && !targetSheetIndices.contains(s)) {
                continue;
            }

            log.info("Processando aba '{}' ({}/{})", sheetName, s + 1, numberOfSheets);
            processSheet(sheet, sheetName, result, existingMap, processedPlatesInFile, toInsert, toUpdate,
                    currentCompanyId);
        }
    }

    private void processXlsbFile(MultipartFile file, ImportResultDto result,
            Map<String, Vehicle> existingMap, Set<String> processedPlatesInFile,
            List<Vehicle> toInsert, List<Vehicle> toUpdate, UUID currentCompanyId) {
        File tempFile = null;
        try {
            tempFile = File.createTempFile("vehicle-import-", ".xlsb");
            file.transferTo(tempFile);

            try (OPCPackage pkg = OPCPackage.open(tempFile)) {
                XSSFBReader reader = new XSSFBReader(pkg);
                XSSFBSharedStringsTable sst = new XSSFBSharedStringsTable(pkg);
                XSSFBStylesTable styles = reader.getXSSFBStylesTable();

                // Identificar se há aba alvo de frota VSS
                List<String> targetSheets = new ArrayList<>();
                XSSFBReader.SheetIterator checkIt = (XSSFBReader.SheetIterator) reader.getSheetsData();
                while (checkIt.hasNext()) {
                    InputStream st = checkIt.next();
                    String sName = checkIt.getSheetName();
                    String norm = normalizeText(sName);
                    if (norm.contains("vss") || norm.contains("patrimoni") || norm.contains("pratim")) {
                        targetSheets.add(sName);
                    }
                    st.close();
                }

                XSSFBReader.SheetIterator it = (XSSFBReader.SheetIterator) reader.getSheetsData();
                while (it.hasNext()) {
                    InputStream sheetStream = it.next();
                    String sheetName = it.getSheetName();

                    // Se identificou abas VSS, processa APENAS a aba VSS - FROTA
                    if (!targetSheets.isEmpty() && !targetSheets.contains(sheetName)) {
                        sheetStream.close();
                        continue;
                    }

                    log.info("Processando aba XLSB '{}'", sheetName);

                    XSSFSheetXMLHandler.SheetContentsHandler contentsHandler = new XSSFSheetXMLHandler.SheetContentsHandler() {
                        private int currentRow = -1;
                        private Map<String, String> rowCells = new HashMap<>();
                        private String currentCategory = "ÔNIBUS RODOVIÁRIOS";

                        @Override
                        public void startRow(int rowNum) {
                            currentRow = rowNum;
                            rowCells.clear();
                        }

                        @Override
                        public void endRow(int rowNum) {
                            int excelRow = rowNum + 1;
                            String colA = rowCells.getOrDefault("A", "").trim();
                            String colB = rowCells.getOrDefault("B", "").trim();

                            // Detectar linha de categoria (ex: Linhas 2, 98, 102, 109, 143, 188, 198)
                            String normA = normalizeText(colA);
                            String normB = normalizeText(colB);
                            String detectedCat = detectCategory(normA, normB);
                            if (detectedCat != null) {
                                currentCategory = detectedCat;
                                log.debug("Categoria detectada na linha {}: {}", excelRow, currentCategory);
                                return;
                            }

                            // Ignorar linha de cabeçalho
                            if (isHeaderRow(normA, normB)) {
                                return;
                            }

                            // Verificar se há placa na Coluna B (PATRIMÔNIO) ou Coluna A
                            if (!colB.isBlank() || !colA.isBlank()) {
                                String rawPlate = !colB.isBlank() ? colB : colA;
                                String chassi = rowCells.getOrDefault("C", "").trim();
                                String renavam = rowCells.getOrDefault("D", "").trim();
                                String modelo = rowCells.getOrDefault("E", "").trim();
                                String ano = rowCells.getOrDefault("F", "").trim();
                                String extraCap = rowCells.getOrDefault("M", "").trim();
                                String extraOwner = rowCells.getOrDefault("G", "").trim();

                                processVehicleEntry(rawPlate, chassi, renavam, modelo, ano, extraCap, extraOwner,
                                        currentCategory, excelRow, sheetName, result, existingMap,
                                        processedPlatesInFile, toInsert, toUpdate, currentCompanyId);
                            }
                        }

                        @Override
                        public void cell(String cellAddress, String formattedValue, XSSFComment comment) {
                            String col = cellAddress.replaceAll("[0-9]", "");
                            rowCells.put(col, formattedValue != null ? formattedValue.trim() : "");
                        }

                        @Override
                        public void headerFooter(String text, boolean isHeader, String tagName) {
                        }
                    };

                    XSSFBSheetHandler handler = new XSSFBSheetHandler(sheetStream, styles, null, sst, contentsHandler,
                            new DataFormatter(), false);
                    handler.parse();
                    sheetStream.close();
                }
            }
        } catch (Exception e) {
            log.error("Erro ao processar arquivo XLSB: ", e);
            result.getErrors().add("Erro ao processar XLSB: " + e.getMessage());
        } finally {
            if (tempFile != null && tempFile.exists()) {
                tempFile.delete();
            }
        }
    }

    private void processSheet(Sheet sheet, String sheetName, ImportResultDto result,
            Map<String, Vehicle> existingMap, Set<String> processedPlatesInFile,
            List<Vehicle> toInsert, List<Vehicle> toUpdate, UUID currentCompanyId) {
        int firstRowNum = sheet.getFirstRowNum();
        int lastRowNum = sheet.getLastRowNum();
        if (lastRowNum < 0)
            return;

        // Verificar se a aba possui seções empilhadas de categorias (como na planilha
        // VSS)
        boolean hasCategorySections = false;
        for (int r = firstRowNum; r <= Math.min(firstRowNum + 250, lastRowNum); r++) {
            Row row = sheet.getRow(r);
            if (row == null)
                continue;
            String cellA = normalizeText(getCellValueAsString(row.getCell(0)));
            String cellB = normalizeText(getCellValueAsString(row.getCell(1)));
            if (detectCategory(cellA, cellB) != null) {
                hasCategorySections = true;
                break;
            }
        }

        if (hasCategorySections) {
            log.info("Aba '{}' possui seções de categorias. Processando modo multi-categoria...", sheetName);
            String currentCategory = "ÔNIBUS RODOVIÁRIOS";

            for (int r = firstRowNum; r <= lastRowNum; r++) {
                Row row = sheet.getRow(r);
                if (row == null || isRowEmpty(row))
                    continue;

                String cellA = getCellValueAsString(row.getCell(0)).trim();
                String cellB = getCellValueAsString(row.getCell(1)).trim();
                String normA = normalizeText(cellA);
                String normB = normalizeText(cellB);

                String detectedCat = detectCategory(normA, normB);
                if (detectedCat != null) {
                    currentCategory = detectedCat;
                    continue;
                }

                if (isHeaderRow(normA, normB)) {
                    continue;
                }

                if (!cellB.isBlank() || !cellA.isBlank()) {
                    String rawPlate = !cellB.isBlank() ? cellB : cellA;
                    String chassi = getCellValueAsString(row.getCell(2));
                    String renavam = getCellValueAsString(row.getCell(3));
                    String modelo = getCellValueAsString(row.getCell(4));
                    String ano = getCellValueAsString(row.getCell(5));
                    String extraOwner = getCellValueAsString(row.getCell(6));
                    String extraCap = getCellValueAsString(row.getCell(12));

                    processVehicleEntry(rawPlate, chassi, renavam, modelo, ano, extraCap, extraOwner,
                            currentCategory, r + 1, sheetName, result, existingMap,
                            processedPlatesInFile, toInsert, toUpdate, currentCompanyId);
                }
            }
            return;
        }

        // Caso contrário, executa o mapeamento clássico por tabela única (cabeçalho no
        // topo)
        processClassicSheet(sheet, sheetName, result, existingMap, processedPlatesInFile, toInsert, toUpdate,
                currentCompanyId);
    }

    private void processClassicSheet(Sheet sheet, String sheetName, ImportResultDto result,
            Map<String, Vehicle> existingMap, Set<String> processedPlatesInFile,
            List<Vehicle> toInsert, List<Vehicle> toUpdate, UUID currentCompanyId) {
        int firstRowNum = sheet.getFirstRowNum();
        int lastRowNum = sheet.getLastRowNum();
        if (lastRowNum < 0)
            return;

        int headerRowIndex = -1;
        Map<Integer, String> columnMap = new HashMap<>();

        for (int r = firstRowNum; r <= Math.min(firstRowNum + 15, lastRowNum); r++) {
            Row row = sheet.getRow(r);
            if (row == null)
                continue;

            Map<Integer, String> tempMap = mapHeaders(row);
            if (tempMap.size() >= 2 && (tempMap.containsValue("PLATE") || tempMap.containsValue("PATRIMONIO")
                    || tempMap.containsValue("MODEL"))) {
                headerRowIndex = r;
                columnMap = tempMap;
                break;
            }
        }

        if (headerRowIndex == -1) {
            for (int r = firstRowNum; r <= Math.min(firstRowNum + 15, lastRowNum); r++) {
                Row row = sheet.getRow(r);
                if (row == null)
                    continue;

                Map<Integer, String> tempMap = mapHeaders(row);
                if (tempMap.containsValue("PLATE") || tempMap.containsValue("PATRIMONIO")) {
                    headerRowIndex = r;
                    columnMap = tempMap;
                    break;
                }
            }
        }

        if (headerRowIndex == -1 || columnMap.isEmpty()) {
            log.warn("Nenhum cabeçalho válido encontrado na aba '{}'", sheetName);
            return;
        }

        log.info("Cabeçalho localizado na aba '{}', linha {}. Colunas: {}", sheetName, headerRowIndex + 1,
                columnMap.values());

        for (int r = headerRowIndex + 1; r <= lastRowNum; r++) {
            Row row = sheet.getRow(r);
            if (row == null || isRowEmpty(row))
                continue;

            try {
                processRow(row, r + 1, sheetName, columnMap, result, existingMap, processedPlatesInFile, toInsert,
                        toUpdate, currentCompanyId);
            } catch (Exception e) {
                log.error("Erro na aba '{}', linha {}: ", sheetName, r + 1, e);
                result.setSkipped(result.getSkipped() + 1);
                result.getErrors().add(String.format("Aba '%s', Linha %d: %s", sheetName, r + 1, e.getMessage()));
            }
        }
    }

    private String detectCategory(String normA, String normB) {
        String text = (normA + " " + normB).trim();
        if (text.contains("double decker") || text.contains("luxo turismo")) {
            return "ÔNIBUS LUXO TURISMO (DOUBLE DECKER)";
        }
        if (text.contains("onibus rodoviarios") || text.contains("rodoviarios")) {
            return "ÔNIBUS RODOVIÁRIOS";
        }
        if (text.contains("micro onibus") || text.contains("micro-onibus")) {
            return "MICRO ÔNIBUS";
        }
        if (text.contains("onibus urbanos") || text.contains("urbanos")) {
            return "ÔNIBUS URBANOS";
        }
        if (text.contains("vans") || text.equals("van")) {
            return "VANS";
        }
        if (text.contains("carros utilitarios") || text.contains("utilitarios")) {
            return "CARROS UTILITÁRIOS";
        }
        if (text.contains("locados") || text.contains("agregados")) {
            return "VEÍCULOS LOCADOS/AGREGADOS";
        }
        return null;
    }

    private boolean isHeaderRow(String normA, String normB) {
        return normB.equals("patrimonio") || normB.equals("placa") || normB.equals("plate")
                || normA.equals("qtde") || normA.equals("quantidade") || normA.equals("item")
                || normB.contains("chassi") || normB.contains("renavam");
    }

    private void processVehicleEntry(String rawPlate, String rawChassis, String rawRenavam,
            String rawModel, String rawYear, String rawCapacity,
            String extraOwner, String category, int rowNum, String sheetName,
            ImportResultDto result, Map<String, Vehicle> existingMap,
            Set<String> processedPlatesInFile, List<Vehicle> toInsert,
            List<Vehicle> toUpdate, UUID currentCompanyId) {
        if (rawPlate == null || rawPlate.isBlank())
            return;

        // Extrair proprietário agregado se vier no formato "GTN7B68 - MARÇAL"
        String ownerName = null;
        String plateToClean = rawPlate;
        if (plateToClean.contains("-")) {
            String[] parts = plateToClean.split("-", 2);
            String candidatePlate = cleanPlate(parts[0]);
            if (candidatePlate.length() >= 7) {
                plateToClean = parts[0];
                ownerName = parts[1].trim();
            }
        }

        String finalPlate = cleanPlate(plateToClean);
        if (finalPlate.isBlank() || isHeaderWord(finalPlate) || finalPlate.length() < 7 || finalPlate.length() > 8) {
            return;
        }

        if (processedPlatesInFile.contains(finalPlate)) {
            result.setSkipped(result.getSkipped() + 1);
            return;
        }
        processedPlatesInFile.add(finalPlate);
        result.setTotalRows(result.getTotalRows() + 1);

        String finalChassis = parseAndValidateChassis(rawChassis);
        String finalRenavam = parseAndValidateRenavam(rawRenavam);
        String finalModel = (rawModel != null && !rawModel.isBlank()) ? rawModel.trim() : "Modelo Não Especificado";
        String finalBrand = extractBrandFromModel(finalModel);

        Integer[] years = parseYearAndModelYear(rawYear);
        Integer parsedYear = years[0] != null ? years[0] : LocalDate.now().getYear();
        Integer parsedModelYear = years[1] != null ? years[1] : parsedYear;

        VehicleType parsedVehicleType = resolveCategoryToVehicleType(category, finalModel);
        boolean isAggregated = category != null
                && (category.toUpperCase().contains("LOCADO") || category.toUpperCase().contains("AGREGADO"));

        if (ownerName == null && extraOwner != null && !extraOwner.isBlank() && !extraOwner.equalsIgnoreCase("VSS")) {
            ownerName = extraOwner.trim();
        }

        Vehicle vehicle = existingMap.get(finalPlate);
        if (vehicle == null) {
            try {
                Optional<Vehicle> opt = vehicleRepository.findByPlateRawScoped(finalPlate, currentCompanyId);
                if (opt.isPresent()) {
                    vehicle = opt.get();
                    existingMap.put(finalPlate, vehicle);
                }
            } catch (Exception ignored) {
            }
        }

        if (vehicle != null) {
            boolean updated = false;
            if (vehicle.getDeletedAt() != null) {
                vehicle.setDeletedAt(null);
                updated = true;
            }
            if (vehicle.getStatus() == null) {
                vehicle.setStatus(VehicleStatus.ACTIVE);
                updated = true;
            }
            if (finalChassis != null && !finalChassis.equalsIgnoreCase(vehicle.getChassisNumber())) {
                vehicle.setChassisNumber(truncateString(finalChassis, 50));
                updated = true;
            }
            if (finalRenavam != null && !finalRenavam.equalsIgnoreCase(vehicle.getRenavan())) {
                vehicle.setRenavan(truncateString(finalRenavam, 50));
                updated = true;
            }
            if (!finalModel.equalsIgnoreCase(vehicle.getModel()) && !finalModel.equals("Modelo Não Especificado")) {
                vehicle.setModel(truncateString(finalModel, 50));
                updated = true;
            }
            if (finalBrand != null && !finalBrand.equals("Outros")) {
                vehicle.setBrand(truncateString(finalBrand, 50));
                updated = true;
            }
            if (parsedYear != null && !parsedYear.equals(vehicle.getYear())) {
                vehicle.setYear(parsedYear);
                updated = true;
            }
            if (parsedModelYear != null && !parsedModelYear.equals(vehicle.getModelYear())) {
                vehicle.setModelYear(parsedModelYear);
                updated = true;
            }
            if (parsedVehicleType != null && !parsedVehicleType.equals(vehicle.getVehicleType())) {
                vehicle.setVehicleType(parsedVehicleType);
                updated = true;
            }
            if (isAggregated) {
                vehicle.setIsAggregated(true);
                if (ownerName != null && !ownerName.isBlank()) {
                    vehicle.setAggregatedOwnerName(truncateString(ownerName, 200));
                }
                updated = true;
            }
            if (currentCompanyId != null && vehicle.getCompanyId() == null) {
                vehicle.setCompanyId(currentCompanyId);
                updated = true;
            }

            if (updated) {
                toUpdate.add(vehicle);
            } else {
                result.setSkipped(result.getSkipped() + 1);
            }
        } else {
            Vehicle newVehicle = new Vehicle();
            newVehicle.setPlate(finalPlate);
            newVehicle.setChassisNumber(truncateString(finalChassis, 50));
            newVehicle.setRenavan(truncateString(finalRenavam, 50));
            newVehicle.setModel(truncateString(finalModel, 50));
            newVehicle.setBrand(truncateString(finalBrand, 50));
            newVehicle.setYear(parsedYear);
            newVehicle.setModelYear(parsedModelYear);
            newVehicle.setColor("Branco");
            newVehicle.setStatus(VehicleStatus.ACTIVE);
            newVehicle.setFuelType(
                    parsedVehicleType == VehicleType.CAR || parsedVehicleType == VehicleType.CAR_UTILITY ? FuelType.FLEX
                            : FuelType.DIESEL);
            newVehicle.setVehicleType(parsedVehicleType != null ? parsedVehicleType : VehicleType.BUS_ROAD);
            newVehicle.setCapacity(parseInteger(rawCapacity, 44));

            if (isAggregated) {
                newVehicle.setIsAggregated(true);
                if (ownerName != null && !ownerName.isBlank()) {
                    newVehicle.setAggregatedOwnerName(truncateString(ownerName, 200));
                }
            }
            if (currentCompanyId != null) {
                newVehicle.setCompanyId(currentCompanyId);
            }

            toInsert.add(newVehicle);
            existingMap.put(finalPlate, newVehicle);
        }
    }

    private void persistVehicles(List<Vehicle> toInsert, List<Vehicle> toUpdate,
            ImportResultDto result, UUID currentCompanyId) {
        int insertedCount = 0;
        int updatedCount = 0;
        TransactionTemplate tt = new TransactionTemplate(transactionManager);

        for (Vehicle v : toInsert) {
            try {
                tt.execute(status -> {
                    vehicleRepository.save(v);
                    return null;
                });
                insertedCount++;
            } catch (Exception e) {
                log.warn("Erro ao inserir veículo {}: {}. Tentando recuperar por busca direta...", v.getPlate(),
                        e.getMessage());
                try {
                    Optional<Vehicle> rawOpt = vehicleRepository.findByPlateRawScoped(v.getPlate(), currentCompanyId);
                    if (rawOpt.isPresent()) {
                        Vehicle existing = rawOpt.get();
                        existing.setDeletedAt(null);
                        if (v.getModel() != null)
                            existing.setModel(v.getModel());
                        if (v.getBrand() != null)
                            existing.setBrand(v.getBrand());
                        if (v.getYear() != null)
                            existing.setYear(v.getYear());
                        if (v.getModelYear() != null)
                            existing.setModelYear(v.getModelYear());
                        if (v.getChassisNumber() != null)
                            existing.setChassisNumber(v.getChassisNumber());
                        if (v.getRenavan() != null)
                            existing.setRenavan(v.getRenavan());
                        if (v.getFleetNumber() != null)
                            existing.setFleetNumber(v.getFleetNumber());
                        if (v.getColor() != null)
                            existing.setColor(v.getColor());
                        if (v.getCompanyId() != null)
                            existing.setCompanyId(v.getCompanyId());
                        if (v.getVehicleType() != null)
                            existing.setVehicleType(v.getVehicleType());
                        if (v.getIsAggregated() != null && v.getIsAggregated()) {
                            existing.setIsAggregated(true);
                            if (v.getAggregatedOwnerName() != null)
                                existing.setAggregatedOwnerName(v.getAggregatedOwnerName());
                        }
                        if (existing.getStatus() == null)
                            existing.setStatus(VehicleStatus.ACTIVE);
                        tt.execute(status -> {
                            vehicleRepository.save(existing);
                            return null;
                        });
                        updatedCount++;
                        continue;
                    }
                } catch (Exception ex2) {
                    log.error("Falha no fallback de veículo {}: {}", v.getPlate(), ex2.getMessage());
                }
                result.setSkipped(result.getSkipped() + 1);
                result.getErrors()
                        .add(String.format("Veículo placa %s não inserido: %s", v.getPlate(), e.getMessage()));
            }
        }

        for (Vehicle v : toUpdate) {
            try {
                tt.execute(status -> {
                    vehicleRepository.save(v);
                    return null;
                });
                updatedCount++;
            } catch (Exception e) {
                log.warn("Erro ao atualizar veículo {}: {}", v.getPlate(), e.getMessage());
                result.setSkipped(result.getSkipped() + 1);
                result.getErrors()
                        .add(String.format("Veículo placa %s não atualizado: %s", v.getPlate(), e.getMessage()));
            }
        }

        result.setInserted(insertedCount);
        result.setUpdated(updatedCount);
    }

    private Map<Integer, String> mapHeaders(Row headerRow) {
        Map<Integer, String> map = new HashMap<>();
        for (Cell cell : headerRow) {
            String val = getCellValueAsString(cell);
            if (val == null || val.isBlank())
                continue;

            String normalized = normalizeText(val);

            if (normalized.equals("placa") || normalized.equals("plate") || normalized.startsWith("placa")) {
                map.put(cell.getColumnIndex(), "PLATE");
            } else if (normalized.contains("patrimonio") || normalized.contains("patrimon")
                    || normalized.contains("patrim")) {
                map.put(cell.getColumnIndex(), "PATRIMONIO");
            } else if (normalized.contains("frota") || normalized.contains("prefixo") || normalized.contains("subsidio")
                    || normalized.contains("num veiculo")) {
                map.put(cell.getColumnIndex(), "FLEET_NUMBER");
            } else if (normalized.contains("chassi") || normalized.contains("chassis") || normalized.contains("vin")) {
                map.put(cell.getColumnIndex(), "CHASSIS");
            } else if (normalized.contains("renavam") || normalized.contains("renavan")) {
                map.put(cell.getColumnIndex(), "RENAVAM");
            } else if (normalized.contains("modelo") || normalized.contains("model")
                    || normalized.contains("marca/modelo") || normalized.contains("descricao")) {
                map.put(cell.getColumnIndex(), "MODEL");
            } else if (normalized.contains("ano") || normalized.contains("mod") || normalized.contains("ano/mod")) {
                map.put(cell.getColumnIndex(), "YEAR");
            } else if (normalized.contains("marca") || normalized.contains("brand") || normalized.contains("fabricante")
                    || normalized.contains("montadora")) {
                map.put(cell.getColumnIndex(), "BRAND");
            } else if (normalized.contains("cor") || normalized.contains("color")) {
                map.put(cell.getColumnIndex(), "COLOR");
            } else if (normalized.contains("capacidade") || normalized.contains("lotacao")
                    || normalized.contains("passageiros") || normalized.contains("assentos")) {
                map.put(cell.getColumnIndex(), "CAPACITY");
            } else if (normalized.contains("carroceria") || normalized.contains("encatavel")) {
                map.put(cell.getColumnIndex(), "BODY_BUILDER");
            } else if (normalized.contains("chassi marca") || normalized.contains("marca chassi")
                    || normalized.contains("mod chassi")) {
                map.put(cell.getColumnIndex(), "CHASSIS_BRAND");
            } else if (normalized.contains("proprietario") || normalized.contains("proprietário")
                    || normalized.contains("proprix") || normalized.contains("dono")) {
                map.put(cell.getColumnIndex(), "OWNER");
            } else if (normalized.contains("cliente") || normalized.contains("empresa")
                    || normalized.contains("contrato")) {
                map.put(cell.getColumnIndex(), "CLIENT");
            } else if (normalized.contains("valor") || normalized.contains("avaliacao")) {
                map.put(cell.getColumnIndex(), "MARKET_VALUE");
            } else if (normalized.contains("km") || normalized.contains("odometro")) {
                map.put(cell.getColumnIndex(), "MILEAGE");
            } else if (normalized.contains("combustivel") || normalized.contains("combustível")) {
                map.put(cell.getColumnIndex(), "FUEL_TYPE");
            } else if (normalized.contains("tipo de veiculo") || normalized.contains("tipo veiculo")
                    || normalized.equals("tipo") || normalized.contains("categoria")
                    || normalized.contains("especie")) {
                map.put(cell.getColumnIndex(), "VEHICLE_TYPE");
            }
        }
        return map;
    }

    private void processRow(Row row, int rowNum, String sheetName, Map<Integer, String> columnMap,
            ImportResultDto result, Map<String, Vehicle> existingMap,
            Set<String> processedPlatesInFile, List<Vehicle> toInsert, List<Vehicle> toUpdate,
            UUID currentCompanyId) {
        String plateValue = null;
        String patrimonioValue = null;
        String fleetNumberValue = null;
        String chassisValue = null;
        String renavamValue = null;
        String modelValue = null;
        String yearValue = null;
        String brandValue = null;
        String colorValue = null;
        String capacityValue = null;
        String bodyBuilderValue = null;
        String chassisBrandValue = null;
        String ownerValue = null;
        String clientValue = null;
        String mileageValue = null;
        String vehicleTypeValue = null;
        BigDecimal marketValue = null;

        for (Map.Entry<Integer, String> entry : columnMap.entrySet()) {
            int colIdx = entry.getKey();
            String fieldType = entry.getValue();
            Cell cell = row.getCell(colIdx);
            String val = getCellValueAsString(cell);

            if (val == null || val.isBlank())
                continue;

            switch (fieldType) {
                case "PLATE":
                    plateValue = val.trim().toUpperCase();
                    break;
                case "PATRIMONIO":
                    patrimonioValue = val.trim().toUpperCase();
                    break;
                case "FLEET_NUMBER":
                    fleetNumberValue = val.trim();
                    break;
                case "CHASSIS":
                    chassisValue = val.trim().toUpperCase();
                    break;
                case "RENAVAM":
                    renavamValue = val.trim().replaceAll("\\D", "");
                    if (renavamValue.isBlank())
                        renavamValue = val.trim();
                    break;
                case "MODEL":
                    modelValue = val.trim();
                    break;
                case "YEAR":
                    yearValue = val.trim();
                    break;
                case "BRAND":
                    brandValue = val.trim();
                    break;
                case "COLOR":
                    colorValue = val.trim();
                    break;
                case "CAPACITY":
                    capacityValue = val.trim();
                    break;
                case "BODY_BUILDER":
                    bodyBuilderValue = val.trim();
                    break;
                case "CHASSIS_BRAND":
                    chassisBrandValue = val.trim();
                    break;
                case "OWNER":
                    ownerValue = val.trim();
                    break;
                case "CLIENT":
                    clientValue = val.trim();
                    break;
                case "MILEAGE":
                    mileageValue = val.trim();
                    break;
                case "VEHICLE_TYPE":
                    vehicleTypeValue = val.trim();
                    break;
                case "MARKET_VALUE":
                    try {
                        marketValue = new BigDecimal(val.trim().replaceAll("[^0-9,.]", "").replace(",", "."));
                    } catch (Exception ignored) {
                    }
                    break;
            }
        }

        // Validar Chassi (17 caracteres alfanuméricos)
        String finalChassis = parseAndValidateChassis(chassisValue);

        // Validar RENAVAM (9 a 11 dígitos numéricos)
        String finalRenavam = parseAndValidateRenavam(renavamValue);

        // REGRA PRINCIPAL: PATRIMÔNIO ou PLACA é o identificador inserido no campo
        // PLACA
        String finalPlate = plateValue;
        if (finalPlate != null
                && (isHeaderWord(finalPlate) || isPureRenavamNumber(finalPlate) || isPureChassisString(finalPlate))) {
            if (isPureRenavamNumber(finalPlate) && finalRenavam == null) {
                finalRenavam = parseAndValidateRenavam(finalPlate);
            } else if (isPureChassisString(finalPlate) && finalChassis == null) {
                finalChassis = parseAndValidateChassis(finalPlate);
            }
            finalPlate = null;
        }

        if ((finalPlate == null || finalPlate.isBlank()) && patrimonioValue != null && !patrimonioValue.isBlank()) {
            if (!isHeaderWord(patrimonioValue) && !isPureRenavamNumber(patrimonioValue)
                    && !isPureChassisString(patrimonioValue)) {
                finalPlate = patrimonioValue;
            } else if (isPureRenavamNumber(patrimonioValue) && finalRenavam == null) {
                finalRenavam = parseAndValidateRenavam(patrimonioValue);
            } else if (isPureChassisString(patrimonioValue) && finalChassis == null) {
                finalChassis = parseAndValidateChassis(patrimonioValue);
            }
        }

        if (finalPlate == null || finalPlate.isBlank()) {
            result.setSkipped(result.getSkipped() + 1);
            return;
        }

        finalPlate = cleanPlate(finalPlate);
        if (finalPlate.isBlank() || isHeaderWord(finalPlate) || isPureRenavamNumber(finalPlate)
                || isPureChassisString(finalPlate) || finalPlate.length() < 5 || finalPlate.length() > 8) {
            result.setSkipped(result.getSkipped() + 1);
            return;
        }

        // Ignorar duplicatas dentro do próprio arquivo Excel
        if (processedPlatesInFile.contains(finalPlate)) {
            result.setSkipped(result.getSkipped() + 1);
            return;
        }
        processedPlatesInFile.add(finalPlate);

        String fleetNum = fleetNumberValue;
        if ((fleetNum == null || fleetNum.isBlank()) && patrimonioValue != null && !patrimonioValue.isBlank()) {
            fleetNum = patrimonioValue.trim();
        }

        Integer parsedYear = parseYear(yearValue);
        if (parsedYear == null) {
            parsedYear = LocalDate.now().getYear();
        }

        String finalModel = (modelValue != null && !modelValue.isBlank()) ? modelValue : "Modelo Não Especificado";
        String finalBrand = (brandValue != null && !brandValue.isBlank()) ? brandValue
                : extractBrandFromModel(finalModel);
        VehicleType parsedVehicleType = parseVehicleType(vehicleTypeValue);
        String cleanedPlateKey = cleanPlate(finalPlate);
        Vehicle vehicle = existingMap.get(cleanedPlateKey);
        if (vehicle == null) {
            try {
                Optional<Vehicle> opt = vehicleRepository.findByPlateRawScoped(finalPlate, currentCompanyId);
                if (opt.isPresent()) {
                    vehicle = opt.get();
                    existingMap.put(cleanedPlateKey, vehicle);
                }
            } catch (Exception ignored) {
            }
        }

        if (vehicle != null) {
            boolean updated = false;

            if (vehicle.getDeletedAt() != null) {
                vehicle.setDeletedAt(null);
                updated = true;
            }
            if (vehicle.getStatus() == null) {
                vehicle.setStatus(VehicleStatus.ACTIVE);
                updated = true;
            }

            if (finalChassis != null && !finalChassis.equalsIgnoreCase(vehicle.getChassisNumber())) {
                vehicle.setChassisNumber(truncateString(finalChassis, 50));
                updated = true;
            }
            if (finalRenavam != null && !finalRenavam.equalsIgnoreCase(vehicle.getRenavan())) {
                vehicle.setRenavan(truncateString(finalRenavam, 50));
                updated = true;
            }
            if (modelValue != null && !modelValue.isBlank() && !modelValue.equalsIgnoreCase(vehicle.getModel())) {
                vehicle.setModel(truncateString(finalModel, 50));
                updated = true;
            }
            if (parsedYear != null && !parsedYear.equals(vehicle.getYear())) {
                vehicle.setYear(parsedYear);
                updated = true;
            }
            if (parsedVehicleType != null && !parsedVehicleType.equals(vehicle.getVehicleType())) {
                vehicle.setVehicleType(parsedVehicleType);
                updated = true;
            }
            if (colorValue != null && !colorValue.isBlank()) {
                vehicle.setColor(truncateString(colorValue, 30));
                updated = true;
            }
            if (fleetNum != null && !fleetNum.isBlank() && !fleetNum.equalsIgnoreCase(vehicle.getFleetNumber())) {
                vehicle.setFleetNumber(truncateString(fleetNum, 50));
                updated = true;
            }
            if (bodyBuilderValue != null && !bodyBuilderValue.isBlank()) {
                vehicle.setBodyBuilder(truncateString(bodyBuilderValue, 100));
                updated = true;
            }
            if (chassisBrandValue != null && !chassisBrandValue.isBlank()) {
                vehicle.setChassisBrand(truncateString(chassisBrandValue, 50));
                updated = true;
            }
            if (ownerValue != null && !ownerValue.isBlank()) {
                vehicle.setAggregatedOwnerName(truncateString(ownerValue, 200));
                vehicle.setIsAggregated(true);
                updated = true;
            }
            if (clientValue != null && !clientValue.isBlank()) {
                vehicle.setClientName(truncateString(clientValue, 200));
                updated = true;
            }
            if (marketValue != null) {
                vehicle.setMarketValue(marketValue);
                updated = true;
            }
            if (currentCompanyId != null && vehicle.getCompanyId() == null) {
                vehicle.setCompanyId(currentCompanyId);
                updated = true;
            }

            if (updated) {
                toUpdate.add(vehicle);
            } else {
                result.setSkipped(result.getSkipped() + 1);
            }
        } else {
            Vehicle newVehicle = new Vehicle();
            newVehicle.setPlate(finalPlate);
            newVehicle.setFleetNumber(truncateString(fleetNum, 50));
            newVehicle.setChassisNumber(truncateString(finalChassis, 50));
            newVehicle.setRenavan(truncateString(finalRenavam, 50));
            newVehicle.setModel(truncateString(finalModel, 50));
            newVehicle.setBrand(truncateString(finalBrand, 50));
            newVehicle.setYear(parsedYear);
            newVehicle.setColor(truncateString(colorValue != null ? colorValue : "Branco", 30));
            newVehicle.setStatus(VehicleStatus.ACTIVE);
            newVehicle.setFuelType(FuelType.DIESEL);
            newVehicle.setVehicleType(parsedVehicleType != null ? parsedVehicleType : VehicleType.BUS_ROAD);
            newVehicle.setCapacity(parseInteger(capacityValue, 44));
            newVehicle.setCurrentMileage(parseInteger(mileageValue, 0));
            newVehicle.setBodyBuilder(truncateString(bodyBuilderValue, 100));
            newVehicle.setChassisBrand(truncateString(chassisBrandValue, 50));

            if (ownerValue != null && !ownerValue.isBlank()) {
                newVehicle.setAggregatedOwnerName(truncateString(ownerValue, 200));
                newVehicle.setIsAggregated(true);
            }
            if (clientValue != null && !clientValue.isBlank()) {
                newVehicle.setClientName(truncateString(clientValue, 200));
            }
            if (marketValue != null) {
                newVehicle.setMarketValue(marketValue);
            }
            if (currentCompanyId != null) {
                newVehicle.setCompanyId(currentCompanyId);
            }

            toInsert.add(newVehicle);
        }
    }

    private String truncateString(String str, int maxLen) {
        if (str == null)
            return null;
        return str.length() > maxLen ? str.substring(0, maxLen) : str;
    }

    private String cleanPlate(String rawPlate) {
        if (rawPlate == null)
            return "";
        String cleaned = rawPlate.replaceAll("[^A-Za-z0-9]", "").toUpperCase();
        if (cleaned.length() > 10) {
            cleaned = cleaned.substring(0, 10);
        }
        return cleaned;
    }

    private Integer parseYear(String yearStr) {
        if (yearStr == null || yearStr.isBlank())
            return null;
        Matcher matcher = YEAR_PATTERN.matcher(yearStr);
        Integer lastMatch = null;
        while (matcher.find()) {
            try {
                lastMatch = Integer.parseInt(matcher.group(1));
            } catch (NumberFormatException ignored) {
            }
        }
        return lastMatch;
    }

    private Integer[] parseYearAndModelYear(String yearStr) {
        if (yearStr == null || yearStr.isBlank())
            return new Integer[] { null, null };
        Matcher matcher = YEAR_PATTERN.matcher(yearStr);
        Integer firstYear = null;
        Integer secondYear = null;
        if (matcher.find()) {
            try {
                firstYear = Integer.parseInt(matcher.group(1));
            } catch (NumberFormatException ignored) {
            }
        }
        if (matcher.find()) {
            try {
                secondYear = Integer.parseInt(matcher.group(1));
            } catch (NumberFormatException ignored) {
            }
        } else {
            secondYear = firstYear;
        }
        return new Integer[] { firstYear, secondYear };
    }

    private VehicleType resolveCategoryToVehicleType(String category, String model) {
        if (category == null || category.isBlank())
            return parseVehicleType(model);
        String upper = Normalizer.normalize(category, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toUpperCase();
        if (upper.contains("DOUBLE DECKER") || upper.contains("LUXO TURISMO")) {
            return VehicleType.BUS_LUXURY_TOURISM;
        }
        if (upper.contains("RODOVIARIO")) {
            return VehicleType.BUS_ROAD;
        }
        if (upper.contains("URBANO")) {
            return VehicleType.BUS_URBAN;
        }
        if (upper.contains("MICRO")) {
            return VehicleType.MINIBUS;
        }
        if (upper.contains("VAN")) {
            return VehicleType.VAN;
        }
        if (upper.contains("UTILITARIO")) {
            return VehicleType.CAR_UTILITY;
        }
        if (upper.contains("LOCADO") || upper.contains("AGREGADO")) {
            String modelUpper = model != null ? model.toUpperCase() : "";
            if (modelUpper.contains("SPRINTER") || modelUpper.contains("HIACE") || modelUpper.contains("VAN")) {
                return VehicleType.VAN;
            }
            if (modelUpper.contains("VOLARE") || modelUpper.contains("MICRO")) {
                return VehicleType.MINIBUS;
            }
            if (modelUpper.contains("IDEALE") || modelUpper.contains("VIAGGIO") || modelUpper.contains("VERSATILE")
                    || modelUpper.contains("MPOLO")) {
                return VehicleType.BUS_ROAD;
            }
            return VehicleType.CAR_UTILITY;
        }
        return VehicleType.BUS_ROAD;
    }

    private String extractBrandFromModel(String model) {
        if (model == null || model.isBlank())
            return "Outros";
        String lower = model.toLowerCase();
        if (lower.contains("mercedes") || lower.contains("m.benz") || lower.contains("mbenz") || lower.contains("mb "))
            return "Mercedes-Benz";
        if (lower.contains("volvo"))
            return "Volvo";
        if (lower.contains("scania"))
            return "Scania";
        if (lower.contains("vw") || lower.contains("volks") || lower.contains("saveiro"))
            return "Volkswagen";
        if (lower.contains("toyota") || lower.contains("hiace"))
            return "Toyota";
        if (lower.contains("renault") || lower.contains("kwid"))
            return "Renault";
        if (lower.contains("ford") || lower.contains("ka "))
            return "Ford";
        if (lower.contains("byd"))
            return "BYD";
        if (lower.contains("nissan") || lower.contains("frontier"))
            return "Nissan";
        if (lower.contains("fiat") || lower.contains("strada") || lower.contains("ducato"))
            return "Fiat";
        if (lower.contains("chevrolet") || lower.contains("gm"))
            return "Chevrolet";
        if (lower.contains("iveco"))
            return "Iveco";
        if (lower.contains("volare"))
            return "Volare";
        if (lower.contains("marcopolo") || lower.contains("mpolo"))
            return "Marcopolo";
        if (lower.contains("caio") || lower.contains("apache"))
            return "Caio";
        if (lower.contains("mascarello"))
            return "Mascarello";
        if (lower.contains("comil") || lower.contains("versatile"))
            return "Comil";
        if (lower.contains("induscar"))
            return "Induscar";
        return "Outros";
    }

    private Integer parseInteger(String str, int defaultVal) {
        if (str == null || str.isBlank())
            return defaultVal;
        try {
            return (int) Math.round(Double.parseDouble(str.replaceAll("[^0-9.]", "")));
        } catch (Exception e) {
            return defaultVal;
        }
    }

    private String normalizeText(String text) {
        if (text == null)
            return "";
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "").toLowerCase().trim();
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null)
            return "";
        CellType type = cell.getCellType();
        if (type == CellType.FORMULA) {
            type = cell.getCachedFormulaResultType();
        }
        switch (type) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getLocalDateTimeCellValue().toLocalDate().toString();
                }
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

    private boolean isRowEmpty(Row row) {
        if (row == null)
            return true;
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                String val = getCellValueAsString(cell);
                if (val != null && !val.isBlank()) {
                    return false;
                }
            }
        }
        return true;
    }

    private boolean isHeaderWord(String text) {
        if (text == null)
            return true;
        String norm = normalizeText(text);
        return norm.equals("renavam") || norm.equals("renavan") || norm.equals("placa") || norm.equals("plate")
                || norm.contains("patrimonio") || norm.contains("chassi") || norm.equals("modelo")
                || norm.equals("marca") || norm.equals("ano") || norm.equals("cor") || norm.equals("status")
                || norm.equals("frota") || norm.equals("prefixo") || norm.equals("subsidio")
                || norm.equals("patrimon") || norm.equals("patrim");
    }

    private boolean isPureRenavamNumber(String text) {
        if (text == null)
            return false;
        String digitsOnly = text.replaceAll("\\D", "");
        // RENAVAM no Brasil possui de 9 a 11 dígitos numéricos puros
        return digitsOnly.length() >= 9 && digitsOnly.length() <= 11 && text.replaceAll("[0-9]", "").isEmpty();
    }

    private boolean isPureChassisString(String text) {
        if (text == null)
            return false;
        String cleaned = text.replaceAll("[^A-Za-z0-9]", "").toUpperCase();
        return cleaned.length() == 17;
    }

    private String parseAndValidateChassis(String rawChassis) {
        if (rawChassis == null || rawChassis.isBlank())
            return null;
        String cleaned = rawChassis.replaceAll("[^A-Za-z0-9]", "").toUpperCase();
        if (cleaned.length() == 17) {
            return cleaned;
        }
        return null;
    }

    private String parseAndValidateRenavam(String rawRenavam) {
        if (rawRenavam == null || rawRenavam.isBlank())
            return null;
        String digitsOnly = rawRenavam.replaceAll("\\D", "");
        if (digitsOnly.length() >= 9 && digitsOnly.length() <= 11) {
            return digitsOnly;
        }
        return null;
    }

    private VehicleType parseVehicleType(String text) {
        if (text == null || text.isBlank())
            return null;
        String norm = normalizeText(text);

        if (norm.contains("micro"))
            return VehicleType.MINIBUS;
        if (norm.contains("van"))
            return VehicleType.VAN;
        if (norm.contains("rodoviario") || norm.contains("rodoviaria"))
            return VehicleType.BUS_ROAD;
        if (norm.contains("urbano") || norm.contains("urbana"))
            return VehicleType.BUS_URBAN;
        if (norm.contains("luxo") || norm.contains("double decker"))
            return VehicleType.BUS_LUXURY_TOURISM;
        if (norm.contains("onibus") || norm.contains("bus"))
            return VehicleType.BUS_ROAD;
        if (norm.contains("caminhao") || norm.contains("truck") || norm.contains("carreta") || norm.contains("cavalo"))
            return VehicleType.TRUCK;
        if (norm.contains("utilitario") || norm.contains("furgao"))
            return VehicleType.CAR_UTILITY;
        if (norm.contains("pickup") || norm.contains("picape") || norm.contains("camionete") || norm.contains("cabine"))
            return VehicleType.PICKUP;
        if (norm.contains("suv"))
            return VehicleType.SUV;
        if (norm.contains("moto"))
            return VehicleType.MOTORCYCLE;
        if (norm.contains("carro") || norm.contains("passeio") || norm.contains("automovel"))
            return VehicleType.CAR;

        for (VehicleType vt : VehicleType.values()) {
            if (norm.equalsIgnoreCase(normalizeText(vt.name()))
                    || norm.equalsIgnoreCase(normalizeText(vt.getDisplayName()))) {
                return vt;
            }
        }
        return null;
    }
}
