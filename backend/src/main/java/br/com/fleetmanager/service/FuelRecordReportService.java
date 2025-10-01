package br.com.fleetmanager.service;

import br.com.fleetmanager.model.FuelRecord;
import br.com.fleetmanager.repository.FuelRecordRepository;
import br.com.fleetmanager.dto.FuelRecordReportDTO;
import br.com.fleetmanager.repository.CostCenterRepository;
import br.com.fleetmanager.model.CostCenter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import br.com.fleetmanager.service.JasperReportService;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FuelRecordReportService {
    
    private final FuelRecordRepository fuelRecordRepository;
    private final CostCenterRepository costCenterRepository;
    private final JasperReportService jasperReportService;
    
    public byte[] generateExcelReport(LocalDate startDate, LocalDate endDate, UUID vehicleId, String posto, UUID driverId) throws IOException {
        log.info("Gerando relatório Excel de abastecimentos - Período: {} a {}, Veículo: {}, Posto: {}, Motorista: {}", 
                startDate, endDate, vehicleId, posto, driverId);
        
        try {
            // Buscar dados filtrados
            List<FuelRecord> fuelRecords = getFuelRecordsFiltered(startDate, endDate, vehicleId, posto, driverId);
            log.info("Dados obtidos: {} registros de abastecimento", fuelRecords.size());
            
            try (Workbook workbook = new XSSFWorkbook()) {
                Sheet sheet = workbook.createSheet("Relatório de Abastecimentos");
                log.debug("Planilha criada com sucesso");
                
                // Criar estilos
                CellStyle headerStyle = createHeaderStyle(workbook);
                CellStyle dateStyle = createDateStyle(workbook);
                CellStyle currencyStyle = createCurrencyStyle(workbook);
                CellStyle numberStyle = createNumberStyle(workbook);
                log.debug("Estilos criados com sucesso");
                
                // Criar cabeçalho
                createHeader(sheet, headerStyle);
                log.debug("Cabeçalho criado com sucesso");
                
                // Preencher dados
                fillData(sheet, fuelRecords, dateStyle, currencyStyle, numberStyle);
                log.debug("Dados preenchidos com sucesso");
                
                // Ajustar largura das colunas
                autoSizeColumns(sheet);
                log.debug("Colunas ajustadas com sucesso");
                
                // Criar linha de totais
                createTotalsRow(sheet, fuelRecords, currencyStyle, numberStyle);
                log.debug("Linha de totais criada com sucesso");
                
                // Converter para bytes
                ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
                workbook.write(outputStream);
                byte[] result = outputStream.toByteArray();
                
                log.info("Relatório Excel gerado com sucesso. {} registros processados, {} bytes gerados", 
                        fuelRecords.size(), result.length);
                return result;
            }
        } catch (Exception e) {
            log.error("Erro ao gerar relatório Excel", e);
            throw new IOException("Erro ao gerar relatório Excel: " + e.getMessage(), e);
        }
    }
    
    public byte[] generatePdfReport(LocalDate startDate, LocalDate endDate, UUID vehicleId, String posto, UUID driverId) throws IOException {
        log.info("Gerando relatório PDF de abastecimentos com JasperReports - Período: {} a {}, Veículo: {}, Posto: {}, Motorista: {}", 
                startDate, endDate, vehicleId, posto, driverId);
        
        try {
            // Buscar dados filtrados
            List<FuelRecord> fuelRecords = getFuelRecordsFiltered(startDate, endDate, vehicleId, posto, driverId);
            log.info("Dados obtidos: {} registros de abastecimento", fuelRecords.size());
            
            // Converter para DTOs com nomes de centros de custo
            List<FuelRecordReportDTO> reportDTOs = fuelRecords.stream()
                    .map(this::convertToReportDTO)
                    .collect(Collectors.toList());
            
            log.info("DTOs convertidos: {} registros", reportDTOs.size());
            
            // Preparar filtros para o relatório
            String vehicleFilter = vehicleId != null ? "Veículo específico" : "Todos os veículos";
            String driverFilter = driverId != null ? "Motorista específico" : "Todos os motoristas";
            
            // Gerar PDF usando JasperReports
            byte[] result = jasperReportService.generateFuelReportPDF(
                    reportDTOs, 
                    startDate, 
                    endDate, 
                    vehicleFilter, 
                    driverFilter
            );
            
            log.info("Relatório PDF gerado com sucesso usando JasperReports. {} registros processados, {} bytes gerados", 
                    fuelRecords.size(), result.length);
            return result;
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatório PDF", e);
            e.printStackTrace();
            throw new IOException("Erro ao gerar relatório PDF: " + e.getMessage(), e);
        }
    }
    
    private List<FuelRecord> getFuelRecordsFiltered(LocalDate startDate, LocalDate endDate, UUID vehicleId, String posto, UUID driverId) {
        log.debug("Aplicando filtros - startDate: {}, endDate: {}, vehicleId: {}, posto: {}, driverId: {}", 
                startDate, endDate, vehicleId, posto, driverId);
        
        try {
            List<FuelRecord> records;
            
            // Aplicar filtros de data e veículo primeiro
            if (startDate != null && endDate != null) {
                if (vehicleId != null) {
                    records = fuelRecordRepository.findByVehicleIdAndDateBetween(vehicleId, startDate, endDate);
                } else {
                    records = fuelRecordRepository.findByDateBetween(startDate, endDate);
                }
            } else if (vehicleId != null) {
                records = fuelRecordRepository.findByVehicleId(vehicleId);
            } else {
                records = fuelRecordRepository.findAll();
            }
            
            // Aplicar filtros adicionais em memória (posto e motorista)
            if (posto != null && !posto.trim().isEmpty() && !"all".equals(posto)) {
                records = records.stream()
                        .filter(record -> record.getStation() != null && record.getStation().toLowerCase().contains(posto.toLowerCase()))
                        .collect(Collectors.toList());
            }
            
            if (driverId != null) {
                records = records.stream()
                        .filter(record -> record.getDriver() != null && record.getDriver().getId().equals(driverId))
                        .collect(Collectors.toList());
            }
            
            log.info("Filtros aplicados. {} registros encontrados", records.size());
            return records;
            
        } catch (Exception e) {
            log.error("Erro ao aplicar filtros nos registros de abastecimento", e);
            throw new RuntimeException("Erro ao buscar registros de abastecimento: " + e.getMessage(), e);
        }
    }
    
    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }
    
    private CellStyle createDateStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        CreationHelper createHelper = workbook.getCreationHelper();
        style.setDataFormat(createHelper.createDataFormat().getFormat("dd/mm/yyyy"));
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        return style;
    }
    
    private CellStyle createCurrencyStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        CreationHelper createHelper = workbook.getCreationHelper();
        style.setDataFormat(createHelper.createDataFormat().getFormat("R$ #,##0.00"));
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        return style;
    }
    
    private CellStyle createNumberStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        CreationHelper createHelper = workbook.getCreationHelper();
        style.setDataFormat(createHelper.createDataFormat().getFormat("#,##0.00"));
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        return style;
    }
    
    private void createHeader(Sheet sheet, CellStyle headerStyle) {
        Row headerRow = sheet.createRow(0);
        String[] headers = {
            "Data", "Veículo", "Motorista", "Posto", "Combustível", 
            "Litros", "Valor/Litro", "Valor Total", "Quilometragem", "Observações"
        };
        
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }
    }
    
    private void fillData(Sheet sheet, List<FuelRecord> fuelRecords, CellStyle dateStyle, CellStyle currencyStyle, CellStyle numberStyle) {
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        int rowNum = 1;
        
        for (FuelRecord record : fuelRecords) {
            Row row = sheet.createRow(rowNum++);
            
            // Data
            Cell dateCell = row.createCell(0);
            dateCell.setCellValue(record.getDate().format(dateFormatter));
            dateCell.setCellStyle(dateStyle);
            
            // Veículo
            Cell vehicleCell = row.createCell(1);
            vehicleCell.setCellValue(record.getVehicle().getPlate() + " - " + 
                                   record.getVehicle().getBrand() + " " + 
                                   record.getVehicle().getModel());
            
            // Motorista
            Cell driverCell = row.createCell(2);
            driverCell.setCellValue(record.getDriver() != null ? record.getDriver().getName() : "N/A");
            
            // Posto
            Cell stationCell = row.createCell(3);
            stationCell.setCellValue(record.getStation());
            
            // Combustível
            Cell fuelTypeCell = row.createCell(4);
            fuelTypeCell.setCellValue(record.getFuelType().toString());
            
            // Litros
            Cell quantityCell = row.createCell(5);
            quantityCell.setCellValue(record.getQuantity().doubleValue());
            quantityCell.setCellStyle(numberStyle);
            
            // Valor por Litro
            Cell pricePerLiterCell = row.createCell(6);
            if (record.getQuantity().compareTo(BigDecimal.ZERO) > 0) {
                double pricePerLiter = record.getCost().divide(record.getQuantity(), 2, java.math.RoundingMode.HALF_UP).doubleValue();
                pricePerLiterCell.setCellValue(pricePerLiter);
            } else {
                pricePerLiterCell.setCellValue(0.0);
            }
            pricePerLiterCell.setCellStyle(currencyStyle);
            
            // Valor Total
            Cell costCell = row.createCell(7);
            costCell.setCellValue(record.getCost().doubleValue());
            costCell.setCellStyle(currencyStyle);
            
            // Quilometragem
            Cell mileageCell = row.createCell(8);
            mileageCell.setCellValue(record.getMileage());
            mileageCell.setCellStyle(numberStyle);
            
            // Observações
            Cell notesCell = row.createCell(9);
            notesCell.setCellValue(record.getNotes() != null ? record.getNotes() : "");
        }
    }
    
    private void autoSizeColumns(Sheet sheet) {
        for (int i = 0; i < 10; i++) {
            sheet.autoSizeColumn(i);
        }
    }
    
    private void createTotalsRow(Sheet sheet, List<FuelRecord> fuelRecords, CellStyle currencyStyle, CellStyle numberStyle) {
        int lastRowNum = sheet.getLastRowNum() + 2; // Pular uma linha
        Row totalsRow = sheet.createRow(lastRowNum);
        
        // Label
        Cell labelCell = totalsRow.createCell(0);
        labelCell.setCellValue("TOTAIS:");
        
        // Total de Litros
        double totalLiters = fuelRecords.stream()
                .mapToDouble(record -> record.getQuantity().doubleValue())
                .sum();
        Cell totalLitersCell = totalsRow.createCell(5);
        totalLitersCell.setCellValue(totalLiters);
        totalLitersCell.setCellStyle(numberStyle);
        
        // Total de Custo
        double totalCost = fuelRecords.stream()
                .mapToDouble(record -> record.getCost().doubleValue())
                .sum();
        Cell totalCostCell = totalsRow.createCell(7);
        totalCostCell.setCellValue(totalCost);
        totalCostCell.setCellStyle(currencyStyle);
        
        // Quantidade de registros
        Cell countCell = totalsRow.createCell(9);
        countCell.setCellValue(fuelRecords.size() + " registros");
    }
    
    private String formatPeriod(LocalDate startDate, LocalDate endDate) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        
        if (startDate != null && endDate != null) {
            return startDate.format(formatter) + " a " + endDate.format(formatter);
        } else if (startDate != null) {
            return "A partir de " + startDate.format(formatter);
        } else if (endDate != null) {
            return "Até " + endDate.format(formatter);
        } else {
            return "Todos os períodos";
        }
    }
    
    private FuelRecordReportDTO convertToReportDTO(FuelRecord fuelRecord) {
        String costCenterName = "-";
        
        if (fuelRecord.getCostCenter() != null && !fuelRecord.getCostCenter().trim().isEmpty()) {
            try {
                // Tentar buscar por ID primeiro
                UUID costCenterId = UUID.fromString(fuelRecord.getCostCenter());
                CostCenter costCenter = costCenterRepository.findById(costCenterId).orElse(null);
                if (costCenter != null) {
                    costCenterName = costCenter.getName();
                }
            } catch (IllegalArgumentException e) {
                // Se não for UUID, tentar buscar por código
                try {
                    CostCenter costCenter = costCenterRepository.findByCode(fuelRecord.getCostCenter()).orElse(null);
                    if (costCenter != null) {
                        costCenterName = costCenter.getName();
                    }
                } catch (Exception ex) {
                    log.warn("Não foi possível encontrar centro de custo para: {}", fuelRecord.getCostCenter());
                }
            }
        }
        
        return FuelRecordReportDTO.fromEntity(fuelRecord, costCenterName);
    }
}