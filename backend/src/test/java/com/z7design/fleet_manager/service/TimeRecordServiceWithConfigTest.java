package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.repository.*;
import com.z7design.fleet_manager.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests for TimeRecordService.getIndicators() integration with WorkJourneyConfig.
 *
 * The getIndicators() method should use configured values from WorkJourneyConfig
 * (cargaHorariaDiaria, toleranciaAtrasoMin) instead of hardcoded defaults (8h, 10min).
 */
@ExtendWith(MockitoExtension.class)
class TimeRecordServiceWithConfigTest {

    @Mock
    private TimeRecordRepository timeRecordRepository;
    @Mock
    private QRCodeWorkPostRepository qrCodeWorkPostRepository;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private WorkPostRepository workPostRepository;
    @Mock
    private CompanyRepository companyRepository;
    @Mock
    private WorkJourneyConfigService workJourneyConfigService;

    @InjectMocks
    private TimeRecordService timeRecordService;

    private UUID companyId;
    private UUID employeeId;
    private Employee employee;
    private LocalDate startDate;
    private LocalDate endDate;
    private MockedStatic<TenantContext> tenantContextMock;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        employeeId = UUID.randomUUID();

        employee = new Employee();
        employee.setId(employeeId);
        employee.setName("João Teste");
        employee.setCompanyId(companyId);

        startDate = LocalDate.of(2026, 7, 20);
        endDate = LocalDate.of(2026, 7, 24);

