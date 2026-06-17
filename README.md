<div align="center">
  <img alt="CAPI" src="frontend/public/assets/CAPI_logo.png" width="320" style="border-radius: 50%; aspect-ratio: 1/1; object-fit: cover; display: block;">
  <h1 style="margin: 0 0 -0.5rem 0;">CAPI</h1>
  <p><i><font color="#6b7280">Goodbye Financial Amnesia!</font></i></p>
</div>

Sistema de gestión de finanzas personales con persistencia configurable (PostgreSQL por defecto, con soporte para MySQL y MongoDB mediante arquitectura hexagonal).

- **Backend**: NestJS + TypeORM (o Mongoose para Mongo)
- **Frontend**: React + TypeScript + TailwindCSS
- **Arquitectura Backend**: Hexagonal (Puertos y Adaptadores)
- **Arquitectura Frontend**: Basada en features con capas internas

---

## 2. Modelos de Datos

### Deuda (`debt`)

| Campo             | Tipo      | Descripción                                             |
| ----------------- | --------- | ------------------------------------------------------- |
| `id`              | UUID      | Identificador único                                     |
| `initialAmount`   | decimal   | Monto inicial de la deuda                               |
| `lender`          | string    | Entidad o persona a la cual se le pide prestado         |
| `months`          | int       | Plazo en meses                                          |
| `installAmount`   | int       | Valor de la cuota                                       |
| `payments`        | int       | Número de pagos realizados (se calcula automáticamente) |
| `finalAmount`     | decimal   | Monto total a pagar (incluye intereses)                 |
| `paidAmount`      | decimal   | Total pagado hasta la fecha                             |
| `remainingAmount` | decimal   | Monto restante por pagar                                |
| `date`            | date      | Fecha de registro de la deuda                           |
| `createdAt`       | timestamp | Auditoría                                               |
| `updatedAt`       | timestamp | Auditoría                                               |

**Reglas de negocio:**

- `remainingAmount = finalAmount - paidAmount`
- `payments` se incrementa al agregar un pago
- No se puede pagar más que `finalAmount`

---

### Gasto (`expense`)

| Campo       | Tipo      | Descripción         |
| ----------- | --------- | ------------------- |
| `id`        | UUID      | Identificador único |
| `amount`    | decimal   | Monto del gasto     |
| `reason`    | string    | Motivo del gasto    |
| `date`      | date      | Fecha del gasto     |
| `createdAt` | timestamp | Auditoría           |

---

### Ingreso (`income`)

| Campo       | Tipo      | Descripción         |
| ----------- | --------- | ------------------- |
| `id`        | UUID      | Identificador único |
| `amount`    | decimal   | Monto del ingreso   |
| `reason`    | string    | Motivo del ingreso  |
| `date`      | date      | Fecha del ingreso   |
| `createdAt` | timestamp | Auditoría           |

---

### Préstamo Otorgado (`loan`)

| Campo             | Tipo      | Descripción           |
| ----------------- | --------- | --------------------- |
| `id`              | UUID      | Identificador único   |
| `initialAmount`   | decimal   | Monto prestado        |
| `interestRate`    | decimal   | Porcentaje de interés |
| `installment`     | decimal   | Cuota fija mensual    |
| `paidAmount`      | decimal   | Total recibido        |
| `remainingAmount` | decimal   | Saldo pendiente       |
| `createdAt`       | timestamp | Auditoría             |
| `updatedAt`       | timestamp | Auditoría             |

**Reglas de negocio:**

- `remainingAmount = (initialAmount * (1 + interestRate/100)) - paidAmount`
- Al registrar un pago, se actualiza `paidAmount` y `remainingAmount`

---

## 3. Arquitectura del Backend (Hexagonal)

src/
├── domain/ # Capa de dominio (independiente de frameworks)
│ ├── entities/ # Modelos de dominio (Deuda, Gasto, Ingreso, Prestamo)
│ ├── repositories/ # Interfaces de repositorios (abstracciones)
│ └── services/ # Lógica de negocio pura
│
├── application/ # Casos de uso
│ ├── debt/ # CrearDeuda, PagarDeuda, ListarDeudas, etc.
│ ├── expense/
│ ├── income/
│ └── loan/
│
├── infrastructure/ # Implementaciones concretas
│ ├── config/ # Configuración de DB, TypeORM/Mongoose
│ ├── persistence/ # Adaptadores de repositorios
│ │ ├── postgres/ # Repositorios con TypeORM
│ │ ├── mysql/ # (opcional)
│ │ └── mongo/ # (opcional) con Mongoose
│ └── web/ # Controladores REST (NestJS)
│ ├── controllers/
│ ├── dto/ # Data Transfer Objects
│ └── modules/ # Módulos de NestJS
│
└── shared/ # Utilidades comunes

