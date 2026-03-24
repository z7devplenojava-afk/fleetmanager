package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.QRCodeWorkPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QRCodeWorkPostRepository extends JpaRepository<QRCodeWorkPost, UUID> {

    Optional<QRCodeWorkPost> findByQrCode(String qrCode);

    List<QRCodeWorkPost> findByWorkPostId(UUID workPostId);

    List<QRCodeWorkPost> findByIsActiveTrue();

    @Query("SELECT q FROM QRCodeWorkPost q WHERE q.qrCode = :qrCode " +
           "AND q.isActive = true " +
           "AND (q.validFrom IS NULL OR q.validFrom <= :now) " +
           "AND (q.validUntil IS NULL OR q.validUntil >= :now)")
    Optional<QRCodeWorkPost> findValidQRCode(
            @Param("qrCode") String qrCode,
            @Param("now") LocalDateTime now);
}


