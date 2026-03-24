package com.z7design.fleet_manager.dto;

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
    
    @NotNull(message = "Tipo da ocorrÃªncia Ã© obrigatÃ³rio")
    @Pattern(regexp = "^(SEGURANCA|DISCIPLINAR|EQUIPAMENTO|INCIDENTE|MANUTENCAO)$", 
             message = "Tipo deve ser SEGURANCA, DISCIPLINAR, EQUIPAMENTO, INCIDENTE ou MANUTENCAO")
    private String type;
    
    @NotBlank(message = "TÃ­tulo Ã© obrigatÃ³rio")
    @Size(min = 3, max = 200, message = "TÃ­tulo deve ter entre 3 e 200 caracteres")
    private String title;
    
    @Size(max = 2000, message = "DescriÃ§Ã£o nÃ£o pode ter mais de 2000 caracteres")
    private String description;
    
    @NotNull(message = "ID do funcionÃ¡rio Ã© obrigatÃ³rio")
    private UUID employeeId;
    
    @Size(max = 200, message = "Local nÃ£o pode ter mais de 200 caracteres")
    private String location;
    
    @Pattern(regexp = "^(PENDENTE|EM_ANDAMENTO|RESOLVIDO|CONCLUIDO)$", 
             message = "Status deve ser PENDENTE, EM_ANDAMENTO, RESOLVIDO ou CONCLUIDO")
    private String status;
    
    @NotNull(message = "Prioridade Ã© obrigatÃ³ria")
    @Pattern(regexp = "^(BAIXA|MEDIA|ALTA)$", message = "Prioridade deve ser BAIXA, MEDIA ou ALTA")
    private String priority;
    
    @NotNull(message = "Data da ocorrÃªncia Ã© obrigatÃ³ria")
    @PastOrPresent(message = "Data da ocorrÃªncia deve ser no passado ou presente")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime date;
    
    @Size(max = 200, message = "ResponsÃ¡vel nÃ£o pode ter mais de 200 caracteres")
    private String responsible;
    
    @Min(value = 1, message = "NÃºmero de advertÃªncia deve ser maior que 0")
    @Max(value = 999999, message = "NÃºmero de advertÃªncia deve ser menor que 999999")
    private Integer warningNumber;
    
    // Campos de resposta (nÃ£o validados na entrada)
    private String employeeName;
    private String createdAt;
    private String updatedAt;
}

