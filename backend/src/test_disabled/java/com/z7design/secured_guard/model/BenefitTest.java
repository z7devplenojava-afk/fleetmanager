package com.z7design.secured_guard.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.util.UUID;
import java.math.BigDecimal;

class BenefitTest {

    private Benefit benefit;
    private Position position;

    @BeforeEach
    void setUp() {
        position = Position.builder()
                .id(UUID.randomUUID())
                .name("Test Position")
                .build();

        benefit = Benefit.builder()
                .id(UUID.randomUUID())
                .name("Test Benefit")
                .description("Test Description")
                .value(new BigDecimal("1000.00"))
                .position(position)
                .build();
    }

    @Test
    void whenCreateBenefit_thenBenefitIsCreated() {
        assertNotNull(benefit);
        assertEquals("Test Benefit", benefit.getName());
        assertEquals("Test Description", benefit.getDescription());
        assertEquals(new BigDecimal("1000.00"), benefit.getValue());
        assertEquals(position, benefit.getPosition());
    }

    @Test
    void whenUpdateBenefitName_thenNameIsUpdated() {
        String newName = "Updated Benefit";
        benefit.setName(newName);
        assertEquals(newName, benefit.getName());
    }

    @Test
    void whenUpdateBenefitValue_thenValueIsUpdated() {
        BigDecimal newValue = new BigDecimal("1500.00");
        benefit.setValue(newValue);
        assertEquals(newValue, benefit.getValue());
    }

    @Test
    void whenUpdateBenefitPosition_thenPositionIsUpdated() {
        Position newPosition = Position.builder()
                .id(UUID.randomUUID())
                .name("New Position")
                .build();

        benefit.setPosition(newPosition);
        assertEquals(newPosition, benefit.getPosition());
    }
} 