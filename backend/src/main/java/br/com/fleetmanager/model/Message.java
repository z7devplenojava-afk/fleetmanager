package br.com.fleetmanager.model;

import java.time.LocalDateTime;
import java.util.UUID;

import br.com.fleetmanager.model.enums.MessagePriority;
import br.com.fleetmanager.model.enums.MessageType;

import java.util.Set;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Message {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @NotBlank(message = "Título é obrigatório")
    @Column(nullable = false, length = 255)
    private String title;
    
    @NotBlank(message = "Conteúdo é obrigatório")
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;
    
    @NotNull(message = "Tipo de mensagem é obrigatório")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MessageType type;
    
    @NotNull(message = "Prioridade é obrigatória")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MessagePriority priority = MessagePriority.NORMAL;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    @NotNull(message = "Remetente é obrigatório")
    private User sender;
    
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "message_recipients",
        joinColumns = @JoinColumn(name = "message_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> recipients;
    
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "message_departments",
        joinColumns = @JoinColumn(name = "message_id"),
        inverseJoinColumns = @JoinColumn(name = "department_id")
    )
    private Set<Department> departments;
    
    @Column(name = "send_email")
    private Boolean sendEmail = false;
    
    @Column(name = "send_notification")
    private Boolean sendNotification = true;
    
    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;
    
    @Column(name = "sent_at")
    private LocalDateTime sentAt;
    
    @Column(name = "read_at")
    private LocalDateTime readAt;
    
    @Column(name = "created_at", nullable = false)
    @NotNull(message = "Data de criação é obrigatória")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
} 