package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.FeriasReportDTO;
import com.z7design.fleet_manager.model.Absence;
import com.z7design.fleet_manager.model.Vacation;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.Company.CompanyStatus;
import com.z7design.fleet_manager.model.enums.VacationStatus;
import com.z7design.fleet_manager.repository.AbsenceRepository;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.VacationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class FeriasReportService {

    private final VacationRepository vacationRepository;
    private final AbsenceRepository absenceRepository;
    private final CompanyRepository companyRepository;
    private final ExcelReportLayoutService excelReportLayoutService;

    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // EstatÃ­sticas de fÃ©rias
        Map<String, Object> feriasStats = getFeriasStats();
        stats.put("ferias", feriasStats);
        
        // EstatÃ­sticas de afastamentos
        Map<String, Object> afastamentosStats = getAfastamentosStats();
        stats.put("afastamentos", afastamentosStats);
        
        return stats;
    }

    public Map<String, Object> getFeriasStats() {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            long totalFerias = vacationRepository.count();
            long feriasPendentes = vacationRepository.countByStatus(VacationStatus.PENDING);
            long feriasAprovadas = vacationRepository.countByStatus(VacationStatus.APPROVED);
            long feriasRejeitadas = vacationRepository.countByStatus(VacationStatus.REJECTED);
            long feriasCanceladas = vacationRepository.countByStatus(VacationStatus.CANCELLED);
            
            stats.put("total", totalFerias);
            stats.put("pendentes", feriasPendentes);
            stats.put("aprovadas", feriasAprovadas);
            stats.put("rejeitadas", feriasRejeitadas);
            stats.put("canceladas", feriasCanceladas);
            
            log.info("EstatÃ­sticas de fÃ©rias geradas: {}", stats);
            
        } catch (Exception e) {
            log.error("Erro ao gerar estatÃ­sticas de fÃ©rias", e);
            stats.put("error", "Erro ao gerar estatÃ­sticas");
        }
        
        return stats;
    }

    public Map<String, Object> getAfastamentosStats() {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            long totalAfastamentos = absenceRepository.count();
            long afastamentosPendentes = absenceRepository.countByStatus(Absence.AbsenceStatus.PENDING);
            long afastamentosAprovados = absenceRepository.countByStatus(Absence.AbsenceStatus.APPROVED);
            long afastamentosRejeitados = absenceRepository.countByStatus(Absence.AbsenceStatus.REJECTED);
            long afastamentosCancelados = absenceRepository.countByStatus(Absence.AbsenceStatus.CANCELLED);
            
            stats.put("total", totalAfastamentos);
            stats.put("pendentes", afastamentosPendentes);
            stats.put("aprovados", afastamentosAprovados);
            stats.put("rejeitados", afastamentosRejeitados);
            stats.put("cancelados", afastamentosCancelados);
            
            log.info("EstatÃ­sticas de afastamentos geradas: {}", stats);
            
        } catch (Exception e) {
            log.error("Erro ao gerar estatÃ­sticas de afastamentos", e);
            stats.put("error", "Erro ao gerar estatÃ­sticas");
        }
        
        return stats;
    }

    public byte[] generateFeriasExcelReport(FeriasReportDTO filters) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("RelatÃ³rio de FÃ©rias");
            Company company = resolveCompany();
            int lastColumn = 7;
            int rowIndex = excelReportLayoutService.addHeader(sheet, workbook, company, "RELATÃ“RIO DE FÃ‰RIAS", lastColumn);
            
            // CabeÃ§alho
            int dataStartRow = createFeriasHeader(sheet, workbook, rowIndex);
            
            // Buscar dados
            List<Vacation> vacations = getFeriasData(filters);
            
            // Preencher dados
            fillFeriasData(sheet, workbook, vacations, dataStartRow);
            
            // Auto-size columns
            for (int i = 0; i < 8; i++) {
                sheet.autoSizeColumn(i);
            }

            excelReportLayoutService.addFooter(sheet, workbook, company, lastColumn);
            
            // Converter para bytes
            try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
                workbook.write(outputStream);
                return outputStream.toByteArray();
            }
        }
    }

    public byte[] generateAfastamentosExcelReport(FeriasReportDTO filters) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("RelatÃ³rio de Afastamentos");
            Company company = resolveCompany();
            int lastColumn = 6;
            int rowIndex = excelReportLayoutService.addHeader(sheet, workbook, company, "RELATÃ“RIO DE AFASTAMENTOS", lastColumn);
            
            // CabeÃ§alho
            int dataStartRow = createAfastamentosHeader(sheet, workbook, rowIndex);
            
            // Buscar dados
            List<Absence> absences = getAfastamentosData(filters);
            
            // Preencher dados
            fillAfastamentosData(sheet, workbook, absences, dataStartRow);
            
            // Auto-size columns
            for (int i = 0; i < 7; i++) {
                sheet.autoSizeColumn(i);
            }

            excelReportLayoutService.addFooter(sheet, workbook, company, lastColumn);
            
            // Converter para bytes
            try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
                workbook.write(outputStream);
                return outputStream.toByteArray();
            }
        }
    }

    public byte[] generateConsolidadoExcelReport(FeriasReportDTO filters) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Company company = resolveCompany();

            // Aba de FÃ©rias
            Sheet feriasSheet = workbook.createSheet("FÃ©rias");
            int feriasLastColumn = 7;
            int feriasRowIndex = excelReportLayoutService.addHeader(feriasSheet, workbook, company, "RELATÃ“RIO DE FÃ‰RIAS", feriasLastColumn);
            int feriasDataStart = createFeriasHeader(feriasSheet, workbook, feriasRowIndex);
            List<Vacation> vacations = getFeriasData(filters);
            fillFeriasData(feriasSheet, workbook, vacations, feriasDataStart);
            excelReportLayoutService.addFooter(feriasSheet, workbook, company, feriasLastColumn);
            
            // Aba de Afastamentos
            Sheet afastamentosSheet = workbook.createSheet("Afastamentos");
            int afastLastColumn = 6;
            int afastRowIndex = excelReportLayoutService.addHeader(afastamentosSheet, workbook, company, "RELATÃ“RIO DE AFASTAMENTOS", afastLastColumn);
            int afastDataStart = createAfastamentosHeader(afastamentosSheet, workbook, afastRowIndex);
            List<Absence> absences = getAfastamentosData(filters);
            fillAfastamentosData(afastamentosSheet, workbook, absences, afastDataStart);
            excelReportLayoutService.addFooter(afastamentosSheet, workbook, company, afastLastColumn);
            
            // Aba de EstatÃ­sticas
            Sheet statsSheet = workbook.createSheet("EstatÃ­sticas");
            int statsLastColumn = 1;
            int statsRowIndex = excelReportLayoutService.addHeader(statsSheet, workbook, company, "ESTATÃSTICAS", statsLastColumn);
            createStatsSheet(statsSheet, workbook, filters, statsRowIndex);
            excelReportLayoutService.addFooter(statsSheet, workbook, company, statsLastColumn);
            
            // Auto-size columns
            for (Sheet sheet : workbook) {
                for (int i = 0; i < 8; i++) {
                    sheet.autoSizeColumn(i);
                }
            }
            
            // Converter para bytes
            try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
                workbook.write(outputStream);
                return outputStream.toByteArray();
            }
        }
    }

    private int createFeriasHeader(Sheet sheet, Workbook workbook, int startRow) {
        Row headerRow = sheet.createRow(startRow);
        
        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerStyle.setFont(headerFont);
        headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        
        String[] headers = {"ID", "FuncionÃ¡rio", "PerÃ­odo Aquisitivo", "Data InÃ­cio", "Data Fim", "Dias", "Status", "ObservaÃ§Ãµes"};
        
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }
        return startRow + 1;
    }

    private int createAfastamentosHeader(Sheet sheet, Workbook workbook, int startRow) {
        Row headerRow = sheet.createRow(startRow);
        
        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerStyle.setFont(headerFont);
        headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        
        String[] headers = {"ID", "FuncionÃ¡rio", "Tipo", "Data", "Status", "Motivo", "ObservaÃ§Ãµes"};
        
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }
        return startRow + 1;
    }

    private void fillFeriasData(Sheet sheet, Workbook workbook, List<Vacation> vacations, int startRow) {
        CellStyle dateStyle = workbook.createCellStyle();
        CreationHelper createHelper = workbook.getCreationHelper();
        dateStyle.setDataFormat(createHelper.createDataFormat().getFormat("dd/mm/yyyy"));
        
        int rowNum = startRow;
        for (Vacation vacation : vacations) {
            Row row = sheet.createRow(rowNum++);
            
            row.createCell(0).setCellValue(vacation.getId().toString());
            row.createCell(1).setCellValue(vacation.getEmployee().getName());
            row.createCell(2).setCellValue(vacation.getStartDate().getYear() + "/" + (vacation.getStartDate().getYear() + 1));
            
            Cell startDateCell = row.createCell(3);
            startDateCell.setCellValue(vacation.getStartDate());
            startDateCell.setCellStyle(dateStyle);
            
            Cell endDateCell = row.createCell(4);
            endDateCell.setCellValue(vacation.getEndDate());
            endDateCell.setCellStyle(dateStyle);
            
            row.createCell(5).setCellValue(vacation.getDaysTaken());
            row.createCell(6).setCellValue(vacation.getStatus().toString());
            row.createCell(7).setCellValue(vacation.getApprovalDate() != null ? 
                vacation.getApprovalDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "");
        }
    }

    private void fillAfastamentosData(Sheet sheet, Workbook workbook, List<Absence> absences, int startRow) {
        CellStyle dateStyle = workbook.createCellStyle();
        CreationHelper createHelper = workbook.getCreationHelper();
        dateStyle.setDataFormat(createHelper.createDataFormat().getFormat("dd/mm/yyyy"));
        
        int rowNum = startRow;
        for (Absence absence : absences) {
            Row row = sheet.createRow(rowNum++);
            
            row.createCell(0).setCellValue(absence.getId().toString());
            row.createCell(1).setCellValue(absence.getEmployee().getName());
            row.createCell(2).setCellValue(absence.getAbsenceType().toString());
            
            Cell dateCell = row.createCell(3);
            dateCell.setCellValue(absence.getAbsenceDate());
            dateCell.setCellStyle(dateStyle);
            
            row.createCell(4).setCellValue(absence.getStatus().toString());
            row.createCell(5).setCellValue(absence.getReason() != null ? absence.getReason() : "");
            row.createCell(6).setCellValue(absence.getCoverageNotes() != null ? absence.getCoverageNotes() : "");
        }
    }

    private void createStatsSheet(Sheet sheet, Workbook workbook, FeriasReportDTO filters, int startRow) {
        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerStyle.setFont(headerFont);
        
        // TÃ­tulo
        int rowNum = startRow;
        Row titleRow = sheet.createRow(rowNum++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("EstatÃ­sticas de FÃ©rias e Afastamentos");
        titleCell.setCellStyle(headerStyle);
        
        // EstatÃ­sticas de fÃ©rias
        Map<String, Object> feriasStats = getFeriasStats();
        rowNum++;
        
        Row feriasHeaderRow = sheet.createRow(rowNum++);
        Cell feriasHeaderCell = feriasHeaderRow.createCell(0);
        feriasHeaderCell.setCellValue("FÃ©rias");
        feriasHeaderCell.setCellStyle(headerStyle);
        
        for (Map.Entry<String, Object> entry : feriasStats.entrySet()) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(entry.getKey());
            row.createCell(1).setCellValue(entry.getValue().toString());
        }
        
        // EstatÃ­sticas de afastamentos
        rowNum++;
        Map<String, Object> afastamentosStats = getAfastamentosStats();
        
        Row afastamentosHeaderRow = sheet.createRow(rowNum++);
        Cell afastamentosHeaderCell = afastamentosHeaderRow.createCell(0);
        afastamentosHeaderCell.setCellValue("Afastamentos");
        afastamentosHeaderCell.setCellStyle(headerStyle);
        
        for (Map.Entry<String, Object> entry : afastamentosStats.entrySet()) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(entry.getKey());
            row.createCell(1).setCellValue(entry.getValue().toString());
        }
    }

    private Company resolveCompany() {
        List<Company> activeCompanies = companyRepository.findByStatus(CompanyStatus.ACTIVE);
        if (!activeCompanies.isEmpty()) {
            return activeCompanies.get(0);
        }

        List<Company> allCompanies = companyRepository.findAll();
        if (!allCompanies.isEmpty()) {
            return allCompanies.get(0);
        }

        throw new RuntimeException("NÃ£o foi possÃ­vel determinar a empresa para o relatÃ³rio.");
    }

    private List<Vacation> getFeriasData(FeriasReportDTO filters) {
        // Implementar filtros baseados nos parÃ¢metros
        // Por enquanto, retorna todos os dados
        return vacationRepository.findAll();
    }

    private List<Absence> getAfastamentosData(FeriasReportDTO filters) {
        // Implementar filtros baseados nos parÃ¢metros
        // Por enquanto, retorna todos os dados
        return absenceRepository.findAll();
    }
}

