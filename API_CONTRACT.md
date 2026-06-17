# Contrato API - Gestión de Ingresos (Incomes)

## Base URL
```
http://localhost:3000/api
```

## Endpoints

### 1. Obtener todos los ingresos (con paginación)
**GET** `/incomes`

**Query Parameters:**
- `startDate` (opcional): Fecha de inicio en formato ISO 8601 (YYYY-MM-DD)
- `endDate` (opcional): Fecha de fin en formato ISO 8601 (YYYY-MM-DD)
- `year` (opcional): Año para filtrar ingresos (formato YYYY)
- `month` (opcional): Mes para filtrar ingresos (1-12)
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 6, máximo: 100)

**Ejemplos:**
```
GET /api/incomes                                          -- Sin filtros (página 1, 6 elementos)
GET /api/incomes?page=1&limit=6                         -- Página 1, 6 elementos (grid 2x3)
GET /api/incomes?page=2&limit=6                         -- Página 2
GET /api/incomes?startDate=2024-01-01&endDate=2024-12-31    -- Por rango de fechas
GET /api/incomes?year=2026&month=4                        -- Por año y mes
GET /api/incomes?year=2026&month=4&page=1&limit=6       -- Con filtros + paginación
```

**Respuesta Exitosa (200 OK):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "amount": 1500.50,
      "reason": "Salario mensual",
      "date": "2024-01-15",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "message": "Incomes retrieved successfully",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 6,
    "totalPages": 5
  }
}
```

### 2. Obtener ingreso por ID
**GET** `/incomes/:id`

**Path Parameters:**
- `id` (requerido): UUID del ingreso

**Ejemplo:**
```
GET /api/incomes/550e8400-e29b-41d4-a716-446655440000
```

**Respuesta Exitosa (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 1500.50,
    "reason": "Salario mensual",
    "date": "2024-01-15",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Income retrieved successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Error (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "Income not found",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 3. Crear nuevo ingreso
**POST** `/incomes`

**Body:**
```json
{
  "amount": 1500.50,
  "reason": "Salario mensual",
  "date": "2024-01-15"
}
```

**Validaciones:**
- `amount`: número positivo, máximo 2 decimales
- `reason`: string, máximo 255 caracteres
- `date`: fecha válida en formato YYYY-MM-DD

**Respuesta Exitosa (201 Created):**
```json
{
  "statusCode": 201,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 1500.50,
    "reason": "Salario mensual",
    "date": "2024-01-15",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Income created successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Error (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "amount must be a positive number",
    "reason must be a string"
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 4. Actualizar ingreso
**PUT** `/incomes/:id`

**Path Parameters:**
- `id` (requerido): UUID del ingreso

**Body:**
```json
{
  "amount": 1600.00,
  "reason": "Salario mensual actualizado",
  "date": "2024-01-16"
}
```

**Respuesta Exitosa (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 1600.00,
    "reason": "Salario mensual actualizado",
    "date": "2024-01-16",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-16T11:30:00.000Z"
  },
  "message": "Income updated successfully",
  "timestamp": "2024-01-16T11:30:00.000Z"
}
```

### 5. Eliminar ingreso
**DELETE** `/incomes/:id`

**Path Parameters:**
- `id` (requerido): UUID del ingreso

**Respuesta Exitosa (204 No Content):**
```json
{
  "statusCode": 204,
  "message": "Income deleted successfully",
  "timestamp": "2024-01-16T11:30:00.000Z"
}
```

## Endpoints Adicionales (Resúmenes)

### 6. Resumen mensual
**GET** `/incomes/summary/monthly`

**Query Parameters:**
- `year` (opcional): Año (default: año actual)
- `month` (opcional): Mes 1-12 (1=Enero, 2=Febrero, ..., 12=Diciembre). **Importante**: El mes usa formato **1-indexed** (1 a 12), no 0-indexed.

**Ejemplo:**
```
GET /api/incomes/summary/monthly?year=2024&month=1
```

**Respuesta:**
```json
{
  "statusCode": 200,
  "data": {
    "month": "January 2024",
    "totalAmount": 1500.50,
    "incomeCount": 1,
    "dailyBreakdown": {
      "15": 500.00,
      "20": 1000.50
    },
    "byReason": {
      "Salario": 1500.50
    }
  },
  "message": "Monthly summary retrieved successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 7. Resumen anual
**GET** `/incomes/summary/yearly`

**Query Parameters:**
- `year` (opcional): Año (default: año actual)

**Respuesta:**
```json
{
  "statusCode": 200,
  "data": {
    "year": 2024,
    "totalAmount": 18000.00,
    "count": 12,
    "averageAmount": 1500.00,
    "monthlyBreakdown": [
      {"month": 1, "total": 1500.00},
      {"month": 2, "total": 1500.00}
    ]
  },
  "message": "Yearly summary retrieved successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 8. Resumen general
**GET** `/incomes/summary/overall`

**Respuesta:**
```json
{
  "statusCode": 200,
  "data": {
    "totalAmount": 50000.00,
    "totalCount": 35,
    "averageAmount": 1428.57,
    "firstIncomeDate": "2023-01-15",
    "lastIncomeDate": "2024-01-15"
  },
  "message": "Overall summary retrieved successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Modelo de Datos

### Income Entity
```typescript
interface Income {
  id: string;           // UUID
  amount: number;       // Monto del ingreso (decimal)
  reason: string;       // Motivo/descripción
  date: string;         // Fecha del ingreso (YYYY-MM-DD)
  createdAt: string;    // Timestamp de creación
  updatedAt: string;    // Timestamp de actualización
}
```

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 200 | OK - Operación exitosa |
| 201 | Created - Recurso creado exitosamente |
| 204 | No Content - Recurso eliminado exitosamente |
| 400 | Bad Request - Validación fallida |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error del servidor |

## Headers

**Content-Type:** `application/json`

**Accept:** `application/json`

## Notas

1. Todas las fechas deben enviarse en formato ISO 8601 (YYYY-MM-DD)
2. Los montos deben tener máximo 2 decimales
3. El backend valida automáticamente los datos antes de procesarlos
4. Swagger está disponible en: `http://localhost:3000/api/docs`
5. El frontend debe manejar errores de red y timeout (10 segundos)

## Ejemplos de Uso

### Frontend - TypeScript Types
```typescript
interface Income {
  id: string;
  amount: number;
  reason: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateIncomeDto {
  amount: number;
  reason: string;
  date: string;
}

interface UpdateIncomeDto {
  amount?: number;
  reason?: string;
  date?: string;
}

interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  timestamp: string;
}
```

### Frontend - Ejemplo de Llamada
```typescript
const fetchIncomes = async (startDate?: string, endDate?: string) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const response = await fetch(`/api/incomes?${params.toString()}`);
  const data: ApiResponse<Income[]> = await response.json();
  return data.data;
};
```

# Autenticación (Auth)

## Endpoints de Autenticación

### 1. Registrar usuario
**POST** `/auth/register`

**Request Body:**
```typescript
interface RegisterRequest {
  email: string;      // Correo electrónico válido
  password: string;   // Mínimo 6 caracteres
  name: string;       // Nombre completo
}
```

**Ejemplo:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Juan Pérez"
}
```

**Respuesta Exitosa (201 Created):**
```json
{
  "statusCode": 201,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "Juan Pérez",
      "provider": "local"
    }
  },
  "message": "Usuario registrado exitosamente",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Errores:**
- 409 Conflict: El correo ya está registrado

---

### 2. Iniciar sesión
**POST** `/auth/login`

**Request Body:**
```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

**Respuesta Exitosa (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "Juan Pérez",
      "provider": "local"
    }
  },
  "message": "Login exitoso",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Errores:**
- 401 Unauthorized: Credenciales inválidas

---

### 3. Autenticación con Google
**POST** `/auth/google`

**Request Body:**
```typescript
interface GoogleAuthRequest {
  email: string;
  googleId: string;
  name: string;
}
```

**Respuesta Exitosa (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@gmail.com",
      "name": "Juan Pérez",
      "provider": "google"
    }
  },
  "message": "Autenticación con Google exitosa",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### 4. Obtener perfil del usuario (Protegido)
**GET** `/auth/me`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Respuesta Exitosa (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "Juan Pérez",
    "provider": "local"
  },
  "message": "Usuario encontrado",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Errores:**
- 401 Unauthorized: Token inválido o expirado

---

 ## Variables de Entorno Requeridas
 
 ```env
 # JWT
 JWT_SECRET=tu-secret-key-aqui
 
 # Google OAuth (opcional para autenticación con Google)
 GOOGLE_CLIENT_ID=tu-google-client-id
 GOOGLE_CLIENT_SECRET=tu-google-client-secret
 GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
 ```

# Contrato API - Gestión de Deudas (Debts)

## Base URL
```
http://localhost:3000/api
```

## Endpoints

### 1. Obtener todas las deudas (con paginación)
**GET** `/debts`

**Query Parameters:**
- `startDate` (opcional): Fecha de inicio en formato ISO 8601 (YYYY-MM-DD)
- `endDate` (opcional): Fecha de fin en formato ISO 8601 (YYYY-MM-DD)
- `year` (opcional): Año para filtrar deudas (formato YYYY)
- `month` (opcional): Mes para filtrar deudas (1-12)
- `status` (opcional): Filtrar por estado: `active` (paidAmount < finalAmount) | `paid` (paidAmount >= finalAmount)
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 6, máximo: 100)

**Ejemplos:**
```
GET /api/debts                                           -- Sin filtros (página 1, 6 elementos)
GET /api/debts?page=1&limit=6                         -- Página 1, 6 elementos (grid 2x3)
GET /api/debts?page=2&limit=6                         -- Página 2
GET /api/debts?startDate=2024-01-01&endDate=2024-12-31    -- Por rango de fechas
GET /api/debts?year=2026&month=4                        -- Por año y mes
GET /api/debts?status=active                              -- Solo deudas activas (paidAmount < finalAmount)
GET /api/debts?status=paid                                -- Solo deudas pagadas (paidAmount >= finalAmount)
```

**Respuesta Exitosa (200 OK):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "finalAmount": 1500.00,
      "paidAmount": 500.00,
      "remainingAmount": 1000.00,
      "reason": "Préstamo personal",
      "startDate": "2024-01-15",
      "installments": 12,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "message": "Debts retrieved successfully",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 6,
    "totalPages": 5
  }
}
```

### 2. Obtener deuda por ID
**GET** `/debts/:id`

**Path Parameters:**
- `id` (requerido): UUID de la deuda

### 3. Crear nueva deuda
**POST** `/debts`

**Body:**
```json
{
  "finalAmount": 1500.00,
  "reason": "Préstamo personal",
  "startDate": "2024-01-15",
  "installments": 12
}
```

### 4. Actualizar deuda
**PUT** `/debts/:id`

### 5. Eliminar deuda
**DELETE** `/debts/:id`

### 6. Resumen mensual de deudas
**GET** `/debts/summary/monthly?year=2024&month=1`

### 7. Resumen anual de deudas
**GET** `/debts/summary/yearly?year=2024`

### 8. Resumen general de deudas
**GET** `/debts/summary/overall`

---

# Contrato API - Gestión de Pockets

## Endpoints

### 1. Gestión de Pockets
Base URL: `/api/pockets`

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/pockets` | Listar todos los pockets |
| `POST` | `/api/pockets` | Crear un nuevo pocket |
| `GET` | `/api/pockets/:id` | Obtener detalle de un pocket (incluye transfers) |
| `PUT` | `/api/pockets/:id` | Editar un pocket |
| `DELETE` | `/api/pockets/:id` | Eliminar un pocket |
| `POST` | `/api/pockets/:id/deposits` | Registrar un depósito (ahora con `reason` opcional) |
| `GET` | `/api/pockets/:id/deposits` | Obtener depósitos paginados |
| `GET` | `/api/pockets/summary` | Resumen de todos los pockets |

### 2. Pockets - Transferencias
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `POST` | `/api/pockets/transfer` | Transferir dinero entre bolsillos |

---

### 3. GET /api/pockets/:id — Detalle del Pocket (ACTUALIZADO v2)

**Nuevos campos en la respuesta:**
- `transfers[]` — Lista de transferencias donde el pocket participó (como origen o destino)
- `initialMovement` — Movimiento sintético que representa el monto de apertura del pocket

**Respuesta Exitosa (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Ahorro vacaciones",
    "type": "goal",
    "goal": 5000.00,
    "initialAmount": 1000.00,
    "accumulatedAmount": 3200.00,
    "depositCount": 5,
    "motivation": "Para viajar a Europa",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",

    "deposits": [
      {
        "id": "uuid-dep-1",
        "pocketId": "uuid-pocket",
        "amount": 500.00,
        "reason": "Depósito inicial de nómina",
        "date": "2024-01-15",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],

    "expenses": [
      {
        "id": "uuid-exp-1",
        "amount": 200.00,
        "reason": "Compra de insumos",
        "date": "2024-02-01",
        "createdAt": "2024-02-01T10:30:00.000Z",
        "pocketId": "uuid-pocket"
      }
    ],

    "transfers": [
      {
        "id": "uuid-trf-1",
        "sourcePocketId": "uuid-origen",
        "targetPocketId": "uuid-pocket",
        "amount": 300.00,
        "reason": "Ajuste mensual",
        "date": "2024-03-01",
        "createdAt": "2024-03-01T10:30:00.000Z",
        "direction": "incoming"
      },
      {
        "id": "uuid-trf-2",
        "sourcePocketId": "uuid-pocket",
        "targetPocketId": "uuid-destino",
        "amount": 100.00,
        "reason": "Traspaso a efectivo",
        "date": "2024-03-15",
        "createdAt": "2024-03-15T10:30:00.000Z",
        "direction": "outgoing"
      }
    ],

    "initialMovement": {
      "type": "opening",
      "amount": 1000.00,
      "date": "2024-01-15",
      "description": "Monto de apertura"
    }
  },
  "message": "Pocket retrieved successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Nuevos tipos en el response:**

```typescript
interface TransferMovement {
  id: string;
  sourcePocketId: string;    // UUID del pocket origen
  targetPocketId: string;    // UUID del pocket destino
  amount: number;
  reason: string;
  date: string;              // ISO 8601 (YYYY-MM-DD)
  createdAt: string;
  direction: 'incoming' | 'outgoing';  // Calculado: relativo al pocket solicitado
}

interface InitialMovement {
  type: 'opening';
  amount: number;            // = pocket.initialAmount
  date: string;              // = pocket.createdAt
  description: string;       // "Monto de apertura"
}
```

---

### 4. POST /api/pockets/:id/deposits — Registrar Depósito (ACTUALIZADO v2)

**Agregar campo opcional `reason`:**

```json
{
  "amount": 500.00,
  "date": "2024-01-15",
  "reason": "Depósito de nómina enero",
  "newGoal": 6000.00
}
```

**Validaciones:**
- `amount`: número positivo, mínimo 0.01
- `date`: ISO 8601 (YYYY-MM-DD)
- `reason` (NUEVO, opcional): string, 3-200 caracteres, nullable
- `newGoal` (opcional): número positivo, solo para pockets tipo goal

**Respuesta Exitosa (201 Created):**
```json
{
  "statusCode": 201,
  "data": {
    "id": "uuid-pocket",
    "name": "Ahorro vacaciones",
    "type": "goal",
    "goal": 6000.00,
    "initialAmount": 1000.00,
    "accumulatedAmount": 3700.00,
    "depositCount": 6,
    "motivation": "Para viajar a Europa",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-03-01T10:30:00.000Z",
    "deposits": [/*últimos 4 depósitos*/],
    "expenses": [/*últimos gastos*/],
    "transfers": [/*últimas transferencias*/]
  },
  "message": "Deposit registered successfully",
  "timestamp": "2024-03-01T10:30:00.000Z"
}
```
*Nota: El response ahora incluye `transfers` igual que GET /:id para mantener el cache del frontend consistente.*

---

### 5. POST /api/pockets/transfer — Transferir entre bolsillos (SIN CAMBIOS)

```json
{
  "sourcePocketId": "uuid-origen",
  "targetPocketId": "uuid-destino",
  "amount": 300.00,
  "reason": "Ajuste mensual",
  "date": "2024-03-01"
}
```

**Respuesta Exitosa (201 Created):**
```json
{
  "statusCode": 201,
  "data": {
    "id": "uuid-trf",
    "sourcePocketId": "uuid-origen",
    "targetPocketId": "uuid-destino",
    "amount": 300.00,
    "reason": "Ajuste mensual",
    "date": "2024-03-01",
    "createdAt": "2024-03-01T10:30:00.000Z"
  },
  "message": "Transfer successful",
  "timestamp": "2024-03-01T10:30:00.000Z"
}
```

---

### 6. Modelo de Datos Actualizado (Pockets)

```typescript
// Deposit (actualizado con reason opcional)
interface Deposit {
  id: string;           // UUID
  pocketId: string;     // UUID
  amount: number;
  reason?: string;      // NUEVO: opcional, descripción del depósito
  date: string;         // YYYY-MM-DD
  createdAt: string;
}

// PocketTransfer (sin cambios)
interface PocketTransfer {
  id: string;
  sourcePocketId: string;
  targetPocketId: string;
  amount: number;
  reason: string;
  date: string;
  createdAt: string;
}

// TransferMovement (NUEVO: lo que recibe el frontend en el detalle)
interface TransferMovement {
  id: string;
  sourcePocketId: string;
  targetPocketId: string;
  amount: number;
  reason: string;
  date: string;
  createdAt: string;
  direction: 'incoming' | 'outgoing';  // Relativo al pocket actual
}

// InitialMovement (NUEVO: monto de apertura como movimiento sintético)
interface InitialMovement {
  type: 'opening';
  amount: number;
  date: string;
  description: string;
}

// Pocket (actualizado con transfers e initialMovement)
interface Pocket {
  id: string;
  name: string;
  type: 'goal' | 'deposit';
  goal: number;
  initialAmount: number;
  accumulatedAmount: number;
  depositCount?: number;
  deposits?: Deposit[];
  expenses?: Expense[];
  transfers?: TransferMovement[];       // NUEVO
  initialMovement?: InitialMovement;    // NUEVO
  createdAt: string;
  updatedAt: string;
  motivation: string;
}

// RegisterDepositDto (actualizado con reason opcional)
interface RegisterDepositDto {
  amount: number;
  date: string;
  reason?: string;    // NUEVO: opcional
  newGoal?: number;
}
```

---
# Actualización: Incomes y Expenses (Allocations Obligatorios)

`POST /api/incomes` y `POST /api/expenses` ahora requieren el campo `allocations`:

```json
{
  "amount": 200.00,
  "reason": "...",
  "date": "...",
  "allocations": [
    { "pocketId": "uuid-1", "amount": 150.00 },
    { "pocketId": "uuid-2", "amount": 50.00 }
  ]
}
```
*Validación: La suma de allocations debe ser igual al monto total.*
*Nota: Todo Gasto (Expense) debe registrar sus allocations (salida de dinero de bolsillos).*


## Base URL
```
http://localhost:3000/api
```

## Endpoints

### 1. Obtener todos los préstamos (con paginación)
**GET** `/loans`

**Query Parameters:**
- `startDate` (opcional): Fecha de inicio en formato ISO 8601 (YYYY-MM-DD)
- `endDate` (opcional): Fecha de fin en formato ISO 8601 (YYYY-MM-DD)
- `year` (opcional): Año para filtrar préstamos (formato YYYY)
- `month` (opcional): Mes para filtrar préstamos (1-12)
- `status` (opcional): Filtrar por estado: `active` (remainingAmount > 0) | `paid` (remainingAmount <= 0) | `all`
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 6, máximo: 100)

**Ejemplos:**
```
GET /api/loans                                           -- Sin filtros (página 1, 6 elementos)
GET /api/loans?page=1&limit=6                         -- Página 1, 6 elementos (grid 2x3)
GET /api/loans?page=2&limit=6                         -- Página 2
GET /api/loans?startDate=2024-01-01&endDate=2024-12-31    -- Por rango de fechas
GET /api/loans?year=2026&month=4                        -- Por año y mes
GET /api/loans?status=active                              -- Solo préstamos activos (remainingAmount > 0)
GET /api/loans?status=paid                                -- Solo préstamos pagados (remainingAmount <= 0)
```

**Respuesta Exitosa (200 OK):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "initialAmount": 5000.00,
      "remainingAmount": 2500.00,
      "interestRate": 5.5,
      "installment": 500.00,
      "debtor": "Juan Pérez",
      "date": "2024-01-15",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "message": "Loans retrieved successfully",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "meta": {
    "total": 15,
    "page": 1,
    "limit": 6,
    "totalPages": 3
  }
}
```

### 2. Obtener préstamo por ID
**GET** `/loans/:id`

### 3. Crear nuevo préstamo
**POST** `/loans`

### 4. Actualizar préstamo
**PUT** `/loans/:id`

### 5. Eliminar préstamo
**DELETE** `/loans/:id`

### 6. Resumen mensual de préstamos
**GET** `/loans/summary/monthly?year=2024&month=1`

**Query Parameters:**
- `year` (opcional): Año (default: año actual)
- `month` (opcional): Mes 1-12 (1-indexed)

**Respuesta:**
```json
{
  "statusCode": 200,
  "data": {
    "month": "May 2026",
    "totalAmountLent": 5000.00,
    "totalInterest": 275.00,
    "totalReceived": 1000.00,
    "totalPending": 4250.00,
    "loanCount": 3,
    "fullyPaidCount": 1,
    "activeCount": 2,
    "byDebtor": { "Juan Pérez": 5000.00 },
    "byDay": { "15": 5000.00 }
  },
  "message": "Monthly loan summary retrieved successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 7. Resumen anual de préstamos
**GET** `/loans/summary/yearly?year=2024`

**Query Parameters:**
- `year` (opcional): Año (default: año actual)

**Respuesta:**
```json
{
  "statusCode": 200,
  "data": {
    "year": 2026,
    "totalAmountLent": 60000.00,
    "totalInterest": 3300.00,
    "totalReceived": 15000.00,
    "totalPending": 48300.00,
    "count": 12,
    "fullyPaidCount": 4,
    "activeCount": 8,
    "monthlyBreakdown": {
      "Jan": 5000.00,
      "Feb": 4500.00,
      "Mar": 5500.00
    },
    "averageMonthly": 5000.00
  },
  "message": "Yearly loan summary retrieved successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 8. Resumen general de préstamos
**GET** `/loans/summary/overall`

**Respuesta:**
```json
{
  "statusCode": 200,
  "data": {
    "totalLoans": 15,
    "totalAmountLent": 120000.00,
    "totalInterest": 6600.00,
    "totalExpectedReturn": 126600.00,
    "totalReceived": 45000.00,
    "totalPending": 81600.00,
    "fullyPaidCount": 5,
    "activeLoansCount": 10
  },
  "message": "Loan summary retrieved successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Variables de Entorno Requeridas
 
 ```env
 # JWT
 JWT_SECRET=tu-secret-key-aqui
 
 # Google OAuth (opcional para autenticación con Google)
 GOOGLE_CLIENT_ID=tu-google-client-id
 GOOGLE_CLIENT_SECRET=tu-google-client-secret
 GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
 ```