package com.z7design.fleet_manager.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Resultado do parse de NFS-e com validação de cadastro do prestador de serviço")
public class NfseValidationResultDTO {

    private NfseParsedDataDTO parsedData;

    @Schema(description = "Indica se o prestador de serviços já está cadastrado no sistema")
    private boolean prestadorRegistered;

    @Schema(description = "ID do fornecedor/prestador caso já cadastrado")
    private UUID prestadorId;

    @Schema(description = "Razão social ou nome do prestador")
    private String prestadorName;

    @Schema(description = "CNPJ ou CPF limpo do prestador")
    private String prestadorCnpj;

    @Schema(description = "Mensagem orientativa sobre o status da NFS-e")
    private String statusMessage;

    @Schema(description = "URL do PDF/XML armazenado")
    private String fileUrl;
}

