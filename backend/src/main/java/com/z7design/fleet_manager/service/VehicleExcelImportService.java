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
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.text.Normalizer;
import java.time.LocalDate;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleExcelImportService {

    private final VehicleRepository vehicleRepository;
    private final PlatformTransactionManager transactionManager;

    private static final Pattern YEAR_PATTERN = Pattern.compile("(19\\d{2}|20\\d{2})");

    public ImportResultDto importVehiclesFromExcel(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("O arquivo de importação está vazio ou não foi enviado.");
        }

        ImportResultDto result = ImportResultDto.empty();
        log.info("Iniciando importação otimizada de veículos a partir do arquivo Excel: {}", file.getOriginalFilename());

        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {

            // 1. Pré-carregar todos os veículos existentes para busca O(1) em memória
            Map<String, Vehicle> existingMap = new HashMap<>();
            try {
                List<Vehicle> allVehicles = vehicleRepository.findAll();
                for (Vehicle v : allVehicles) {
                    if (v.getPlate() != null) {
                        existingMap.put(v.getPlate().toUpperCase(), v);
                    }
                }
                log.info("Pré-carregados {} veículos existentes em memória.", existingMap.size());
            } catch (Exception e) {
                log.warn("Não foi possível pré-carregar veículos: {}", e.getMessage());
            }

            Set<String> processedPlatesInFile = new HashSet<>();
            List<Vehicle> toInsert = new ArrayList<>();
            List<Vehicle> toUpdate = new ArrayList<>();

            int numberOfSheets = workbook.getNumberOfSheets();
            log.info("Processando arquivo Excel com {} abas", numberOfSheets);

            for (int s = 0; s < numberOfSheets; s++) {
                Sheet sheet = workbook.getSheetAt(s);
                String sheetName = sheet.getSheetName();

                if (workbook.isSheetHidden(s) || sheet.getPhysicalNumberOfRows() == 0) {
                    continue;
                }

                log.info("Processando aba '{}' ({}/{})", sheetName, s + 1, numberOfSheets);
                processSheet(sheet, sheetName, result, existingMap, processedPlatesInFile, toInsert, toUpdate);
            }

            // 2. Persistir em lote em uma única transação otimizada
            if (!toInsert.isEmpty() || !toUpdate.isEmpty()) {
                log.info("Persistindo lote: {} a inserir, {} a atualizar", toInsert.size(), toUpdate.size());
                TransactionTemplate tt = new TransactionTemplate(transactionManager);
                tt.execute(status -> {
                    if (!toInsert.isEmpty()) {
                        vehicleRepository.saveAll(toInsert);
                    }
                    if (!toUpdate.isEmpty()) {
                        vehicleRepository.saveAll(toUpdate);
                    }
                    return null;
                });
                result.setInserted(toInsert.size());
                result.setUpdated(toUpdate.size());
            }

        } catch (Exception e) {
            log.error("Erro crítico ao ler o arquivo Excel de veículos: ", e);
            result.getErrors().add("Falha ao ler arquivo Excel: " + e.getMessage());
        }

        log.info("Importação de veículos concluída. Inseridos: {}, Atualizados: {}, Ignorados: {}, Erros: {}",
                result.getInserted(), result.getUpdated(), result.getSkipped(), result.getErrors().size());

        return result;
    }

    private void processSheet(Sheet sheet, String sheetName, ImportResultDto result,
                              Map<String, Vehicle> existingMap, Set<String> processedPlatesInFile,
                              List<Vehicle> toInsert, List<Vehicle> toUpdate) {
        int firstRowNum = sheet.getFirstRowNum();
        int lastRowNum = sheet.getLastRowNum();

        if (lastRowNum < 0) return;

        int headerRowIndex = -1;
        Map<Integer, String> columnMap = new HashMap<>();

        for (int r = firstRowNum; r <= Math.min(firstRowNum + 15, lastRowNum); r++) {
            Row row = sheet.getRow(r);
            if (row == null) continue;

            Map<Integer, String> tempMap = mapHeaders(row);
            if (tempMap.containsValue("PLATE") || tempMap.containsValue("PATRIMONIO") || tempMap.containsValue("MODEL")) {
                headerRowIndex = r;
                columnMap = tempMap;
                break;
            }
        }

        if (headerRowIndex == -1 || columnMap.isEmpty()) {
            log.warn("Nenhum cabeçalho válido encontrado na aba '{}'", sheetName);
            return;
        }

        log.info("Cabeçalho localizado na aba '{}', linha {}. Colunas: {}", sheetName, headerRowIndex + 1, columnMap.values());

        for (int r = headerRowIndex + 1; r <= lastRowNum; r++) {
            Row row = sheet.getRow(r);
            if (row == null || isRowEmpty(row)) {
                continue;
            }

            result.setTotalRows(result.getTotalRows() + 1);

            try {
                processRow(row, r + 1, sheetName, columnMap, result, existingMap, processedPlatesInFile, toInsert, toUpdate);
            } catch (Exception e) {
                log.error("Erro na aba '{}', linha {}: ", sheetName, r + 1, e);
                result.setSkipped(result.getSkipped() + 1);
                result.getErrors().add(String.format("Aba '%s', Linha %d: %s", sheetName, r + 1, e.getMessage()));
            }
        }
    }

    private Map<Integer, String> mapHeaders(Row headerRow) {
        Map<Integer, String> map = new HashMap<>();
        for (Cell cell : headerRow) {
            String val = getCellValueAsString(cell);
            if (val == null || val.isBlank()) continue;

            String normalized = normalizeText(val);

            if (normalized.equals("placa") || normalized.equals("plate") || normalized.startsWith("placa")) {
                map.put(cell.getColumnIndex(), "PLATE");
            } else if (normalized.contains("patrimonio") || normalized.contains("patrimon")) {
                map.put(cell.getColumnIndex(), "PATRIMONIO");
            } else if (normalized.contains("chassi") || normalized.contains("chassis")) {
                map.put(cell.getColumnIndex(), "CHASSIS");
            } else if (normalized.contains("renavam") || normalized.contains("renavan")) {
                map.put(cell.getColumnIndex(), "RENAVAM");
            } else if (normalized.contains("modelo") || normalized.contains("model") || normalized.contains("marca/modelo")) {
                map.put(cell.getColumnIndex(), "MODEL");
            } else if (normalized.contains("ano") || normalized.contains("mod") || normalized.contains("ano/mod")) {
                map.put(cell.getColumnIndex(), "YEAR");
            } else if (normalized.contains("marca") || normalized.contains("brand") || normalized.contains("fabricante")) {
                map.put(cell.getColumnIndex(), "BRAND");
            } else if (normalized.contains("cor") || normalized.contains("color")) {
                map.put(cell.getColumnIndex(), "COLOR");
            } else if (normalized.contains("capacidade") || normalized.contains("lotacao")) {
                map.put(cell.getColumnIndex(), "CAPACITY");
            }
        }
        return map;
    }

    private void processRow(Row row, int rowNum, String sheetName, Map<Integer, String> columnMap,
                            ImportResultDto result, Map<String, Vehicle> existingMap,
                            Set<String> processedPlatesInFile, List<Vehicle> toInsert, List<Vehicle> toUpdate) {
        String plateValue = null;
        String patrimonioValue = null;
        String chassisValue = null;
        String renavamValue = null;
        String modelValue = null;
        String yearValue = null;
        String brandValue = null;
        String colorValue = null;
        String capacityValue = null;

        for (Map.Entry<Integer, String> entry : columnMap.entrySet()) {
            int colIdx = entry.getKey();
            String fieldType = entry.getValue();
            Cell cell = row.getCell(colIdx);
            String val = getCellValueAsString(cell);

            if (val == null || val.isBlank()) continue;

            switch (fieldType) {
                case "PLATE":
                    plateValue = val.trim().toUpperCase();
                    break;
                case "PATRIMONIO":
                    patrimonioValue = val.trim().toUpperCase();
                    break;
                case "CHASSIS":
                    chassisValue = val.trim().toUpperCase();
                    break;
                case "RENAVAM":
                    renavamValue = val.trim().replaceAll("\\D", "");
                    if (renavamValue.isBlank()) renavamValue = val.trim();
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
            }
        }

        // Usar PATRIMÔNIO como PLACA se Placa estiver em branco
        String finalPlate = plateValue;
        if ((finalPlate == null || finalPlate.isBlank()) && patrimonioValue != null && !patrimonioValue.isBlank()) {
            finalPlate = patrimonioValue;
        }

        if (finalPlate == null || finalPlate.isBlank()) {
            result.setSkipped(result.getSkipped() + 1);
            result.getErrors().add(String.format("Aba '%s', Linha %d: Placa/Patrimônio não encontrada.", sheetName, rowNum));
            return;
        }

        finalPlate = cleanPlate(finalPlate);
        if (finalPlate.isBlank()) {
            result.setSkipped(result.getSkipped() + 1);
            return;
        }

        // Ignorar duplicatas dentro do próprio arquivo Excel
        if (processedPlatesInFile.contains(finalPlate)) {
            result.setSkipped(result.getSkipped() + 1);
            return;
        }
        processedPlatesInFile.add(finalPlate);

        Integer parsedYear = parseYear(yearValue);
        if (parsedYear == null) {
            parsedYear = LocalDate.now().getYear();
        }

        String finalModel = (modelValue != null && !modelValue.isBlank()) ? modelValue : "Modelo Não Especificado";
        String finalBrand = (brandValue != null && !brandValue.isBlank()) ? brandValue : extractBrandFromModel(finalModel);

        Vehicle vehicle = existingMap.get(finalPlate);
        UUID currentCompanyId = TenantContext.get();

        if (vehicle != null) {
            boolean updated = false;

            if (chassisValue != null && !chassisValue.isBlank() && !chassisValue.equalsIgnoreCase(vehicle.getChassisNumber())) {
                vehicle.setChassisNumber(truncateString(chassisValue, 50));
                updated = true;
            }
            if (renavamValue != null && !renavamValue.isBlank() && !renavamValue.equalsIgnoreCase(vehicle.getRenavan())) {
                vehicle.setRenavan(truncateString(renavamValue, 50));
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
            if (colorValue != null && !colorValue.isBlank()) {
                vehicle.setColor(truncateString(colorValue, 30));
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
            newVehicle.setChassisNumber(truncateString(chassisValue, 50));
            newVehicle.setRenavan(truncateString(renavamValue, 50));
            newVehicle.setModel(truncateString(finalModel, 50));
            newVehicle.setBrand(truncateString(finalBrand, 50));
            newVehicle.setYear(parsedYear);
            newVehicle.setColor(truncateString(colorValue != null ? colorValue : "Branco", 30));
            newVehicle.setStatus(VehicleStatus.ACTIVE);
            newVehicle.setFuelType(FuelType.DIESEL);
            newVehicle.setVehicleType(VehicleType.BUS_ROAD);
            newVehicle.setCapacity(parseInteger(capacityValue, 44));
            newVehicle.setCurrentMileage(0);

            if (currentCompanyId != null) {
                newVehicle.setCompanyId(currentCompanyId);
            }

            toInsert.add(newVehicle);
        }
    }

    private String truncateString(String str, int maxLen) {
        if (str == null) return null;
        return str.length() > maxLen ? str.substring(0, maxLen) : str;
    }

    private String cleanPlate(String rawPlate) {
        if (rawPlate == null) return "";
        String cleaned = rawPlate.replaceAll("[^A-Za-z0-9]", "").toUpperCase();
        if (cleaned.length() > 10) {
            cleaned = cleaned.substring(0, 10);
        }
        return cleaned;
    }

    private Integer parseYear(String yearStr) {
        if (yearStr == null || yearStr.isBlank()) return null;
        Matcher matcher = YEAR_PATTERN.matcher(yearStr);
        Integer lastMatch = null;
        while (matcher.find()) {
            try {
                lastMatch = Integer.parseInt(matcher.group(1));
            } catch (NumberFormatException ignored) {}
        }
        return lastMatch;
    }

    private String extractBrandFromModel(String model) {
        if (model == null || model.isBlank()) return "Outros";
        String lower = model.toLowerCase();
        if (lower.contains("mercedes") || lower.contains("mb")) return "Mercedes-Benz";
        if (lower.contains("volvo")) return "Volvo";
        if (lower.contains("scania")) return "Scania";
        if (lower.contains("vw") || lower.contains("volks")) return "Volkswagen";
        if (lower.contains("marcopolo")) return "Marcopolo";
        if (lower.contains("caio")) return "Caio";
        if (lower.contains("mascarello")) return "Mascarello";
        if (lower.contains("comil")) return "Comil";
        if (lower.contains("fiat")) return "Fiat";
        if (lower.contains("ford")) return "Ford";
        if (lower.contains("chevrolet") || lower.contains("gm")) return "Chevrolet";
        return "Outros";
    }

    private Integer parseInteger(String str, int defaultVal) {
        if (str == null || str.isBlank()) return defaultVal;
        try {
            return (int) Math.round(Double.parseDouble(str.replaceAll("[^0-9.]", "")));
        } catch (Exception e) {
            return defaultVal;
        }
    }

    private String normalizeText(String text) {
        if (text == null) return "";
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "").toLowerCase().trim();
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
        if (row == null) return true;
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
}
