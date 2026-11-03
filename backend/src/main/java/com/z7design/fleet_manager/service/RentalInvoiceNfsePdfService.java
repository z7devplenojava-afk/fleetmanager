package com.z7design.fleet_manager.service;

import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Client;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.RentalInvoice;
import com.z7design.fleet_manager.model.RentalInvoiceVehicle;
import com.z7design.fleet_manager.repository.ClientRepository;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.RentalInvoiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * Gera a Nota Fiscal de Serviço (NFS-e gerencial) da fatura de locação de veículos.
 * O documento reúne prestador, tomador, discriminação dos veículos locados e totais.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RentalInvoiceNfsePdfService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_TIME_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DeviceRgb HEADER_BG = new DeviceRgb(31, 41, 55);
    private static final DeviceRgb HEADER_FG = new DeviceRgb(255, 255, 255);
    private static final DeviceRgb LIGHT_BG = new DeviceRgb(243, 244, 246);

    private final RentalInvoiceRepository rentalInvoiceRepository;
    private final ClientRepository clientRepository;
    private final CompanyRepository companyRepository;

    @Transactional(readOnly = true)
    public byte[] generate(UUID invoiceId) {
        RentalInvoice invoice = rentalInvoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Fatura de locação não encontrada"));
        Client client = clientRepository.findById(invoice.getClientId()).orElse(null);
        Company company = resolveCompany(client);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(out);
            try (PdfDocument pdf = new PdfDocument(writer);
                 Document document = new Document(pdf)) {

                addHeader(document, company);
                addFiscalIdentification(document, invoice);
                addParties(document, company, client);
                addItems(document, invoice);
                addTotals(document, invoice);
                addPaymentInfo(document, invoice);
                addFooter(document);
            }
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Erro ao gerar NFS-e da fatura de locação {}: {}", invoiceId, e.getMessage(), e);
            throw new IllegalStateException("Não foi possível gerar a Nota Fiscal da fatura de locação.", e);
        }
    }

    private Company resolveCompany(Client client) {
        if (client == null || client.getCompanyId() == null) {
            return null;
        }
        return companyRepository.findById(client.getCompanyId()).orElse(null);
    }

    private void addHeader(Document document, Company company) {
        String name = company != null && company.getName() != null ? company.getName() : "PRESTADOR DE SERVIÇOS";
        document.add(new Paragraph(name)
                .setBold()
                .setFontSize(15)
                .setTextAlignment(TextAlignment.CENTER));
        StringBuilder details = new StringBuilder();
        if (company != null) {
            if (company.getCnpj() != null) details.append("CNPJ: ").append(company.getCnpj());
            if (company.getAddress() != null) details.append("  •  ").append(company.getAddress());
            if (company.getCity() != null) details.append("  •  ").append(company.getCity());
            if (company.getState() != null) details.append("/").append(company.getState());
            if (company.getPhone() != null) details.append("  •  Tel: ").append(company.getPhone());
            if (company.getEmail() != null) details.append("  •  ").append(company.getEmail());
        }
        document.add(new Paragraph(details.toString().isBlank() ? "-" : details.toString())
                .setFontSize(8)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(4));
        document.add(new Paragraph("NOTA FISCAL DE SERVIÇO ELETRÔNICA - NFS-e")
                .setBold()
                .setFontSize(13)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(6));
        document.add(new Paragraph("Documento gerado eletronicamente para fins de cobrança da locação de veículos.")
                .setFontSize(8)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(14));
    }

    private void addFiscalIdentification(Document document, RentalInvoice invoice) {
        Table table = new Table(UnitValue.createPercentArray(new float[]{25f, 25f, 25f, 25f}))
                .useAllAvailableWidth()
                .setMarginBottom(12);
        table.addCell(infoCell("Número da NFS-e", valueOrDash(invoice.getNfseNumber())));
        table.addCell(infoCell("Série", "1"));
        table.addCell(infoCell("Emissão", invoice.getNfseIssueDate() != null
                ? invoice.getNfseIssueDate().format(DATE_TIME_FMT)
                : (invoice.getIssueDate() != null ? invoice.getIssueDate().format(DATE_FMT) : "-")));
        table.addCell(infoCell("Situação", valueOrDash(invoice.getNfseStatus())));
        document.add(table);
    }

    private void addParties(Document document, Company company, Client client) {
        Table table = new Table(UnitValue.createPercentArray(new float[]{50f, 50f}))
                .useAllAvailableWidth()
                .setMarginBottom(12);

        Cell provider = new Cell().setPadding(6);
        provider.add(new Paragraph("PRESTADOR DE SERVIÇOS").setBold().setFontSize(9));
        provider.add(new Paragraph(company != null ? valueOrDash(company.getName()) : "-").setFontSize(9));
        provider.add(new Paragraph("CNPJ: " + (company != null ? valueOrDash(company.getCnpj()) : "-")).setFontSize(8));
        provider.add(new Paragraph("Endereço: " + (company != null ? valueOrDash(company.getAddress()) : "-")).setFontSize(8));
        provider.add(new Paragraph("Cidade: " + cityLine(company != null ? company.getCity() : null,
                company != null ? company.getState() : null,
                company != null ? company.getZipCode() : null)).setFontSize(8));
        provider.add(new Paragraph("Telefone: " + (company != null ? valueOrDash(company.getPhone()) : "-")).setFontSize(8));

        Cell taker = new Cell().setPadding(6).setBackgroundColor(LIGHT_BG);
        taker.add(new Paragraph("TOMADOR DE SERVIÇOS").setBold().setFontSize(9));
        taker.add(new Paragraph(valueOrDash(client != null ? client.getName() : null)).setFontSize(9));
        taker.add(new Paragraph("CNPJ/CPF: " + (client != null ? valueOrDash(client.getCnpj()) : "-")).setFontSize(8));
        taker.add(new Paragraph("Endereço: " + (client != null ? valueOrDash(client.getAddress()) : "-")).setFontSize(8));
        taker.add(new Paragraph("Cidade: " + cityLine(client != null ? client.getCity() : null,
                client != null ? client.getState() : null,
                client != null ? client.getZipCode() : null)).setFontSize(8));

        table.addCell(provider);
        table.addCell(taker);
        document.add(table);
    }

    private void addItems(Document document, RentalInvoice invoice) {
        document.add(new Paragraph("DISCRIMINAÇÃO DOS SERVIÇOS")
                .setBold().setFontSize(10).setMarginBottom(4));
        String description = "Locação de veículos sem cessão de mão de obra";
        if (invoice.getContractNumber() != null) {
            description += " - Contrato " + invoice.getContractNumber();
        }
        description += " - Período de " + period(invoice);
        document.add(new Paragraph(description).setFontSize(9).setMarginBottom(6));

        Table table = new Table(UnitValue.createPercentArray(new float[]{15f, 45f, 40f}))
                .useAllAvailableWidth()
                .setMarginBottom(10);
        table.addHeaderCell(headerCell("Placa"));
        table.addHeaderCell(headerCell("Veículo / Descrição"));
        table.addHeaderCell(headerCellRight("Valor (R$)"));

        for (RentalInvoiceVehicle item : invoice.getItems()) {
            table.addCell(bodyCell(valueOrDash(item.getPlate())));
            String vehicle = joinNonBlank(item.getModel(), item.getDescription(), "-");
            table.addCell(bodyCell(vehicle));
            table.addCell(bodyCellRight(currency(item.getAmount())));
        }
        if (invoice.getItems().isEmpty()) {
            table.addCell(bodyCell("-"));
            table.addCell(bodyCell("Nenhum veículo informado"));
            table.addCell(bodyCellRight(currency(BigDecimal.ZERO)));
        }
        document.add(table);
    }

    private void addTotals(Document document, RentalInvoice invoice) {
        Table table = new Table(UnitValue.createPercentArray(new float[]{70f, 30f}))
                .useAllAvailableWidth()
                .setMarginBottom(12);
        table.addCell(labelCell("Total dos veículos"));
        table.addCell(valueCell(currency(invoice.getTotalAmount())));
        table.addCell(labelCell("Desconto"));
        table.addCell(valueCell(currency(invoice.getDiscount())));
        table.addCell(labelCellBold("Valor líquido da NFS-e"));
        table.addCell(valueCellBold(currency(invoice.getNetAmount())));
        document.add(table);
    }

    private void addPaymentInfo(Document document, RentalInvoice invoice) {
        Table table = new Table(UnitValue.createPercentArray(new float[]{25f, 25f, 25f, 25f}))
                .useAllAvailableWidth()
                .setMarginBottom(12);
        table.addCell(infoCell("Fatura de locação", valueOrDash(invoice.getNumber())));
        table.addCell(infoCell("Vencimento", invoice.getDueDate() != null ? invoice.getDueDate().format(DATE_FMT) : "-"));
        table.addCell(infoCell("Recebimento", invoice.getReceiptDate() != null ? invoice.getReceiptDate().format(DATE_FMT) : "-"));
        table.addCell(infoCell("Forma de pagamento", valueOrDash(invoice.getPaymentMethod())));
        document.add(table);

        StringBuilder bank = new StringBuilder();
        if (invoice.getBankName() != null) bank.append("Banco: ").append(invoice.getBankName()).append("  ");
        if (invoice.getBankAgency() != null) bank.append("Agência: ").append(invoice.getBankAgency()).append("  ");
        if (invoice.getBankAccount() != null) bank.append("Conta: ").append(invoice.getBankAccount());
        if (!bank.toString().isBlank()) {
            document.add(new Paragraph("Dados bancários: " + bank.toString().trim()).setFontSize(8).setMarginBottom(6));
        }
        if (invoice.getNotes() != null && !invoice.getNotes().isBlank()) {
            document.add(new Paragraph("Observações: " + invoice.getNotes()).setFontSize(8).setMarginBottom(6));
        }
    }

    private void addFooter(Document document) {
        document.add(new Paragraph("Documento gerado eletronicamente pelo sistema de gestão de frota.")
                .setFontSize(7)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(10));
    }

    private Cell infoCell(String label, String value) {
        Cell cell = new Cell().setPadding(5).setBackgroundColor(LIGHT_BG);
        cell.add(new Paragraph(label).setBold().setFontSize(7));
        cell.add(new Paragraph(value).setFontSize(9));
        return cell;
    }

    private Cell headerCell(String text) {
        return new Cell().setBackgroundColor(HEADER_BG).setPadding(4)
                .add(new Paragraph(text).setBold().setFontSize(8).setFontColor(HEADER_FG));
    }

    private Cell headerCellRight(String text) {
        return new Cell().setBackgroundColor(HEADER_BG).setPadding(4)
                .add(new Paragraph(text).setBold().setFontSize(8).setFontColor(HEADER_FG)
                        .setTextAlignment(TextAlignment.RIGHT));
    }

    private Cell bodyCell(String text) {
        return new Cell().setPadding(4).add(new Paragraph(text).setFontSize(8));
    }

    private Cell bodyCellRight(String text) {
        return new Cell().setPadding(4).add(new Paragraph(text).setFontSize(8)
                .setTextAlignment(TextAlignment.RIGHT));
    }

    private Cell labelCell(String text) {
        return new Cell().setPadding(4).add(new Paragraph(text).setFontSize(8));
    }

    private Cell labelCellBold(String text) {
        return new Cell().setPadding(4).add(new Paragraph(text).setBold().setFontSize(9));
    }

    private Cell valueCell(String text) {
        return new Cell().setPadding(4).add(new Paragraph(text).setFontSize(8)
                .setTextAlignment(TextAlignment.RIGHT));
    }

    private Cell valueCellBold(String text) {
        return new Cell().setPadding(4).add(new Paragraph(text).setBold().setFontSize(9)
                .setTextAlignment(TextAlignment.RIGHT));
    }

    private String period(RentalInvoice invoice) {
        if (invoice.getPeriodStart() == null || invoice.getPeriodEnd() == null) {
            return "-";
        }
        return invoice.getPeriodStart().format(DATE_FMT) + " a " + invoice.getPeriodEnd().format(DATE_FMT);
    }

    private String cityLine(String city, String state, String zipCode) {
        StringBuilder sb = new StringBuilder();
        if (city != null && !city.isBlank()) sb.append(city);
        if (state != null && !state.isBlank()) sb.append(sb.length() > 0 ? "/" : "").append(state);
        if (zipCode != null && !zipCode.isBlank()) sb.append(sb.length() > 0 ? " - CEP " : "CEP ").append(zipCode);
        return sb.length() == 0 ? "-" : sb.toString();
    }

    private String joinNonBlank(String first, String second, String fallback) {
        if (first != null && !first.isBlank()) return first;
        if (second != null && !second.isBlank()) return second;
        return fallback;
    }

    private String currency(BigDecimal value) {
        BigDecimal safe = value == null ? BigDecimal.ZERO : value.setScale(2, RoundingMode.HALF_UP);
        return "R$ " + safe.toPlainString().replace('.', ',');
    }

    private String valueOrDash(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }
}
