package com.z7design.fleet_manager.model.email;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "email_templates")
@Data
public class EmailTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true, length = 100)
    private String code;

    private String description;

    @Column(name = "subject_template", nullable = false)
    private String subjectTemplate;

    @Column(name = "body_html_template", nullable = false, columnDefinition = "TEXT")
    private String bodyHtmlTemplate;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "required_variables", columnDefinition = "jsonb")
    private List<String> requiredVariables;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
