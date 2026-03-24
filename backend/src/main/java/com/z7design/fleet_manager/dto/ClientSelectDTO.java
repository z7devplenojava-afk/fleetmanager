package com.z7design.fleet_manager.dto;

import java.util.UUID;

/**
 * DTO simplificado para seleÃ§Ã£o de clientes em formulÃ¡rios
 */
public class ClientSelectDTO {
    
    private UUID id;
    private String name;
    private String cnpj;
    
    // Constructors
    public ClientSelectDTO() {}
    
    public ClientSelectDTO(UUID id, String name, String cnpj) {
        this.id = id;
        this.name = name;
        this.cnpj = cnpj;
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getCnpj() {
        return cnpj;
    }
    
    public void setCnpj(String cnpj) {
        this.cnpj = cnpj;
    }
    
    /**
     * MÃ©todo utilitÃ¡rio para criar um ClientSelectDTO a partir de um ClientDTO
     */
    public static ClientSelectDTO fromClientDTO(ClientDTO clientDTO) {
        return new ClientSelectDTO(
            clientDTO.getId(),
            clientDTO.getName(),
            clientDTO.getCnpj()
        );
    }
}
