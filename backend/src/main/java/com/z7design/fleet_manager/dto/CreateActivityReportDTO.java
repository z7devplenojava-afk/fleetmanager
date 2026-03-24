package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.AbsenceStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public class CreateActivityReportDTO {
    @NotNull(message = "Employee ID is required")
    private UUID employeeId;
    private String employeeName; // Opcional, serÃ¡ preenchido pelo service
    @NotNull(message = "Client ID is required")
    private UUID clientId;
    private String clientName; // Opcional, serÃ¡ preenchido pelo service
    @NotNull(message = "Work Post ID is required")
    private UUID workPostId;
    private String workPostName; // Opcional, serÃ¡ preenchido pelo service
    @NotNull(message = "Date is required")
    private LocalDate date;
    @NotNull(message = "Start time is required")
    private LocalTime startTime;
    @NotNull(message = "End time is required")
    private LocalTime endTime;
    private String description;
    private BallisticPlateDTO ballisticPlate;
    private WeaponRegistryDTO weaponRegistry;
    @NotNull(message = "Absence status is required")
    private AbsenceStatus absenceStatus;
    private String divergences;
    private MedicalConsultationDTO medicalConsultation;
    private List<CreateActivityReportPhotoDTO> photos;
    private List<CreateActivityReportDocumentDTO> documents;

    // Getters and Setters
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

    public List<CreateActivityReportPhotoDTO> getPhotos() {
        return photos;
    }

    public void setPhotos(List<CreateActivityReportPhotoDTO> photos) {
        this.photos = photos;
    }

    public List<CreateActivityReportDocumentDTO> getDocuments() {
        return documents;
    }

    public void setDocuments(List<CreateActivityReportDocumentDTO> documents) {
        this.documents = documents;
    }
}

