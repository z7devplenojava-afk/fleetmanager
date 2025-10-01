package br.com.fleetmanager.model;

import jakarta.persistence.Embeddable;
import java.time.LocalDate;

@Embeddable
public class WeaponRegistry {
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
