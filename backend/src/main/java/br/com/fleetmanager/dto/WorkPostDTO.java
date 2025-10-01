package br.com.fleetmanager.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import br.com.fleetmanager.model.enums.WorkPostStatus;
import br.com.fleetmanager.model.enums.WorkPostType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "DTO para Posto de Trabalho")
public class WorkPostDTO {
    
    private java.util.UUID id;
    
    @Schema(description = "Código do posto", example = "POSTO-001")
    @NotBlank(message = "Código do posto é obrigatório")
    @Size(max = 50, message = "Código do posto deve ter no máximo 50 caracteres")
    private String postCode;
    
    @Schema(description = "Nome do posto", example = "Posto Principal - Barbosa Mello")
    @NotBlank(message = "Nome do posto é obrigatório")
    @Size(max = 200, message = "Nome do posto deve ter no máximo 200 caracteres")
    private String name;
    
    @Schema(description = "Descrição detalhada do posto")
    @Size(max = 1000, message = "Descrição deve ter no máximo 1000 caracteres")
    private String description;
    
    @Schema(description = "Tipo do posto", example = "POSTO_24H")
    @NotNull(message = "Tipo do posto é obrigatório")
    private WorkPostType type;
    
    @Schema(description = "Status do posto", example = "EM_IMPLANTACAO")
    private WorkPostStatus status;
    
    // Localização
    @Schema(description = "Endereço do posto", example = "Rua das Flores, 123")
    @NotBlank(message = "Endereço é obrigatório")
    private String address;
    
    @Schema(description = "Cidade", example = "Belo Horizonte")
    private String city;
    
    @Schema(description = "Estado", example = "MG")
    private String state;
    
    @Schema(description = "CEP", example = "30123-456")
    private String zipCode;
    
    // Relacionamentos
    @Schema(description = "ID do cliente", example = "1")
    @NotNull(message = "ID do cliente é obrigatório")
    private java.util.UUID clientId;
    
    @Schema(description = "ID do contrato", example = "1")
    private java.util.UUID contractId;
    
    // Configuração de Pessoal
    @Schema(description = "Quantidade de vigilantes necessários", example = "4")
    @NotNull(message = "Quantidade de vigilantes é obrigatória")
    private Integer requiredVigilantes;
    
    @Schema(description = "Escala de trabalho", example = "12x36")
    @NotBlank(message = "Escala de trabalho é obrigatória")
    private String workSchedule;
    
    @Schema(description = "Horário de início do turno", example = "18:00")
    @NotNull(message = "Horário de início é obrigatório")
    private LocalTime shiftStart;
    
    @Schema(description = "Horário de fim do turno", example = "06:00")
    @NotNull(message = "Horário de fim é obrigatório")
    private LocalTime shiftEnd;
    
    @Schema(description = "Descrição do turno", example = "18:00 às 06:00")
    private String shiftDescription;
    
    // Benefícios e Condições
    @Schema(description = "Vale transporte disponível")
    private Boolean transportVoucher;
    
    @Schema(description = "Ajuda de custo disponível")
    private Boolean costAllowance;
    
    @Schema(description = "Valor da ajuda de custo", example = "400.00")
    private BigDecimal costAllowanceValue;
    
    @Schema(description = "Intrajornada disponível")
    private Boolean intrajourney;
    
    @Schema(description = "Alimentação no local disponível")
    private Boolean localMeal;
    
    @Schema(description = "Ticket alimentação disponível")
    private Boolean mealTicket;
    
    @Schema(description = "Plano de saúde disponível")
    private Boolean healthPlan;
    
    @Schema(description = "Plano odontológico disponível")
    private Boolean dentalPlan;
    
    // Recursos e Equipamentos
    @Schema(description = "Quantidade de carros", example = "1")
    private Integer cars;
    
    @Schema(description = "Quantidade de motos", example = "0")
    private Integer motorcycles;
    
    @Schema(description = "Quantidade de rádios", example = "0")
    private Integer radios;
    
    @Schema(description = "Quantidade de corporativos", example = "0")
    private Integer corporates;
    
    @Schema(description = "Banco DOC disponível")
    private Boolean documentBank;
    
    // Conformidade Legal
    @Schema(description = "Lista de Normas Regulamentadoras")
    private List<String> nrs;
    
    @Schema(description = "PGR disponível")
    private Boolean pgr;
    
    @Schema(description = "PCMSO disponível")
    private Boolean pcmso;
    
    @Schema(description = "Lista de EPIs necessários")
    private List<String> epis;
    
    @Schema(description = "Lista de treinamentos necessários")
    private List<String> trainings;
    
    // Implantação
    @Schema(description = "Data de implantação", example = "2025-01-04")
    private LocalDate implementationDate;
    
    @Schema(description = "Horário de implantação", example = "06:00")
    private LocalTime implementationTime;
    
    @Schema(description = "Observações complementares")
    @Size(max = 2000, message = "Observações deve ter no máximo 2000 caracteres")
    private String observations;
    
    @Schema(description = "ID do responsável pela implantação")
    private UUID responsibleId;
    
    // Campos adicionais para resposta
    @Schema(description = "Nome do cliente")
    private String clientName;
    
    @Schema(description = "CNPJ do cliente")
    private String clientCnpj;
    
    @Schema(description = "Nome do responsável")
    private String responsibleName;
    
    @Schema(description = "Data de criação")
    private LocalDateTime createdAt;
    
    @Schema(description = "Data de atualização")
    private LocalDateTime updatedAt;
} 