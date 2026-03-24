package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * DTO para atualizaÃ§Ã£o de usuÃ¡rios
 * NÃ£o inclui validaÃ§Ã£o obrigatÃ³ria de senha (pode ser null)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {

    @NotBlank(message = "Nome Ã© obrigatÃ³rio")
    @Size(min = 3, max = 100, message = "Nome deve ter entre 3 e 100 caracteres")
    private String name;

    @NotBlank(message = "Email Ã© obrigatÃ³rio")
    @Email(message = "Email invÃ¡lido")
    private String email;

    @NotBlank(message = "Username Ã© obrigatÃ³rio")
    @Size(min = 3, max = 50, message = "Username deve ter entre 3 e 50 caracteres")
    private String username;

    /**
     * Senha opcional - sÃ³ validada se fornecida
     */
    @Size(min = 6, message = "Senha deve ter no mÃ­nimo 6 caracteres")
    @Pattern(regexp = "^(?:(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[^a-zA-Z0-9\\s]).*|\\d{11}@2025)?$", message = "Senha deve ser forte (maiÃºscula, minÃºscula, dÃ­gito, especial) ou no formato CPF@2025")
    private String password;

    @Pattern(regexp = "^\\d{9,20}$|^$", message = "WhatsApp deve conter apenas dÃ­gitos (9-20 caracteres)")
    private String whatsapp;

    private List<String> roles; // Array de Strings com nomes dos roles

    private Boolean active;

    private String status;

    // Campos de informaÃ§Ãµes adicionais (opcionais)
    @Size(max = 500, message = "Avatar deve ter no mÃ¡ximo 500 caracteres")
    private String avatar;

    @Size(max = 100, message = "Departamento deve ter no mÃ¡ximo 100 caracteres")
    private String department;

    @Size(max = 100, message = "PosiÃ§Ã£o deve ter no mÃ¡ximo 100 caracteres")
    private String position;

    @Size(max = 50, message = "CÃ³digo do funcionÃ¡rio deve ter no mÃ¡ximo 50 caracteres")
    private String employeeCode;

    @Pattern(regexp = "^\\d{9,20}$|^$", message = "Telefone deve conter apenas dÃ­gitos (9-20 caracteres)")
    private String phone;

    @Size(max = 500, message = "EndereÃ§o deve ter no mÃ¡ximo 500 caracteres")
    private String address;

    private UUID companyId;

    // Getters and Setters explicitos para resolver problemas de compilaÃ§Ã£o com
    // Lombok
    public UUID getCompanyId() {
        return companyId;
    }

    public void setCompanyId(UUID companyId) {
        this.companyId = companyId;
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

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
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

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public String getEmployeeCode() {
        return employeeCode;
    }

    public void setEmployeeCode(String employeeCode) {
        this.employeeCode = employeeCode;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }
}
