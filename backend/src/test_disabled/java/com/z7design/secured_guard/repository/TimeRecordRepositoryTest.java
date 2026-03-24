package com.z7design.secured_guard.repository;

import com.z7design.secured_guard.model.Employee;
import com.z7design.secured_guard.model.TimeRecord;
import com.z7design.secured_guard.model.enums.TimeRecordStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class TimeRecordRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private TimeRecordRepository timeRecordRepository;

    private Employee employee;
    private TimeRecord timeRecord;

    @BeforeEach
    void setUp() {
        employee = new Employee();
        employee.setId(UUID.randomUUID());
        employee.setName("Test Employee");
        entityManager.persist(employee);

        timeRecord = TimeRecord.builder()
            .id(UUID.randomUUID())
            .employee(employee)
            .recordDate(LocalDate.now())
            .entryTime(LocalTime.of(9, 0))
            .exitTime(LocalTime.of(18, 0))
            .entryLunchTime(LocalTime.of(12, 0))
            .exitLunchTime(LocalTime.of(13, 0))
            .status(TimeRecordStatus.PENDING)
            .build();
        entityManager.persist(timeRecord);
        entityManager.flush();
    }

    @Test
    void whenFindById_thenReturnTimeRecord() {
        Optional<TimeRecord> found = timeRecordRepository.findById(timeRecord.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getEmployee()).isEqualTo(employee);
        assertThat(found.get().getStatus()).isEqualTo(TimeRecordStatus.PENDING);
    }

    @Test
    void whenFindByEmployeeId_thenReturnTimeRecords() {
        List<TimeRecord> found = timeRecordRepository.findByEmployeeId(employee.getId());
        assertThat(found).hasSize(1);
        assertThat(found.get(0).getEmployee()).isEqualTo(employee);
    }

    @Test
    void whenFindByEmployeeIdAndRecordDate_thenReturnTimeRecord() {
        List<TimeRecord> found = timeRecordRepository.findByEmployeeIdAndRecordDateBetween(
            employee.getId(),
            LocalDate.now(),
            LocalDate.now()
        );
        assertThat(found).hasSize(1);
        assertThat(found.get(0).getEmployee()).isEqualTo(employee);
        assertThat(found.get(0).getRecordDate()).isEqualTo(LocalDate.now());
    }

    @Test
    void whenFindByEmployeeIdAndStatus_thenReturnTimeRecords() {
        List<TimeRecord> found = timeRecordRepository.findByEmployeeIdAndStatus(
            employee.getId(),
            TimeRecordStatus.PENDING
        );
        assertThat(found).hasSize(1);
        assertThat(found.get(0).getEmployee()).isEqualTo(employee);
        assertThat(found.get(0).getStatus()).isEqualTo(TimeRecordStatus.PENDING);
    }
} 