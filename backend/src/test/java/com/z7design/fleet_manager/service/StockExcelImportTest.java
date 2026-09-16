package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.ImportResultDto;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.StockItem;
import com.z7design.fleet_manager.model.enums.StockCategory;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.StockAlertRepository;
import com.z7design.fleet_manager.repository.StockItemRepository;
import com.z7design.fleet_manager.repository.StockMovementRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.repository.UnitRepository;
import com.z7design.fleet_manager.tenant.TenantContext;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StockExcelImportTest {

    @Mock
    private StockItemRepository stockItemRepository;

    @Mock
    private StockMovementRepository stockMovementRepository;

    @Mock
    private StockAlertRepository stockAlertRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UnitRepository unitRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private UserCompanyResolver userCompanyResolver;

    @InjectMocks
    private StockService stockService;

    private UUID companySaoSilvestreId;
    private UUID companyPaiEternoId;
    private Company companySaoSilvestre;
    private Company companyPaiEterno;

    @BeforeEach
    void setUp() {
        companySaoSilvestreId = UUID.randomUUID();
        companyPaiEternoId = UUID.randomUUID();

        companySaoSilvestre = new Company();
        companySaoSilvestre.setId(companySaoSilvestreId);
        companySaoSilvestre.setName("Viação São Silvestre");
        companySaoSilvestre.setCnpj("33.123.456/0001-00");

        companyPaiEterno = new Company();
        companyPaiEterno.setId(companyPaiEternoId);
        companyPaiEterno.setName("Pai Eterno Turismo");
        companyPaiEterno.setCnpj("44.987.654/0001-99");
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private byte[] createTestWorkbookBytes(String[][] rows) throws IOException {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Estoque");
            for (int r = 0; r < rows.length; r++) {
                Row row = sheet.createRow(r);
                for (int c = 0; c < rows[r].length; c++) {
                    row.createCell(c).setCellValue(rows[r][c]);
                }
            }
            workbook.write(bos);
            return bos.toByteArray();
        }
    }

    @Test
    @DisplayName("Deve importar com sucesso quando o CNPJ pertence à empresa do usuário logado")
    void shouldImportSuccessfullyWhenCnpjMatchesTenant() throws IOException {
        TenantContext.set(companySaoSilvestreId);

        when(companyRepository.findByNormalizedCnpj("33123456000100"))
                .thenReturn(List.of(companySaoSilvestre));

        when(stockItemRepository.findByCompanyIdAndCode(eq(companySaoSilvestreId), eq("CAMISA-M")))
                .thenReturn(Optional.empty());

        StockItem existingItem = new StockItem();
        existingItem.setId(UUID.randomUUID());
        existingItem.setCode("BOTA-40");
        existingItem.setCompanyId(companySaoSilvestreId);
        existingItem.setCurrentQuantity(5);

        when(stockItemRepository.findByCompanyIdAndCode(eq(companySaoSilvestreId), eq("BOTA-40")))
                .thenReturn(Optional.of(existingItem));

        String[][] data = {
                {"CNPJ", "Produto", "Código", "Estoque", "Vr.Compra", "Total Médio"},
                {"33.123.456/0001-00", "Camisa Polo Manga Curta M", "CAMISA-M", "50", "45.90", "42.50"},
                {"33.123.456/0001-00", "Bota de Segurança Tam 40", "BOTA-40", "20", "120.00", "115.00"}
        };

        byte[] bytes = createTestWorkbookBytes(data);
        MockMultipartFile file = new MockMultipartFile("file", "estoque.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", bytes);

        ImportResultDto result = stockService.importExcel(file);

        assertEquals(2, result.getTotalRows());
        assertEquals(1, result.getInserted());
        assertEquals(1, result.getUpdated());
        assertEquals(0, result.getSkipped());
        assertTrue(result.getErrors().isEmpty());

        assertEquals(20, existingItem.getCurrentQuantity());
        assertEquals(new BigDecimal("120.00"), existingItem.getUnitCost());
        assertEquals(new BigDecimal("115.00"), existingItem.getAverageCost());

        ArgumentCaptor<StockItem> captor = ArgumentCaptor.forClass(StockItem.class);
        verify(stockItemRepository, times(2)).save(captor.capture());

        StockItem insertedItem = captor.getAllValues().get(0);
        assertEquals("CAMISA-M", insertedItem.getCode());
        assertEquals("Camisa Polo Manga Curta M", insertedItem.getName());
        assertEquals(50, insertedItem.getCurrentQuantity());
        assertEquals(companySaoSilvestreId, insertedItem.getCompanyId());
        assertEquals(StockCategory.ACESSORIOS, insertedItem.getCategory());
    }

    @Test
    @DisplayName("Deve bloquear importação quando CNPJ pertence a outra empresa (violação multiempresa)")
    void shouldBlockImportWhenCnpjBelongsToAnotherCompany() throws IOException {
        TenantContext.set(companySaoSilvestreId);

        when(companyRepository.findByNormalizedCnpj("44987654000199"))
                .thenReturn(List.of(companyPaiEterno));

        String[][] data = {
                {"CNPJ", "Produto", "Código", "Estoque", "Vr.Compra", "Total Médio"},
                {"44.987.654/0001-99", "Extintor ABC 4kg", "EXT-ABC", "10", "80.00", "75.00"}
        };

        byte[] bytes = createTestWorkbookBytes(data);
        MockMultipartFile file = new MockMultipartFile("file", "estoque_paieterno.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", bytes);

        ImportResultDto result = stockService.importExcel(file);

        assertEquals(1, result.getTotalRows());
        assertEquals(0, result.getInserted());
        assertEquals(0, result.getUpdated());
        assertEquals(1, result.getSkipped());
        assertFalse(result.getErrors().isEmpty());
        assertTrue(result.getErrors().get(0).contains("Violação multiempresa"));

        verify(stockItemRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve reportar erro quando CNPJ não for encontrado no sistema")
    void shouldReportErrorWhenCnpjNotFound() throws IOException {
        TenantContext.set(companySaoSilvestreId);

        when(companyRepository.findByNormalizedCnpj("00000000000000"))
                .thenReturn(Collections.emptyList());
        when(companyRepository.findByCnpj("00.000.000/0000-00"))
                .thenReturn(Optional.empty());

        String[][] data = {
                {"CNPJ", "Produto", "Código", "Estoque", "Vr.Compra", "Total Médio"},
                {"00.000.000/0000-00", "Item Desconhecido", "ITEM-999", "5", "10.00", "10.00"}
        };

        byte[] bytes = createTestWorkbookBytes(data);
        MockMultipartFile file = new MockMultipartFile("file", "estoque.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", bytes);

        ImportResultDto result = stockService.importExcel(file);

        assertEquals(1, result.getTotalRows());
        assertEquals(0, result.getInserted());
        assertEquals(1, result.getSkipped());
        assertTrue(result.getErrors().get(0).contains("não encontrada no sistema"));

        verify(stockItemRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve importar com sucesso relatório de Almoxarifado ERP com títulos e formatação brasileira")
    void shouldImportAlmoxarifadoReportWithHeadersAndPtBrNumbers() throws IOException {
        TenantContext.set(companySaoSilvestreId);

        when(stockItemRepository.findByCompanyIdAndCode(eq(companySaoSilvestreId), eq("00142")))
                .thenReturn(Optional.empty());
        when(stockItemRepository.findByCompanyIdAndCode(eq(companySaoSilvestreId), eq("00143")))
                .thenReturn(Optional.empty());

        String[][] data = {
                {"EMPRESA: VIAÇÃO SÃO SILVESTRE LTDA", "", "", "", "", ""},
                {"RELATÓRIO DE ESTOQUE - ALMOXARIFADO CENTRAL", "", "", "", "", ""},
                {"EMISSÃO: 16/09/2026", "", "", "", "", ""},
                {"Cód. Prod.", "Descrição do Material", "Grupo", "Saldo Atual", "Valor Unitário", "Valor Total"},
                {"00142", "Luva de Proteção Pigmentada", "EPI / Segurança", "150 UN", "R$ 4,50", "R$ 675,00"},
                {"00143", "Bota de Segurança Nobuck Tam 41", "Calçados", "1.200", "125,90", "151.080,00"},
                {"TOTAL DO GRUPO:", "", "", "1.350", "", "151.755,00"},
                {"TOTAL GERAL:", "", "", "1.350", "", "151.755,00"}
        };

        byte[] bytes = createTestWorkbookBytes(data);
        MockMultipartFile file = new MockMultipartFile("file", "Relatorio Estoque Almoxarifado.xls",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", bytes);

        ImportResultDto result = stockService.importExcel(file);

        assertEquals(2, result.getTotalRows());
        assertEquals(2, result.getInserted());
        assertEquals(0, result.getSkipped());
        assertTrue(result.getErrors().isEmpty());

        ArgumentCaptor<StockItem> captor = ArgumentCaptor.forClass(StockItem.class);
        verify(stockItemRepository, times(2)).save(captor.capture());

        StockItem item1 = captor.getAllValues().get(0);
        assertEquals("00142", item1.getCode());
        assertEquals("Luva de Proteção Pigmentada", item1.getName());
        assertEquals(150, item1.getCurrentQuantity());
        assertEquals(new BigDecimal("4.50"), item1.getUnitCost());
        assertEquals(new BigDecimal("675.00"), item1.getAverageCost());
        assertEquals(StockCategory.EPI, item1.getCategory());

        StockItem item2 = captor.getAllValues().get(1);
        assertEquals("00143", item2.getCode());
        assertEquals("Bota de Segurança Nobuck Tam 41", item2.getName());
        assertEquals(1200, item2.getCurrentQuantity());
        assertEquals(new BigDecimal("125.90"), item2.getUnitCost());
        assertEquals(new BigDecimal("151080.00"), item2.getAverageCost());
        assertEquals(StockCategory.CALCADOS, item2.getCategory());
    }
}
