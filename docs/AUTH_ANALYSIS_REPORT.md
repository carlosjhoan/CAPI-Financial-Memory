# Informe de Análisis: Estado Actual del Proyecto para Implementación de Autenticación

## Resumen Ejecutivo

El proyecto Personal Finance Manager (PFM) actualmente **no cuenta con ningún módulo de autenticación implementado**. El backend está configurado para soportar JWT Bearer Auth en Swagger, pero la lógica de autenticación no existe. Se requiere implementar desde cero tanto el backend como la integración con el frontend.

---

## 1. Estructura del Proyecto Backend (NestJS)

### 1.1 Arquitectura General

El proyecto sigue una **arquitectura Clean Architecture** bien organizada:

```
backend/src/
├── main.ts                          # Punto de entrada
├── domain/
│   ├── entities/                    # Entidades del dominio
│   │   ├── income.entity.ts
│   │   ├── expense.entity.ts
│   │   ├── debt.entity.ts
│   │   └── loan.entity.ts
│   ├── repositories/                # Interfaces de repositorios
│   │   ├── income.repository.ts
│   │   ├── expense.repository.ts
│   │   ├── debt.repository.ts
│   │   └── loan.repository.ts
│   └── services/                    # Servicios del dominio
├── application/                     # Casos de uso (use-cases)
│   ├── income/
│   ├── expense/
│   ├── debt/
│   └── loan/
└── infrastructure/
    ├── config/                      # Configuraciones
    │   ├── database.module.ts
    │   ├── data-source.ts
    │   └── swagger.config.ts
    ├── persistence/                 # Implementaciones de repositorios
    │   └── postgres/
    │       ├── entities/            # Entidades TypeORM
    │       ├── repository/          # Repositorios TypeORM
    │       └── in_memory/           # Repositorios en memoria
    └── web/
        ├── controllers/             # Controladores API
        ├── modules/                 # Módulos NestJS
        └── dto/                     # Data Transfer Objects
```

### 1.2 Módulos Existentes

| Módulo    | Controlador        | Servicio       | Entidad       |
|-----------|-------------------|----------------|---------------|
| Income    | income.controller | income.service | Income        |
| Expense   | expense.controller| expense.service| Expense       |
| Debt      | debt.controller  | debt.service   | Debt          |
| Loan      | loan.controller   | loan.service   | Loan          |

---

## 2. Estado del Módulo de Autenticación

### 2.1 Résultat de la Búsqueda

**NO EXISTE** ningún módulo, controlador, servicio o componente relacionado con autenticación. La búsqueda de patrones como `auth`, `Auth`, `passport`, `Passport`, `jwt`, `JWT`, `google`, `Google` únicamente devolvió:

- Referencias en la configuración de Swagger para JWT Bearer
- Referencias en `main.ts` para el header `Authorization` en CORS
- Referencias genéricas en archivos de node_modules

### 2.2 Archivos de Autenticación No Existentes

```
backend/src/
├── [NO EXISTE] auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts
│   │   └── google.strategy.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   └── decorators/
│       └── current-user.decorator.ts
├── [NO EXISTE] domain/entities/user.entity.ts
└── [NO EXISTE] infrastructure/persistence/postgres/entities/user.entity.ts
```

---

## 3. Dependencias del Package.json

### 3.1 Dependencies Actuales del Backend

```json
{
  "@nestjs/common": "10.4.15",
  "@nestjs/core": "10.4.15",
  "@nestjs/platform-express": "10.4.15",
  "@nestjs/typeorm": "10.0.2",
  "@nestjs/swagger": "7.4.2",
  "class-transformer": "0.5.1",
  "class-validator": "0.14.1",
  "pg": "8.13.1",
  "reflect-metadata": "0.2.2",
  "rxjs": "7.8.1",
  "swagger-ui-express": "5.0.1",
  "typeorm": "0.3.20"
}
```

### 3.2 Dependencias Faltantes para Autenticación

Para implementar la autenticación solicitada (JWT + Passport y Google OAuth), se requieren las siguientes dependencias adicionales:

