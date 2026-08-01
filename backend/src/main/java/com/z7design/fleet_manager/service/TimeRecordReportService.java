package com.z7design.fleet_manager.service;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TimeRecordReportService {

    private final TimeRecordService timeRecordService;

    public byte[] generateConsolidatedPdf(LocalDate startDate, LocalDate endDate) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc);

            document.add(new Paragraph("Relatório Consolidado de Ponto")
                    .setBold().setFontSize(18));
            document.add(new Paragraph("Período: " + startDate + " a " + endDate)
                    .setFontSize(12));
            document.add(new Paragraph(" "));

            Map<String, Object> data = timeRecordService.getConsolidatedIndicators(startDate, endDate);

            document.add(new Paragraph("Resumo Consolidado").setBold().setFontSize(14));
            document.add(new Paragraph("Total de Empresas: " + data.getOrDefault("totalCompanies", 0)));
            document.add(new Paragraph("Total de Funcionários: " + data.getOrDefault("totalEmployees", 0)));
            document.add(new Paragraph("Total de Registros: " + data.getOrDefault("totalRecords", 0)));
            document.add(new Paragraph("Registros Pendentes: " + data.getOrDefault("totalPending", 0)));
            document.add(new Paragraph(" "));

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> breakdown = (List<Map<String, Object>>) data.getOrDefault("companyBreakdown", List.of());
            if (!breakdown.isEmpty()) {
                document.add(new Paragraph("Detalhamento por Empresa").setBold().setFontSize(14));
                Table table = new Table(UnitValue.createPercentArray(new float[]{3, 2, 2, 2, 2}));
                table.setWidth(UnitValue.createPercentValue(100));

                table.addHeaderCell(new Cell().add(new Paragraph("Empresa").setBold()));
                table.addHeaderCell(new Cell().add(new Paragraph("Registros").setBold()));
                table.addHeaderCell(new Cell().add(new Paragraph("Pendentes").setBold()));
                table.addHeaderCell(new Cell().add(new Paragraph("HE").setBold()));
                table.addHeaderCell(new Cell().add(new Paragraph("Atrasos").setBold()));

                for (Map<String, Object> company : breakdown) {
                    table.addCell(new Cell().add(new Paragraph(
                            company.getOrDefault("companyName", "N/A").toString())));
                    table.addCell(new Cell().add(new Paragraph(
                            company.getOrDefault("totalRecords", 0).toString())));
                    table.addCell(new Cell().add(new Paragraph(
                            company.getOrDefault("pendingRecords", 0).toString())));
                    table.addCell(new Cell().add(new Paragraph(
                            company.getOrDefault("overtime", 0).toString())));
                    table.addCell(new Cell().add(new Paragraph(
                            company.getOrDefault("lateness", 0).toString())));
                }
                document.add(table);
            }

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Erro ao gerar PDF consolidado: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar PDF consolidado", e);
        }
    }

    public byte[] generateConsolidatedExcel(LocalDate startDate, LocalDate endDate) {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            Map<String, Object> data = timeRecordService.getConsolidatedIndicators(startDate, endDate);

            Sheet summarySheet = workbook.createSheet("Resumo Consolidado");
            Row headerRow = summarySheet.createRow(0);
            headerRow.createCell(0).setCellValue("Indicador");
            headerRow.createCell(1).setCellValue("Valor");

            summarySheet.createRow(1).createCell(0).setCellValue("Total Empresas");
            summarySheet.getRow(1).createCell(1).setCellValue(
                    data.getOrDefault("totalCompanies", 0).toString());
            summarySheet.createRow(2).createCell(0).setCellValue("Total Funcionários");
            summarySheet.getRow(2).createCell(1).setCellValue(
                    data.getOrDefault("totalEmployees", 0).toString());
            summarySheet.createRow(3).createCell(0).setCellValue("Total Registros");
            summarySheet.getRow(3).createCell(1).setCellValue(
                    data.getOrDefault("totalRecords", 0).toString());
            summarySheet.createRow(4).createCell(0).setCellValue("Pendentes");
            summarySheet.getRow(4).createCell(1).setCellValue(
                    data.getOrDefault("totalPending", 0).toString());

            Sheet companiesSheet = workbook.createSheet("Empresas");
            Row compHeader = companiesSheet.createRow(0);
            compHeader.createCell(0).setCellValue("Empresa");
            compHeader.createCell(1).setCellValue("Registros");
            compHeader.createCell(2).setCellValue("Pendentes");
            compHeader.createCell(3).setCellValue("Funcionários");
            compHeader.createCell(4).setCellValue("HE");
            compHeader.createCell(5).setCellValue("Atrasos");

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> breakdown = (List<Map<String, Object>>) data.getOrDefault("companyBreakdown", List.of());
            int rowNum = 1;
            for (Map<String, Object> company : breakdown) {
                Row row = companiesSheet.createRow(rowNum++);
                row.createCell(0).setCellValue(company.getOrDefault("companyName", "N/A").toString());
                row.createCell(1).setCellValue(((Number) company.getOrDefault("totalRecords", 0)).doubleValue());
                row.createCell(2).setCellValue(((Number) company.getOrDefault("pendingRecords", 0)).doubleValue());
                row.createCell(3).setCellValue(((Number) company.getOrDefault("employees", 0)).doubleValue());
                row.createCell(4).setCellValue(((Number) company.getOrDefault("overtime", 0)).doubleValue());
                row.createCell(5).setCellValue(((Number) company.getOrDefault("lateness", 0)).doubleValue());
            }

            for (int i = 0; i < 6; i++) {
                companiesSheet.autoSizeColumn(i);
            }

            workbook.write(baos);
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Erro ao gerar Excel consolidado: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar Excel consolidado", e);
        }
    }
}
