package com.z7design.fleet_manager.service;

import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.pdf.canvas.parser.PdfTextExtractor;
import com.z7design.fleet_manager.model.Client;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.Contract;
import com.z7design.fleet_manager.model.MeasurementBulletin;
import com.z7design.fleet_manager.model.MeasurementItem;
import com.z7design.fleet_manager.model.Unit;
import com.z7design.fleet_manager.model.enums.MeasurementCategory;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.MeasurementBulletinRepository;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

/**
 * Gera um boletim de medição de teste (PDF + Excel) usando os serviços reais
 * de produção com repositórios mockados e valida:
 * - orientação paisagem (A4 rotacionado)
 * - Cliente no cabeçalho
 * - as 15 colunas da tabela
 * - os novos campos (diária, KM considerado/excedido, valor KM exc, data,
 *   trajeto, tipo de veículo)
 * Os arquivos são gravados em build/test-measurement/ para inspeção visual.
 */
class MeasurementReportPdfValidationTest {

    private static final String[] EXPECTED_HEADERS = {
            "Item", "Código", "Descrição", "Unidade", "Qtd/Dias", "Diária", "Preço Un.",
            "KM Consid.", "KM Exced.", "Valor KM Exc", "Placa", "Data", "Trajeto",
            "Tipo Veíc.", "Valor Total"
    };

    private MeasurementBulletin buildBulletin() {
        Client client = new Client();
        client.setId(UUID.randomUUID());
        client.setName("Cliente Teste Transportes LTDA");

        Contract contract = new Contract();
        contract.setId(UUID.randomUUID());
        contract.setDescription("Contrato de locação de veículos com motorista");

        Unit unit = new Unit();
        unit.setId(UUID.randomUUID());
        unit.setName("Unidade Matriz");

        MeasurementBulletin bulletin = new MeasurementBulletin();
        bulletin.setId(UUID.randomUUID());
        bulletin.setCompanyName("Empresa Transportadora Teste");
        bulletin.setPeriodStart(LocalDate.of(2026, 7, 1));
        bulletin.setPeriodEnd(LocalDate.of(2026, 7, 31));
        bulletin.setContractNumber("CT-2026-0001");
        bulletin.setContractStart(LocalDate.of(2026, 1, 1));
        bulletin.setContractEnd(LocalDate.of(2026, 12, 31));
        bulletin.setNfNumber("NF-00123");
        bulletin.setElaboratedBy("João Elaborador");
        bulletin.setMeasuredBy("Maria Medidora");
        bulletin.setClient(client);
        bulletin.setContract(contract);
        bulletin.setUnit(unit);

        // Item 1: Locação em regime global (com diária)
        MeasurementItem lease = new MeasurementItem();
        lease.setItemNumber(1);
        lease.setCode("LOC-001");
        lease.setDescription("Locação de ônibus 44 lugares");
        lease.setUnit("VB/MÊS");
        lease.setQuantity(new BigDecimal("1.00"));
        lease.setUnitPrice(new BigDecimal("28000.00"));
        lease.setDiaria(new BigDecimal("933.33"));
        lease.setCategory(MeasurementCategory.LEASE);
        lease.calculateTotalValue();
        bulletin.addItem(lease);

        // Item 2: Quilometragem excedente (todos os campos de KM)
        MeasurementItem km = new MeasurementItem();
        km.setItemNumber(2);
        km.setCode("KM-EXT");
        km.setDescription("Quilometragem excedente");
        km.setUnit("KM");
        km.setQuantity(new BigDecimal("300.00"));
        km.setUnitPrice(new BigDecimal("4.50"));
        km.setInitialKm(new BigDecimal("2500.00"));
        km.setFinalKm(new BigDecimal("3200.00"));
        km.setFranchiseKm(new BigDecimal("300.00"));
        km.setDisregardedKm(new BigDecimal("100.00"));
        km.setKmConsiderado(new BigDecimal("700.00"));
        km.setKmExcedido(new BigDecimal("300.00"));
        km.setValorKmExcedido(new BigDecimal("1350.00"));
        km.setVehiclePlate("ABC-1234");
        km.setCategory(MeasurementCategory.EXCESS_KM);
        km.calculateTotalValue();
        bulletin.addItem(km);

        // Item 3: Viagem extra (data, trajeto, tipo de veículo)
        MeasurementItem trip = new MeasurementItem();
        trip.setItemNumber(3);
        trip.setCode("VIAG-EXT");
        trip.setDescription("Viagem extra para evento corporativo");
        trip.setUnit("VB/DIA");
        trip.setQuantity(new BigDecimal("2.00"));
        trip.setUnitPrice(new BigDecimal("850.00"));
        trip.setDiaria(new BigDecimal("850.00"));
        trip.setTripCount(2);
        trip.setIsExtraTrip(true);
        trip.setTripDate(LocalDate.of(2026, 7, 15));
        trip.setRoute("Belo Horizonte - Vitória");
        trip.setVehicleType("Micro-ônibus");
        trip.setVehiclePlate("XYZ-9876");
        trip.setCategory(MeasurementCategory.EXTRA_TRIP);
        trip.calculateTotalValue();
        bulletin.addItem(trip);

        bulletin.calculateSubtotal();
        return bulletin;
    }

