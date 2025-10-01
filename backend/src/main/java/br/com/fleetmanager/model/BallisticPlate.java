package br.com.fleetmanager.model;

import jakarta.persistence.Embeddable;
import java.time.LocalDate;

@Embeddable
public class BallisticPlate {
    private String ballisticPlateNumber;
    private LocalDate ballisticPlateValidUntil;

    // Getters and Setters
    public String getBallisticPlateNumber() {
        return ballisticPlateNumber;
    }

    public void setBallisticPlateNumber(String ballisticPlateNumber) {
        this.ballisticPlateNumber = ballisticPlateNumber;
    }

    public LocalDate getBallisticPlateValidUntil() {
        return ballisticPlateValidUntil;
    }

    public void setBallisticPlateValidUntil(LocalDate ballisticPlateValidUntil) {
        this.ballisticPlateValidUntil = ballisticPlateValidUntil;
    }
}
