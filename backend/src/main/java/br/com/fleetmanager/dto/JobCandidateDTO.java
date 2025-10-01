package br.com.fleetmanager.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import br.com.fleetmanager.model.enums.CandidateStatus;

public class JobCandidateDTO {
    
    private UUID id;
    
    @NotNull(message = "ID da vaga é obrigatório")
    private UUID jobVacancyId;
    
    private String jobVacancyTitle;
    
    @NotBlank(message = "Nome é obrigatório")
    private String name;
    
    @NotBlank(message = "Email é obrigatório")
    @Email(message = "Email inválido")
    private String email;
    
    private String phone;
    
    @NotBlank(message = "CPF é obrigatório")
    private String cpf;
    
    private String address;
    
    private String city;
    
    private String state;
    
    private String educationLevel;
    
    @Min(value = 0, message = "Anos de experiência não podem ser negativos")
    private Integer experienceYears;
    
    private String currentPosition;
    
    private String currentCompany;
    
    @DecimalMin(value = "0.0", message = "Salário esperado deve ser maior que zero")
    private BigDecimal expectedSalary;
    
    private String availability;
    
    private String curriculumFileName;
    
    private String curriculumFilePath;
    
    private Long curriculumFileSize;
    
    private CandidateStatus status;
    
    private String notes;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    private Boolean requiresCnh;
    private String cnhCategory;
    private String curriculumUrl;
    
    // Construtores
    public JobCandidateDTO() {}
    
    public JobCandidateDTO(UUID id, UUID jobVacancyId, String jobVacancyTitle, String name, String email,
                          String phone, String cpf, String address, String city, String state,
                          String educationLevel, Integer experienceYears, String currentPosition,
                          String currentCompany, BigDecimal expectedSalary, String availability,
                          String curriculumFileName, String curriculumFilePath, Long curriculumFileSize,
                          CandidateStatus status, String notes, LocalDateTime createdAt, LocalDateTime updatedAt,
                          Boolean requiresCnh, String cnhCategory, String curriculumUrl) {
        this.id = id;
        this.jobVacancyId = jobVacancyId;
        this.jobVacancyTitle = jobVacancyTitle;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.cpf = cpf;
        this.address = address;
        this.city = city;
        this.state = state;
        this.educationLevel = educationLevel;
        this.experienceYears = experienceYears;
        this.currentPosition = currentPosition;
        this.currentCompany = currentCompany;
        this.expectedSalary = expectedSalary;
        this.availability = availability;
        this.curriculumFileName = curriculumFileName;
        this.curriculumFilePath = curriculumFilePath;
        this.curriculumFileSize = curriculumFileSize;
        this.status = status;
        this.notes = notes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.requiresCnh = requiresCnh;
        this.cnhCategory = cnhCategory;
        this.curriculumUrl = curriculumUrl;
    }
    
    // Getters e Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public UUID getJobVacancyId() {
        return jobVacancyId;
    }
    
    public void setJobVacancyId(UUID jobVacancyId) {
        this.jobVacancyId = jobVacancyId;
    }
    
    public String getJobVacancyTitle() {
        return jobVacancyTitle;
    }
    
    public void setJobVacancyTitle(String jobVacancyTitle) {
        this.jobVacancyTitle = jobVacancyTitle;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getPhone() {
        return phone;
    }
    
    public void setPhone(String phone) {
        this.phone = phone;
    }
    
    public String getCpf() {
        return cpf;
    }
    
    public void setCpf(String cpf) {
        this.cpf = cpf;
    }
    
    public String getAddress() {
        return address;
    }
    
    public void setAddress(String address) {
        this.address = address;
    }
    
    public String getCity() {
        return city;
    }
    
    public void setCity(String city) {
        this.city = city;
    }
    
    public String getState() {
        return state;
    }
    
    public void setState(String state) {
        this.state = state;
    }
    
    public String getEducationLevel() {
        return educationLevel;
    }
    
    public void setEducationLevel(String educationLevel) {
        this.educationLevel = educationLevel;
    }
    
    public Integer getExperienceYears() {
        return experienceYears;
    }
    
    public void setExperienceYears(Integer experienceYears) {
        this.experienceYears = experienceYears;
    }
    
    public String getCurrentPosition() {
        return currentPosition;
    }
    
    public void setCurrentPosition(String currentPosition) {
        this.currentPosition = currentPosition;
    }
    
    public String getCurrentCompany() {
        return currentCompany;
    }
    
    public void setCurrentCompany(String currentCompany) {
        this.currentCompany = currentCompany;
    }
    
    public BigDecimal getExpectedSalary() {
        return expectedSalary;
    }
    
    public void setExpectedSalary(BigDecimal expectedSalary) {
        this.expectedSalary = expectedSalary;
    }
    
    public String getAvailability() {
        return availability;
    }
    
    public void setAvailability(String availability) {
        this.availability = availability;
    }
    
    public String getCurriculumFileName() {
        return curriculumFileName;
    }
    
    public void setCurriculumFileName(String curriculumFileName) {
        this.curriculumFileName = curriculumFileName;
    }
    
    public String getCurriculumFilePath() {
        return curriculumFilePath;
    }
    
    public void setCurriculumFilePath(String curriculumFilePath) {
        this.curriculumFilePath = curriculumFilePath;
    }
    
    public Long getCurriculumFileSize() {
        return curriculumFileSize;
    }
    
    public void setCurriculumFileSize(Long curriculumFileSize) {
        this.curriculumFileSize = curriculumFileSize;
    }
    
    public CandidateStatus getStatus() {
        return status;
    }
    
    public void setStatus(CandidateStatus status) {
        this.status = status;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
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

    public Boolean getRequiresCnh() {
        return requiresCnh;
    }
    public void setRequiresCnh(Boolean requiresCnh) {
        this.requiresCnh = requiresCnh;
    }
    public String getCnhCategory() {
        return cnhCategory;
    }
    public void setCnhCategory(String cnhCategory) {
        this.cnhCategory = cnhCategory;
    }
    public String getCurriculumUrl() {
        return curriculumUrl;
    }
    public void setCurriculumUrl(String curriculumUrl) {
        this.curriculumUrl = curriculumUrl;
    }
} 