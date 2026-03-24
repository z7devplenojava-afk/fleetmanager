package com.z7design.fleet_manager.model;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.Set;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import com.z7design.fleet_manager.model.enums.MessageType;
import com.z7design.fleet_manager.model.enums.MessagePriority;
import com.z7design.fleet_manager.model.enums.MessageStatus;

@Entity
@Table(name = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Message {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @NotBlank(message = "TÃ­tulo Ã© obrigatÃ³rio")
    @Column(nullable = false, length = 255)
    private String title;
    
    @NotBlank(message = "ConteÃºdo Ã© obrigatÃ³rio")
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;
    
    @NotNull(message = "Tipo de mensagem Ã© obrigatÃ³rio")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MessageType type;
    
    @NotNull(message = "Prioridade Ã© obrigatÃ³ria")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MessagePriority priority = MessagePriority.NORMAL;
    
    @NotNull(message = "Status Ã© obrigatÃ³rio")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MessageStatus status = MessageStatus.UNREAD;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    @NotNull(message = "Remetente Ã© obrigatÃ³rio")
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
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_to_id")
    private Message replyTo;
    
    @Column(name = "created_at", nullable = false)
    @NotNull(message = "Data de criaÃ§Ã£o Ã© obrigatÃ³ria")
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
