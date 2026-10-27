package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;
import com.z7design.fleet_manager.model.enums.UserStatus;

@Data
public class CreateUserRequest {

    @NotBlank(message = "Nome Ã© obrigatÃ³rio")
    @Size(min = 3, max = 100, message = "Nome deve ter entre 3 e 100 caracteres")
    private String name;

    @NotBlank(message = "Username Ã© obrigatÃ³rio")
    @Size(min = 3, max = 50, message = "Username deve ter entre 3 e 50 caracteres")
    private String username;

    @NotBlank(message = "Email Ã© obrigatÃ³rio")
    @Email(message = "Email invÃ¡lido")
    private String email;

    @NotBlank(message = "Senha Ã© obrigatÃ³ria")
    @Pattern(regexp = "^(?:(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[^a-zA-Z0-9\\s]).*|\\d{11}@202[0-9]|Flux[bB]us@2026)$", message = "Senha deve ser forte (maiúscula, minúscula, número, especial), CPF@2025/2026 ou Fluxbus@2026")
    private String password;

    private String cpf;

    private java.util.UUID employeeId;

    @Pattern(regexp = "^(?:\\d{9,20})?$", message = "WhatsApp deve conter apenas dígitos e ter entre 9 e 20 caracteres")
    private String whatsapp;

    private List<String> roles; // Array de Strings com nomes dos roles

    private Boolean active = true;

    private String status = UserStatus.ACTIVE.name();

    private java.util.UUID companyId;

    public String getCpf() {
        return cpf;
    }

    public void setCpf(String cpf) {
        this.cpf = cpf;
    }

    public java.util.UUID getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(java.util.UUID employeeId) {
        this.employeeId = employeeId;
    }

    // Getters and Setters explicitos para resolver problemas de compilaÃ§Ã£o com
    // Lombok
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getWhatsapp() {
        return whatsapp;
    }

    public void setWhatsapp(String whatsapp) {
        this.whatsapp = whatsapp;
    }

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public java.util.UUID getCompanyId() {
        return companyId;
    }

    public void setCompanyId(java.util.UUID companyId) {
        this.companyId = companyId;
    }
}
