package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Entidade que representa um item de EPI dentro de uma Ficha de Entrega
 */
@Entity
@Table(name = "epi_delivery_form_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class EPIDeliveryFormItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull(message = "Ficha de entrega Ã© obrigatÃ³ria")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_form_id", nullable = false)
    @JsonBackReference
    private EPIDeliveryForm deliveryForm;

    @NotNull(message = "Nome do EPI Ã© obrigatÃ³rio")
    @Column(name = "epi_name", nullable = false, length = 255)
    private String epiName;

    @Column(name = "quantity", nullable = false)
    @Builder.Default
    private Integer quantity = 1;

    @Column(name = "ca", length = 100)
    private String ca; // NÃºmero do Certificado de AprovaÃ§Ã£o

    @Column(name = "ca_name", length = 255)
    private String caName; // Nome/DescriÃ§Ã£o do CA

    @Column(name = "validity_date")
    private LocalDate validityDate;

    @Column(name = "uniform_type", length = 50)
    private String uniformType; // COMPLETO ou INDIVIDUAL

    @Column(name = "uniform_piece", length = 50)
    private String uniformPiece; // CALCA, CAMISA, etc.

    @Column(name = "stock_item_id")
    private UUID stockItemId;

    @Column(columnDefinition = "TEXT")
    private String observations;
}






