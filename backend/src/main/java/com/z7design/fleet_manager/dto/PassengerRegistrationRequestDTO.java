package com.z7design.fleet_manager.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PassengerRegistrationRequestDTO {

    @NotBlank(message = "Nome completo é obrigatório")
    private String name;

    @NotBlank(message = "CPF é obrigatório")
    private String cpf;

    @NotBlank(message = "E-mail é obrigatório")
    @Email(message = "E-mail inválido")
    private String email;

    @JsonAlias({"whatsapp", "celular", "telefone"})
    private String phone;

    private String whatsapp;

    @NotBlank(message = "Nome de usuário é obrigatório")
    @Size(min = 3, max = 50, message = "Usuário deve ter entre 3 e 50 caracteres")
    private String username;

    @NotBlank(message = "Senha é obrigatória")
    @Size(min = 6, message = "A senha deve ter no mínimo 6 caracteres")
    private String password;

    private String confirmPassword;

    // Endereço (ViaCEP)
    private String cep;
    private String street;
    private String number;
    private String complement;
    private String neighborhood;
    private String city;
    private String state;

    // Acessibilidade / PCD
    @Builder.Default
    private Boolean isPcd = false;
    private String disabilityType;
    private String disabilityDescription;

    // LGPD
    @NotNull(message = "É obrigatório aceitar os termos da LGPD")
    private Boolean lgpdAccepted;

    // Empresa (opcional, se nulo associa à empresa padrão)
    private UUID companyId;

    public String getEffectivePhone() {
        if (phone != null && !phone.isBlank()) return phone;
        if (whatsapp != null && !whatsapp.isBlank()) return whatsapp;
        return "";
    }
}

