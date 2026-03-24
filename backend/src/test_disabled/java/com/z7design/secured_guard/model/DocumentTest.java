package com.z7design.secured_guard.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDateTime;
import java.util.UUID;

class DocumentTest {

    private Document document;
    private Employee employee;

    @BeforeEach
    void setUp() {
        employee = new Employee();
        employee.setId(UUID.randomUUID());
        employee.setName("Test Employee");

        document = Document.builder()
                .id(UUID.randomUUID())
                .employee(employee)
                .type("ID")
                .number("123456")
                .issueDate(LocalDateTime.now())
                .expirationDate(LocalDateTime.now().plusYears(10))
                .fileUrl("http://example.com/document.pdf")
                .description("Test document")
                .build();
    }

    @Test
    void whenCreateDocument_thenDocumentIsCreated() {
        assertNotNull(document);
        assertEquals(employee, document.getEmployee());
        assertEquals("ID", document.getType());
        assertEquals("123456", document.getNumber());
        assertNotNull(document.getIssueDate());
        assertNotNull(document.getExpirationDate());
        assertEquals("http://example.com/document.pdf", document.getFileUrl());
        assertEquals("Test document", document.getDescription());
    }

    @Test
    void whenUpdateDocumentType_thenTypeIsUpdated() {
        String newType = "Passport";
        document.setType(newType);
        assertEquals(newType, document.getType());
    }

    @Test
    void whenUpdateDocumentNumber_thenNumberIsUpdated() {
        String newNumber = "987654";
        document.setNumber(newNumber);
        assertEquals(newNumber, document.getNumber());
    }

    @Test
    void whenUpdateDocumentFileUrl_thenFileUrlIsUpdated() {
        String newFileUrl = "http://example.com/new-document.pdf";
        document.setFileUrl(newFileUrl);
        assertEquals(newFileUrl, document.getFileUrl());
    }
} 