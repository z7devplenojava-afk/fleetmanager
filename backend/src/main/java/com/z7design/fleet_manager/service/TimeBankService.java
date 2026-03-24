package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.TimeBank;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.TimeBankRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TimeBankService {

    private final TimeBankRepository timeBankRepository;
    private final UserRepository userRepository;

    @Transactional
    public void updateBalance(UUID driverId, Long minutesDelta) {
        TimeBank timeBank = timeBankRepository.findByDriverId(driverId)
                .orElseGet(() -> createTimeBank(driverId));

        timeBank.setBalanceMinutes(timeBank.getBalanceMinutes() + minutesDelta);
        timeBank.setLastUpdated(LocalDateTime.now());

        timeBankRepository.save(timeBank);
        log.info("Updated time bank for driver {}: delta={} min, new balance={} min",
                driverId, minutesDelta, timeBank.getBalanceMinutes());
    }

    public TimeBank getBalance(UUID driverId) {
        return timeBankRepository.findByDriverId(driverId)
                .orElseGet(() -> createTimeBank(driverId));
    }

    private TimeBank createTimeBank(UUID driverId) {
        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        return TimeBank.builder()
                .driver(driver)
                .balanceMinutes(0L)
                .lastUpdated(LocalDateTime.now())
                .build();
    }
}