        // Mock the static TenantContext.get() to return our companyId
        tenantContextMock = mockStatic(TenantContext.class);
        tenantContextMock.when(TenantContext::get).thenReturn(companyId);
    }

    @AfterEach
    void tearDown() {
        if (tenantContextMock != null) {
            tenantContextMock.close();
        }
    }

    /**
     * Helper: Create an ENTRADA time record.
     */
    private TimeRecord createEntrada(LocalDateTime recordedAt) {
        TimeRecord record = new TimeRecord();
        record.setId(UUID.randomUUID());
        record.setEmployee(employee);
        record.setRecordType(TimeRecord.RecordType.ENTRADA);
        record.setRecordedAt(recordedAt);
        record.setStatus(TimeRecord.RecordStatus.APPROVED);
        record.setCompanyId(companyId);
        return record;
    }

    /**
     * Helper: Create a SAIDA time record.
     */
    private TimeRecord createSaida(LocalDateTime recordedAt) {
        TimeRecord record = new TimeRecord();
        record.setId(UUID.randomUUID());
        record.setEmployee(employee);
        record.setRecordType(TimeRecord.RecordType.SAIDA);
        record.setRecordedAt(recordedAt);
        record.setStatus(TimeRecord.RecordStatus.APPROVED);
        record.setCompanyId(companyId);
        return record;
    }

    /**
     * Helper: Create a SAIDA_ALMOCO time record.
     */
    private TimeRecord createSaidaAlmoco(LocalDateTime recordedAt) {
        TimeRecord record = new TimeRecord();
        record.setId(UUID.randomUUID());
        record.setEmployee(employee);
        record.setRecordType(TimeRecord.RecordType.SAIDA_ALMOCO);
        record.setRecordedAt(recordedAt);
        record.setStatus(TimeRecord.RecordStatus.APPROVED);
        record.setCompanyId(companyId);
        return record;
    }

    /**
     * Helper: Create a RETORNO_ALMOCO time record.
     */
    private TimeRecord createRetornoAlmoco(LocalDateTime recordedAt) {
        TimeRecord record = new TimeRecord();
        record.setId(UUID.randomUUID());
        record.setEmployee(employee);
        record.setRecordType(TimeRecord.RecordType.RETORNO_ALMOCO);
        record.setRecordedAt(recordedAt);
        record.setStatus(TimeRecord.RecordStatus.APPROVED);
        record.setCompanyId(companyId);
        return record;
    }

    // ─────────────────────────────────────────────────────────────────
    // Test 1: Custom config → uses configured values
    // ─────────────────────────────────────────────────────────────────

    @Test
    void testGetIndicators_ShouldUseCustomConfig_WhenConfigExists() {
        // Arrange: Config with 7h workday and 5min lateness tolerance
        WorkJourneyConfig customConfig = WorkJourneyConfig.builder()
                .companyId(companyId)
                .cargaHorariaDiaria(new BigDecimal("7.00"))
                .toleranciaAtrasoMin(5)
                .build();

        when(workJourneyConfigService.findActiveByCompanyId(companyId))
                .thenReturn(customConfig);
        when(employeeRepository.count()).thenReturn(1L);

        // Employee works on 2026-07-21 (Tuesday):
        //   - ENTRADA 08:07 → 7min after hour → late (tolerance=5min, 7>5 ✓)
        //   - SAIDA 17:30 → worked 9h23min → overtime (9.38 > 7.0 ✓)
        // No lunch interval, so overtime = worked - 7.0 = 2.38h
        LocalDateTime entrada = LocalDateTime.of(2026, 7, 21, 8, 7, 0);
        LocalDateTime saida = LocalDateTime.of(2026, 7, 21, 17, 30, 0);

        TimeRecord recEntrada = createEntrada(entrada);
        TimeRecord recSaida = createSaida(saida);

        when(timeRecordRepository.findByRecordedAtBetweenOrderByRecordedAtDesc(
                any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(recSaida, recEntrada));

        // Act
        Map<String, Object> indicators = timeRecordService.getIndicators(startDate, endDate, null);

        // Assert
        assertNotNull(indicators);

        // Overtime: 09:30 - 08:07 = 1h23min → 1.38h worked, but 1.38 < 7.0
        // Wait, that doesn't make sense. Let me recalculate.
        // 08:07 to 17:30 = 9h23min = 9.38h
        // Overtime = max(0, 9.38 - 7.0) = 2.38h
        double expectedOvertime = 2.38; // 9.38 - 7.0
        assertEquals(expectedOvertime, (Double) indicators.get("totalOvertimeHours"), 0.1);

        // Lateness: arrived at 08:07, startHour=8, tolerance=5min → 7 > 5 → late ✓
        assertEquals(1, indicators.get("latenessCount"));

        // Absenteeism: 1 employee total, 1 with records → 0%
        assertEquals(0.0, (Double) indicators.get("absenteeismRate"), 0.01);

        verify(workJourneyConfigService).findActiveByCompanyId(companyId);
    }

    // ─────────────────────────────────────────────────────────────────
    // Test 2: No config → uses default values (8h, 10min)
    // ─────────────────────────────────────────────────────────────────

    @Test
    void testGetIndicators_ShouldUseDefaults_WhenNoConfig() {
        // Arrange: No config returned (null)
        when(workJourneyConfigService.findActiveByCompanyId(companyId))
                .thenReturn(null);
        when(employeeRepository.count()).thenReturn(1L);

        // Employee works on 2026-07-21:
        //   - ENTRADA 08:07 → 7min → NOT late (tolerance=10min, 7<10 ✓)
        //   - SAIDA 15:00 → worked 6h53min → NO overtime (6.88 < 8.0 ✓)
        LocalDateTime entrada = LocalDateTime.of(2026, 7, 21, 8, 7, 0);
        LocalDateTime saida = LocalDateTime.of(2026, 7, 21, 15, 0, 0);

        TimeRecord recEntrada = createEntrada(entrada);
        TimeRecord recSaida = createSaida(saida);

        when(timeRecordRepository.findByRecordedAtBetweenOrderByRecordedAtDesc(
                any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(recSaida, recEntrada));

        // Act
        Map<String, Object> indicators = timeRecordService.getIndicators(startDate, endDate, null);

        // Assert
        assertNotNull(indicators);

        // 08:07 to 15:00 = 6h53min = 6.88h → no overtime since 6.88 < 8.0
        assertEquals(0.0, (Double) indicators.get("totalOvertimeHours"), 0.01);

        // 08:07, tolerance=10min → 7 < 10 → NOT late
        assertEquals(0, indicators.get("latenessCount"));

        verify(workJourneyConfigService).findActiveByCompanyId(companyId);
    }

    // ─────────────────────────────────────────────────────────────────
    // Test 3: Config error → fallback to defaults (8h, 10min)
    // ─────────────────────────────────────────────────────────────────

    @Test
    void testGetIndicators_ShouldFallbackToDefaults_WhenConfigThrows() {
        // Arrange: Config service throws exception
        when(workJourneyConfigService.findActiveByCompanyId(companyId))
                .thenThrow(new RuntimeException("Database error"));
        when(employeeRepository.count()).thenReturn(1L);

        // Arriving at 08:07 with default tolerance=10min → NOT late
        // Working 08:07 to 15:07 = 7h → NO overtime (7.0 < 8.0)
        LocalDateTime entrada = LocalDateTime.of(2026, 7, 21, 8, 7, 0);
        LocalDateTime saida = LocalDateTime.of(2026, 7, 21, 15, 7, 0);

        TimeRecord recEntrada = createEntrada(entrada);
        TimeRecord recSaida = createSaida(saida);

        when(timeRecordRepository.findByRecordedAtBetweenOrderByRecordedAtDesc(
                any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(recSaida, recEntrada));

        // Act
        Map<String, Object> indicators = timeRecordService.getIndicators(startDate, endDate, null);

        // Assert
        assertNotNull(indicators);

        // Fallback defaults: 8h standard → 7h worked → no overtime
        assertEquals(0.0, (Double) indicators.get("totalOvertimeHours"), 0.01);

        // Fallback defaults: 10min tolerance → 7min → NOT late
        assertEquals(0, indicators.get("latenessCount"));

        verify(workJourneyConfigService).findActiveByCompanyId(companyId);
    }

    // ─────────────────────────────────────────────────────────────────
    // Test 4: Custom config with lunch interval
    // ─────────────────────────────────────────────────────────────────

    @Test
    void testGetIndicators_ShouldAccountForLunchInterval_WithCustomConfig() {
        // Arrange: Config with 6h workday (very short), 15min tolerance
        WorkJourneyConfig customConfig = WorkJourneyConfig.builder()
                .companyId(companyId)
                .cargaHorariaDiaria(new BigDecimal("6.00"))
                .toleranciaAtrasoMin(15)
                .build();

        when(workJourneyConfigService.findActiveByCompanyId(companyId))
                .thenReturn(customConfig);
        when(employeeRepository.count()).thenReturn(1L);

        // Day: 08:10 ENTRADA → 12:00 SAIDA_ALMOCO → 13:00 RETORNO_ALMOCO → 17:00 SAIDA
        // Arrival 08:10: 10min after hour → NOT late (tolerance=15min, 10<15)
        // Worked: 08:10→17:00 = 8h50min - 1h lunch = 7h50min = 7.83h
        // Overtime: 7.83 - 6.0 = 1.83h
        LocalDateTime entrada = LocalDateTime.of(2026, 7, 21, 8, 10, 0);
        LocalDateTime saidaAlmoco = LocalDateTime.of(2026, 7, 21, 12, 0, 0);
        LocalDateTime retornoAlmoco = LocalDateTime.of(2026, 7, 21, 13, 0, 0);
        LocalDateTime saida = LocalDateTime.of(2026, 7, 21, 17, 0, 0);

        TimeRecord recEntrada = createEntrada(entrada);
        TimeRecord recSaidaAlmoco = createSaidaAlmoco(saidaAlmoco);
        TimeRecord recRetornoAlmoco = createRetornoAlmoco(retornoAlmoco);
        TimeRecord recSaida = createSaida(saida);

        when(timeRecordRepository.findByRecordedAtBetweenOrderByRecordedAtDesc(
                any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(recSaida, recRetornoAlmoco, recSaidaAlmoco, recEntrada));

        // Act
        Map<String, Object> indicators = timeRecordService.getIndicators(startDate, endDate, null);

        // Assert
        assertNotNull(indicators);

        // Overtime: (17:00-08:10) - (13:00-12:00) - 6.0 = 8h50 - 1h - 6h = 1h50 = 1.83h
        assertEquals(1.83, (Double) indicators.get("totalOvertimeHours"), 0.1);

        // Not late (10min ≤ 15min tolerance)
        assertEquals(0, indicators.get("latenessCount"));

        verify(workJourneyConfigService).findActiveByCompanyId(companyId);
    }

    // ─────────────────────────────────────────────────────────────────
    // Test 5: Multiple employees with different arrival times
    // ─────────────────────────────────────────────────────────────────

    @Test
    void testGetIndicators_ShouldHandleMultipleEmployees_WithConfig() {
        // Arrange: Config with 8h workday, 5min tolerance
        WorkJourneyConfig customConfig = WorkJourneyConfig.builder()
                .companyId(companyId)
                .cargaHorariaDiaria(new BigDecimal("8.00"))
                .toleranciaAtrasoMin(5)
                .build();

        when(workJourneyConfigService.findActiveByCompanyId(companyId))
                .thenReturn(customConfig);
        when(employeeRepository.count()).thenReturn(2L);

        // Employee 2
        UUID employeeId2 = UUID.randomUUID();
        Employee employee2 = new Employee();
        employee2.setId(employeeId2);
        employee2.setName("Maria Teste");
        employee2.setCompanyId(companyId);

        // Employee 1: 08:03 → not late (3min < 5min tolerance)
        LocalDateTime entrada1 = LocalDateTime.of(2026, 7, 21, 8, 3, 0);
        LocalDateTime saida1 = LocalDateTime.of(2026, 7, 21, 17, 0, 0);

        TimeRecord r1ent = createEntrada(entrada1);
        r1ent.setEmployee(employee);
        TimeRecord r1sai = createSaida(saida1);
        r1sai.setEmployee(employee);

        // Employee 2: 08:07 → late (7min > 5min tolerance)
        LocalDateTime entrada2 = LocalDateTime.of(2026, 7, 21, 8, 7, 0);
        LocalDateTime saida2 = LocalDateTime.of(2026, 7, 21, 18, 0, 0);

        TimeRecord r2ent = createEntrada(entrada2);
        r2ent.setEmployee(employee2);
        TimeRecord r2sai = createSaida(saida2);
        r2sai.setEmployee(employee2);

        when(timeRecordRepository.findByRecordedAtBetweenOrderByRecordedAtDesc(
                any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(r2sai, r2ent, r1sai, r1ent));

        // Act
        Map<String, Object> indicators = timeRecordService.getIndicators(startDate, endDate, null);

        // Assert
        assertNotNull(indicators);

        // Overtime:
        //   Emp1: 17:00-08:03 = 8h57min - 8.0 = 0.95h
        //   Emp2: 18:00-08:07 = 9h53min - 8.0 = 1.88h
        //   Total = 2.83h
        assertEquals(2.83, (Double) indicators.get("totalOvertimeHours"), 0.1);

        // Lateness: only employee 2 is late
        assertEquals(1, indicators.get("latenessCount"));

        // Employees with lateness: 1
        assertEquals(1, indicators.get("employeesWithLateness"));

        // Employees with overtime: both
        assertEquals(2, indicators.get("employeesWithOvertime"));

        verify(workJourneyConfigService).findActiveByCompanyId(companyId);
    }
}