| Paquete                           | Versión Sugerida | Propósito                              |
|-----------------------------------|------------------|----------------------------------------|
| @nestjs/passport                 | ^10.0.3          | Integración de Passport con NestJS    |
| @nestjs/jwt                      | ^10.2.0          | Módulo JWT de NestJS                   |
| passport                         | ^0.7.0           | Framework de autenticación              |
| passport-jwt                     | ^4.0.1           | Strategy JWT para Passport             |
| passport-google-oauth20          | ^2.0.0           | Strategy Google OAuth                  |
| bcrypt                           | ^5.1.1           | Hash de contraseñas                    |
| @types/bcrypt                    | ^5.0.2           | Tipos TypeScript para bcrypt           |
| @types/passport-jwt              | ^4.0.1           | Tipos para passport-jwt                |
| @types/passport-google-oauth20   | ^2.0.2           | Tipos para Google OAuth                |

---

## 4. Configuración de Swagger

### 4.1 Estado Actual

La configuración de Swagger **sí incluye** la definición de autenticación JWT Bearer:

```typescript
// backend/src/infrastructure/config/swagger.config.ts
.addBearerAuth(
  {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "Ingrese el token JWT en el formato: Bearer <token>",
  },
  "access-token",
)
```

### 4. Limitaciones

- La configuración de Swagger está lista para JWT, pero **no hay implementación real** de autenticación en los controladores
- No hay ningún endpoint de login/register documentado
- No hay guards aplicados a los endpoints existentes

---

## 5. Entidades de Usuario

### 5.1 Estado Actual

**NO EXISTE** una entidad de Usuario en el proyecto. Las entidades existentes son:

| Entidad    | Ubicación                              | Propósito                           |
|------------|---------------------------------------|-------------------------------------|
| Income     | domain/entities/income.entity.ts      | Registro de ingresos                |
| Expense    | domain/entities/expense.entity.ts     | Registro de gastos                  |
| Debt       | domain/entities/debt.entity.ts        | Registro de deudas                  |
| Loan       | domain/entities/loan.entity.ts        | Registro de préstamos               |

### 5.2 Entidad Requerida para Autenticación

Para implementar la autenticación, se necesita crear:

```typescript
// Entidad de dominio (domain/entities/user.entity.ts)
export class User {
  id: string;
  email: string;
  password?: string;        // Para JWT local
  googleId?: string;        // Para Google OAuth
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Entidad TypeORM (infrastructure/persistence/postgres/entities/user.entity.ts)
@Entity('users')
export class UserEntity {
  @PrimaryColumn('uuid')
  id: string;
  
  @Column({ unique: true })
  email: string;
  
  @Column({ nullable: true })
  password: string;
  
  @Column({ nullable: true, unique: true })
  googleId: string;
  
  @Column()
  name: string;
  
  @CreateDateColumn()
  createdAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

## 6. Guards e Interceptores de Autenticación

### 6.1 Estado Actual

**NO EXISTE** ningún guard o interceptor de autenticación. El proyecto tiene:

- `ValidationPipe` global para validación de DTOs
- `setGlobalPrefix("api")` para todas las rutas
- CORS configurado con headers de Authorization

### 6.2 Componentes Requeridos

```typescript
// backend/src/infrastructure/auth/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// backend/src/infrastructure/auth/guards/google-auth.guard.ts
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}

// backend/src/infrastructure/auth/decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(/* ... */);
```

---

## 7. Estado del API_CONTRACT.md

### 7.1 Contenido Actual

El archivo `API_CONTRACT.md` únicamente documenta los endpoints de **Ingresos (Incomes)**:

- `GET /api/incomes` - Obtener todos los ingresos
- `GET /api/incomes/:id` - Obtener ingreso por ID
- `POST /api/incomes` - Crear nuevo ingreso
- `PUT /api/incomes/:id` - Actualizar ingreso
- `DELETE /api/incomes/:id` - Eliminar ingreso
- `GET /api/incomes/summary/monthly` - Resumen mensual
- `GET /api/incomes/summary/yearly` - Resumen anual
- `GET /api/incomes/summary/overall` - Resumen general

### 7.2 Sección de Autenticación

**NO EXISTE** documentación de autenticación. Se requiere agregar:

```markdown
## Autenticación

### Endpoints de Autenticación

#### 1. Registro de Usuario
**POST** `/auth/register`

#### 2. Inicio de Sesión (JWT)
**POST** `/auth/login`

#### 3. Inicio de Sesión con Google
**GET** `/auth/google`
**GET** `/auth/google/callback`

