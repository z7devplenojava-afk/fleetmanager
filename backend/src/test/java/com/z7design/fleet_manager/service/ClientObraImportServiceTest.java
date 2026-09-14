package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.ImportResultDto;
import com.z7design.fleet_manager.model.Client;
import com.z7design.fleet_manager.model.Contract;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.model.WorkPost;
import com.z7design.fleet_manager.repository.ClientRepository;
import com.z7design.fleet_manager.repository.ContractRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import com.z7design.fleet_manager.repository.WorkPostRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClientObraImportServiceTest {

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private WorkPostRepository workPostRepository;

    @Mock
    private PlatformTransactionManager transactionManager;

    @Mock
    private TransactionStatus transactionStatus;

    @InjectMocks
    private ClientObraImportService importService;

    @BeforeEach
    void setUp() {
        lenient().when(transactionManager.getTransaction(any())).thenReturn(transactionStatus);
        lenient().when(clientRepository.findAll()).thenReturn(Collections.emptyList());
        lenient().when(vehicleRepository.findAll()).thenReturn(Collections.emptyList());
        lenient().when(contractRepository.findAll()).thenReturn(Collections.emptyList());
        lenient().when(workPostRepository.findAll()).thenReturn(Collections.emptyList());
    }

    @Test
    @DisplayName("Deve extrair Nome do Cliente e Nome da Obra corretamente de strings com parênteses e hífens")
    void testParseClientAndObraName() {
        String[] res1 = ClientObraImportService.parseClientAndObraName("CONSTRUTORA BARBOSA MELLO S.A. (CONGONHAS-MG)");
        assertEquals("CONSTRUTORA BARBOSA MELLO S.A.", res1[0]);
        assertEquals("CONGONHAS-MG", res1[1]);

        String[] res2 = ClientObraImportService.parseClientAndObraName("ATERPA (ITABIRITO-MG)");
        assertEquals("ATERPA", res2[0]);
        assertEquals("ITABIRITO-MG", res2[1]);

        String[] res3 = ClientObraImportService.parseClientAndObraName("FM2C SERVIÇOS DE MANUTENÇÃO LTDA - (BETIM X RIBEIRÃO DAS NEVES)");
        assertEquals("FM2C SERVIÇOS DE MANUTENÇÃO LTDA", res3[0]);
        assertEquals("BETIM X RIBEIRÃO DAS NEVES", res3[1]);

        String[] res4 = ClientObraImportService.parseClientAndObraName("ALFA SERVIÇOS DE TRANSPORTE E LOCAÇÕES");
        assertEquals("ALFA SERVIÇOS DE TRANSPORTE E LOCAÇÕES", res4[0]);
        assertEquals("MATRIZ", res4[1]);
    }

    @Test
    @DisplayName("Deve importar planilha QUADRO DE OBRAS criando Clientes, Contratos com novos campos e Obras (WorkPosts)")
    void testImportFromExcel() throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("QUADRO DE OBRAS 2026");

        Row header = sheet.createRow(0);
        header.createCell(0).setCellValue("N°");
        header.createCell(1).setCellValue("CLIENTE/OBRA");
        header.createCell(2).setCellValue("QTD VEÍCULOS");
        header.createCell(3).setCellValue("DESCRIÇÃO");
        header.createCell(4).setCellValue("TIPO SERVIÇO");
        header.createCell(5).setCellValue("VALOR POR VEÍCULO");
        header.createCell(6).setCellValue("VALOR MENSAL");
        header.createCell(7).setCellValue("VIGENCIA");

        // Linha 1: Cliente Barbosa Mello (Congonhas)
        Row row1 = sheet.createRow(1);
        row1.createCell(0).setCellValue(1);
        row1.createCell(1).setCellValue("CONSTRUTORA BARBOSA MELLO S.A. (CONGONHAS-MG)");
        row1.createCell(2).setCellValue(2);
        row1.createCell(3).setCellValue("MICRO");
        row1.createCell(4).setCellValue("LOCAÇÃO");
        row1.createCell(5).setCellValue(30000);
        row1.createCell(6).setCellValue(60000);
        row1.createCell(7).setCellValue("31/03/2025 À 31/03/2026");

        // Linha 2: Mesmo cliente Barbosa Mello (Nova Lima)
        Row row2 = sheet.createRow(2);
        row2.createCell(0).setCellValue(2);
        row2.createCell(1).setCellValue("CONSTRUTORA BARBOSA MELLO S.A. (NOVA LIMA-MG)");
        row2.createCell(2).setCellValue(1);
        row2.createCell(3).setCellValue("ONIBUS RODOVIARIO");
        row2.createCell(4).setCellValue("FRETAMENTO");
        row2.createCell(5).setCellValue(24000);
        row2.createCell(6).setCellValue(24000);
        row2.createCell(7).setCellValue("26/03/2025 À 31/05/2027 - ADITIVO REALIZADO 13/06/2027");

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        workbook.write(out);
        workbook.close();

        MockMultipartFile file = new MockMultipartFile("file", "QUADRO_DE_OBRAS.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", out.toByteArray());

        ImportResultDto result = importService.importFromExcel(file);

        assertNotNull(result);
        assertTrue(result.getErrors().isEmpty(), "Importação não deve conter erros: " + result.getErrors());

        // Verificar Clientes criados (deve criar APENAS 1 Cliente único para Barbosa Mello)
        ArgumentCaptor<List<Client>> clientsCaptor = ArgumentCaptor.forClass(List.class);
        verify(clientRepository, atLeastOnce()).saveAll(clientsCaptor.capture());
        List<Client> savedClients = clientsCaptor.getValue();
        assertEquals(1, savedClients.size());
        assertEquals("CONSTRUTORA BARBOSA MELLO S.A.", savedClients.get(0).getName());

        // Verificar Contratos criados (deve criar 2 Contratos, um para cada Obra)
        ArgumentCaptor<List<Contract>> contractsCaptor = ArgumentCaptor.forClass(List.class);
        verify(contractRepository, atLeastOnce()).saveAll(contractsCaptor.capture());
        List<Contract> savedContracts = contractsCaptor.getValue();
        assertEquals(2, savedContracts.size());

        Contract c1 = savedContracts.get(0);
        assertEquals("CONGONHAS-MG", c1.getObraName());
        assertEquals(2, c1.getVehicleQuantity());
        assertEquals("LOCAÇÃO", c1.getServiceType());
        assertEquals("MICRO", c1.getVehicleDescription());

        Contract c2 = savedContracts.get(1);
        assertEquals("NOVA LIMA-MG", c2.getObraName());
        assertEquals(1, c2.getVehicleQuantity());
        assertEquals("26/03/2025 À 31/05/2027 - ADITIVO REALIZADO 13/06/2027", c2.getVigenciaText());

        // Verificar Obras (WorkPosts) criadas (deve criar 2 WorkPosts)
        ArgumentCaptor<List<WorkPost>> workPostsCaptor = ArgumentCaptor.forClass(List.class);
        verify(workPostRepository, atLeastOnce()).saveAll(workPostsCaptor.capture());
        List<WorkPost> savedWorkPosts = workPostsCaptor.getValue();
        assertEquals(2, savedWorkPosts.size());
        assertEquals("CONGONHAS-MG", savedWorkPosts.get(0).getName());
        assertEquals("NOVA LIMA-MG", savedWorkPosts.get(1).getName());

        // Verificar Veículos alocados (2 para Congonhas + 1 para Nova Lima = 3 Veículos)
        ArgumentCaptor<List<Vehicle>> vehiclesCaptor = ArgumentCaptor.forClass(List.class);
        verify(vehicleRepository, atLeastOnce()).saveAll(vehiclesCaptor.capture());
        List<Vehicle> savedVehicles = vehiclesCaptor.getValue();
        assertEquals(3, savedVehicles.size());
    }
}
