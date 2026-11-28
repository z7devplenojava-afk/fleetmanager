package com.z7design.fleet_manager.dto;

import lombok.*;

/** Requisição para criar uma caixa corporativa no Mailcow e conectá-la ao sistema. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCompanyMailboxRequest {
    /** Endereço completo, ex.: financeiro@fluxbus.com.br */
    private String emailAddress;
    private String displayName;
    private String password;
    /** Quota em MB (opcional; padrão 1024). */
    private Integer quotaMb;
}
