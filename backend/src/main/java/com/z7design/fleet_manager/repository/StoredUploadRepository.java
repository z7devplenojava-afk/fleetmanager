package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.StoredUpload;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoredUploadRepository extends JpaRepository<StoredUpload, UUID> {
    Optional<StoredUpload> findByCategoryAndFileName(String category, String fileName);
    Optional<StoredUpload> findFirstByFileName(String fileName);
    void deleteByCategoryAndFileName(String category, String fileName);
}

