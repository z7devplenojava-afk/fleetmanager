package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.EmployeeDTO;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeExcelImportTest {

    @Mock
    private EmployeeService employeeService;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private EmployeeExcelImportService employeeExcelImportService;

    @Test
    @DisplayName("Deve importar funcionário com dados de benefícios e descontos via planilha Excel")
    void shouldImportEmployeeWithPayrollBenefitsFromExcel() throws IOException {
        // Arrange
        UUID companyId = UUID.randomUUID();
        Company company = new Company();
        company.setId(companyId);
        company.setName("Viação São Silvestre");
        company.setCnpj("71.055.644/0006-30");

        when(companyRepository.findByNormalizedCnpj("71055644000630"))
                .thenReturn(Collections.singletonList(company));

        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Funcionários");

        // Header row
        Row header = sheet.createRow(0);
        header.createCell(0).setCellValue("CNPJ Empresa");
        header.createCell(1).setCellValue("Nome Completo");
        header.createCell(2).setCellValue("CPF");
        header.createCell(3).setCellValue("Plano de Saude");
        header.createCell(4).setCellValue("Desconto de Multas");
        header.createCell(5).setCellValue("Horas Extras 50");

        // Data row
        Row data = sheet.createRow(1);
        data.createCell(0).setCellValue("71.055.644/0006-30");
        data.createCell(1).setCellValue("Carlos Eduardo Silva");
        data.createCell(2).setCellValue("123.456.789-00");
        data.createCell(3).setCellValue("250.50");
        data.createCell(4).setCellValue("100.00");
        data.createCell(5).setCellValue("45.00");

        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        workbook.write(bos);
        workbook.close();

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "folha_funcionarios.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                bos.toByteArray()
        );

        when(employeeRepository.findByCpfAndCompanyId(eq("12345678900"), eq(companyId)))
                .thenReturn(Optional.empty());
        when(employeeRepository.findByCpf(eq("12345678900")))
                .thenReturn(Optional.empty());
        when(employeeRepository.findByNameExactAndCompanyId(eq("Carlos Eduardo Silva"), eq(companyId)))
                .thenReturn(Optional.empty());

        // Act
        EmployeeExcelImportService.ImportResult result = employeeExcelImportService.importEmployees(file);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getCreated());
        assertEquals(0, result.getErrors().size());

        ArgumentCaptor<EmployeeDTO> dtoCaptor = ArgumentCaptor.forClass(EmployeeDTO.class);
        verify(employeeService).create(dtoCaptor.capture());

        EmployeeDTO capturedDto = dtoCaptor.getValue();
        assertEquals("Carlos Eduardo Silva", capturedDto.getName());
        assertEquals("12345678900", capturedDto.getCpf());
        assertEquals(new BigDecimal("250.50"), capturedDto.getMensalidadePlanoSaude());
        assertEquals(new BigDecimal("100.00"), capturedDto.getDescontoMultas());
        assertEquals(new BigDecimal("45.00"), capturedDto.getHorasExtras50());
    }
}
