package com.z7design.fleet_manager.dto;

import lombok.Data;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * PRD 1.0 - MÓDULO 3 (RF-03.1): resultado do filtro de elegibilidade de um veículo.
 */
@Data
public class VehicleEligibilityDTO {

    private UUID vehicleId;
    private String plate;
    private String model;
    private Integer year;

    /** Veículo atende a TODOS os critérios exigidos. */
    private boolean eligible;

    /** Detalhe por critério: nome → {required, present, ok, detail}. */
    private Map<String, CriterionResult> criteria = new LinkedHashMap<>();

    /** Lista de critérios reprovados (resumo executivo). */
    private java.util.List<String> failures = new java.util.ArrayList<>();

    @Data
    public static class CriterionResult {
        private boolean required;
        private boolean present;
        private boolean ok;
        private String detail;

        public static CriterionResult of(boolean required, boolean present, String detail) {
            CriterionResult r = new CriterionResult();
            r.setRequired(required);
            r.setPresent(present);
            r.setOk(!required || present);
            r.setDetail(detail);
            return r;
        }
    }
}
