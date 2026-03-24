# API de Veículos - Documentação Completa

## Base URL
```
http://localhost:8081/api/vehicles
```

## Autenticação
Todos os endpoints requerem autenticação JWT com roles: `ADMIN`, `SUPER_ADMIN` ou `RH`

## Endpoints

### 1. Listar Todos os Veículos
```http
GET /api/vehicles
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Resposta (200):**
```json
[
  {
    "id": 1,
    "plate": "ABC-1234",
    "model": "Civic",
    "brand": "Honda",
    "year": 2023,
    "color": "Prata",
    "status": "ACTIVE",
    "fuelType": "FLEX",
    "capacity": 5,
    "currentMileage": 15000,
    "lastMaintenanceDate": "2024-01-15",
    "nextMaintenanceDate": "2024-07-15",
    "insuranceExpiryDate": "2024-12-31",
    "documentationExpiryDate": "2024-12-31",
    "createdAt": "2024-01-01T10:00:00",
    "updatedAt": "2024-01-01T10:00:00"
  }
]
```

### 2. Cadastrar Novo Veículo
```http
POST /api/vehicles
```

**Permissão:** `ADMIN` ou `SUPER_ADMIN`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "plate": "ABC-1234",
  "model": "Civic",
  "brand": "Honda",
  "year": 2023,
  "color": "Prata",
  "status": "ACTIVE",
  "fuelType": "FLEX",
  "capacity": 5,
  "currentMileage": 15000,
  "lastMaintenanceDate": "2024-01-15",
  "nextMaintenanceDate": "2024-07-15",
  "insuranceExpiryDate": "2024-12-31",
  "documentationExpiryDate": "2024-12-31"
}
```

**Campos Obrigatórios:**
- `plate` (string, único)
- `model` (string)
- `brand` (string)
- `year` (integer)
- `status` (enum: ACTIVE, INACTIVE, MAINTENANCE)
- `fuelType` (enum: GASOLINE, ETHANOL, DIESEL, FLEX)
- `capacity` (integer)
- `currentMileage` (integer)

**Campos Opcionais:**
- `color` (string)
- `lastMaintenanceDate` (date: YYYY-MM-DD)
- `nextMaintenanceDate` (date: YYYY-MM-DD)
- `insuranceExpiryDate` (date: YYYY-MM-DD)
- `documentationExpiryDate` (date: YYYY-MM-DD)

**Resposta (200):**
```json
{
  "id": 1,
  "plate": "ABC-1234",
  "model": "Civic",
  "brand": "Honda",
  "year": 2023,
  "color": "Prata",
  "status": "ACTIVE",
  "fuelType": "FLEX",
  "capacity": 5,
  "currentMileage": 15000,
  "lastMaintenanceDate": "2024-01-15",
  "nextMaintenanceDate": "2024-07-15",
  "insuranceExpiryDate": "2024-12-31",
  "documentationExpiryDate": "2024-12-31",
  "createdAt": "2024-01-01T10:00:00",
  "updatedAt": "2024-01-01T10:00:00"
}
```

**Erro (400):** Placa já cadastrada

### 3. Buscar Veículo por ID
```http
GET /api/vehicles/{id}
```

**Resposta (200):**
```json
{
  "id": 1,
  "plate": "ABC-1234",
  "model": "Civic",
  "brand": "Honda",
  "year": 2023,
  "color": "Prata",
  "status": "ACTIVE",
  "fuelType": "FLEX",
  "capacity": 5,
  "currentMileage": 15000,
  "lastMaintenanceDate": "2024-01-15",
  "nextMaintenanceDate": "2024-07-15",
  "insuranceExpiryDate": "2024-12-31",
  "documentationExpiryDate": "2024-12-31",
  "createdAt": "2024-01-01T10:00:00",
  "updatedAt": "2024-01-01T10:00:00"
}
```

**Erro (404):** Veículo não encontrado

### 4. Buscar Veículo por Placa
```http
GET /api/vehicles/plate/{plate}
```

**Exemplo:**
```http
GET /api/vehicles/plate/ABC-1234
```

### 5. Buscar Veículos por Status
```http
GET /api/vehicles/status/{status}
```

**Status disponíveis:**
- `ACTIVE`
- `INACTIVE`
- `MAINTENANCE`

**Exemplo:**
```http
GET /api/vehicles/status/ACTIVE
```

### 6. Buscar Veículos por Termo
```http
GET /api/vehicles/search?searchTerm={termo}
```

**Exemplo:**
```http
GET /api/vehicles/search?searchTerm=Honda
```

### 7. Atualizar Veículo
```http
PUT /api/vehicles/{id}
```

**Permissão:** `ADMIN` ou `SUPER_ADMIN`

**Body:** Mesmo formato do cadastro

**Resposta (200):** Veículo atualizado

**Erro (404):** Veículo não encontrado

### 8. Excluir Veículo
```http
DELETE /api/vehicles/{id}
```

**Permissão:** `ADMIN` ou `SUPER_ADMIN`

**Resposta (204):** Veículo excluído

**Erro (404):** Veículo não encontrado

## Enums

### VehicleStatus
- `ACTIVE` - Ativo
- `INACTIVE` - Inativo
- `MAINTENANCE` - Em manutenção

### FuelType
- `GASOLINE` - Gasolina
- `ETHANOL` - Etanol
- `DIESEL` - Diesel
- `FLEX` - Flex

## Exemplos de Uso

### PowerShell
```powershell
# Login
$loginData = @{ username = "superadmin"; password = "Password123!" } | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
$token = $loginResponse.token

# Headers
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Listar veículos
$vehicles = Invoke-RestMethod -Uri "http://localhost:8081/api/vehicles" -Method GET -Headers $headers

# Cadastrar veículo
$vehicleData = @{
    plate = "XYZ-1234"
    model = "Civic"
    brand = "Honda"
    year = 2023
    status = "ACTIVE"
    fuelType = "FLEX"
    capacity = 5
    currentMileage = 15000
} | ConvertTo-Json

$newVehicle = Invoke-RestMethod -Uri "http://localhost:8081/api/vehicles" -Method POST -Body $vehicleData -Headers $headers
```

### cURL
```bash
# Login
curl -X POST "http://localhost:8081/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"Password123!"}'

# Listar veículos
curl -X GET "http://localhost:8081/api/vehicles" \
  -H "Authorization: Bearer {token}"

# Cadastrar veículo
curl -X POST "http://localhost:8081/api/vehicles" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d @vehicle_create_example.json
```

## Scripts de Teste

Execute os scripts PowerShell para testar a API:

1. `test_vehicles.ps1` - Teste básico de listagem
2. `test_vehicle_create.ps1` - Teste de cadastro
3. `test_frontend_vehicles_detailed.ps1` - Teste detalhado

## Frontend Integration

O frontend deve usar o serviço `fleetService.ts` que já está configurado para:

- `getVehicles()` - Listar veículos
- `createVehicle(vehicle)` - Cadastrar veículo
- `updateVehicle(id, vehicle)` - Atualizar veículo
- `deleteVehicle(id)` - Excluir veículo 