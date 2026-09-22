package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.CIPAMeeting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Repositório para reuniões da CIPA.
 */
@Repository
public interface CIPAMeetingRepository extends JpaRepository<CIPAMeeting, UUID> {
}
