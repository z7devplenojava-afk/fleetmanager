package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.AbsenceStatus;
import com.z7design.fleet_manager.model.enums.ActivityReportStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.z7design.fleet_manager.model.*; // Import all models for conversion

public class ActivityReportDTO {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private UUID clientId;
    private String clientName;
    private UUID workPostId;
    private String workPostName;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private String description;
    private BallisticPlateDTO ballisticPlate;
    private WeaponRegistryDTO weaponRegistry;
    private AbsenceStatus absenceStatus;
    private String divergences;
    private MedicalConsultationDTO medicalConsultation;
    private List<ActivityReportPhotoDTO> photos;
    private List<ActivityReportDocumentDTO> documents;
    private UUID supervisorId;
    private String supervisorName;
    private ActivityReportStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Static factory method to convert entity to DTO
    public static ActivityReportDTO fromEntity(ActivityReport entity) {
        ActivityReportDTO dto = new ActivityReportDTO();
        dto.setId(entity.getId());
        dto.setEmployeeId(entity.getEmployee().getId());
        dto.setEmployeeName(entity.getEmployeeName());
        dto.setClientId(entity.getClient().getId());
        dto.setClientName(entity.getClientName());
        dto.setWorkPostId(entity.getWorkPost().getId());
        dto.setWorkPostName(entity.getWorkPostName());
        dto.setDate(entity.getDate());
        dto.setStartTime(entity.getStartTime());
        dto.setEndTime(entity.getEndTime());
        dto.setDescription(entity.getDescription());
        if (entity.getBallisticPlate() != null) {
            BallisticPlateDTO bpDto = new BallisticPlateDTO();
            bpDto.setBallisticPlateNumber(entity.getBallisticPlate().getBallisticPlateNumber());
            bpDto.setBallisticPlateValidUntil(entity.getBallisticPlate().getBallisticPlateValidUntil());
            dto.setBallisticPlate(bpDto);
        }
        if (entity.getWeaponRegistry() != null) {
            WeaponRegistryDTO wrDto = new WeaponRegistryDTO();
            wrDto.setWeaponRegistryNumber(entity.getWeaponRegistry().getWeaponRegistryNumber());
            wrDto.setWeaponRegistryValidUntil(entity.getWeaponRegistry().getWeaponRegistryValidUntil());
            dto.setWeaponRegistry(wrDto);
        }
        dto.setAbsenceStatus(entity.getAbsenceStatus());
        dto.setDivergences(entity.getDivergences());
        if (entity.getMedicalConsultation() != null) {
            MedicalConsultationDTO mcDto = new MedicalConsultationDTO();
            mcDto.setConsultationDate(entity.getMedicalConsultation().getConsultationDate());
            mcDto.setReason(entity.getMedicalConsultation().getReason());
            mcDto.setDoctor(entity.getMedicalConsultation().getDoctor());
            mcDto.setResult(entity.getMedicalConsultation().getResult());
            dto.setMedicalConsultation(mcDto);
        }
        if (entity.getPhotos() != null && !entity.getPhotos().isEmpty()) {
            dto.setPhotos(entity.getPhotos().stream().map(photo -> {
                ActivityReportPhotoDTO photoDto = new ActivityReportPhotoDTO();
                photoDto.setId(photo.getId());
                photoDto.setUrl(photo.getUrl());
                photoDto.setDescription(photo.getDescription());
                photoDto.setTimestamp(photo.getTimestamp());
                return photoDto;
            }).collect(Collectors.toList()));
        } else {
            dto.setPhotos(java.util.Collections.emptyList());
        }
        if (entity.getDocuments() != null && !entity.getDocuments().isEmpty()) {
            dto.setDocuments(entity.getDocuments().stream().map(doc -> {
                ActivityReportDocumentDTO docDto = new ActivityReportDocumentDTO();
                docDto.setId(doc.getId());
                docDto.setName(doc.getName());
                docDto.setUrl(doc.getUrl());
                docDto.setType(doc.getType());
                docDto.setSize(doc.getSize());
                docDto.setUploadedAt(doc.getUploadedAt());
                return docDto;
            }).collect(Collectors.toList()));
        } else {
            dto.setDocuments(java.util.Collections.emptyList());
        }
        if (entity.getSupervisor() != null) {
            dto.setSupervisorId(entity.getSupervisor().getId());
            dto.setSupervisorName(entity.getSupervisorName());
        }
        dto.setStatus(entity.getStatus());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(UUID employeeId) {
        this.employeeId = employeeId;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public UUID getClientId() {
        return clientId;
    }

    public void setClientId(UUID clientId) {
        this.clientId = clientId;
    }

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public UUID getWorkPostId() {
        return workPostId;
    }

    public void setWorkPostId(UUID workPostId) {
        this.workPostId = workPostId;
    }

    public String getWorkPostName() {
        return workPostName;
    }

    public void setWorkPostName(String workPostName) {
        this.workPostName = workPostName;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BallisticPlateDTO getBallisticPlate() {
        return ballisticPlate;
    }

    public void setBallisticPlate(BallisticPlateDTO ballisticPlate) {
        this.ballisticPlate = ballisticPlate;
    }

    public WeaponRegistryDTO getWeaponRegistry() {
        return weaponRegistry;
    }

    public void setWeaponRegistry(WeaponRegistryDTO weaponRegistry) {
        this.weaponRegistry = weaponRegistry;
    }

    public AbsenceStatus getAbsenceStatus() {
        return absenceStatus;
    }

    public void setAbsenceStatus(AbsenceStatus absenceStatus) {
        this.absenceStatus = absenceStatus;
    }

    public String getDivergences() {
        return divergences;
    }

    public void setDivergences(String divergences) {
        this.divergences = divergences;
    }

    public MedicalConsultationDTO getMedicalConsultation() {
        return medicalConsultation;
    }

    public void setMedicalConsultation(MedicalConsultationDTO medicalConsultation) {
        this.medicalConsultation = medicalConsultation;
    }

    public List<ActivityReportPhotoDTO> getPhotos() {
        return photos;
    }

    public void setPhotos(List<ActivityReportPhotoDTO> photos) {
        this.photos = photos;
    }

    public List<ActivityReportDocumentDTO> getDocuments() {
        return documents;
    }

    public void setDocuments(List<ActivityReportDocumentDTO> documents) {
        this.documents = documents;
    }

    public UUID getSupervisorId() {
        return supervisorId;
    }

    public void setSupervisorId(UUID supervisorId) {
        this.supervisorId = supervisorId;
    }

    public String getSupervisorName() {
        return supervisorName;
    }

    public void setSupervisorName(String supervisorName) {
        this.supervisorName = supervisorName;
    }

    public ActivityReportStatus getStatus() {
        return status;
    }

    public void setStatus(ActivityReportStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

