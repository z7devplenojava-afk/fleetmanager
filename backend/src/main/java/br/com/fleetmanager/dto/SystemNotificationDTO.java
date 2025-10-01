package br.com.fleetmanager.dto;

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
    
    @NotNull(message = "Tipo da notificação é obrigatório")
    @Pattern(regexp = "^(NOVO_CLIENTE|CONTRATO_VENCENDO|FUNCIONARIO_ATRASADO|OCORRENCIA|ESCALA|ADVERTENCIA|NOVO_CONTRATO|LEAD_NOVO|PROPOSTA_ENVIADA|ORCAMENTO_APROVADO)$", 
             message = "Tipo deve ser um dos valores válidos")
    private String type;
    
    @NotBlank(message = "Título é obrigatório")
    @Size(min = 3, max = 200, message = "Título deve ter entre 3 e 200 caracteres")
    private String title;
    
    @Size(max = 2000, message = "Descrição não pode ter mais de 2000 caracteres")
    private String description;
    
    @NotNull(message = "Prioridade é obrigatória")
    @Pattern(regexp = "^(BAIXA|MEDIA|ALTA)$", message = "Prioridade deve ser BAIXA, MEDIA ou ALTA")
    private String priority;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;
    
    private Boolean read;
    
    private UUID recipientId;
    
    @Size(max = 200, message = "Nome do funcionário não pode ter mais de 200 caracteres")
    private String employeeName;
    
    @Size(max = 200, message = "Nome do cliente não pode ter mais de 200 caracteres")
    private String clientName;
    
    @Size(max = 100, message = "Referência do contrato não pode ter mais de 100 caracteres")
    private String contractReference;
    
    @DecimalMin(value = "0.0", inclusive = false, message = "Valor deve ser maior que zero")
    @Digits(integer = 15, fraction = 2, message = "Valor deve ter no máximo 15 dígitos inteiros e 2 decimais")
    private BigDecimal value;
    
    @Size(max = 50, message = "Departamento não pode ter mais de 50 caracteres")
    private String department;
    
    // Campos de resposta (não validados na entrada)
    private String recipientName;
    private String createdAt;
}
