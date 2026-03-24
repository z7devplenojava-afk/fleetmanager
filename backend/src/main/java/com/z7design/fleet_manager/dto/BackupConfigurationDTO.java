package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BackupConfigurationDTO {
    
    @NotBlank(message = "Nome Ã© obrigatÃ³rio")
    private String name;
    
    @NotBlank(message = "Tipo Ã© obrigatÃ³rio (LOCAL ou REMOTE)")
    @Pattern(regexp = "LOCAL|REMOTE", message = "Tipo deve ser LOCAL ou REMOTE")
    private String type;
    
    @NotBlank(message = "Host Ã© obrigatÃ³rio")
    private String host;
    
    @NotNull(message = "Porta Ã© obrigatÃ³ria")
    @Min(value = 1, message = "Porta deve ser maior que 0")
    @Max(value = 65535, message = "Porta deve ser menor que 65536")
    private Integer port;
    
    @NotBlank(message = "Nome do banco Ã© obrigatÃ³rio")
    private String database;
    
    @NotBlank(message = "UsuÃ¡rio Ã© obrigatÃ³rio")
    private String username;
    
    @NotBlank(message = "Senha Ã© obrigatÃ³ria")
    private String password;
    
    private Boolean enabled;
    private Boolean autoBackup;
    private String schedule;
    private Integer retentionDays;
    private String backupPath;
    private Boolean compressBackup;
}


