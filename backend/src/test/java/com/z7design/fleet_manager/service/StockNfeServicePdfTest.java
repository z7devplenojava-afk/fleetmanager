package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.StockNfeParsedDTO;
import com.z7design.fleet_manager.model.Supplier;
import com.z7design.fleet_manager.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StockNfeServicePdfTest {

    @Mock
    private StockItemRepository stockItemRepository;

    @Mock
    private StockMovementRepository stockMovementRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private UnitRepository unitRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private StockService stockService;

    @Mock
    private UserCompanyResolver userCompanyResolver;

    @Mock
    private TesseractService tesseractService;

    @InjectMocks
    private StockNfeService stockNfeService;

    @Test
    @DisplayName("Deve extrair chave de 44 dígitos, número, série e CNPJ do nome do arquivo DANFE PDF")
    void testExtractDataFromFilenameAndDanfe() {
        UUID companyId = UUID.randomUUID();
        String filename = "31260900754526000167550010009531261010154590-nfe.pdf";
        String sampleDanfeText = """
                DANFE
                DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔNICA
                AUTO PECAS MINAS LTDA
                RUA DOS MECANICOS, 120 - CENTRO - BELO HORIZONTE/MG
                CNPJ / CPF: 00.754.526/0001-67
                INSC. ESTADUAL: 00123456789
                CHAVE DE ACESSO
                3126 0900 7545 2600 0167 5500 1000 9531 2610 1015 4590
                DESTINATARIO / REMETENTE
                NOME / RAZAO SOCIAL: TRANSPORTADORA FLUXBUS LTDA
                CNPJ / CPF: 12.345.678/0001-90
                DATA DE EMISSAO: 30/09/2026
                DADOS DO PRODUTO / SERVICO
                CODIGO DESCRICAO DO PRODUTO NCM/SH CST CFOP UN QTD VLR.UNIT VLR.TOTAL
                001 FILTRO DE OLEO MOTOR DIESEL 84212300 000 5102 UN 1 222,10 222,10
                DADOS ADICIONAIS
                INFORMACOES COMPLEMENTARES
                VALOR TOTAL DA NOTA: 222,10
                """;

        StockNfeParsedDTO dto = stockNfeService.parseDanfeText(sampleDanfeText, companyId, filename);

        assertNotNull(dto);
        assertEquals("31260900754526000167550010009531261010154590", dto.getAccessKey());
        assertEquals("953126", dto.getInvoiceNumber());
        assertEquals("1", dto.getSeries());
        assertEquals("00.754.526/0001-67", dto.getSupplierCnpj());
        assertEquals("AUTO PECAS MINAS LTDA", dto.getSupplierName());
        assertEquals(new BigDecimal("222.10"), dto.getTotalInvoiceAmount());

        assertFalse(dto.getItems().isEmpty());
        StockNfeParsedDTO.StockNfeItemDTO item = dto.getItems().get(0);
        assertEquals("84212300", item.getNcm());
        assertEquals("5102", item.getCfop());
        assertEquals("UN", item.getUnitOfMeasure());
        assertTrue(item.getDescription().contains("FILTRO DE OLEO"));
        assertEquals(new BigDecimal("222.10"), item.getTotalPrice());
    }

    @Test
    @DisplayName("Deve extrair dados com recuperação heurística profunda e vincular dados de fornecedor pré-existente")
    void testExtractDataWithExistingSupplierAndFallbackHeuristics() {
        UUID companyId = UUID.randomUUID();
        String filename = "31260900754526000167550010009531261010154590.pdf";

        Supplier existingSupplier = new Supplier();
        existingSupplier.setId(UUID.randomUUID());
        existingSupplier.setName("FORNECEDOR OFICIAL DE BATERIAS LTDA");
        existingSupplier.setCnpj("00.754.526/0001-67");
        existingSupplier.setCity("Belo Horizonte");
        existingSupplier.setState("MG");

        when(supplierRepository.findByCleanCnpjNativeScoped(eq("00754526000167"), eq(companyId)))
                .thenReturn(Optional.of(existingSupplier));

        String minimalDanfeText = """
                DANFE
                NOTA FISCAL ELETRONICA
                DESTINATARIO: EMPRESA TESTE LTDA
                DADOS DO PRODUTO
                BATERIA HELIAR 150AH FROTA PESADA
                85071010 5102 UN 1,00 222,10 222,10
                VALOR TOTAL DA NOTA R$ 222,10
                """;

        StockNfeParsedDTO dto = stockNfeService.parseDanfeText(minimalDanfeText, companyId, filename);

        assertNotNull(dto);
        assertEquals("31260900754526000167550010009531261010154590", dto.getAccessKey());
        assertEquals("953126", dto.getInvoiceNumber());
        assertEquals("00.754.526/0001-67", dto.getSupplierCnpj());
        assertEquals("FORNECEDOR OFICIAL DE BATERIAS LTDA", dto.getSupplierName());

        assertFalse(dto.getItems().isEmpty());
        StockNfeParsedDTO.StockNfeItemDTO item = dto.getItems().get(0);
        assertEquals("85071010", item.getNcm());
        assertEquals("5102", item.getCfop());
        assertTrue(item.isBattery());
        assertEquals(new BigDecimal("222.10"), item.getTotalPrice());
    }

    private org.springframework.web.multipart.MultipartFile createMockMultipart(String filename, byte[] content) {
        return new org.springframework.web.multipart.MultipartFile() {
            @Override public String getName() { return filename; }
            @Override public String getOriginalFilename() { return filename; }
            @Override public String getContentType() { return "application/pdf"; }
            @Override public boolean isEmpty() { return content == null || content.length == 0; }
            @Override public long getSize() { return content != null ? content.length : 0; }
            @Override public byte[] getBytes() { return content; }
            @Override public java.io.InputStream getInputStream() { return new java.io.ByteArrayInputStream(content); }
            @Override public void transferTo(java.io.File dest) throws java.io.IOException { java.nio.file.Files.write(dest.toPath(), content); }
        };
    }

    @Test
    @DisplayName("Inspeciona extração dos PDFs reais de Almoxarifado")
    void testInspectRealPdf() throws Exception {
        String[] sampleFiles = {
            "31260900754526000167550010009531261010154590-nfe.pdf",
            "31260900452917000127550010002053501172831839-nfe.pdf",
            "DANFE  6038  SO SILVESTRE.pdf",
            "15595 SAO SILVESTRE.pdf"
        };

        for (String sampleName : sampleFiles) {
            java.io.File file = new java.io.File("E:\\VSS Sistema\\Almoxarifado\\" + sampleName);
            if (!file.exists()) {
                System.out.println("Arquivo nao encontrado: " + sampleName);
                continue;
            }
            System.out.println("==================================================");
            System.out.println("TESTANDO ARQUIVO: " + sampleName);

            byte[] fileBytes = java.nio.file.Files.readAllBytes(file.toPath());
            org.springframework.web.multipart.MultipartFile mf = createMockMultipart(sampleName, fileBytes);
            UUID companyId = UUID.randomUUID();

            StockNfeParsedDTO dto = stockNfeService.parsePdf(mf, companyId);
            assertNotNull(dto);
            System.out.println("DTO PARSE_PDF: Fornecedor=" + dto.getSupplierName() + " (CNPJ=" + dto.getSupplierCnpj() + "), NF=" + dto.getInvoiceNumber() + ", Itens=" + dto.getItems().size() + ", Total=" + dto.getTotalInvoiceAmount());
            for (var it : dto.getItems()) {
                System.out.println("   ITEM: cod=" + it.getProductCode() + ", desc=" + it.getDescription() + ", ncm=" + it.getNcm() + ", cfop=" + it.getCfop() + ", un=" + it.getUnitOfMeasure() + ", qty=" + it.getQuantity() + ", unitPrice=" + it.getUnitPrice() + ", total=" + it.getTotalPrice());
            }

            if (sampleName.contains("953126")) {
                assertEquals("953126", dto.getInvoiceNumber());
                assertEquals(new BigDecimal("222.10"), dto.getTotalInvoiceAmount());
                assertFalse(dto.getItems().isEmpty());
                assertEquals("87083090", dto.getItems().get(0).getNcm());
                assertEquals("5403", dto.getItems().get(0).getCfop());
            } else if (sampleName.contains("205350")) {
                assertEquals("205350", dto.getInvoiceNumber());
                assertTrue(dto.getTotalInvoiceAmount().compareTo(BigDecimal.ZERO) > 0);
                assertEquals(2, dto.getItems().size());
            } else if (sampleName.contains("15595")) {
                assertEquals("15595", dto.getInvoiceNumber());
                assertEquals(new BigDecimal("1100.00"), dto.getTotalInvoiceAmount());
                assertEquals(1, dto.getItems().size());
            }
        }
    }
}

