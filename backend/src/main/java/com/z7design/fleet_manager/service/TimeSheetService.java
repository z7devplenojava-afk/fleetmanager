package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.TimeRecord;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.Company.CompanyStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * ServiÃ§o responsÃ¡vel por montar o calendÃ¡rio de ponto (folha de ponto)
 * e gerar um arquivo Excel usando Apache POI.
 *
 * Esta implementaÃ§Ã£o Ã© focada em um cenÃ¡rio simples:
 * - Um mÃªs civil (1..N)
 * - Colunas: Data, Dia da Semana, Entrada, SaÃ­da AlmoÃ§o, Retorno AlmoÃ§o, SaÃ­da, ObservaÃ§Ãµes
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TimeSheetService {

    private final TimeRecordService timeRecordService;
    private final EmployeeRepository employeeRepository;
    private final CompanyRepository companyRepository;
    private final ExcelReportLayoutService excelReportLayoutService;

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public byte[] generateMonthlyTimeSheet(UUID employeeId, int year, int month) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("FuncionÃ¡rio nÃ£o encontrado: " + employeeId));

        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        log.info("ðŸ—“ï¸ Gerando folha de ponto - Employee: {}, PerÃ­odo: {}/{}", employee.getName(), month, year);

        List<TimeRecord> records = timeRecordService.getRecordsByPeriod(employeeId, startDate, endDate);

        // Agrupar por dia
        Map<LocalDate, List<TimeRecord>> recordsByDay = records.stream()
                .sorted(Comparator.comparing(TimeRecord::getRecordedAt))
                .collect(Collectors.groupingBy(tr -> tr.getRecordedAt().toLocalDate()));

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Folha de Ponto");

            Company company = resolveCompany(employee);
            int lastColumn = 6;
            int rowIndex = excelReportLayoutService.addHeader(sheet, workbook, company, "FOLHA DE PONTO", lastColumn);

            // Estilos simples
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setWrapText(true);

            // CabeÃ§alho com informaÃ§Ãµes do funcionÃ¡rio/perÃ­odo
            Row infoRow = sheet.createRow(rowIndex++);
            infoRow.createCell(0).setCellValue("FuncionÃ¡rio:");
            infoRow.createCell(1).setCellValue(employee.getName() != null ? employee.getName() : employee.getId().toString());

            Row periodRow = sheet.createRow(rowIndex++);
            periodRow.createCell(0).setCellValue("PerÃ­odo:");
            periodRow.createCell(1).setCellValue(String.format("%02d/%04d", month, year));

            rowIndex++; // linha em branco

            // CabeÃ§alho da tabela
            Row header = sheet.createRow(rowIndex++);
            String[] columns = {
                    "Data",
                    "Dia Semana",
                    "Entrada",
                    "SaÃ­da AlmoÃ§o",
                    "Retorno AlmoÃ§o",
                    "SaÃ­da",
                    "ObservaÃ§Ãµes"
            };
            for (int i = 0; i < columns.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            // Linhas por dia
            for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
                Row row = sheet.createRow(rowIndex++);

                // Data
                row.createCell(0).setCellValue(DATE_FORMAT.format(date));
                // Dia da semana em pt-BR
                DayOfWeek dayOfWeek = date.getDayOfWeek();
                String dayName = dayOfWeek.getDisplayName(java.time.format.TextStyle.FULL, new Locale("pt", "BR"));
                row.createCell(1).setCellValue(capitalize(dayName));

                List<TimeRecord> dayRecords = recordsByDay.getOrDefault(date, List.of())
                        .stream()
                        .sorted(Comparator.comparing(TimeRecord::getRecordedAt))
                        .toList();

                // Mapear por tipo de registro
                Map<TimeRecord.RecordType, LocalDateTime> byType = new EnumMap<>(TimeRecord.RecordType.class);
                for (TimeRecord timeRecord : dayRecords) {
                    // Guarda o primeiro registro de cada tipo
                    byType.putIfAbsent(timeRecord.getRecordType(), timeRecord.getRecordedAt());
                }

                // Preencher colunas bÃ¡sicas
                setTimeCell(row, 2, byType.get(TimeRecord.RecordType.ENTRADA));
                setTimeCell(row, 3, byType.get(TimeRecord.RecordType.SAIDA_ALMOCO));
                setTimeCell(row, 4, byType.get(TimeRecord.RecordType.RETORNO_ALMOCO));
                setTimeCell(row, 5, byType.get(TimeRecord.RecordType.SAIDA));

                // ObservaÃ§Ãµes simples (ex: sem registros em dia Ãºtil)
                String observation = "";
                if (dayRecords.isEmpty() && isWorkingDay(dayOfWeek)) {
                    observation = "Sem registros";
                }
                row.createCell(6).setCellValue(observation);
            }

            // Ajustar largura das colunas
            for (int i = 0; i < 7; i++) {
                sheet.autoSizeColumn(i);
            }

            excelReportLayoutService.addFooter(sheet, workbook, company, lastColumn);

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Erro ao gerar folha de ponto para funcionÃ¡rio {}: {}", employeeId, e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar folha de ponto: " + e.getMessage(), e);
        }
    }

    private void setTimeCell(Row row, int colIndex, LocalDateTime dateTime) {
        Cell cell = row.createCell(colIndex);
        if (dateTime != null) {
            String value = dateTime.toLocalTime().toString(); // HH:mm:ss
            // reduz para HH:mm
            if (value.length() >= 5) {
                value = value.substring(0, 5);
            }
            cell.setCellValue(value);
        } else {
            cell.setCellValue("");
        }
    }

    private boolean isWorkingDay(DayOfWeek dayOfWeek) {
        return dayOfWeek != DayOfWeek.SATURDAY && dayOfWeek != DayOfWeek.SUNDAY;
    }

    private String capitalize(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }
        return text.substring(0, 1).toUpperCase() + text.substring(1);
    }

    private Company resolveCompany(Employee employee) {
        if (employee.getCompany() != null) {
            return employee.getCompany();
        }

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
}




