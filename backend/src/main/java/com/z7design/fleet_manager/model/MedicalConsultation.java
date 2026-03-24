package com.z7design.fleet_manager.model;

import jakarta.persistence.Embeddable;
import java.time.LocalDate;

@Embeddable
public class MedicalConsultation {
    private LocalDate consultationDate;
    private String reason;
    private String doctor;
    private String result;

    // Getters and Setters
    public LocalDate getConsultationDate() {
        return consultationDate;
    }

    public void setConsultationDate(LocalDate consultationDate) {
        this.consultationDate = consultationDate;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getDoctor() {
        return doctor;
    }

    public void setDoctor(String doctor) {
        this.doctor = doctor;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }
}

