package com.z7design.fleet_manager.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonSetter;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true) // Ignora campos desconhecidos como "employeeName" quando criando
public class CreateOccurrenceDTO {
    
    // ID opcional (usado apenas em atualizaÃ§Ãµes, ignorado na criaÃ§Ã£o)
    private UUID id;
    
    // Setter customizado para aceitar string vazia e converter para null
    @JsonSetter
    public void setId(Object idValue) {
        if (idValue == null || idValue.toString().trim().isEmpty()) {
            this.id = null;
        } else if (idValue instanceof UUID) {
            this.id = (UUID) idValue;
        } else {
            try {
                this.id = UUID.fromString(idValue.toString());
            } catch (IllegalArgumentException e) {
                this.id = null; // Ignora IDs invÃ¡lidos
            }
        }
    }
    
    @NotNull(message = "Tipo da ocorrÃªncia Ã© obrigatÃ³rio")
    private String type;
    
    @NotBlank(message = "TÃ­tulo Ã© obrigatÃ³rio")
    private String title;
    
    private String description;
    
    @NotNull(message = "ID do funcionÃ¡rio Ã© obrigatÃ³rio")
    private UUID employeeId;
    
    private String location;
    
    private String status;
    
    private String priority;
    
    @NotNull(message = "Data da ocorrÃªncia Ã© obrigatÃ³ria")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private String date; // Aceita string no formato yyyy-MM-dd
    
    private String startTime;
    
    private String endTime;
    
    private String responsible;
    
    private String startDate;
    
    private String endDate;
    
    private String reason;
    
    private Integer warningNumber;
    
    /**
     * Converte a string de data para LocalDateTime
     * Se apenas a data for fornecida, usa a hora atual
     */
    public LocalDateTime getDateAsLocalDateTime() {
        if (date == null || date.isEmpty()) {
            return LocalDateTime.now();
        }
        try {
            // Tentar parsear como LocalDate primeiro (formato yyyy-MM-dd)
            LocalDate localDate = LocalDate.parse(date, DateTimeFormatter.ISO_LOCAL_DATE);
            // Combinar com a hora atual
            return localDate.atStartOfDay();
        } catch (Exception e) {
            // Se falhar, tentar parsear como LocalDateTime completo
            try {
                return LocalDateTime.parse(date, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            } catch (Exception e2) {
                // Se tudo falhar, retornar agora
                return LocalDateTime.now();
            }
        }
    }
}


