package com.z7design.fleet_manager.model.kiosk;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "kiosk_slide_elements")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class KioskSlideElement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "slide_id", nullable = false)
    private UUID slideId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "slide_id", insertable = false, updatable = false)
    @JsonIgnore
    private KioskSlide slide;

    @Column(name = "element_type", nullable = false, length = 50)
    private String elementType; // VIDEO, IMAGE, TEXT, BUTTON, GALLERY, CARD, QR_CODE, FORM, WEB_CONTENT

    @Column(name = "content_json", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private String contentJson = "{}";

    @Column(nullable = false)
    @Builder.Default
    private Double x = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double y = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double width = 100.0;

    @Column(nullable = false)
    @Builder.Default
    private Double height = 100.0;

    @Column(name = "z_index", nullable = false)
    @Builder.Default
    private Integer zIndex = 1;

    @Column(name = "style_json", columnDefinition = "jsonb")
    @Builder.Default
    private String styleJson = "{}";

    @Column(name = "action_json", columnDefinition = "jsonb")
    @Builder.Default
    private String actionJson = "{}";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

