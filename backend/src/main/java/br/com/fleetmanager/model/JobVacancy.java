package br.com.fleetmanager.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import br.com.fleetmanager.model.enums.VacancyStatus;

@Entity
@Table(name = "job_vacancies")
public class JobVacancy {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @NotBlank(message = "Título da vaga é obrigatório")
    @Column(nullable = false)
    private String title;
    
    @NotBlank(message = "Cargo é obrigatório")
    @Column(nullable = false)
    private String position;
    
    @Column
    private Boolean requiresCnh;

    @Column
    private String cnhCategory;
    
    @NotBlank(message = "Localização é obrigatória")
    @Column(nullable = false)
    private String location;
    
    @NotBlank(message = "Função é obrigatória")
    @Column(nullable = false)
    private String function;
    
    @ElementCollection
    @CollectionTable(name = "job_vacancy_requirements", joinColumns = @JoinColumn(name = "job_vacancy_id"))
    @Column(name = "requirement")
    private List<String> requirements;
    
    @NotBlank(message = "Jornada de trabalho é obrigatória")
    @Column(nullable = false)
    private String workSchedule;
    
    @NotNull(message = "Salário é obrigatório")
    @DecimalMin(value = "0.0", inclusive = false, message = "Salário deve ser maior que zero")
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal salary;
    
    @ElementCollection
    @CollectionTable(name = "job_vacancy_benefits", joinColumns = @JoinColumn(name = "job_vacancy_id"))
    @Column(name = "benefit")
    private List<String> benefits;
    
    @NotNull(message = "Prazo de inscrição é obrigatório")
    @Column(nullable = false)
    private LocalDateTime deadline;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VacancyStatus status = VacancyStatus.OPEN;
    
    @Column(nullable = false)
    private Integer applications = 0;
    
    @OneToMany(mappedBy = "jobVacancy", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<JobCandidate> candidates;
    
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
    public JobVacancy() {}
    
    public JobVacancy(String title, String position, String location, 
                     List<String> requirements, String workSchedule, BigDecimal salary, 
                     List<String> benefits, LocalDateTime deadline, Boolean requiresCnh, String cnhCategory) {
        this.title = title;
        this.position = position;
        this.location = location;
        this.requirements = requirements;
        this.workSchedule = workSchedule;
        this.salary = salary;
        this.benefits = benefits;
        this.deadline = deadline;
        this.requiresCnh = requiresCnh;
        this.cnhCategory = cnhCategory;
    }
    
    // Getters e Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getPosition() {
        return position;
    }
    
    public void setPosition(String position) {
        this.position = position;
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
    
    public String getLocation() {
        return location;
    }
    
    public void setLocation(String location) {
        this.location = location;
    }
    
    public String getFunction() { return function; }
    public void setFunction(String function) { this.function = function; }
    
    public List<String> getRequirements() {
        return requirements;
    }
    
    public void setRequirements(List<String> requirements) {
        this.requirements = requirements;
    }
    
    public String getWorkSchedule() {
        return workSchedule;
    }
    
    public void setWorkSchedule(String workSchedule) {
        this.workSchedule = workSchedule;
    }
    
    public BigDecimal getSalary() {
        return salary;
    }
    
    public void setSalary(BigDecimal salary) {
        this.salary = salary;
    }
    
    public List<String> getBenefits() {
        return benefits;
    }
    
    public void setBenefits(List<String> benefits) {
        this.benefits = benefits;
    }
    
    public LocalDateTime getDeadline() {
        return deadline;
    }
    
    public void setDeadline(LocalDateTime deadline) {
        this.deadline = deadline;
    }
    
    public VacancyStatus getStatus() {
        return status;
    }
    
    public void setStatus(VacancyStatus status) {
        this.status = status;
    }
    
    public Integer getApplications() {
        return applications;
    }
    
    public void setApplications(Integer applications) {
        this.applications = applications;
    }
    
    public List<JobCandidate> getCandidates() {
        return candidates;
    }
    
    public void setCandidates(List<JobCandidate> candidates) {
        this.candidates = candidates;
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