### Cambio de Base de Datos

- Usar **interfaces** en `domain/repositories` y **adaptadores** en `infrastructure/persistence`
- Configurar `TypeORM` para SQL (PostgreSQL/MySQL) con entities decoradas
- Configurar `Mongoose` para Mongo con schemas
- Un solo archivo de configuración que seleccione el adaptador según variable de entorno `DB_TYPE`

---

## 4. Arquitectura del Frontend

Arquitectura **por features** con capas internas:
src/
├── core/ # Servicios globales
│ ├── api/ # Cliente HTTP (Axios) con interceptores
│ ├── hooks/ # Hooks genéricos (useLocalStorage, etc.)
│ └── utils/
│
├── features/ # Cada feature es independiente
│ ├── debts/
│ │ ├── components/ # DebtForm, DebtList, DebtPaymentModal
│ │ ├── hooks/ # useDebts, useDebtPayment
│ │ ├── services/ # Llamadas a API específicas
│ │ ├── types/ # Tipos locales
│ │ └── pages/ # DebtPage, DebtDetailPage
│ ├── expenses/
│ ├── incomes/
│ └── loans/
│
├── shared/ # Componentes UI reusables (Button, Card, Modal)
├── layouts/ # Layouts generales (MainLayout, AuthLayout)
├── routes/ # Definición de rutas (React Router)
└── main.tsx # Punto de entrada

### Comunicación Backend-Frontend

- REST API con endpoints documentados
- **React Query** (TanStack Query) para manejo de estado asíncrono y caché
- **Zod** para validación de tipos en formularios
- **React Hook Form** para manejo de formularios

---

## 5. Tecnologías Específicas

| Capa           | Tecnología                                |
| -------------- | ----------------------------------------- |
| Backend        | NestJS + TypeScript                       |
| ORM/ODM        | TypeORM (SQL) / Mongoose (Mongo)          |
| DB por defecto | PostgreSQL                                |
| Frontend       | React + TypeScript + Vite                 |
| Estilos        | TailwindCSS                               |
| UI State       | React Context (temas) + React Query (API) |
| Formularios    | React Hook Form + Zod                     |
| Router         | React Router v6                           |
| HTTP Client    | Axios                                     |

---

## 6. Configuración y Arranque

### Requisitos Previos

- Node.js (Verificar versión. Prioritariamente que sea una +18)
- Docker (opcional para PostgreSQL. En este equipo toca utilizarlos con WSL)
- PostgreSQL (o MySQL/Mongo según elección)

### Variables de Entorno (Backend)

```env
# .env
DB_TYPE=postgres  # postgres | mysql | mongo
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=secret
DB_NAME=pfm_db

# Para MySQL:
# DB_TYPE=mysql
# DB_PORT=3306

# Para Mongo:
# DB_TYPE=mongo
# DB_URL=mongodb://localhost:27017/pfm_db

PORT=3000
```

### Variables de Entorno (Frontend)

```env
VITE_API_URL=http://localhost:3000/api
```

### Arranque del Backend

```bash
cd backend
npm install
npm run start:dev
```

### Arranque del Frontend

```bash
cd frontend
npm install
npm run dev
```

### Base de Datos con Docker (PostgreSQL)

```bash
docker run --name pfm-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=pfm_db \
  -p 5432:5432 \
  -d postgres:15
```

---

## 7. Documentación API con Swagger

El backend incluye documentación completa de la API utilizando Swagger/OpenAPI, que proporciona una interfaz interactiva para explorar y probar todos los endpoints.

### 📖 Acceso a la Documentación

1. **Iniciar el backend** (si no está ejecutándose):

   ```bash
   cd backend
   npm run start:dev
   ```

