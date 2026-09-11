package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.ClientDocFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClientDocFileRepository extends JpaRepository<ClientDocFile, UUID> {

    List<ClientDocFile> findByStageIdAndCategoryId(UUID stageId, UUID categoryId);

    List<ClientDocFile> findByStageId(UUID stageId);

    void deleteByStageId(UUID stageId);
}
