package com.z7design.secured_guard.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDateTime;
import java.util.UUID;

class PayrollTest {

    private Payroll payroll;
    private Employee employee;
    private Unit unit;

    @BeforeEach
    void setUp() {
        employee = new Employee();
        employee.setId(UUID.randomUUID());
        employee.setName("Test Employee");

        unit = Unit.builder()
                .id(UUID.randomUUID())
                .name("Test Unit")
                .build();

        payroll = Payroll.builder()
                .id(UUID.randomUUID())
                .employee(employee)
                .unit(unit)
                .referenceMonth("2024-03")
                .baseSalary(5000.0)
                .grossSalary(6000.0)
                .netSalary(4500.0)
                .overtimeHours(10.0)
                .overtimeValue(500.0)
                .benefitsValue(1000.0)
                .deductionsValue(1500.0)
                .documentUrl("http://example.com/payroll.pdf")
                .build();
    }

    @Test
    void whenCreatePayroll_thenPayrollIsCreated() {
        assertNotNull(payroll);
        assertEquals(employee, payroll.getEmployee());
        assertEquals(unit, payroll.getUnit());
        assertEquals("2024-03", payroll.getReferenceMonth());
        assertEquals(5000.0, payroll.getBaseSalary());
        assertEquals(6000.0, payroll.getGrossSalary());
        assertEquals(4500.0, payroll.getNetSalary());
        assertEquals(10.0, payroll.getOvertimeHours());
        assertEquals(500.0, payroll.getOvertimeValue());
        assertEquals(1000.0, payroll.getBenefitsValue());
        assertEquals(1500.0, payroll.getDeductionsValue());
        assertEquals("http://example.com/payroll.pdf", payroll.getDocumentUrl());
    }

    @Test
    void whenUpdatePayrollValues_thenValuesAreUpdated() {
        payroll.setBaseSalary(5500.0);
        payroll.setGrossSalary(6500.0);
        payroll.setNetSalary(5000.0);

        assertEquals(5500.0, payroll.getBaseSalary());
        assertEquals(6500.0, payroll.getGrossSalary());
        assertEquals(5000.0, payroll.getNetSalary());
    }

    @Test
    void whenUpdateOvertimeValues_thenValuesAreUpdated() {
        payroll.setOvertimeHours(15.0);
        payroll.setOvertimeValue(750.0);

        assertEquals(15.0, payroll.getOvertimeHours());
        assertEquals(750.0, payroll.getOvertimeValue());
    }

    @Test
    void whenUpdateBenefitsAndDeductions_thenValuesAreUpdated() {
        payroll.setBenefitsValue(1200.0);
        payroll.setDeductionsValue(1800.0);

        assertEquals(1200.0, payroll.getBenefitsValue());
        assertEquals(1800.0, payroll.getDeductionsValue());
    }
} 