2. **Acceder a la documentación** en tu navegador:
   - **URL**: http://localhost:3000/api/docs
   - **Interfaz**: Swagger UI interactiva

### 🏷️ Organización por Categorías

La documentación está organizada en tags para facilitar la navegación:

| Tag        | Descripción                            | Endpoints                                               |
| ---------- | -------------------------------------- | ------------------------------------------------------- |
| `debts`    | Operaciones relacionadas con deudas    | Crear, listar, obtener, pagar, eliminar                 |
| `expenses` | Operaciones relacionadas con gastos    | Crear, listar, obtener, actualizar, eliminar, resúmenes |
| `incomes`  | Operaciones relacionadas con ingresos  | Crear, listar, obtener, actualizar, eliminar, resúmenes |
| `loans`    | Operaciones relacionadas con préstamos | Crear, listar, obtener, pagar, eliminar, resúmenes      |

### ✨ Características de la Documentación

- **📋 Documentación completa**: Todos los endpoints están documentados con descripciones detalladas
- **📝 Ejemplos de request/response**: Cada endpoint incluye ejemplos de DTOs con datos realistas
- **🔍 Validación interactiva**: Puedes probar los endpoints directamente desde la interfaz
- **📊 Esquemas de datos**: Modelos de entidades y DTOs completamente documentados
- **⚡ Actualización automática**: Los cambios en el código se reflejan automáticamente en Swagger

### ⚙️ Configuración Técnica

La configuración de Swagger se encuentra en `src/infrastructure/config/swagger.config.ts`:

```typescript
const config = new DocumentBuilder()
  .setTitle("Personal Finance Manager API")
  .setDescription(
    "API para el sistema de gestión de finanzas personales. Incluye modelos para Deudas, Gastos, Ingresos y Préstamos.",
  )
  .setVersion("1.0")
  .addTag("debts", "Operaciones relacionadas con deudas")
  .addTag("expenses", "Operaciones relacionadas con gastos")
  .addTag("incomes", "Operaciones relacionadas con ingresos")
  .addTag("loans", "Operaciones relacionadas con préstamos")
  .addServer("http://localhost:3000", "Servidor de desarrollo")
  .build();
```

### 🚀 Cómo Usar la Documentación

#### 1. Explorar Endpoints

- Navega por los diferentes tags para ver los endpoints disponibles
- Cada endpoint muestra:
  - **Método HTTP** y **ruta**
  - **Descripción** detallada
  - **Parámetros** requeridos y opcionales
  - **Códigos de respuesta** con ejemplos

#### 2. Probar Endpoints

1. Haz clic en el botón **"Try it out"** de cualquier endpoint
2. Completa los parámetros requeridos (si los hay)
3. Haz clic en **"Execute"** para enviar la solicitud
4. Revisa la **respuesta** en tiempo real

#### 3. Ver Esquemas de Datos

- En la sección **"Schemas"** encontrarás todos los modelos de datos
- Cada esquema incluye:
  - **Propiedades** con tipos de datos
  - **Descripciones** de cada campo
  - **Ejemplos** de valores
  - **Validaciones** aplicadas

### 📋 Ejemplo de Endpoint Documentado

**Endpoint**: `POST /api/debts`

- **Tag**: `debts`
- **Descripción**: "Crear una nueva deuda"
- **Body**: `CreateDebtDto` con validaciones
- **Respuestas**:
  - `201 Created`: Deuda creada exitosamente
  - `400 Bad Request`: Datos de entrada inválidos

### 🔧 Para Desarrolladores

#### Extender la Documentación

Para agregar documentación a nuevos endpoints o modificar la existente:

1. **Decorar Controladores**:

   ```typescript
   @ApiTags('nuevo-tag')
   @ApiOperation({ summary: 'Descripción', description: 'Detalles' })
   @ApiResponse({ status: 200, description: 'Éxito' })
   ```

2. **Decorar DTOs**:

   ```typescript
   @ApiProperty({ description: 'Descripción del campo', example: 'valor ejemplo' })
   @ApiPropertyOptional({ description: 'Campo opcional' })
   ```

3. **Decorar Entidades** (opcional):
   ```typescript
   @ApiProperty({ description: 'Propiedad de la entidad' })
   ```

#### Archivos Clave

