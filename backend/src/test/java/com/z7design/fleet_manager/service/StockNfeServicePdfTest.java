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
}