    private MeasurementReportService buildService(MeasurementBulletin bulletin) {
        UUID companyId = UUID.randomUUID();

        Company company = new Company();
        company.setId(companyId);
        company.setName("Empresa Transportadora Teste LTDA");
        company.setSigla("ETT");
        company.setCnpj("12345678000190");
        company.setEnderecoRua("Av. Teste");
        company.setEnderecoNumero("100");
        company.setEnderecoBairro("Centro");
        company.setCity("Belo Horizonte");
        company.setState("MG");
        company.setZipCode("30100-000");
        company.setStatus(Company.CompanyStatus.ACTIVE);

        MeasurementBulletinRepository bulletinRepo = Mockito.mock(MeasurementBulletinRepository.class);
        when(bulletinRepo.findById(bulletin.getId())).thenReturn(Optional.of(bulletin));

        CompanyRepository companyRepo = Mockito.mock(CompanyRepository.class);
        when(companyRepo.findByStatus(Company.CompanyStatus.ACTIVE)).thenReturn(List.of(company));
        when(companyRepo.findById(companyId)).thenReturn(Optional.of(company));

        StandardReportLayoutService layoutService = new StandardReportLayoutService(companyRepo);
        return new MeasurementReportService(bulletinRepo, layoutService, companyRepo);
    }

    @Test
    void generatesLandscapePdfWithClientHeaderAndAll15Columns() throws Exception {
        MeasurementBulletin bulletin = buildBulletin();
        MeasurementReportService service = buildService(bulletin);

        byte[] pdfBytes = service.generateBulletinPDF(bulletin.getId());
        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 5000, "PDF deve ter conteúdo");

        Path outDir = Paths.get("build", "test-measurement");
        Files.createDirectories(outDir);
        Path pdfPath = outDir.resolve("boletim-medicao-teste.pdf");
        Files.write(pdfPath, pdfBytes);

