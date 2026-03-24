package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.TransportGuide;
import com.z7design.fleet_manager.model.enums.TransportGuideStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransportGuideDTO {

    private Long id;

    @NotBlank(message = "CNPJ Ã© obrigatÃ³rio")
    private String cnpj;

    @NotBlank(message = "Nome da empresa Ã© obrigatÃ³rio")
    private String empresa;

    private String numeroColete;

    @NotBlank(message = "NÃºmero da arma Ã© obrigatÃ³rio")
    private String numeroArma;

    @NotBlank(message = "Calibre Ã© obrigatÃ³rio")
    private String calibre;

    @NotNull(message = "Quantidade de muniÃ§Ãµes Ã© obrigatÃ³ria")
    @Positive(message = "Quantidade de muniÃ§Ãµes deve ser positiva")
    private Integer qtdMunicoes;

    @NotBlank(message = "Origem Ã© obrigatÃ³ria")
    private String origem;

    @NotBlank(message = "Destino Ã© obrigatÃ³rio")
    private String destino;

    @NotBlank(message = "Trajeto Ã© obrigatÃ³rio")
    private String trajeto;

    @NotBlank(message = "Motivo Ã© obrigatÃ³rio")
    private String motivo;

    private TransportGuideStatus status;

    private String arquivoGuiaPath;

    private String createdBy;
    private String approvedBy;
    private LocalDateTime approvedAt;
    private String rejectedBy;
    private LocalDateTime rejectedAt;
    private String rejectionReason;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public TransportGuideDTO(TransportGuide entity) {
        this.id = entity.getId();
        this.cnpj = entity.getCnpj();
        this.empresa = entity.getEmpresa();
        this.numeroColete = entity.getNumeroColete();
        this.numeroArma = entity.getNumeroArma();
        this.calibre = entity.getCalibre();
        this.qtdMunicoes = entity.getQtdMunicoes();
        this.origem = entity.getOrigem();
        this.destino = entity.getDestino();
        this.trajeto = entity.getTrajeto();
        this.motivo = entity.getMotivo();
        this.status = entity.getStatus();
        this.arquivoGuiaPath = entity.getArquivoGuiaPath();
        this.createdBy = entity.getCreatedBy();
        this.approvedBy = entity.getApprovedBy();
        this.approvedAt = entity.getApprovedAt();
        this.rejectedBy = entity.getRejectedBy();
        this.rejectedAt = entity.getRejectedAt();
        this.rejectionReason = entity.getRejectionReason();
        this.createdAt = entity.getCreatedAt();
        this.updatedAt = entity.getUpdatedAt();
    }

    public TransportGuide toEntity() {
        return TransportGuide.builder()
                .id(this.id)
                .cnpj(this.cnpj)
                .empresa(this.empresa)
                .numeroColete(this.numeroColete)
                .numeroArma(this.numeroArma)
                .calibre(this.calibre)
                .qtdMunicoes(this.qtdMunicoes)
                .origem(this.origem)
                .destino(this.destino)
                .trajeto(this.trajeto)
                .motivo(this.motivo)
                .status(this.status)
                .arquivoGuiaPath(this.arquivoGuiaPath)
                .createdBy(this.createdBy)
                .approvedBy(this.approvedBy)
                .approvedAt(this.approvedAt)
                .rejectedBy(this.rejectedBy)
                .rejectedAt(this.rejectedAt)
                .rejectionReason(this.rejectionReason)
                .build();
    }
}




























