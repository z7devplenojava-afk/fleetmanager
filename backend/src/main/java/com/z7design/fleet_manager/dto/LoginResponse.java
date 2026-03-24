package com.z7design.fleet_manager.dto;

import java.util.List;

public class LoginResponse {
    private String token;
    private String email;
    private String name;
    private List<String> roles;

    public LoginResponse(String token, String email, String name, List<String> roles) {
        this.token = token;
        this.email = email;
        this.name = name;
        this.roles = roles;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }
} 
