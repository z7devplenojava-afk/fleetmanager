package com.z7design.secured_guard.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import com.z7design.secured_guard.model.enums.EmploymentStatus;

class EmployeeTest {

    private Employee employee;
    private User user;
    private Position position;
    private Unit unit;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setName("Test User");

        position = Position.builder()
                .id(UUID.randomUUID())
                .name("Test Position")
                .build();

        unit = Unit.builder()
                .id(UUID.randomUUID())
                .name("Test Unit")
                .build();

        employee = new Employee();
        employee.setId(UUID.randomUUID());
        employee.setUser(user);
        employee.setPosition(position);
        employee.setUnit(unit);
        employee.setRegistrationNumber("EMP001");
        employee.setHireDate(LocalDate.now());
        employee.setStatus(EmploymentStatus.ACTIVE);
        employee.setName("Test Employee");
        employee.setDocument("12345678900");
        employee.setCpf("12345678900");
        employee.setRg("1234567");
        employee.setMaritalStatus("Single");
        employee.setNationality("Brazilian");
    }

    @Test
    void whenCreateEmployee_thenEmployeeIsCreated() {
        assertNotNull(employee);
        assertEquals(user, employee.getUser());
        assertEquals(position, employee.getPosition());
        assertEquals(unit, employee.getUnit());
        assertEquals("EMP001", employee.getRegistrationNumber());
        assertEquals(LocalDate.now(), employee.getHireDate());
        assertEquals(EmploymentStatus.ACTIVE, employee.getStatus());
        assertEquals("Test Employee", employee.getName());
        assertEquals("12345678900", employee.getDocument());
        assertEquals("12345678900", employee.getCpf());
        assertEquals("1234567", employee.getRg());
        assertEquals("Single", employee.getMaritalStatus());
        assertEquals("Brazilian", employee.getNationality());
    }

    @Test
    void whenSetTerminationDate_thenEmployeeIsTerminated() {
        LocalDate terminationDate = LocalDate.now().plusDays(30);
        employee.setTerminationDate(terminationDate);
        employee.setStatus(EmploymentStatus.TERMINATED);

        assertEquals(terminationDate, employee.getTerminationDate());
        assertEquals(EmploymentStatus.TERMINATED, employee.getStatus());
    }

    @Test
    void whenAddDocument_thenDocumentIsAddedToEmployee() {
        Document document = new Document();
        document.setId(UUID.randomUUID());
        document.setType("ID");
        document.setNumber("123456");
        document.setEmployee(employee);

        employee.getDocuments().add(document);

        assertTrue(employee.getDocuments().contains(document));
        assertEquals(employee, document.getEmployee());
    }
} 