package com.z7design.fleet_manager.model;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Um bloco de gozo de ferias dentro de uma solicitacao fracionada.
 * CLT Art. 134, §1º (apos a Lei 13.467/2017):
 *  - ate 3 blocos;
 *  - pelo menos um bloco com >= 14 dias corridos;
 *  - os demais blocos com >= 5 dias corridos cada.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class VacationBloco {

    private LocalDate inicio;

    private LocalDate fim;

    /** Dias corridos contados inclusivamente (fim - inicio + 1). */
    private Integer dias;
}