- `src/infrastructure/config/swagger.config.ts` - Configuración principal
- `src/main.ts` - Integración con la aplicación NestJS
- `src/infrastructure/web/controllers/*.controller.ts` - Controladores documentados
- `src/infrastructure/web/dto/*.dto.ts` - DTOs documentados
- `src/domain/entities/*.entity.ts` - Entidades documentadas

### ⚠️ Notas Importantes

- La documentación Swagger solo está disponible en **modo desarrollo** (`npm run start:dev`)
- Para entornos de producción, considera:
  - Deshabilitar Swagger
  - Proteger el acceso con autenticación
  - Configurar CORS apropiadamente
- Los cambios en controladores, DTOs o entidades se reflejan automáticamente al recargar
- Swagger UI incluye funcionalidades de búsqueda y filtrado para encontrar endpoints rápidamente

### 🔗 Recursos Adicionales

- [Documentación oficial de NestJS Swagger](https://docs.nestjs.com/openapi/introduction)
- [Especificación OpenAPI 3.0](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)

---

## 8. Endpoints API

| Método | Endpoint                  | Descripción                  |
| ------ | ------------------------- | ---------------------------- |
| POST   | `/api/debts`              | Crear nueva deuda            |
| GET    | `/api/debts`              | Listar todas las deudas      |
| GET    | `/api/debts/:id`          | Obtener detalle de una deuda |
| POST   | `/api/debts/:id/payments` | Registrar pago de deuda      |
| DELETE | `/api/debts/:id`          | Eliminar deuda               |
| POST   | `/api/expenses`           | Crear gasto                  |
| GET    | `/api/expenses`           | Listar gastos                |
| GET    | `/api/expenses/:id`       | Obtener detalle de gasto     |
| PUT    | `/api/expenses/:id`       | Actualizar gasto             |
| DELETE | `/api/expenses/:id`       | Eliminar gasto               |
| POST   | `/api/incomes`            | Crear ingreso                |
| GET    | `/api/incomes`            | Listar ingresos              |
| GET    | `/api/incomes/:id`        | Obtener detalle de ingreso   |
| PUT    | `/api/incomes/:id`        | Actualizar ingreso           |
| DELETE | `/api/incomes/:id`        | Eliminar ingreso             |
| POST   | `/api/loans`              | Crear préstamo otorgado      |
| GET    | `/api/loans`              | Listar préstamos             |
| GET    | `/api/loans/:id`          | Obtener detalle de préstamo  |
| POST   | `/api/loans/:id/payments` | Registrar pago de préstamo   |
| DELETE | `/api/loans/:id`          | Eliminar préstamo            |

### Formato de Respuesta

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Success",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Formato de Error

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation error details",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 9. DTOs (Data Transfer Objects)

### Crear Deuda

```json
{
  "initialAmount": 10000.0,
  "months": 12,
  "lender": "Nequi",
  "finalAmount": 12000.0,
  "date": "2024-01-01"
}
```

### Registrar Pago de Deuda

```json
{
  "amount": 1000.0,
  "date": "2024-02-01"
}
```

### Crear Gasto

```json
{
  "amount": 150.5,
  "reason": "Supermercado",
  "date": "2024-01-15"
}
```

### Crear Ingreso

```json
{
  "amount": 2500.0,
  "reason": "Salario Enero",
  "date": "2024-01-10"
}
```

### Crear Préstamo

```json
{
  "initialAmount": 5000.0,
  "interestRate": 5.0,
  "installment": 500.0,
  "debtor": "Fulanito",
  "date": "2024-01-01"
}
```

### Registrar Pago de Préstamo

```json
{
  "amount": 500.0,
  "date": "2024-02-01"
}
```

---

## 10. Criterios de Calidad

### Backend

- Pruebas unitarias: Servicios de dominio con Jest

- Pruebas e2e: Controladores con supertest

- Cobertura mínima: 80%

- Validaciones: class-validator en DTOs

- Manejo de errores: Global exception filter

- Migraciones: TypeORM migrations para SQL

- Logging: NestJS Logger con Winston (opcional)

### Frontend

- Tipado estricto: TypeScript sin any

- Componentes funcionales: React Hooks

- Manejo de errores: Error boundaries y manejo en React Query

- Accesibilidad: ARIA labels y semántica HTML

- Responsive: TailwindCSS con breakpoints móvil primero
