package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.VacancyStatus;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class JobVacancyDTO {
    
    private UUID id;
    
    @NotBlank(message = "TÃ­tulo da vaga Ã© obrigatÃ³rio")
    private String title;
    
    @NotBlank(message = "Cargo Ã© obrigatÃ³rio")
    private String position;
    
    @NotBlank(message = "LocalizaÃ§Ã£o Ã© obrigatÃ³ria")
    private String location;
    
    private List<String> requirements;
    
    @NotBlank(message = "Jornada de trabalho Ã© obrigatÃ³ria")
    private String workSchedule;
    
    @NotNull(message = "SalÃ¡rio Ã© obrigatÃ³rio")
    @DecimalMin(value = "0.0", inclusive = false, message = "SalÃ¡rio deve ser maior que zero")
    private BigDecimal salary;
    
    private List<String> benefits;
    
    @NotNull(message = "Prazo de inscriÃ§Ã£o Ã© obrigatÃ³rio")
    private LocalDateTime deadline;
    
    private VacancyStatus status;
    
    private Integer applications;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    private Boolean requiresCnh;
    private String cnhCategory;
    
    @NotBlank(message = "FunÃ§Ã£o Ã© obrigatÃ³ria")
    private String function;
    
    // Construtores
    public JobVacancyDTO() {}
    
    public JobVacancyDTO(UUID id, String title, String position, String function, String location,
                        List<String> requirements, String workSchedule, BigDecimal salary,
                        List<String> benefits, LocalDateTime deadline, VacancyStatus status,
                        Integer applications, LocalDateTime createdAt, LocalDateTime updatedAt,
                        Boolean requiresCnh, String cnhCategory) {
        this.id = id;
        this.title = title;
        this.position = position;
        this.function = function;
        this.location = location;
        this.requirements = requirements;
        this.workSchedule = workSchedule;
        this.salary = salary;
        this.benefits = benefits;
        this.deadline = deadline;
        this.status = status;
        this.applications = applications;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
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
    
    public String getLocation() {
        return location;
    }
    
    public void setLocation(String location) {
        this.location = location;
    }
    
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

    public String getFunction() { return function; }
    public void setFunction(String function) { this.function = function; }
} 
