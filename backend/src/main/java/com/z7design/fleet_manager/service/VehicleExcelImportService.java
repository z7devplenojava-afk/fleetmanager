package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.ImportResultDto;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.model.Vehicle.FuelType;
import com.z7design.fleet_manager.model.Vehicle.VehicleStatus;
import com.z7design.fleet_manager.model.Vehicle.VehicleType;
import com.z7design.fleet_manager.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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

    private static final Pattern YEAR_PATTERN = Pattern.compile("(19\\d{2}|20\\d{2})");

    @Transactional
    public ImportResultDto importVehiclesFromExcel(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("O arquivo de importação está vazio ou não foi enviado.");
        }

        ImportResultDto result = ImportResultDto.empty();
        log.info("Iniciando importação de veículos a partir do arquivo Excel: {}", file.getOriginalFilename());

        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {

            int numberOfSheets = workbook.getNumberOfSheets();
            log.info("Processando arquivo Excel com {} abas", numberOfSheets);

            for (int s = 0; s < numberOfSheets; s++) {
                Sheet sheet = workbook.getSheetAt(s);
                String sheetName = sheet.getSheetName();

                // Ignorar abas ocultas ou vazias
                if (workbook.isSheetHidden(s) || sheet.getPhysicalNumberOfRows() == 0) {
                    continue;
                }

                log.info("Processando aba '{}' ({}/{})", sheetName, s + 1, numberOfSheets);
                processSheet(sheet, sheetName, result);
            }

        } catch (Exception e) {
            log.error("Erro crítico ao ler o arquivo Excel de veículos: ", e);
            result.getErrors().add("Falha ao ler arquivo Excel: " + e.getMessage());
        }

        log.info("Importação de veículos concluída. Inseridos: {}, Atualizados: {}, Ignorados: {}, Erros: {}",
                result.getInserted(), result.getUpdated(), result.getSkipped(), result.getErrors().size());

        return result;
    }

    private void processSheet(Sheet sheet, String sheetName, ImportResultDto result) {
        int firstRowNum = sheet.getFirstRowNum();
        int lastRowNum = sheet.getLastRowNum();

        if (lastRowNum < 0) return;

        // Localizar a linha de cabeçalho (procura nas primeiras 15 linhas)
        int headerRowIndex = -1;
        Map<Integer, String> columnMap = new HashMap<>();

        for (int r = firstRowNum; r <= Math.min(firstRowNum + 15, lastRowNum); r++) {
            Row row = sheet.getRow(r);
            if (row == null) continue;

            Map<Integer, String> tempMap = mapHeaders(row);
            // Se encontrar ao menos a coluna de Placa ou Patrimônio, considera como cabeçalho
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

        log.info("Cabeçalho localizado na aba '{}', linha {}. Colunas identificadas: {}", sheetName, headerRowIndex + 1, columnMap.values());

        // Processar linhas de dados
        for (int r = headerRowIndex + 1; r <= lastRowNum; r++) {
            Row row = sheet.getRow(r);
            if (row == null || isRowEmpty(row)) {
                continue;
            }

            result.setTotalRows(result.getTotalRows() + 1);

            try {
                processRow(row, r + 1, sheetName, columnMap, result);
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
            } else if (normalized.contains("patrimonio") || normalized.contains("patrimonio") || normalized.contains("patrimon")) {
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

    private void processRow(Row row, int rowNum, String sheetName, Map<Integer, String> columnMap, ImportResultDto result) {
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

        // REGRA SOLICITADA: Se Placa estiver em branco e houver PATRIMÔNIO, usar o valor de PATRIMÔNIO como PLACA
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

        Integer parsedYear = parseYear(yearValue);
        if (parsedYear == null) {
            parsedYear = LocalDate.now().getYear();
        }

        String finalModel = (modelValue != null && !modelValue.isBlank()) ? modelValue : "Modelo Não Especificado";
        String finalBrand = (brandValue != null && !brandValue.isBlank()) ? brandValue : extractBrandFromModel(finalModel);

        Optional<Vehicle> existingOpt = vehicleRepository.findByPlate(finalPlate);

        if (existingOpt.isPresent()) {
            Vehicle vehicle = existingOpt.get();
            boolean updated = false;

            if (chassisValue != null && !chassisValue.isBlank() && !chassisValue.equalsIgnoreCase(vehicle.getChassisNumber())) {
                vehicle.setChassisNumber(chassisValue);
                updated = true;
            }
            if (renavamValue != null && !renavamValue.isBlank() && !renavamValue.equalsIgnoreCase(vehicle.getRenavan())) {
                vehicle.setRenavan(renavamValue);
                updated = true;
            }
            if (modelValue != null && !modelValue.isBlank() && !modelValue.equalsIgnoreCase(vehicle.getModel())) {
                vehicle.setModel(finalModel);
                updated = true;
            }
            if (parsedYear != null && !parsedYear.equals(vehicle.getYear())) {
                vehicle.setYear(parsedYear);
                updated = true;
            }
            if (colorValue != null && !colorValue.isBlank()) {
                vehicle.setColor(colorValue);
                updated = true;
            }

            if (updated) {
                vehicleRepository.save(vehicle);
                result.setUpdated(result.getUpdated() + 1);
            } else {
                result.setSkipped(result.getSkipped() + 1);
            }
        } else {
            Vehicle vehicle = new Vehicle();
            vehicle.setPlate(finalPlate);
            vehicle.setChassisNumber(chassisValue);
            vehicle.setRenavan(renavamValue);
            vehicle.setModel(finalModel);
            vehicle.setBrand(finalBrand);
            vehicle.setYear(parsedYear);
            vehicle.setColor(colorValue != null ? colorValue : "Branco");
            vehicle.setStatus(VehicleStatus.ACTIVE);
            vehicle.setFuelType(FuelType.DIESEL);
            vehicle.setVehicleType(VehicleType.BUS_ROAD);
            vehicle.setCapacity(parseInteger(capacityValue, 44));
            vehicle.setCurrentMileage(0);

            vehicleRepository.save(vehicle);
            result.setInserted(result.getInserted() + 1);
        }
    }

    private String cleanPlate(String rawPlate) {
        if (rawPlate == null) return "";
        return rawPlate.replaceAll("[^A-Za-z0-9]", "").toUpperCase();
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
