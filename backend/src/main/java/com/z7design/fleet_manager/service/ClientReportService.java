package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.ClientReportFilterDTO;
import com.z7design.fleet_manager.model.Client;
import com.z7design.fleet_manager.repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

// Placeholder for PDF generation library (e.g., iText, Apache PDFBox)
// Placeholder for Excel generation library (e.g., Apache POI)

@Service
@RequiredArgsConstructor
@Slf4j
public class ClientReportService {

    private final ClientRepository clientRepository;

    public byte[] generateClientPdfReport(ClientReportFilterDTO filters) {
        log.info("Gerando relatÃ³rio PDF para clientes com filtros: {}", filters);
        List<Client> clients = findClientsByFilters(filters);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc);

            document.add(new Paragraph("RELATÃ“RIO DE CLIENTES")
                    .setBold()
                    .setFontSize(14)
                    .setTextAlignment(TextAlignment.CENTER));

            document.add(new Paragraph("Filtros aplicados:")
                    .setBold()
                    .setFontSize(10));

            document.add(new Paragraph(String.format("Nome: %s",
                    filters.getName() != null ? filters.getName() : "Todos")).setFontSize(9));
            document.add(new Paragraph(String.format("CNPJ: %s",
                    filters.getCnpj() != null ? filters.getCnpj() : "Todos")).setFontSize(9));
            document.add(new Paragraph(String.format("Status: %s",
                    filters.getStatus() != null ? filters.getStatus() : "Todos")).setFontSize(9));
            document.add(new Paragraph(String.format("Data InÃ­cio: %s",
                    filters.getStartDate() != null ? filters.getStartDate() : "N/A")).setFontSize(9));
            document.add(new Paragraph(String.format("Data Fim: %s",
                    filters.getEndDate() != null ? filters.getEndDate() : "N/A")).setFontSize(9));

            document.add(new Paragraph(String.format("Total de clientes: %d", clients.size()))
                    .setFontSize(9)
                    .setMarginTop(8));

            float[] columnWidths = {4, 3, 4, 3, 3};
            Table table = new Table(columnWidths).useAllAvailableWidth().setMarginTop(10);
            addHeaderCell(table, "Nome");
            addHeaderCell(table, "CNPJ");
            addHeaderCell(table, "Email");
            addHeaderCell(table, "Status");
            addHeaderCell(table, "Criado em");

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            for (Client client : clients) {
                table.addCell(createCell(client.getName()));
                table.addCell(createCell(client.getCnpj()));
                table.addCell(createCell(client.getEmail()));
                table.addCell(createCell(client.getStatus() != null ? client.getStatus().toString() : ""));
                table.addCell(createCell(client.getCreatedAt() != null ? client.getCreatedAt().toLocalDate().format(formatter) : ""));
            }

            document.add(table);
            document.close();

            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Erro na geraÃ§Ã£o do PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar relatÃ³rio PDF", e);
        }
    }

    private void addHeaderCell(Table table, String text) {
        table.addCell(new Cell().add(new Paragraph(text).setBold()).setTextAlignment(TextAlignment.CENTER));
    }

    private Cell createCell(String text) {
        return new Cell().add(new Paragraph(text != null ? text : "")).setTextAlignment(TextAlignment.LEFT);
    }

    public byte[] generateClientExcelReport(ClientReportFilterDTO filters) {
        log.info("Gerando relatÃ³rio Excel para clientes com filtros: {}", filters);
        List<Client> clients = findClientsByFilters(filters);

        // TODO: Implement Excel generation logic here
        // This is a placeholder. You would use a library like Apache POI.
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            // Example: Create a simple CSV-like output for demonstration
            StringBuilder csvContent = new StringBuilder();
            csvContent.append("ID,Nome,CNPJ,Email,Status,Data de CriaÃ§Ã£o\n");
            for (Client client : clients) {
                csvContent.append(String.format("%s,%s,%s,%s,%s,%s\n",
                        client.getId(),
                        client.getName(),
                        client.getCnpj(),
                        client.getEmail(),
                        client.getStatus(),
                        client.getCreatedAt() != null ? client.getCreatedAt().toLocalDate() : ""
                ));
            }
            baos.write(csvContent.toString().getBytes());
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Erro na geraÃ§Ã£o do Excel: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar relatÃ³rio Excel", e);
        }
    }

    private List<Client> findClientsByFilters(ClientReportFilterDTO filters) {
        Specification<Client> spec = Specification.where(null);

        if (filters.getName() != null && !filters.getName().isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("name")), "%" + filters.getName().toLowerCase() + "%"));
        }
        if (filters.getCnpj() != null && !filters.getCnpj().isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.like(root.get("cnpj"), "%" + filters.getCnpj() + "%"));
        }
        if (filters.getStatus() != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), filters.getStatus()));
        }
        if (filters.getStartDate() != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), LocalDateTime.of(filters.getStartDate(), java.time.LocalTime.MIN)));
        }
        if (filters.getEndDate() != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), LocalDateTime.of(filters.getEndDate(), java.time.LocalTime.MAX)));
        }

        return clientRepository.findAll(spec);
    }
}
