package com.z7design.secured_guard.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.time.Duration;
import java.util.UUID;

class RouteTest {

    private Route route;
    private Unit unit;
    private Location location;

    @BeforeEach
    void setUp() {
        unit = Unit.builder()
                .id(UUID.randomUUID())
                .name("Test Unit")
                .build();

        location = Location.builder()
                .id(UUID.randomUUID())
                .name("Test Location")
                .build();

        route = new Route();
        route.setId(UUID.randomUUID());
        route.setName("Test Route");
        route.setDescription("Test Description");
        route.setUnit(unit);
        route.setEstimatedDuration(Duration.ofHours(2));
        route.setCheckpointsRequired(true);
    }

    @Test
    void whenCreateRoute_thenRouteIsCreated() {
        assertNotNull(route);
        assertEquals("Test Route", route.getName());
        assertEquals("Test Description", route.getDescription());
        assertEquals(unit, route.getUnit());
        assertEquals(Duration.ofHours(2), route.getEstimatedDuration());
        assertTrue(route.isCheckpointsRequired());
    }

    @Test
    void whenUpdateRouteDuration_thenDurationIsUpdated() {
        Duration newDuration = Duration.ofHours(3);
        route.setEstimatedDuration(newDuration);
        assertEquals(newDuration, route.getEstimatedDuration());
    }

    @Test
    void whenUpdateRouteCheckpoints_thenCheckpointsAreUpdated() {
        route.setCheckpointsRequired(false);
        assertFalse(route.isCheckpointsRequired());
    }
} 