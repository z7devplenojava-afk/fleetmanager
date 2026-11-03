package com.z7design.fleet_manager.model.kiosk;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Entity
@Table(name = "kiosk_slides")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class KioskSlide {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "presentation_id", nullable = false)
    private UUID presentationId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "presentation_id", insertable = false, updatable = false)
    @JsonIgnore
    private KioskPresentation presentation;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    @Builder.Default
    private Integer position = 0;

    @Column(name = "duration_ms")
    private Long durationMs; // Nullable se o modo for INTERACTIVE

    @Column(name = "transition_type", nullable = false, length = 50)
    @Builder.Default
    private String transitionType = "FADE"; // FADE, SLIDE_LEFT, SLIDE_RIGHT, ZOOM, NONE

    @Column(name = "interaction_mode", nullable = false, length = 50)
    @Builder.Default
    private String interactionMode = "AUTOMATIC"; // AUTOMATIC, INTERACTIVE, HYBRID

    @Column(name = "background_type", nullable = false, length = 50)
    @Builder.Default
    private String backgroundType = "COLOR"; // COLOR, IMAGE, VIDEO

    @Column(name = "background_media_id")
    private UUID backgroundMediaId;

    @ManyToOne(fetch = FetchType.LAZY)
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "background_media_id", insertable = false, updatable = false)
    private KioskMediaAsset backgroundMedia;

    @OneToMany(mappedBy = "slide", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("zIndex ASC")
    @Builder.Default
    private List<KioskSlideElement> elements = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

