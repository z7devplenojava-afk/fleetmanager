package com.z7design.fleet_manager.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SeatReservationService {

    private final StringRedisTemplate redisTemplate;
    private static final String LOCK_KEY_PREFIX = "seat_lock:";
    private static final Duration LOCK_EXPIRATION = Duration.ofMinutes(10);

    /**
     * Tries to reserve a seat in Redis.
     * 
     * @return true if reserved successfully, false if already locked.
     */
    public boolean reserveSeat(UUID tripId, String seatNumber, String userId) {
        String key = getLockKey(tripId, seatNumber);
        Boolean success = redisTemplate.opsForValue().setIfAbsent(key, userId, LOCK_EXPIRATION);

        if (Boolean.TRUE.equals(success)) {
            log.info("Seat {} for trip {} reserved by user {} for 10 minutes.", seatNumber, tripId, userId);
            return true;
        }
        return false;
    }

    /**
     * Checks if a seat is currently locked in Redis.
     */
    public boolean isSeatLocked(UUID tripId, String seatNumber) {
        String key = getLockKey(tripId, seatNumber);
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    /**
     * Releases a seat lock manually.
     */
    public void releaseSeat(UUID tripId, String seatNumber) {
        String key = getLockKey(tripId, seatNumber);
        redisTemplate.delete(key);
        log.info("Seat {} for trip {} lock released.", seatNumber, tripId);
    }

    private String getLockKey(UUID tripId, String seatNumber) {
        return LOCK_KEY_PREFIX + tripId.toString() + ":" + seatNumber;
    }
}
