package com.z7design.fleet_manager.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemNotificationDTO {
    
    private UUID id;
    
    @NotNull(message = "Tipo da notificaÃ§Ã£o Ã© obrigatÃ³rio")
    @Pattern(regexp = "^(NOVO_CLIENTE|CONTRATO_VENCENDO|FUNCIONARIO_ATRASADO|OCORRENCIA|ESCALA|ADVERTENCIA|NOVO_CONTRATO|LEAD_NOVO|PROPOSTA_ENVIADA|ORCAMENTO_APROVADO)$", 
             message = "Tipo deve ser um dos valores vÃ¡lidos")
    private String type;
    
    @NotBlank(message = "TÃ­tulo Ã© obrigatÃ³rio")
    @Size(min = 3, max = 200, message = "TÃ­tulo deve ter entre 3 e 200 caracteres")
    private String title;
    
    @Size(max = 2000, message = "DescriÃ§Ã£o nÃ£o pode ter mais de 2000 caracteres")
    private String description;
    
    @NotNull(message = "Prioridade Ã© obrigatÃ³ria")
    @Pattern(regexp = "^(BAIXA|MEDIA|ALTA)$", message = "Prioridade deve ser BAIXA, MEDIA ou ALTA")
    private String priority;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;
    
    private Boolean read;
    
    private UUID recipientId;
    
    @Size(max = 200, message = "Nome do funcionÃ¡rio nÃ£o pode ter mais de 200 caracteres")
    private String employeeName;
    
    @Size(max = 200, message = "Nome do cliente nÃ£o pode ter mais de 200 caracteres")
    private String clientName;
    
    @Size(max = 100, message = "ReferÃªncia do contrato nÃ£o pode ter mais de 100 caracteres")
    private String contractReference;
    
    @DecimalMin(value = "0.0", inclusive = false, message = "Valor deve ser maior que zero")
    @Digits(integer = 15, fraction = 2, message = "Valor deve ter no mÃ¡ximo 15 dÃ­gitos inteiros e 2 decimais")
    private BigDecimal value;
    
    @Size(max = 50, message = "Departamento nÃ£o pode ter mais de 50 caracteres")
    private String department;
    
    // Campos de resposta (nÃ£o validados na entrada)
    private String recipientName;
    private String createdAt;
}

