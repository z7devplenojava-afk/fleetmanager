package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TimeSheetPdfLogoTest {

    @Mock private TimeRecordService timeRecordService;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private ExcelReportLayoutService excelReportLayoutService;
    @Mock private StoredUploadService storedUploadService;
    @InjectMocks private TimeSheetService service;

    @Test
    void espelhoDePontoContemLogoDaEmpresa() {
        UUID employeeId = UUID.randomUUID();

        Company company = new Company();
        company.setId(UUID.randomUUID());
        company.setName("WEG AGÊNCIA DE VIAGENS E TURISMO LTDA");
        company.setLogoUrl("/api/uploads/companies/logos/13bac661-10d0-4d48-8ecf-a07068f8d14e.webp");
        company.setIconUrl("/api/uploads/companies/logos/e89cf85b-a2f6-44c3-be0d-e6cf169eb149.jpg");

        Employee employee = new Employee();
        employee.setId(employeeId);
        employee.setName("WESLEY CRISTIANO FERREIRA DE OLIVEIRA");
        employee.setCompany(company);

        when(timeRecordService.resolveEmployee(employeeId)).thenReturn(employee);
        when(timeRecordService.getRecordsByPeriod(any(), any(), any())).thenReturn(List.of());
        // logoUrl é WebP (ilegível pelo iText) -> deve cair para o ícone JPG da empresa
        when(storedUploadService.loadBytes(org.mockito.ArgumentMatchers.eq("companies/icons"), anyString(), any(java.nio.file.Path[].class)))
                .thenAnswer(inv -> Files.readAllBytes(Paths.get("uploads", "companies", "logos", "e89cf85b-a2f6-44c3-be0d-e6cf169eb149.jpg")));

        byte[] pdf = service.generateMonthlyTimeSheetPdf(employeeId, 2026, 11);

        assertNotNull(pdf);
        assertTrue(pdf.length > 1000);
        String content = new String(pdf, StandardCharsets.ISO_8859_1);
        assertTrue(content.contains("/Subtype /Image") || content.contains("/Subtype/Image"),
                "O espelho de ponto deve conter a logomarca da empresa");
    }
}
