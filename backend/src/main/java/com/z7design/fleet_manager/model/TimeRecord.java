package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "time_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TimeRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne
    @JoinColumn(name = "work_post_id")
    private WorkPost workPost;

    @Column(name = "record_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private RecordType recordType;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;

    @Column(name = "location")
    private String location;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "qr_code_used")
    private String qrCodeUsed;

    @Column(name = "device_info")
    private String deviceInfo;

    @Column(name = "photo_url")
    private String photoUrl;

    @Column(name = "is_manual")
    private Boolean isManual = false;

    // Time Control Module - Origem do registro
    @Column(name = "origin", length = 20)
    private String origin; // MOBILE_APP, WEB, BIOMETRY, MANUAL_ADJUSTMENT

    // Time Control Module - Rastreamento de ajustes (Auto-referência)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "original_record_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private TimeRecord originalRecord;

    // Time Control Module - Justificativa associada
    @Column(name = "justification_id")
    private UUID justificationId;

    // Legacy fields
    @Column(name = "justification")
    private String justification;

    @Column(name = "approved_by_id")
    private UUID approvedById;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private RecordStatus status = RecordStatus.APPROVED;

    @Column(name = "processing_notes")
    private String processingNotes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum RecordType {
        ENTRADA,
        SAIDA_ALMOCO,
        RETORNO_ALMOCO,
        SAIDA
    }

    public enum RecordStatus {
        PENDING,
        APPROVED,
        REJECTED
    }
}
