package br.com.fleetmanager.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import br.com.fleetmanager.model.enums.ClientStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "clients")
public class Client {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private java.util.UUID id;
    
    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 255, message = "Nome deve ter no máximo 255 caracteres")
    @Column(name = "name", nullable = false)
    private String name;
    
    @NotBlank(message = "CNPJ é obrigatório")
    @Size(min = 14, max = 18, message = "CNPJ deve ter entre 14 e 18 caracteres")
    @Column(name = "cnpj", nullable = false, unique = true)
    private String cnpj;
    
    @Email(message = "Email deve ser válido")
    @Size(max = 255, message = "Email deve ter no máximo 255 caracteres")
    @Column(name = "email")
    private String email;
    
    @Size(max = 20, message = "Telefone deve ter no máximo 20 caracteres")
    @Column(name = "phone")
    private String phone;
    
    @Size(max = 20, message = "Celular deve ter no máximo 20 caracteres")
    @Column(name = "mobile")
    private String mobile;
    
    @Size(max = 255, message = "Endereço deve ter no máximo 255 caracteres")
    @Column(name = "address")
    private String address;
    
    @Size(max = 100, message = "Cidade deve ter no máximo 100 caracteres")
    @Column(name = "city")
    private String city;
    
    @Size(max = 2, message = "Estado deve ter no máximo 2 caracteres")
    @Column(name = "state")
    private String state;
    
    @Size(max = 10, message = "CEP deve ter no máximo 10 caracteres")
    @Column(name = "zip_code")
    private String zipCode;
    
    @Size(max = 255, message = "Nome do contato deve ter no máximo 255 caracteres")
    @Column(name = "contact_name")
    private String contactName;
    
    @Email(message = "Email do contato deve ser válido")
    @Size(max = 255, message = "Email do contato deve ter no máximo 255 caracteres")
    @Column(name = "contact_email")
    private String contactEmail;
    
    @Size(max = 20, message = "Telefone do contato deve ter no máximo 20 caracteres")
    @Column(name = "contact_phone")
    private String contactPhone;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ClientStatus status = ClientStatus.ACTIVE;
    
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("client")
    private List<Unit> units = new ArrayList<>();
    
    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("client")
    private List<Contract> contracts = new ArrayList<>();
    
    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("client")
    private List<WorkPost> workPosts = new ArrayList<>();

    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @JsonIgnoreProperties("client")
    private List<MeasurementBulletin> measurementBulletins = new ArrayList<>();

    // Constructors
    public Client() {}
    
    public Client(String name, String cnpj) {
        this.name = name;
        this.cnpj = cnpj;
    }
    
    // Getters and Setters
    public java.util.UUID getId() {
        return id;
    }
    
    public void setId(java.util.UUID id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getCnpj() {
        return cnpj;
    }
    
    public void setCnpj(String cnpj) {
        this.cnpj = cnpj;
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
    
    public String getMobile() {
        return mobile;
    }
    
    public void setMobile(String mobile) {
        this.mobile = mobile;
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
    
    public String getZipCode() {
        return zipCode;
    }
    
    public void setZipCode(String zipCode) {
        this.zipCode = zipCode;
    }
    
    public String getContactName() {
        return contactName;
    }
    
    public void setContactName(String contactName) {
        this.contactName = contactName;
    }
    
    public String getContactEmail() {
        return contactEmail;
    }
    
    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }
    
    public String getContactPhone() {
        return contactPhone;
    }
    
    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }
    
    public ClientStatus getStatus() {
        return status;
    }
    
    public void setStatus(ClientStatus status) {
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
    
    public List<Unit> getUnits() {
        return units;
    }
    
    public void setUnits(List<Unit> units) {
        this.units = units;
    }
    
    public List<Contract> getContracts() {
        return contracts;
    }
    
    public void setContracts(List<Contract> contracts) {
        this.contracts = contracts;
    }
} 