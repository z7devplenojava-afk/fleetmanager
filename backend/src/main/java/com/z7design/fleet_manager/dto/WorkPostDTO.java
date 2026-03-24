package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.WorkPostStatus;
import com.z7design.fleet_manager.model.enums.WorkPostType;
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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "DTO para Posto de Trabalho")
public class WorkPostDTO {
    
    private java.util.UUID id;
    
    @Schema(description = "CÃ³digo do posto", example = "POSTO-001")
    @NotBlank(message = "CÃ³digo do posto Ã© obrigatÃ³rio")
    @Size(max = 50, message = "CÃ³digo do posto deve ter no mÃ¡ximo 50 caracteres")
    private String postCode;
    
    @Schema(description = "Nome do posto", example = "Posto Principal - Barbosa Mello")
    @NotBlank(message = "Nome do posto Ã© obrigatÃ³rio")
    @Size(max = 200, message = "Nome do posto deve ter no mÃ¡ximo 200 caracteres")
    private String name;
    
    @Schema(description = "DescriÃ§Ã£o detalhada do posto")
    @Size(max = 1000, message = "DescriÃ§Ã£o deve ter no mÃ¡ximo 1000 caracteres")
    private String description;
    
    @Schema(description = "Tipo do posto", example = "POSTO_24H")
    @NotNull(message = "Tipo do posto Ã© obrigatÃ³rio")
    private WorkPostType type;
    
    @Schema(description = "Status do posto", example = "EM_IMPLANTACAO")
    private WorkPostStatus status;
    
    // LocalizaÃ§Ã£o
    @Schema(description = "EndereÃ§o do posto", example = "Rua das Flores, 123")
    @NotBlank(message = "EndereÃ§o Ã© obrigatÃ³rio")
    private String address;
    
    @Schema(description = "Cidade", example = "Belo Horizonte")
    private String city;
    
    @Schema(description = "Estado", example = "MG")
    private String state;
    
    @Schema(description = "CEP", example = "30123-456")
    private String zipCode;
    
    // Relacionamentos
    @Schema(description = "ID do cliente", example = "1")
    // Removido @NotNull porque client pode ser null na entidade WorkPost
    private java.util.UUID clientId;
    
    @Schema(description = "ID do contrato", example = "1")
    private java.util.UUID contractId;
    
    // ConfiguraÃ§Ã£o de Pessoal
    @Schema(description = "Quantidade de vigilantes necessÃ¡rios", example = "4")
    @NotNull(message = "Quantidade de vigilantes Ã© obrigatÃ³ria")
    private Integer requiredVigilantes;
    
    @Schema(description = "Escala de trabalho", example = "12x36")
    @NotBlank(message = "Escala de trabalho Ã© obrigatÃ³ria")
    private String workSchedule;
    
    @Schema(description = "HorÃ¡rio de inÃ­cio do turno", example = "18:00")
    @NotNull(message = "HorÃ¡rio de inÃ­cio Ã© obrigatÃ³rio")
    private LocalTime shiftStart;
    
    @Schema(description = "HorÃ¡rio de fim do turno", example = "06:00")
    @NotNull(message = "HorÃ¡rio de fim Ã© obrigatÃ³rio")
    private LocalTime shiftEnd;
    
    @Schema(description = "DescriÃ§Ã£o do turno", example = "18:00 Ã s 06:00")
    private String shiftDescription;
    
    // BenefÃ­cios e CondiÃ§Ãµes
    @Schema(description = "Vale transporte disponÃ­vel")
    private Boolean transportVoucher;
    
    @Schema(description = "Ajuda de custo disponÃ­vel")
    private Boolean costAllowance;
    
    @Schema(description = "Valor da ajuda de custo", example = "400.00")
    private BigDecimal costAllowanceValue;
    
    @Schema(description = "Intrajornada disponÃ­vel")
    private Boolean intrajourney;
    
    @Schema(description = "AlimentaÃ§Ã£o no local disponÃ­vel")
    private Boolean localMeal;
    
    @Schema(description = "Ticket alimentaÃ§Ã£o disponÃ­vel")
    private Boolean mealTicket;
    
    @Schema(description = "Plano de saÃºde disponÃ­vel")
    private Boolean healthPlan;
    
    @Schema(description = "Plano odontolÃ³gico disponÃ­vel")
    private Boolean dentalPlan;
    
    // Recursos e Equipamentos
    @Schema(description = "Quantidade de carros", example = "1")
    private Integer cars;
    
    @Schema(description = "Quantidade de motos", example = "0")
    private Integer motorcycles;
    
    @Schema(description = "Quantidade de rÃ¡dios", example = "0")
    private Integer radios;
    
    @Schema(description = "Quantidade de corporativos", example = "0")
    private Integer corporates;
    
    @Schema(description = "Banco DOC disponÃ­vel")
    private Boolean documentBank;
    
    // Conformidade Legal
    @Schema(description = "Lista de Normas Regulamentadoras")
    private List<String> nrs;
    
    @Schema(description = "PGR disponÃ­vel")
    private Boolean pgr;
    
    @Schema(description = "PCMSO disponÃ­vel")
    private Boolean pcmso;
    
    @Schema(description = "Lista de EPIs necessÃ¡rios")
    private List<String> epis;
    
    @Schema(description = "Lista de treinamentos necessÃ¡rios")
    private List<String> trainings;
    
    // ImplantaÃ§Ã£o
    @Schema(description = "Data de implantaÃ§Ã£o", example = "2025-01-04")
    private LocalDate implementationDate;
    
    @Schema(description = "HorÃ¡rio de implantaÃ§Ã£o", example = "06:00")
    private LocalTime implementationTime;
    
    @Schema(description = "ObservaÃ§Ãµes complementares")
    @Size(max = 2000, message = "ObservaÃ§Ãµes deve ter no mÃ¡ximo 2000 caracteres")
    private String observations;
    
    @Schema(description = "ID do responsÃ¡vel pela implantaÃ§Ã£o")
    private UUID responsibleId;
    
    // Campos adicionais para resposta
    @Schema(description = "Nome do cliente")
    private String clientName;
    
    @Schema(description = "CNPJ do cliente")
    private String clientCnpj;
    
    @Schema(description = "Nome do responsÃ¡vel")
    private String responsibleName;
    
    @Schema(description = "Data de criaÃ§Ã£o")
    private LocalDateTime createdAt;
    
    @Schema(description = "Data de atualizaÃ§Ã£o")
    private LocalDateTime updatedAt;
} 
