package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.BackupConfiguration;
import com.z7design.fleet_manager.model.BackupHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface BackupHistoryRepository extends JpaRepository<BackupHistory, UUID> {
    
    Page<BackupHistory> findByConfigurationOrderByBackupDateDesc(BackupConfiguration configuration, Pageable pageable);
    
    List<BackupHistory> findTop10ByOrderByBackupDateDesc();
    
    @Query("SELECT h FROM BackupHistory h WHERE h.backupDate >= :date ORDER BY h.backupDate DESC")
    List<BackupHistory> findBackupsSince(LocalDateTime date);
    
    @Query("SELECT h FROM BackupHistory h WHERE h.status = :status ORDER BY h.backupDate DESC")
    List<BackupHistory> findByStatus(String status);
}


