package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.model.enums.CandidateStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "job_candidates")
public class JobCandidate {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_vacancy_id", nullable = false)
    private JobVacancy jobVacancy;
    
    @NotBlank(message = "Nome Ã© obrigatÃ³rio")
    @Column(nullable = false)
    private String name;
    
    @NotBlank(message = "Email Ã© obrigatÃ³rio")
    @Email(message = "Email invÃ¡lido")
    @Column(nullable = false)
    private String email;
    
    @Column(length = 20)
    private String phone;
    
    @NotBlank(message = "CPF Ã© obrigatÃ³rio")
    @Column(nullable = false, length = 14)
    private String cpf;
    
    @Column(columnDefinition = "TEXT")
    private String address;
    
    @Column(length = 100)
    private String city;
    
    @Column(length = 2)
    private String state;
    
    @Column(length = 100)
    private String educationLevel;
    
    @Min(value = 0, message = "Anos de experiÃªncia nÃ£o podem ser negativos")
    @Column
    private Integer experienceYears;
    
    @Column(length = 255)
    private String currentPosition;
    
    @Column(length = 255)
    private String currentCompany;
    
    @DecimalMin(value = "0.0", message = "SalÃ¡rio esperado deve ser maior que zero")
    @Column(precision = 10, scale = 2)
    private BigDecimal expectedSalary;
    
    @Column(length = 100)
    private String availability;
    
    @Column(length = 255)
    private String curriculumFileName;
    
    @Column(length = 500)
    private String curriculumFilePath;
    
    @Column
    private Long curriculumFileSize;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CandidateStatus status = CandidateStatus.PENDING;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @Column
    private Boolean requiresCnh;

    @Column(length = 10)
    private String cnhCategory;

    @Column(length = 500)
    private String curriculumUrl;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Construtores
    public JobCandidate() {}
    
    // Getters e Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public JobVacancy getJobVacancy() {
        return jobVacancy;
    }
    
    public void setJobVacancy(JobVacancy jobVacancy) {
        this.jobVacancy = jobVacancy;
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
