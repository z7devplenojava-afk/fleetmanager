package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request para atualizar email de um usuÃ¡rio
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEmailRequest {

    /**
     * Email corporativo ou pessoal vÃ¡lido
     */
    @NotBlank(message = "Email Ã© obrigatÃ³rio")
    @Email(message = "Email em formato invÃ¡lido")
    private String email;
}


