package com.z7design.secured_guard.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDate;
import java.util.UUID;

class EmployeeCertificationTest {

    private EmployeeCertification certification;
    private Employee employee;
    private Training training;

    @BeforeEach
    void setUp() {
        employee = new Employee();
        employee.setId(UUID.randomUUID());
        employee.setName("Test Employee");

        training = Training.builder()
                .id(UUID.randomUUID())
                .name("Test Training")
                .build();

        certification = EmployeeCertification.builder()
                .id(UUID.randomUUID())
                .employee(employee)
                .training(training)
                .issueDate(LocalDate.now())
                .expirationDate(LocalDate.now().plusYears(1))
                .build();
    }

    @Test
    void whenCreateCertification_thenCertificationIsCreated() {
        assertNotNull(certification);
        assertEquals(employee, certification.getEmployee());
        assertEquals(training, certification.getTraining());
        assertNotNull(certification.getIssueDate());
        assertNotNull(certification.getExpirationDate());
    }

    @Test
    void whenUpdateExpirationDate_thenExpirationDateIsUpdated() {
        LocalDate newExpirationDate = LocalDate.now().plusYears(2);
        certification.setExpirationDate(newExpirationDate);
        assertEquals(newExpirationDate, certification.getExpirationDate());
    }

    @Test
    void whenUpdateTraining_thenTrainingIsUpdated() {
        Training newTraining = Training.builder()
                .id(UUID.randomUUID())
                .name("New Training")
                .build();
        certification.setTraining(newTraining);
        assertEquals(newTraining, certification.getTraining());
    }
} 