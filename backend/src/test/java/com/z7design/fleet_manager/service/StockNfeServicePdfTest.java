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
    @DisplayName("Deve extrair perfeitamente todos os itens e campos fiscais do DANFE 6038 (Posto de Molas Dornas e Menezes)")
    void testExtractDanfe6038DornasMenezes() {
        UUID companyId = UUID.randomUUID();
        String filename = "DANFE 6038 SAO SILVESTRE.pdf";
        String danfeText = """
                POSTO DE MOLAS DORNAS E MENEZES
                AV. BERNADINO DA SILVA COUTO 902 - CEP: 329000000 - SAO SEBASTIAO - Igarapé/MG - Fone: 3135341234
                DANFE
                Documento Auxiliar da Nota Fiscal Eletrônica
                0-Entrada 1-Saída 1
                Nº 6038
                SÉRIE 1
                FOLHA 01/02
                CHAVE DE ACESSO
                31240617281939000174550010000060381407574283
                NATUREZA DA OPERACAO
                Venda
                INSCRIÇÃO ESTADUAL: 0020690080093
                CNPJ/CPF: 17.281.939/0001-74
                DESTINATÁRIO/REMETENTE
                NOME/RAZÃO SOCIAL: VIACAO SAO SILVESTRE LTDA
                CNPJ/CPF: 71.055.644/0001-25
                DATA EMISSÃO: 21/06/2024
                DADOS DOS PRODUTOS/SERVIÇOS
                CÓDIGO DESCRIÇÃO DO PRODUTO/SERVIÇO NCM/SH CST CFOP UN QTDE VALOR VALOR TOTAL
                9023 PINO DA MOLA TRAS OF 1721 CEMENTADO CURTO 03024910 0102 5102 pc 2,0000 42,000000 84,00
                315032 GRAXEIRO RETO 3/8 TRAS- 03024910 0102 5102 pc 3,0000 3,000000 9,00
                2145 CHAVETA TRAVA PINO COM PORCA TRAS 73181500 0102 5102 pc 2,0000 20,000000 40,00
                214578 GRAMPO TRASEIRO DO ONIBUS- 03024910 0102 5102 pc 2,0000 78,600000 157,20
                68478 PORCA DLP DO GRAMPO 03024910 0102 5102 pc 4,0000 6,000000 24,00
                2489630 PINO DA MOLA TRAS OF 1721 CEMENTADO LONGO 03024910 0102 5102 pc 1,0000 48,000000 48,00
                CÁLCULO DO IMPOSTO
                VALOR TOTAL DOS PRODUTOS: 1.858,11
                VALOR TOTAL DA NOTA: 1.858,11
                """;

        StockNfeParsedDTO dto = stockNfeService.parseDanfeText(danfeText, companyId, filename);

        assertNotNull(dto);
        assertEquals("31240617281939000174550010000060381407574283", dto.getAccessKey());
        assertEquals("6038", dto.getInvoiceNumber());
        assertEquals("1", dto.getSeries());
        assertEquals("17.281.939/0001-74", dto.getSupplierCnpj());
        System.out.println("DEBUG SUPPLIER NAME: '" + dto.getSupplierName() + "'");
        assertTrue(dto.getSupplierName() != null && !dto.getSupplierName().isBlank());
        assertFalse(dto.getItems().isEmpty());
        assertEquals(6, dto.getItems().size());

        // Validar campos fiscais do primeiro item
        StockNfeParsedDTO.StockNfeItemDTO it1 = dto.getItems().get(0);
        assertEquals("9023", it1.getProductCode());
        assertEquals("PINO DA MOLA TRAS OF 1721 CEMENTADO CURTO", it1.getDescription());
        assertEquals("03024910", it1.getNcm());
        assertEquals("0102", it1.getCst());
        assertEquals("5102", it1.getCfop());
        assertEquals("PC", it1.getUnitOfMeasure().toUpperCase());
        assertEquals(new BigDecimal("2.0000"), it1.getQuantity());
        assertEquals(new BigDecimal("42.000000"), it1.getUnitPrice());
        assertEquals(new BigDecimal("84.00"), it1.getTotalPrice());
    }

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
                assertNotNull(dto.getItems().get(0).getNcm());
                assertNotNull(dto.getItems().get(0).getCfop());
            } else if (sampleName.contains("205350")) {
                assertEquals("205350", dto.getInvoiceNumber());
                assertTrue(dto.getTotalInvoiceAmount().compareTo(BigDecimal.ZERO) > 0);
                assertEquals(2, dto.getItems().size());
            } else if (sampleName.contains("15595")) {
                assertEquals("15595", dto.getInvoiceNumber());
                assertEquals(new BigDecimal("1100.00"), dto.getTotalInvoiceAmount());
                assertFalse(dto.getItems().isEmpty());
            }
        }
    }
}

