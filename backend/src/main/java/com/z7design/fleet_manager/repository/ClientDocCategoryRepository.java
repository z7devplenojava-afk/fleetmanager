package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ClientDocCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClientDocCategoryRepository extends JpaRepository<ClientDocCategory, UUID> {

    List<ClientDocCategory> findByIsSystemTrueOrderByNameAsc();

    List<ClientDocCategory> findByCompanyIdOrIsSystemTrueOrderByNameAsc(UUID companyId);
}
