package br.com.fleetmanager.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Entidade que representa as reuniões da CIPA
 */
@Entity
@Table(name = "cipa_meetings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CIPAMeeting {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull(message = "Data da reunião é obrigatória")
    @Column(name = "meeting_date", nullable = false)
    private LocalDate meetingDate;

    @Column(name = "meeting_time")
    private LocalTime meetingTime;

    private String location;

    @NotNull(message = "Tipo de reunião é obrigatório")
    @Column(name = "meeting_type", nullable = false)
    @Builder.Default
    private String meetingType = "ORDINARIA"; // ORDINARIA, EXTRAORDINARIA

    @Column(columnDefinition = "TEXT")
    private String agenda;

    @Column(columnDefinition = "TEXT")
    private String minutes;

    @Column(columnDefinition = "TEXT[]")
    private String[] attendees; // Array de nomes dos participantes

    @Column(name = "decisions", columnDefinition = "TEXT")
    private String decisions;

    @Column(name = "action_items", columnDefinition = "TEXT")
    private String actionItems;

    @Column(name = "next_meeting_date")
    private LocalDate nextMeetingDate;

    @Column(name = "documents_urls", columnDefinition = "TEXT[]")
    private String[] documentsUrls;

    @NotNull(message = "Usuário criador é obrigatório")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdByUser;

    @NotNull(message = "Status é obrigatório")
    @Column(nullable = false)
    @Builder.Default
    private String status = "AGENDADA"; // AGENDADA, REALIZADA, CANCELADA

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
