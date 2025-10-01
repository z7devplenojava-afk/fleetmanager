package br.com.fleetmanager.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeDTO {
    private java.util.UUID id;
    private String name;
    private String cpf;
    private String rg;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate birthDate;
    private String gender;
    // private String maritalStatus;
    // private String photoUrl;
    // private String currentScale;
    private String email;
    private String phone;
    private String cnhNumber;
    @JsonDeserialize(using = AddressDeserializer.class)
    private AddressDTO address;
    private BankInfoDTO bankInfo;
    private JobInfoDTO jobInfo;
    private List<DocumentDTO> documents;
    private EmergencyContactDTO emergencyContact;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    // private String tituloEleitor;
    // private String carteiraIdentidade;
    // private String grauInstrucao;
    // private String pai;
    // private String mae;
    // private String naturalidade;
    // private String nationality;
    private String registrationNumber;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate hireDate;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate terminationDate;
    // private String cep;
    // private String ctps;
    // private String cbo;
    // private String pis;
    // private BigDecimal salario;
    // private Boolean fgtsOptante;
    // @JsonFormat(pattern = "yyyy-MM-dd")
    // private LocalDate fgtsDataOpcao;
    // private String fgtsBancoDepositario;
    // private String empresaNome;
    // private String empresaEndereco;
    // private String empresaCnpj;
    // private Boolean possuiWhatsapp;
    // private String caminhoPdf;
    // private String mesReferencia;
    // private String anoReferencia;
    private String notes;
    private String status;
    /**
     * Usuário do sistema vinculado ao funcionário (opcional).
     * Só deve ser preenchido se o funcionário também for usuário do sistema.
     */
    private IdOnlyDTO user;
    private PositionDTO position;
    private UnitDTO unit;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AddressDTO {
        private String street;
        private String number;
        private String complement;
        private String neighborhood;
        private String city;
        private String state;
        private String zipCode;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BankInfoDTO {
        private String bank;
        private String agency;
        private String account;
        private String accountType;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class JobInfoDTO {
        private String position;
        private String function;
        private String unit;
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate admissionDate;
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate probationEndDate;
        private String contractType;
        private BigDecimal salary;
        private String status;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DocumentDTO {
        private java.util.UUID id;
        private String type;
        private String number;
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate issueDate;
        private String issuingAuthority;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EmergencyContactDTO {
        private String name;
        private String relationship;
        private String phone;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IdOnlyDTO {
        private java.util.UUID id;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PositionDTO {
        private java.util.UUID id;
        private String name;
        private String description;
        private Double baseSalary;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UnitDTO {
        private java.util.UUID id;
        private String name;
        private String description;
        private String address;
        private String phone;
        private String email;
        private String code;
        private String manager;
        private boolean active;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
    
    // Deserializador customizado para o campo address
    public static class AddressDeserializer extends StdDeserializer<AddressDTO> {
        
        public AddressDeserializer() {
            super(AddressDTO.class);
        }
        
        @Override
        public AddressDTO deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
            JsonNode node = p.getCodec().readTree(p);
            
            AddressDTO address = new AddressDTO();
            
            if (node.isTextual()) {
                // Se for string, usar como street
                address.setStreet(node.asText());
            } else if (node.isObject()) {
                // Se for objeto, mapear os campos
                if (node.has("street")) {
                    address.setStreet(node.get("street").asText());
                }
                if (node.has("number")) {
                    address.setNumber(node.get("number").asText());
                }
                if (node.has("complement")) {
                    address.setComplement(node.get("complement").asText());
                }
                if (node.has("neighborhood")) {
                    address.setNeighborhood(node.get("neighborhood").asText());
                }
                if (node.has("city")) {
                    address.setCity(node.get("city").asText());
                }
                if (node.has("state")) {
                    address.setState(node.get("state").asText());
                }
                if (node.has("zipCode")) {
                    address.setZipCode(node.get("zipCode").asText());
                }
            }
            
            return address;
        }
    }
} 