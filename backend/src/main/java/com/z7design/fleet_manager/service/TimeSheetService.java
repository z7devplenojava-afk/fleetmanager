package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.TimeRecord;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.Company.CompanyStatus;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
                org.apache.poi.ss.usermodel.Cell cell = header.createCell(i);
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
        org.apache.poi.ss.usermodel.Cell cell = row.createCell(colIndex);
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

    public byte[] generateMonthlyTimeSheetPdf(UUID employeeId, int year, int month) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Funcionário não encontrado: " + employeeId));

        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        log.info("📄 Gerando PDF da folha de ponto - Employee: {}, Período: {}/{}", employee.getName(), month, year);

        List<TimeRecord> records = timeRecordService.getRecordsByPeriod(employeeId, startDate, endDate);

        // Agrupar por dia
        Map<LocalDate, List<TimeRecord>> recordsByDay = records.stream()
                .sorted(Comparator.comparing(TimeRecord::getRecordedAt))
                .collect(Collectors.groupingBy(tr -> tr.getRecordedAt().toLocalDate()));

        Company company = resolveCompany(employee);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc, PageSize.A4);
            document.setMargins(25f, 25f, 25f, 25f);

            // Cores institucionais
            DeviceRgb darkHeader = new DeviceRgb(24, 30, 42);     // #181E2A
            DeviceRgb tableHeaderBg = new DeviceRgb(30, 41, 59);  // #1E293B
            DeviceRgb zebraBg = new DeviceRgb(248, 250, 252);     // #F8FAFC
            DeviceRgb weekendBg = new DeviceRgb(241, 245, 249);   // #F1F5F9
            DeviceRgb borderSubtle = new DeviceRgb(226, 232, 240);// #E2E8F0

            // 1. Cabeçalho Geral (Empresa + Título do Documento)
            Table headerTable = new Table(UnitValue.createPercentArray(new float[]{60f, 40f}))
                    .useAllAvailableWidth()
                    .setMarginBottom(10f);

            // Dados da Empresa
            Cell compCell = new Cell()
                    .setBorder(Border.NO_BORDER)
                    .add(new Paragraph(company.getName() != null ? company.getName().toUpperCase() : "FLUXBUS TRANSPORTES")
                            .setBold().setFontSize(13).setFontColor(darkHeader))
                    .add(new Paragraph("CNPJ: " + (company.getCnpj() != null ? company.getCnpj() : "Não informado"))
                            .setFontSize(8).setFontColor(ColorConstants.GRAY))
                    .add(new Paragraph(company.getAddress() != null ? company.getAddress() : "Sistema Integrado de Gestão e Transporte")
                            .setFontSize(8).setFontColor(ColorConstants.GRAY));
            headerTable.addCell(compCell);

            // Título Legal do Documento
            Cell titleCell = new Cell()
                    .setBorder(Border.NO_BORDER)
                    .setTextAlignment(TextAlignment.RIGHT)
                    .add(new Paragraph("ESPELHO DE PONTO ELETRÔNICO")
                            .setBold().setFontSize(12).setFontColor(darkHeader))
                    .add(new Paragraph("Conforme Portaria MTP nº 671/2021 e CLT")
                            .setItalic().setFontSize(8).setFontColor(ColorConstants.GRAY))
                    .add(new Paragraph(String.format("Período de Apuração: %02d/%04d", month, year))
                            .setBold().setFontSize(9).setFontColor(darkHeader));
            headerTable.addCell(titleCell);

            document.add(headerTable);

            // 2. Caixa de Dados do Empregado
            Table empTable = new Table(UnitValue.createPercentArray(new float[]{50f, 25f, 25f}))
                    .useAllAvailableWidth()
                    .setBorder(new SolidBorder(borderSubtle, 1f))
                    .setBackgroundColor(new DeviceRgb(249, 250, 251))
                    .setMarginBottom(12f);

            String cargo = (employee.getPosition() != null && employee.getPosition().getName() != null)
                    ? employee.getPosition().getName()
                    : "Motorista";

            String departamento = (employee.getDepartment() != null && employee.getDepartment().getName() != null)
                    ? employee.getDepartment().getName()
                    : "Operacional";

            empTable.addCell(new Cell().setBorder(Border.NO_BORDER).setPadding(4f)
                    .add(new Paragraph("Empregado: ").setFontSize(8).setFontColor(ColorConstants.GRAY)
                            .add(new Paragraph(employee.getName() != null ? employee.getName() : "N/A").setBold().setFontSize(9).setFontColor(darkHeader))));

            empTable.addCell(new Cell().setBorder(Border.NO_BORDER).setPadding(4f)
                    .add(new Paragraph("CPF / Doc: ").setFontSize(8).setFontColor(ColorConstants.GRAY)
                            .add(new Paragraph(employee.getDocument() != null ? employee.getDocument() : "N/A").setBold().setFontSize(9).setFontColor(darkHeader))));

            empTable.addCell(new Cell().setBorder(Border.NO_BORDER).setPadding(4f)
                    .add(new Paragraph("Matrícula: ").setFontSize(8).setFontColor(ColorConstants.GRAY)
                            .add(new Paragraph(employee.getRegistrationNumber() != null ? employee.getRegistrationNumber() : "-").setBold().setFontSize(9).setFontColor(darkHeader))));

            empTable.addCell(new Cell().setBorder(Border.NO_BORDER).setPadding(4f)
                    .add(new Paragraph("Função: ").setFontSize(8).setFontColor(ColorConstants.GRAY)
                            .add(new Paragraph(cargo).setBold().setFontSize(9).setFontColor(darkHeader))));

            empTable.addCell(new Cell().setBorder(Border.NO_BORDER).setPadding(4f)
                    .add(new Paragraph("Departamento: ").setFontSize(8).setFontColor(ColorConstants.GRAY)
                            .add(new Paragraph(departamento).setBold().setFontSize(9).setFontColor(darkHeader))));

            String admissao = employee.getHireDate() != null ? employee.getHireDate().format(DATE_FORMAT) : "-";
            empTable.addCell(new Cell().setBorder(Border.NO_BORDER).setPadding(4f)
                    .add(new Paragraph("Admissão: ").setFontSize(8).setFontColor(ColorConstants.GRAY)
                            .add(new Paragraph(admissao).setBold().setFontSize(9).setFontColor(darkHeader))));

            document.add(empTable);

            // 3. Tabela de Registros Diários
            // Colunas: Data (10%), Dia (10%), Entrada (12%), Saída Almoço (12%), Retorno Almoço (12%), Saída (12%), Horas (12%), Ocorrências (20%)
            Table grid = new Table(UnitValue.createPercentArray(new float[]{10f, 10f, 12f, 13f, 13f, 12f, 12f, 18f}))
                    .useAllAvailableWidth()
                    .setBorder(new SolidBorder(borderSubtle, 1f));

            String[] headers = {"Data", "Dia", "1ª Entrada", "1ª Saída", "2ª Entrada", "2ª Saída", "Horas Trab.", "Ocorrências / Obs"};
            for (String h : headers) {
                grid.addHeaderCell(new Cell()
                        .setBackgroundColor(tableHeaderBg)
                        .setPadding(4f)
                        .setTextAlignment(TextAlignment.CENTER)
                        .setVerticalAlignment(VerticalAlignment.MIDDLE)
                        .setBorder(new SolidBorder(tableHeaderBg, 0.5f))
                        .add(new Paragraph(h).setBold().setFontSize(7.5f).setFontColor(ColorConstants.WHITE)));
            }

            long totalWorkedMinutesMonth = 0;
            int diasComRegistro = 0;

            DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm");

            for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
                DayOfWeek dayOfWeek = date.getDayOfWeek();
                boolean isWeekend = !isWorkingDay(dayOfWeek);

                List<TimeRecord> dayRecords = recordsByDay.getOrDefault(date, List.of())
                        .stream()
                        .sorted(Comparator.comparing(TimeRecord::getRecordedAt))
                        .toList();

                Map<TimeRecord.RecordType, LocalDateTime> byType = new EnumMap<>(TimeRecord.RecordType.class);
                boolean hasManualAdjustment = false;
                StringBuilder notes = new StringBuilder();

                for (TimeRecord tr : dayRecords) {
                    byType.putIfAbsent(tr.getRecordType(), tr.getRecordedAt());
                    if (Boolean.TRUE.equals(tr.getIsManual())) {
                        hasManualAdjustment = true;
                    }
                    if (tr.getJustification() != null && !tr.getJustification().trim().isEmpty()) {
                        if (notes.length() > 0) notes.append(" | ");
                        notes.append(tr.getJustification().trim());
                    }
                }

                LocalDateTime ent = byType.get(TimeRecord.RecordType.ENTRADA);
                LocalDateTime saiAlm = byType.get(TimeRecord.RecordType.SAIDA_ALMOCO);
                LocalDateTime retAlm = byType.get(TimeRecord.RecordType.RETORNO_ALMOCO);
                LocalDateTime sai = byType.get(TimeRecord.RecordType.SAIDA);

                // Cálculo de horas do dia
                long minutesToday = 0;
                if (ent != null && sai != null && !sai.isBefore(ent)) {
                    long totalSpan = java.time.Duration.between(ent, sai).toMinutes();
                    long intervalSpan = 0;
                    if (saiAlm != null && retAlm != null && !retAlm.isBefore(saiAlm)) {
                        intervalSpan = java.time.Duration.between(saiAlm, retAlm).toMinutes();
                    } else if (totalSpan > 360) {
                        intervalSpan = 60; // Desconto padrão 1h intervalo intrajornada
                    }
                    minutesToday = Math.max(0, totalSpan - intervalSpan);
                    totalWorkedMinutesMonth += minutesToday;
                    diasComRegistro++;
                } else if (!dayRecords.isEmpty()) {
                    diasComRegistro++;
                }

                String horasFormatadas = minutesToday > 0 
                        ? String.format("%02dh %02dm", minutesToday / 60, minutesToday % 60)
                        : (dayRecords.isEmpty() ? (isWeekend ? "DSR" : "--") : "Incompleto");

                DeviceRgb rowBg = isWeekend ? weekendBg : (date.getDayOfMonth() % 2 == 0 ? zebraBg : new DeviceRgb(255, 255, 255));

                // 1. Data
                grid.addCell(new Cell().setBackgroundColor(rowBg).setPadding(3f)
                        .setTextAlignment(TextAlignment.CENTER)
                        .setBorder(new SolidBorder(borderSubtle, 0.5f))
                        .add(new Paragraph(date.format(DateTimeFormatter.ofPattern("dd/MM"))).setFontSize(7.5f)));

                // 2. Dia Semana
                String diaAbrev = dayOfWeek.getDisplayName(java.time.format.TextStyle.SHORT, new Locale("pt", "BR"));
                grid.addCell(new Cell().setBackgroundColor(rowBg).setPadding(3f)
                        .setTextAlignment(TextAlignment.CENTER)
                        .setBorder(new SolidBorder(borderSubtle, 0.5f))
                        .add(new Paragraph(capitalize(diaAbrev)).setFontSize(7.5f)));

                // 3. Entrada
                grid.addCell(new Cell().setBackgroundColor(rowBg).setPadding(3f)
                        .setTextAlignment(TextAlignment.CENTER)
                        .setBorder(new SolidBorder(borderSubtle, 0.5f))
                        .add(new Paragraph(ent != null ? ent.format(timeFmt) : "--").setFontSize(7.5f)));

                // 4. Saída Almoço
                grid.addCell(new Cell().setBackgroundColor(rowBg).setPadding(3f)
                        .setTextAlignment(TextAlignment.CENTER)
                        .setBorder(new SolidBorder(borderSubtle, 0.5f))
                        .add(new Paragraph(saiAlm != null ? saiAlm.format(timeFmt) : "--").setFontSize(7.5f)));

                // 5. Retorno Almoço
                grid.addCell(new Cell().setBackgroundColor(rowBg).setPadding(3f)
                        .setTextAlignment(TextAlignment.CENTER)
                        .setBorder(new SolidBorder(borderSubtle, 0.5f))
                        .add(new Paragraph(retAlm != null ? retAlm.format(timeFmt) : "--").setFontSize(7.5f)));

                // 6. Saída
                grid.addCell(new Cell().setBackgroundColor(rowBg).setPadding(3f)
                        .setTextAlignment(TextAlignment.CENTER)
                        .setBorder(new SolidBorder(borderSubtle, 0.5f))
                        .add(new Paragraph(sai != null ? sai.format(timeFmt) : "--").setFontSize(7.5f)));

                // 7. Horas Trab.
                grid.addCell(new Cell().setBackgroundColor(rowBg).setPadding(3f)
                        .setTextAlignment(TextAlignment.CENTER)
                        .setBorder(new SolidBorder(borderSubtle, 0.5f))
                        .add(new Paragraph(horasFormatadas).setBold().setFontSize(7.5f)));

                // 8. Ocorrências
                String finalObs = "";
                if (dayRecords.isEmpty()) {
                    finalObs = isWeekend ? "Folga Semanal / DSR" : "Sem registro";
                } else {
                    if (hasManualAdjustment) {
                        finalObs = "* Ajuste RH" + (notes.length() > 0 ? " (" + notes + ")" : "");
                    } else if (notes.length() > 0) {
                        finalObs = notes.toString();
                    }
                }
                grid.addCell(new Cell().setBackgroundColor(rowBg).setPadding(3f)
                        .setTextAlignment(TextAlignment.LEFT)
                        .setBorder(new SolidBorder(borderSubtle, 0.5f))
                        .add(new Paragraph(finalObs).setFontSize(7f).setFontColor(hasManualAdjustment ? new DeviceRgb(180, 83, 9) : ColorConstants.DARK_GRAY)));
            }

            document.add(grid);

            // 4. Resumo de Totais
            Table totalsTable = new Table(UnitValue.createPercentArray(new float[]{50f, 50f}))
                    .useAllAvailableWidth()
                    .setBorder(new SolidBorder(borderSubtle, 1f))
                    .setBackgroundColor(new DeviceRgb(248, 250, 252))
                    .setMarginTop(8f)
                    .setMarginBottom(12f);

            long totalHoras = totalWorkedMinutesMonth / 60;
            long totalMins = totalWorkedMinutesMonth % 60;

            totalsTable.addCell(new Cell().setBorder(Border.NO_BORDER).setPadding(6f)
                    .add(new Paragraph(String.format("Total de Dias Trabalhados: %d dias", diasComRegistro))
                            .setBold().setFontSize(8.5f).setFontColor(darkHeader)));

            totalsTable.addCell(new Cell().setBorder(Border.NO_BORDER).setPadding(6f)
                    .setTextAlignment(TextAlignment.RIGHT)
                    .add(new Paragraph(String.format("Total de Horas Trabalhadas: %02dh %02dmin", totalHoras, totalMins))
                            .setBold().setFontSize(9f).setFontColor(new DeviceRgb(15, 118, 110))));

            document.add(totalsTable);

            // 5. Termo de Declaração do Empregado e Assinaturas
            Paragraph declaration = new Paragraph("Reconheço a exatidão das marcações acima registradas nesta folha de ponto, relativas aos serviços prestados na empresa.")
                    .setItalic().setFontSize(7.5f).setTextAlignment(TextAlignment.CENTER).setFontColor(ColorConstants.GRAY).setMarginBottom(16f);
            document.add(declaration);

            Table signTable = new Table(UnitValue.createPercentArray(new float[]{45f, 10f, 45f}))
                    .useAllAvailableWidth();

            Cell signEmp = new Cell().setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.CENTER)
                    .add(new Paragraph("____________________________________________________").setFontSize(8).setFontColor(ColorConstants.GRAY))
                    .add(new Paragraph(employee.getName() != null ? employee.getName() : "Empregado").setBold().setFontSize(8).setFontColor(darkHeader))
                    .add(new Paragraph("Assinatura do Empregado (CPF: " + (employee.getDocument() != null ? employee.getDocument() : "-") + ")").setFontSize(7.5f).setFontColor(ColorConstants.GRAY));

            Cell signMiddle = new Cell().setBorder(Border.NO_BORDER);

            Cell signComp = new Cell().setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.CENTER)
                    .add(new Paragraph("____________________________________________________").setFontSize(8).setFontColor(ColorConstants.GRAY))
                    .add(new Paragraph(company.getName() != null ? company.getName() : "Empresa Empregadora").setBold().setFontSize(8).setFontColor(darkHeader))
                    .add(new Paragraph("Visto do Departamento Pessoal / RH").setFontSize(7.5f).setFontColor(ColorConstants.GRAY));

            signTable.addCell(signEmp);
            signTable.addCell(signMiddle);
            signTable.addCell(signComp);

            document.add(signTable);

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Erro ao gerar folha de ponto em PDF para funcionário {}: {}", employeeId, e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar folha de ponto em PDF: " + e.getMessage(), e);
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

        throw new RuntimeException("Não foi possível determinar a empresa para o relatório.");
    }
}




