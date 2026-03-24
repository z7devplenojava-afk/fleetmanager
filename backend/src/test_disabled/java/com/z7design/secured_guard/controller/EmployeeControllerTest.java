package com.z7design.secured_guard.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.secured_guard.dto.ErrorResponse;
import com.z7design.secured_guard.model.Employee;
import com.z7design.secured_guard.model.Position;
import com.z7design.secured_guard.model.Unit;
import com.z7design.secured_guard.model.User;
import com.z7design.secured_guard.model.enums.EmploymentStatus;
import com.z7design.secured_guard.model.enums.UserRole;
import com.z7design.secured_guard.service.EmployeeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(EmployeeController.class)
public class EmployeeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EmployeeService employeeService;

    @Autowired
    private ObjectMapper objectMapper;

    private Employee employee;
    private UUID employeeId;
    private UUID userId;
    private UUID positionId;

    @BeforeEach
    void setUp() {
        employeeId = UUID.randomUUID();
        userId = UUID.randomUUID();
        positionId = UUID.randomUUID();

        User user = new User();
        user.setId(userId);
        user.setUsername("empuser");
        user.setEmail("empuser@example.com");
        user.setRole(UserRole.VIGILANTE);

        Position position = new Position();
        position.setId(positionId);
        position.setName("Vigilante");

        employee = new Employee();
        employee.setId(employeeId);
        employee.setName("João Silva");
        employee.setCpf("12345678901");
        employee.setEmail("joao@example.com");
        employee.setRegistrationNumber("EMP001");
        employee.setHireDate(LocalDate.of(2023, 1, 15));
        employee.setStatus(EmploymentStatus.ACTIVE);
        employee.setUser(user);
        employee.setPosition(position);
    }

    @Test
    @DisplayName("Should create a new employee")
    void shouldCreateEmployee() throws Exception {
        when(employeeService.create(any(Employee.class))).thenReturn(employee);

        mockMvc.perform(post("/api/employees")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(employee)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(employeeId.toString()))
                .andExpect(jsonPath("$.name").value("João Silva"));
    }

    @Test
    @DisplayName("Should update an existing employee")
    void shouldUpdateEmployee() throws Exception {
        Employee updatedEmployee = new Employee();
        updatedEmployee.setId(employeeId);
        updatedEmployee.setName("João Silva Atualizado");
        updatedEmployee.setCpf("12345678901");
        updatedEmployee.setEmail("joao.atualizado@example.com");
        updatedEmployee.setRegistrationNumber("EMP001");
        updatedEmployee.setHireDate(LocalDate.of(2023, 1, 15));
        updatedEmployee.setStatus(EmploymentStatus.ACTIVE);
        updatedEmployee.setUser(employee.getUser());
        updatedEmployee.setPosition(employee.getPosition());

        when(employeeService.update(eq(employeeId), any(Employee.class))).thenReturn(updatedEmployee);

        mockMvc.perform(put("/api/employees/{id}", employeeId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedEmployee)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("João Silva Atualizado"));
    }

    @Test
    @DisplayName("Should delete an employee")
    void shouldDeleteEmployee() throws Exception {
        doNothing().when(employeeService).delete(employeeId);

        mockMvc.perform(delete("/api/employees/{id}", employeeId))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Should find employee by ID")
    void shouldFindEmployeeById() throws Exception {
        when(employeeService.findById(employeeId)).thenReturn(employee);

        mockMvc.perform(get("/api/employees/{id}", employeeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(employeeId.toString()));
    }

    @Test
    @DisplayName("Should find employee by CPF")
    void shouldFindEmployeeByCpf() throws Exception {
        String cpf = "12345678901";
        when(employeeService.findByCpf(cpf)).thenReturn(Optional.of(employee));

        mockMvc.perform(get("/api/employees/cpf/{cpf}", cpf))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cpf").value(cpf));
    }

    @Test
    @DisplayName("Should find employee by email")
    void shouldFindEmployeeByEmail() throws Exception {
        String email = "joao@example.com";
        when(employeeService.findByEmail(email)).thenReturn(Optional.of(employee));

        mockMvc.perform(get("/api/employees/email/{email}", email))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email));
    }

    @Test
    @DisplayName("Should find employees by status")
    void shouldFindEmployeesByStatus() throws Exception {
        when(employeeService.findByStatus(EmploymentStatus.ACTIVE)).thenReturn(Collections.singletonList(employee));

        mockMvc.perform(get("/api/employees/status/{status}", EmploymentStatus.ACTIVE.name()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value(EmploymentStatus.ACTIVE.name()));
    }

    @Test
    @DisplayName("Should find employees by unit")
    void shouldFindEmployeesByUnit() throws Exception {
        UUID unitId = UUID.randomUUID();
        Unit unit = new Unit();
        unit.setId(unitId);
        employee.setUnit(unit); // Set the unit for the employee

        when(employeeService.findByUnit(unitId)).thenReturn(Collections.singletonList(employee));

        mockMvc.perform(get("/api/employees/unit/{unitId}", unitId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].unit.id").value(unitId.toString()));
    }

    @Test
    @DisplayName("Should find employees by position")
    void shouldFindEmployeesByPosition() throws Exception {
        when(employeeService.findByPosition(positionId)).thenReturn(Collections.singletonList(employee));

        mockMvc.perform(get("/api/employees/position/{positionId}", positionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].position.id").value(positionId.toString()));
    }

    @Test
    @DisplayName("Should return all employees")
    void shouldFindAllEmployees() throws Exception {
        when(employeeService.findAll()).thenReturn(Collections.singletonList(employee));

        mockMvc.perform(get("/api/employees"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(employeeId.toString()));
    }

    @Test
    @DisplayName("Should update employee status")
    void shouldUpdateEmployeeStatus() throws Exception {
        Employee updatedStatusEmployee = new Employee();
        updatedStatusEmployee.setId(employeeId);
        updatedStatusEmployee.setName("João Silva");
        updatedStatusEmployee.setCpf("12345678901");
        updatedStatusEmployee.setEmail("joao@example.com");
        updatedStatusEmployee.setRegistrationNumber("EMP001");
        updatedStatusEmployee.setHireDate(LocalDate.of(2023, 1, 15));
        updatedStatusEmployee.setStatus(EmploymentStatus.TERMINATED);
        updatedStatusEmployee.setUser(employee.getUser());
        updatedStatusEmployee.setPosition(employee.getPosition());

        when(employeeService.updateStatus(eq(employeeId), eq(EmploymentStatus.TERMINATED))).thenReturn(updatedStatusEmployee);

        mockMvc.perform(put("/api/employees/{id}/status", employeeId)
                .param("status", EmploymentStatus.TERMINATED.name()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(EmploymentStatus.TERMINATED.name()));
    }
}