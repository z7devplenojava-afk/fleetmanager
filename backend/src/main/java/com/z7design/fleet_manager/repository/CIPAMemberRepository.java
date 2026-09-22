package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.CIPAMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repositório para membros da CIPA.
 */
@Repository
public interface CIPAMemberRepository extends JpaRepository<CIPAMember, UUID> {

    List<CIPAMember> findByMandateYear(Integer mandateYear);

    List<CIPAMember> findByIsActive(Boolean isActive);
}
