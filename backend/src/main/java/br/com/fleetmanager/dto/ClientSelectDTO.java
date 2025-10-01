package br.com.fleetmanager.dto;

import java.util.UUID;

/**
 * DTO simplificado para seleção de clientes em formulários
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
     * Método utilitário para criar um ClientSelectDTO a partir de um ClientDTO
     */
    public static ClientSelectDTO fromClientDTO(ClientDTO clientDTO) {
        return new ClientSelectDTO(
            clientDTO.getId(),
            clientDTO.getName(),
            clientDTO.getCnpj()
        );
    }
}