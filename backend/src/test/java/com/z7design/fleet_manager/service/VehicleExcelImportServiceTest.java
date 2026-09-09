package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.ImportResultDto;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.model.Vehicle.VehicleType;
import com.z7design.fleet_manager.repository.VehicleRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.PlatformTransactionManager;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VehicleExcelImportServiceTest {

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private PlatformTransactionManager transactionManager;

    @InjectMocks
    private VehicleExcelImportService importService;

    @BeforeEach
    void setUp() {
        when(vehicleRepository.findAll()).thenReturn(Collections.emptyList());
    }

    @Test
    @DisplayName("Deve importar veículo com Chassi (17 chars), RENAVAM (9-11 dígitos) e Tipo mapeado corretamente")
    void testImportValidVehicle() throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Veículos");

        Row header = sheet.createRow(0);
        header.createCell(0).setCellValue("Placa");
        header.createCell(1).setCellValue("Chassi");
        header.createCell(2).setCellValue("RENAVAM");
        header.createCell(3).setCellValue("Modelo");
        header.createCell(4).setCellValue("Ano");
        header.createCell(5).setCellValue("Tipo de Veiculo");

        Row row = sheet.createRow(1);
        row.createCell(0).setCellValue("ABC1D23");
        row.createCell(1).setCellValue("9BWZZZ377VT004251"); // 17 chars
        row.createCell(2).setCellValue("12345678901"); // 11 digits
        row.createCell(3).setCellValue("Volvo FH 540");
        row.createCell(4).setCellValue("2023");
        row.createCell(5).setCellValue("Caminhão");

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        workbook.write(out);
        workbook.close();

        MockMultipartFile file = new MockMultipartFile("file", "veiculos.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", out.toByteArray());

        ImportResultDto result = importService.importVehiclesFromExcel(file);

        assertEquals(1, result.getInserted());
        verify(vehicleRepository, times(1)).saveAll(any());
    }

    @Test
    @DisplayName("Não deve aceitar Chassi de 17 caracteres ou RENAVAM de 9-11 dígitos no campo Placa")
    void testRejectChassisOrRenavamInPlateField() throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Veículos");

        Row header = sheet.createRow(0);
        header.createCell(0).setCellValue("Placa");
        header.createCell(1).setCellValue("Modelo");

        // Linha 1: Placa contendo chassi de 17 caracteres
        Row row1 = sheet.createRow(1);
        row1.createCell(0).setCellValue("9BWZZZ377VT004251");
        row1.createCell(1).setCellValue("Carro Inválido");

        // Linha 2: Placa contendo renavam de 11 dígitos
        Row row2 = sheet.createRow(2);
        row2.createCell(0).setCellValue("12345678901");
        row2.createCell(1).setCellValue("Outro Inválido");

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        workbook.write(out);
        workbook.close();

        MockMultipartFile file = new MockMultipartFile("file", "veiculos.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", out.toByteArray());

        ImportResultDto result = importService.importVehiclesFromExcel(file);

        assertEquals(0, result.getInserted());
        assertEquals(2, result.getSkipped());
    }
}
