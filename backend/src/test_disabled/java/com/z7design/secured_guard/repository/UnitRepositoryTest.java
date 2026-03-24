package com.z7design.secured_guard.repository;

import com.z7design.secured_guard.model.Unit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class UnitRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UnitRepository unitRepository;

    private Unit unit;
    private Unit parentUnit;

    @BeforeEach
    void setUp() {
        parentUnit = Unit.builder()
                .id(UUID.randomUUID())
                .name("Parent Unit")
                .description("Parent Description")
                .address("Parent Address")
                .phone("123456789")
                .email("parent@example.com")
                .build();

        unit = Unit.builder()
                .id(UUID.randomUUID())
                .name("Test Unit")
                .description("Test Description")
                .address("Test Address")
                .phone("987654321")
                .email("test@example.com")
                .parent(parentUnit)
                .build();

        entityManager.persist(parentUnit);
        entityManager.persist(unit);
        entityManager.flush();
    }

    @Test
    void whenFindByName_thenReturnsUnit() {
        Optional<Unit> foundUnit = unitRepository.findByName(unit.getName());

        assertTrue(foundUnit.isPresent());
        assertEquals(unit.getName(), foundUnit.get().getName());
    }

    @Test
    void whenFindByNonExistentName_thenReturnsEmpty() {
        Optional<Unit> foundUnit = unitRepository.findByName("Non Existent");

        assertFalse(foundUnit.isPresent());
    }

    @Test
    void whenFindByEmail_thenReturnsUnit() {
        Optional<Unit> foundUnit = unitRepository.findByEmail(unit.getEmail());

        assertTrue(foundUnit.isPresent());
        assertEquals(unit.getEmail(), foundUnit.get().getEmail());
    }

    @Test
    void whenFindByNonExistentEmail_thenReturnsEmpty() {
        Optional<Unit> foundUnit = unitRepository.findByEmail("nonexistent@example.com");

        assertFalse(foundUnit.isPresent());
    }

    @Test
    void whenFindByAddressContaining_thenReturnsUnits() {
        List<Unit> foundUnits = unitRepository.findByAddressContaining("Test");

        assertFalse(foundUnits.isEmpty());
        assertEquals(1, foundUnits.size());
        assertEquals(unit.getAddress(), foundUnits.get(0).getAddress());
    }

    @Test
    void whenFindByNonExistentAddress_thenReturnsEmpty() {
        List<Unit> foundUnits = unitRepository.findByAddressContaining("Non Existent");

        assertTrue(foundUnits.isEmpty());
    }

    @Test
    void whenFindByParentId_thenReturnsUnits() {
        List<Unit> foundUnits = unitRepository.findByParentId(parentUnit.getId());

        assertFalse(foundUnits.isEmpty());
        assertEquals(1, foundUnits.size());
        assertEquals(parentUnit.getId(), foundUnits.get(0).getParent().getId());
    }

    @Test
    void whenFindByNonExistentParentId_thenReturnsEmpty() {
        List<Unit> foundUnits = unitRepository.findByParentId(UUID.randomUUID());

        assertTrue(foundUnits.isEmpty());
    }

    @Test
    void whenExistsByName_thenReturnsTrue() {
        boolean exists = unitRepository.existsByName(unit.getName());

        assertTrue(exists);
    }

    @Test
    void whenExistsByNonExistentName_thenReturnsFalse() {
        boolean exists = unitRepository.existsByName("Non Existent");

        assertFalse(exists);
    }

    @Test
    void whenExistsByEmail_thenReturnsTrue() {
        boolean exists = unitRepository.existsByEmail(unit.getEmail());

        assertTrue(exists);
    }

    @Test
    void whenExistsByNonExistentEmail_thenReturnsFalse() {
        boolean exists = unitRepository.existsByEmail("nonexistent@example.com");

        assertFalse(exists);
    }
} 