#### 4. Cerrar Sesión
**POST** `/auth/logout`

#### 5. Refrescar Token
**POST** `/auth/refresh`
```

---

## 8. Frontend - Estado Actual

### 8.1 Dependencias del Frontend

```json
{
  "@hookform/resolvers": "^5.2.2",
  "@tanstack/react-query": "^5.0.0",
  "axios": "^1.6.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-hook-form": "^7.48.2",
  "react-router-dom": "^6.20.0",
  "zod": "^3.25.76"
}
```

### 8.2 Estado de Autenticación en Frontend

- **NO EXISTE** contexto de autenticación
- **NO EXISTE** página de login/register
- **NO EXISTE** protección de rutas
- **NO EXISTE** manejo de tokens JWT

### 8.3 Dependencias Sugeridas para Frontend

| Paquete                  | Propósito                          |
|--------------------------|------------------------------------|
| react-oauth/google       | Integración con Google OAuth      |
| @tanstack/react-query    | Ya existe - usar para auth mutations|
| jwt-decode               | Decodificar token JWT             |

---

## 9. Variables de Entorno Requeridas

### 9.1 Backend

```env
# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Base de datos (ya existe)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=pfm
```

### 9.2 Frontend

```env
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

---

## 10. Plan de Implementación Recomendado

### Fase 1: Backend - Autenticación Local (JWT + Passport)

1. Instalar dependencias de Passport y JWT
2. Crear entidad User
3. Crear módulo Auth con:
   - AuthController (endpoints de login/register)
   - AuthService (lógica de autenticación)
   - JwtStrategy (Passport JWT)
   - LocalStrategy (用户名/密码)
   - JWT Guard
4. Crear migración para tabla users
5. Actualizar AppModule

### Fase 2: Backend - Google OAuth

1. Instalar passport-google-oauth20
2. Crear GoogleStrategy
3. Agregar endpoints de Google OAuth al AuthController
4. Configurar callback URL

### Fase 3: Backend - Proteger Endpoints

1. Aplicar JwtAuthGuard a todos los endpoints existentes
2. Actualizar controladores para incluir usuario actual
3. Actualizar entidades para incluir relación con User

### Fase 4: Frontend - Autenticación

1. Crear contexto de autenticación (AuthProvider)
2. Crear página de Login con:
   - Formulario email/password
   - Botón de Google OAuth
3. Crear página de Register
4. Implementar protected routes
5. Agregar interceptor de axios para token

### Fase 5: Documentación

1. Actualizar API_CONTRACT.md con endpoints de auth
2. Actualizar SWAGGER_DOCUMENTATION.md

---

## 11. Conclusiones

| Aspecto                    | Estado              | Acción Requerida         |
|----------------------------|---------------------|-------------------------|
| Módulo Auth                | ❌ No existe        | Crear desde cero        |
| Entidad User               | ❌ No existe        | Crear entidad           |
| Strategies Passport       | ❌ No existen       | Implementar JWT + Google|
| Guards Autenticación       | ❌ No existen       | Implementar JWT Guard  |
| Endpoints Login/Register  | ❌ No existen       | Crear endpoints         |
| Integración Frontend      | ❌ No existe        | Crear contexto + UI     |
| Documentación Auth        | ❌ No existe        | Agregar a API_CONTRACT |
| Dependencias Backend       | ⚠️ Faltan           | Instalar Passport/JWT   |
| Config Swagger            | ✅ Parcial          | Completar implementación|

---

## 12. Recomendaciones del Tech Lead

Como TECH-LEAD de este proyecto, recomiendo:

1. **Iniciar por el Backend**: Completar la implementación de autenticación en el backend antes de modificar el frontend
2. **Swagger primero**: Verificar que los endpoints de auth funcionen con Swagger antes de conectar el frontend
3. **Separar estrategias**: Mantener separadas las estrategias de JWT local y Google OAuth para mejor mantenibilidad
4. **Migración de datos existente**: Considerar cómo migrar los datos de Income, Expense, Debt, Loan para asociarlos con usuarios
5. **Testing**: Crear pruebas unitarias para AuthService y AuthController

---

*Fecha de análisis: 2026-04-10*
*Proyecto: Personal Finance Manager (PFM)*
*Stack: NestJS + React + TypeScript + PostgreSQL*