package com.z7design.fleet_manager.dto;

import lombok.Data;

/**
 * Payload de finalizacao de viagem: km final, passageiros e ocorrencia.
 */
@Data
public class TripFinishRequestDTO {
    private Integer finalKm;
    private Integer passengersRealized;
    private String occurrence;
}
