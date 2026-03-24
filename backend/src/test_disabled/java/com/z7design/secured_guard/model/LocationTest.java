package com.z7design.secured_guard.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.util.UUID;

class LocationTest {

    private Location location;
    private Unit unit;

    @BeforeEach
    void setUp() {
        unit = Unit.builder()
                .id(UUID.randomUUID())
                .name("Test Unit")
                .build();

        location = Location.builder()
                .id(UUID.randomUUID())
                .name("Test Location")
                .description("Test Description")
                .address("Test Address")
                .unit(unit)
                .build();
    }

    @Test
    void whenCreateLocation_thenLocationIsCreated() {
        assertNotNull(location);
        assertEquals("Test Location", location.getName());
        assertEquals("Test Description", location.getDescription());
        assertEquals("Test Address", location.getAddress());
        assertEquals(unit, location.getUnit());
    }

    @Test
    void whenUpdateLocationName_thenNameIsUpdated() {
        String newName = "Updated Location";
        location.setName(newName);
        assertEquals(newName, location.getName());
    }

    @Test
    void whenUpdateLocationAddress_thenAddressIsUpdated() {
        String newAddress = "New Address";
        location.setAddress(newAddress);
        assertEquals(newAddress, location.getAddress());
    }
} 