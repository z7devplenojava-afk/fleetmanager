package com.z7design.secured_guard.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.util.UUID;

class TrainingTest {

    private Training training;
    private EmployeeCertification certification;

    @BeforeEach
    void setUp() {
        training = Training.builder()
                .id(UUID.randomUUID())
                .name("Test Training")
                .description("Test Description")
                .provider("Test Provider")
                .duration(40)
                .build();

        certification = new EmployeeCertification();
        certification.setId(UUID.randomUUID());
        certification.setTraining(training);
    }

    @Test
    void whenCreateTraining_thenTrainingIsCreated() {
        assertNotNull(training);
        assertEquals("Test Training", training.getName());
        assertEquals("Test Description", training.getDescription());
        assertEquals("Test Provider", training.getProvider());
        assertEquals(40, training.getDuration());
    }

    @Test
    void whenAddCertification_thenCertificationIsAddedToTraining() {
        training.getCertifications().add(certification);
        assertEquals(training, certification.getTraining());
        assertTrue(training.getCertifications().contains(certification));
    }

    @Test
    void whenUpdateTrainingName_thenNameIsUpdated() {
        String newName = "Updated Training";
        training.setName(newName);
        assertEquals(newName, training.getName());
    }

    @Test
    void whenUpdateTrainingDuration_thenDurationIsUpdated() {
        int newDuration = 60;
        training.setDuration(newDuration);
        assertEquals(newDuration, training.getDuration());
    }
} 