package com.z7design.fleet_manager.security;

import com.z7design.fleet_manager.model.kiosk.KioskDevice;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collection;
import java.util.Collections;

public class KioskDeviceAuthentication implements Authentication {

    private final KioskDevice device;
    private boolean authenticated = true;
    private static final Collection<GrantedAuthority> AUTHORITIES =
            Collections.singletonList(new SimpleGrantedAuthority("ROLE_KIOSK_DEVICE"));

    public KioskDeviceAuthentication(KioskDevice device) {
        this.device = device;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return AUTHORITIES;
    }

    @Override
    public Object getCredentials() {
        return null;
    }

    @Override
    public Object getDetails() {
        return device;
    }

    @Override
    public Object getPrincipal() {
        return device;
    }

    public KioskDevice getDevice() {
        return device;
    }

    @Override
    public boolean isAuthenticated() {
        return authenticated;
    }

    @Override
    public void setAuthenticated(boolean isAuthenticated) throws IllegalArgumentException {
        this.authenticated = isAuthenticated;
    }

    @Override
    public String getName() {
        return device != null ? device.getDeviceCode() : "KIOSK_DEVICE";
    }
}
