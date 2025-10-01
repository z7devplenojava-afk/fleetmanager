package br.com.fleetmanager.dto;

import java.time.LocalDate;

public class BallisticPlateDTO {
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