        // Validação estrutural com iText
        try (PdfDocument pdfDoc = new PdfDocument(new PdfReader(new ByteArrayInputStream(pdfBytes)))) {
            var pageSize = pdfDoc.getFirstPage().getPageSize();

            // Orientação paisagem (A4 rotacionado = 842 x 595)
            assertEquals(PageSize.A4.rotate().getWidth(), pageSize.getWidth(), 0.5, "Largura A4 paisagem");
            assertEquals(PageSize.A4.rotate().getHeight(), pageSize.getHeight(), 0.5, "Altura A4 paisagem");
            assertTrue(pageSize.getWidth() > pageSize.getHeight(), "Página deve estar em paisagem");

            StringBuilder extracted = new StringBuilder();
            for (int i = 1; i <= pdfDoc.getNumberOfPages(); i++) {
                extracted.append(PdfTextExtractor.getTextFromPage(pdfDoc.getPage(i)));
            }
            // Colunas estreitas quebram linha no PDF ("KM\nConsid.");
            // normalizar espaços em branco para validação de conteúdo
            String text = extracted.toString().replaceAll("\\s+", " ");

            // Dump do texto extraído para inspeção
            Files.writeString(outDir.resolve("texto-extraido.txt"), text);

            // Cliente no cabeçalho do documento
            assertTrue(text.contains("Cliente: Cliente Teste Transportes LTDA"),
                    "Cliente deve aparecer no cabeçalho do PDF");
            assertTrue(text.contains("Empresa: Empresa Transportadora Teste"),
                    "Empresa deve aparecer no cabeçalho do PDF");
            assertTrue(text.contains("Nº Contrato: CT-2026-0001"),
                    "Nº Contrato deve aparecer no cabeçalho do PDF");
            assertTrue(text.contains("Período: 01/07/2026 a 31/07/2026"),
                    "Período deve aparecer no cabeçalho do PDF");

            // 15 colunas
            for (String header : EXPECTED_HEADERS) {
                assertTrue(text.contains(header), "Cabeçalho ausente no PDF: " + header);
            }

            // Novos campos com valores
            assertTrue(text.contains("933,33"), "Diária da locação deve aparecer");
            assertTrue(text.contains("700,00"), "KM considerado deve aparecer");
            assertTrue(text.contains("300,00"), "KM excedido deve aparecer");
            assertTrue(text.contains("R$ 1350,00"), "Valor KM exc deve aparecer");
            assertTrue(text.contains("ABC-1234"), "Placa do KM deve aparecer");
            assertTrue(text.contains("15/07/2026"), "Data da viagem extra deve aparecer");
            // Células de dados quebram linha no PDF; validar por tokens
            assertTrue(text.contains("Belo") && text.contains("Horizonte") && text.contains("Vitória"),
                    "Trajeto da viagem extra deve aparecer");
            assertTrue(text.contains("Micro") && text.contains("ônibus"),
                    "Tipo de veículo da viagem extra deve aparecer");
            assertTrue(text.contains("XYZ-9876"), "Placa da viagem extra deve aparecer");

            // Subtotal = 28000 + 1350 + 1700
            assertTrue(text.contains("R$ 31050,00"), "Subtotal deve aparecer: " + text);
        }
    }

    @Test
    void generatesExcelWithClientHeaderAnd15Columns() throws Exception {
        MeasurementBulletin bulletin = buildBulletin();
        MeasurementReportService service = buildService(bulletin);

        byte[] xlsxBytes = service.generateBulletinExcel(bulletin.getId());
        assertNotNull(xlsxBytes);
        assertTrue(xlsxBytes.length > 1000, "Excel deve ter conteúdo");

        Path outDir = Paths.get("build", "test-measurement");
        Files.createDirectories(outDir);
        Path xlsxPath = outDir.resolve("boletim-medicao-teste.xlsx");
        Files.write(xlsxPath, xlsxBytes);

        try (Workbook workbook = new XSSFWorkbook(new ByteArrayInputStream(xlsxBytes))) {
            Sheet sheet = workbook.getSheet("Boletim de Medição");
            assertNotNull(sheet, "Planilha 'Boletim de Medição' deve existir");

            // Localizar linha do cabeçalho da tabela
            Row headerRow = null;
            for (Row row : sheet) {
                if (row.getCell(0) != null && "Item".equals(row.getCell(0).getStringCellValue())) {
                    headerRow = row;
                    break;
                }
            }
            assertNotNull(headerRow, "Linha de cabeçalho da tabela não encontrada");
            for (int i = 0; i < EXPECTED_HEADERS.length; i++) {
                assertEquals(EXPECTED_HEADERS[i], headerRow.getCell(i).getStringCellValue(),
                        "Cabeçalho Excel coluna " + i);
            }

            // Localizar linha do Cliente
            boolean foundClient = false;
            for (Row row : sheet) {
                if (row.getCell(0) != null && "Cliente:".equals(row.getCell(0).getStringCellValue())) {
                    assertEquals("Cliente Teste Transportes LTDA", row.getCell(1).getStringCellValue());
                    foundClient = true;
                    break;
                }
            }
            assertTrue(foundClient, "Linha 'Cliente:' não encontrada no Excel");
        }
    }
}
