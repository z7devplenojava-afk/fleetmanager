package com.z7design.fleet_manager.dto;

import java.time.LocalDate;

public class WeaponRegistryDTO {
    private String weaponRegistryNumber;
    private LocalDate weaponRegistryValidUntil;

    // Getters and Setters
    public String getWeaponRegistryNumber() {
        return weaponRegistryNumber;
    }

    public void setWeaponRegistryNumber(String weaponRegistryNumber) {
        this.weaponRegistryNumber = weaponRegistryNumber;
    }

    public LocalDate getWeaponRegistryValidUntil() {
        return weaponRegistryValidUntil;
    }

    public void setWeaponRegistryValidUntil(LocalDate weaponRegistryValidUntil) {
        this.weaponRegistryValidUntil = weaponRegistryValidUntil;
    }
}

