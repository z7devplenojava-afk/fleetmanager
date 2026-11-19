package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/** Item (det/prod) de uma NF-e modelo 55. */
@Entity
@Table(name = "electronic_nfe_items")
@Data
@NoArgsConstructor
public class ElectronicNfeItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "nfe_id", nullable = false)
    @JsonIgnore
    private ElectronicNfe nfe;

    @Column(name = "item_number", nullable = false)
    private Integer itemNumber;

    @Column(nullable = false, length = 60)
    private String code;

    @Column(nullable = false, length = 120)
    private String description;

    @Column(nullable = false, length = 8)
    private String ncm;

    @Column(nullable = false, length = 4)
    private String cfop;

    @Column(nullable = false, length = 6)
    private String unit;

    @Column(nullable = false, precision = 15, scale = 4)
    private BigDecimal quantity;

    @Column(name = "unit_value", nullable = false, precision = 15, scale = 10)
    private BigDecimal unitValue;

    @Column(name = "total_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalValue;

    @Column(name = "icms_orig", nullable = false, length = 1)
    private String icmsOrig;

    @Column(name = "icms_cst", nullable = false, length = 2)
    private String icmsCst;

    @Column(name = "icms_base", nullable = false, precision = 15, scale = 2)
    private BigDecimal icmsBase;

    @Column(name = "icms_rate", nullable = false, precision = 7, scale = 4)
    private BigDecimal icmsRate;

    @Column(name = "icms_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal icmsValue;

    @Column(name = "pis_cst", nullable = false, length = 2)
    private String pisCst;

    @Column(name = "pis_base", nullable = false, precision = 15, scale = 2)
    private BigDecimal pisBase;

    @Column(name = "pis_rate", nullable = false, precision = 7, scale = 4)
    private BigDecimal pisRate;

    @Column(name = "pis_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal pisValue;

    @Column(name = "cofins_cst", nullable = false, length = 2)
    private String cofinsCst;

    @Column(name = "cofins_base", nullable = false, precision = 15, scale = 2)
    private BigDecimal cofinsBase;

    @Column(name = "cofins_rate", nullable = false, precision = 7, scale = 4)
    private BigDecimal cofinsRate;

    @Column(name = "cofins_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal cofinsValue;
}
