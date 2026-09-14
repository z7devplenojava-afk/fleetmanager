package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.model.enums.ExpenseStatus;
import com.z7design.fleet_manager.model.enums.ExpenseType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import org.hibernate.annotations.Filter;
import com.z7design.fleet_manager.tenant.TenantAware;
import java.util.UUID;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "invoices")
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class Invoice implements TenantAware {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id")
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;

    @NotBlank(message = "NÃºmero da fatura Ã© obrigatÃ³rio")
    @Size(max = 50, message = "NÃºmero da fatura deve ter no mÃ¡ximo 50 caracteres")
    @Column(name = "invoice_number", nullable = false, unique = true)
    private String invoiceNumber;

    @NotBlank(message = "DescriÃ§Ã£o Ã© obrigatÃ³ria")
    @Size(max = 500, message = "DescriÃ§Ã£o deve ter no mÃ¡ximo 500 caracteres")
    @Column(name = "description", nullable = false)
    private String description;

    @NotNull(message = "Valor Ã© obrigatÃ³rio")
    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private ExpenseType type = ExpenseType.VARIAVEL;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ExpenseStatus status = ExpenseStatus.PENDENTE;

    @NotNull(message = "Data de vencimento Ã© obrigatÃ³ria")
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "issue_date")
    private LocalDate issueDate;

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @Size(max = 255, message = "CÃ³digo de barras deve ter no mÃ¡ximo 255 caracteres")
    @Column(name = "barcode")
    private String barcode;

    @Size(max = 255, message = "Baixa deve ter no mÃ¡ximo 255 caracteres")
    @Column(name = "baixa")
    private String baixa;

    @Size(max = 100, message = "Categoria deve ter no mÃ¡ximo 100 caracteres")
    @Column(name = "category")
    private String category;

    @Size(max = 100, message = "Centro de custo deve ter no mÃ¡ximo 100 caracteres")
    @Column(name = "cost_center")
    private String centroCusto;

    @Size(max = 500, message = "URL do comprovante deve ter no mÃ¡ximo 500 caracteres")
    @Column(name = "comprovante_url")
    private String comprovanteUrl;

    @Size(max = 1000, message = "ObservaÃ§Ãµes deve ter no mÃ¡ximo 1000 caracteres")
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Size(max = 10, message = "Sigla da empresa deve ter no mÃ¡ximo 10 caracteres")
    @Column(name = "company_sigla", length = 10)
    private String companySigla;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id")
    private Contract contract;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_post_id")
    private WorkPost workPost;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false)
    private Unit unit;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
