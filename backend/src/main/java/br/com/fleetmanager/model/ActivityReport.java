package br.com.fleetmanager.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import br.com.fleetmanager.model.enums.AbsenceStatus;
import br.com.fleetmanager.model.enums.ActivityReportStatus;

@Entity
@Table(name = "activity_reports")
public class ActivityReport {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(nullable = false)
    private String employeeName; // Cached name for easier reporting

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Column(nullable = false)
    private String clientName; // Cached name

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_post_id", nullable = false)
    private WorkPost workPost;

    @Column(nullable = false)
    private String workPostName; // Cached name

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Embedded
    private BallisticPlate ballisticPlate;

    @Embedded
    private WeaponRegistry weaponRegistry;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AbsenceStatus absenceStatus;

    @Column(columnDefinition = "TEXT")
    private String divergences;

    @Embedded
    private MedicalConsultation medicalConsultation;

    @OneToMany(mappedBy = "activityReport", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ActivityReportPhoto> photos;

    @OneToMany(mappedBy = "activityReport", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ActivityReportDocument> documents;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supervisor_id")
    private Employee supervisor; // Supervisor who approved/rejected

    private String supervisorName; // Cached name

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActivityReportStatus status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Employee getEmployee() {
        return employee;
    }

    public void setEmployee(Employee employee) {
        this.employee = employee;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public Client getClient() {
        return client;
    }

    public void setClient(Client client) {
        this.client = client;
    }

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public WorkPost getWorkPost() {
        return workPost;
    }

    public void setWorkPost(WorkPost workPost) {
        this.workPost = workPost;
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

    public BallisticPlate getBallisticPlate() {
        return ballisticPlate;
    }

    public void setBallisticPlate(BallisticPlate ballisticPlate) {
        this.ballisticPlate = ballisticPlate;
    }

    public WeaponRegistry getWeaponRegistry() {
        return weaponRegistry;
    }

    public void setWeaponRegistry(WeaponRegistry weaponRegistry) {
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

    public MedicalConsultation getMedicalConsultation() {
        return medicalConsultation;
    }

    public void setMedicalConsultation(MedicalConsultation medicalConsultation) {
        this.medicalConsultation = medicalConsultation;
    }

    public List<ActivityReportPhoto> getPhotos() {
        return photos;
    }

    public void setPhotos(List<ActivityReportPhoto> photos) {
        this.photos = photos;
        if (this.photos != null) {
            this.photos.forEach(photo -> photo.setActivityReport(this));
        }
    }

    public List<ActivityReportDocument> getDocuments() {
        return documents;
    }

    public void setDocuments(List<ActivityReportDocument> documents) {
        this.documents = documents;
        if (this.documents != null) {
            this.documents.forEach(document -> document.setActivityReport(this));
        }
    }

    public Employee getSupervisor() {
        return supervisor;
    }

    public void setSupervisor(Employee supervisor) {
        this.supervisor = supervisor;
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

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
