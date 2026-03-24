package com.z7design.secured_guard.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.secured_guard.dto.ErrorResponse;
import com.z7design.secured_guard.model.Document;
import com.z7design.secured_guard.model.Employee;
import com.z7design.secured_guard.service.DocumentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DocumentController.class)
public class DocumentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DocumentService documentService;

    @Autowired
    private ObjectMapper objectMapper;

    private Document document;
    private UUID documentId;
    private Employee employee;

    @BeforeEach
    void setUp() {
        documentId = UUID.randomUUID();
        employee = new Employee();
        employee.setId(UUID.randomUUID());

        document = new Document();
        document.setId(documentId);
        document.setType("RG");
        document.setNumber("123456789");
        document.setIssueDate(LocalDateTime.now().minusYears(1));
        document.setExpirationDate(LocalDateTime.now().plusYears(4));
        document.setEmployee(employee);
    }

    @Test
    @DisplayName("Should create a new document successfully")
    void shouldCreateDocumentSuccessfully() throws Exception {
        when(documentService.create(any(Document.class))).thenReturn(document);

        mockMvc.perform(post("/api/documents")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(document)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(document.getId().toString()))
                .andExpect(jsonPath("$.type").value(document.getType()));

        verify(documentService, times(1)).create(any(Document.class));
    }

    @Test
    @DisplayName("Should return 400 when creating document with invalid data")
    void shouldReturnBadRequestWhenCreatingDocumentWithInvalidData() throws Exception {
        Document invalidDocument = new Document(); // Missing required fields

        mockMvc.perform(post("/api/documents")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidDocument)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.timestamp").isNotEmpty());

        verify(documentService, never()).create(any(Document.class));
    }

    @Test
    @DisplayName("Should update an existing document successfully")
    void shouldUpdateDocumentSuccessfully() throws Exception {
        Document updatedDocument = new Document();
        updatedDocument.setId(documentId);
        updatedDocument.setType("CNH");
        updatedDocument.setNumber("987654321");
        updatedDocument.setIssueDate(LocalDateTime.now().minusYears(2));
        updatedDocument.setExpirationDate(LocalDateTime.now().plusYears(3));

        when(documentService.update(eq(documentId), any(Document.class))).thenReturn(updatedDocument);

        mockMvc.perform(put("/api/documents/{id}", documentId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedDocument)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(updatedDocument.getId().toString()))
                .andExpect(jsonPath("$.type").value(updatedDocument.getType()));

        verify(documentService, times(1)).update(eq(documentId), any(Document.class));
    }

    @Test
    @DisplayName("Should return 404 when updating a non-existent document")
    void shouldReturnNotFoundWhenUpdatingNonExistentDocument() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        when(documentService.update(eq(nonExistentId), any(Document.class)))
                .thenThrow(new com.z7design.secured_guard.exception.ResourceNotFoundException("Document not found"));

        mockMvc.perform(put("/api/documents/{id}", nonExistentId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(document)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Document not found"));

        verify(documentService, times(1)).update(eq(nonExistentId), any(Document.class));
    }

    @Test
    @DisplayName("Should delete a document successfully")
    void shouldDeleteDocumentSuccessfully() throws Exception {
        doNothing().when(documentService).delete(documentId);

        mockMvc.perform(delete("/api/documents/{id}", documentId))
                .andExpect(status().isNoContent());

        verify(documentService, times(1)).delete(documentId);
    }

    @Test
    @DisplayName("Should return 404 when deleting a non-existent document")
    void shouldReturnNotFoundWhenDeletingNonExistentDocument() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        doThrow(new com.z7design.secured_guard.exception.ResourceNotFoundException("Document not found"))
                .when(documentService).delete(nonExistentId);

        mockMvc.perform(delete("/api/documents/{id}", nonExistentId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Document not found"));

        verify(documentService, times(1)).delete(nonExistentId);
    }

    @Test
    @DisplayName("Should find document by ID successfully")
    void shouldFindDocumentByIdSuccessfully() throws Exception {
        when(documentService.findById(documentId)).thenReturn(document);

        mockMvc.perform(get("/api/documents/{id}", documentId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(documentId.toString()))
                .andExpect(jsonPath("$.type").value(document.getType()));

        verify(documentService, times(1)).findById(documentId);
    }

    @Test
    @DisplayName("Should return 404 when finding non-existent document by ID")
    void shouldReturnNotFoundWhenFindingNonExistentDocumentById() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        when(documentService.findById(nonExistentId))
                .thenThrow(new com.z7design.secured_guard.exception.ResourceNotFoundException("Document not found"));

        mockMvc.perform(get("/api/documents/{id}", nonExistentId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Document not found"));

        verify(documentService, times(1)).findById(nonExistentId);
    }

    @Test
    @DisplayName("Should find documents by employee ID successfully")
    void shouldFindDocumentsByEmployeeIdSuccessfully() throws Exception {
        UUID employeeId = UUID.randomUUID();
        when(documentService.findByEmployeeId(employeeId)).thenReturn(Collections.singletonList(document));

        mockMvc.perform(get("/api/documents/employee/{employeeId}", employeeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(documentId.toString()));

        verify(documentService, times(1)).findByEmployeeId(employeeId);
    }

    @Test
    @DisplayName("Should find documents by type successfully")
    void shouldFindDocumentsByTypeSuccessfully() throws Exception {
        String docType = "RG";
        when(documentService.findByType(docType)).thenReturn(Collections.singletonList(document));

        mockMvc.perform(get("/api/documents/type/{type}", docType))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value(docType));

        verify(documentService, times(1)).findByType(docType);
    }

    @Test
    @DisplayName("Should find expiring documents successfully")
    void shouldFindExpiringDocumentsSuccessfully() throws Exception {
        when(documentService.findExpiringDocuments()).thenReturn(Collections.singletonList(document));

        mockMvc.perform(get("/api/documents/expiring"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(documentId.toString()));

        verify(documentService, times(1)).findExpiringDocuments();
    }

    @Test
    @DisplayName("Should find all documents successfully")
    void shouldFindAllDocumentsSuccessfully() throws Exception {
        when(documentService.findAll()).thenReturn(Collections.singletonList(document));

        mockMvc.perform(get("/api/documents"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(documentId.toString()));

        verify(documentService, times(1)).findAll();
    }
} 