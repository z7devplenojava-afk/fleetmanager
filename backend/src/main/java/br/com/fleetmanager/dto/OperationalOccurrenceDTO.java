package br.com.fleetmanager.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OperationalOccurrenceDTO {
    
    private UUID id;
    
    @NotNull(message = "Tipo da ocorrência é obrigatório")
    @Pattern(regexp = "^(SEGURANCA|DISCIPLINAR|EQUIPAMENTO|INCIDENTE|MANUTENCAO)$", 
             message = "Tipo deve ser SEGURANCA, DISCIPLINAR, EQUIPAMENTO, INCIDENTE ou MANUTENCAO")
    private String type;
    
    @NotBlank(message = "Título é obrigatório")
    @Size(min = 3, max = 200, message = "Título deve ter entre 3 e 200 caracteres")
    private String title;
    
    @Size(max = 2000, message = "Descrição não pode ter mais de 2000 caracteres")
    private String description;
    
    @NotNull(message = "ID do funcionário é obrigatório")
    private UUID employeeId;
    
    @Size(max = 200, message = "Local não pode ter mais de 200 caracteres")
    private String location;
    
    @Pattern(regexp = "^(PENDENTE|EM_ANDAMENTO|RESOLVIDO|CONCLUIDO)$", 
             message = "Status deve ser PENDENTE, EM_ANDAMENTO, RESOLVIDO ou CONCLUIDO")
    private String status;
    
    @NotNull(message = "Prioridade é obrigatória")
    @Pattern(regexp = "^(BAIXA|MEDIA|ALTA)$", message = "Prioridade deve ser BAIXA, MEDIA ou ALTA")
    private String priority;
    
    @NotNull(message = "Data da ocorrência é obrigatória")
    @PastOrPresent(message = "Data da ocorrência deve ser no passado ou presente")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime date;
    
    @Size(max = 200, message = "Responsável não pode ter mais de 200 caracteres")
    private String responsible;
    
    @Min(value = 1, message = "Número de advertência deve ser maior que 0")
    @Max(value = 999999, message = "Número de advertência deve ser menor que 999999")
    private Integer warningNumber;
    
    // Campos de resposta (não validados na entrada)
    private String employeeName;
    private String createdAt;
    private String updatedAt;
}
