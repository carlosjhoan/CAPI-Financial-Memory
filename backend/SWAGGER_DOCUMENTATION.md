# Documentación Swagger - Personal Finance Manager API

## Resumen
La API del Personal Finance Manager (PFM) está completamente documentada con Swagger/OpenAPI. La documentación está disponible en `/api/docs` cuando el servidor está en ejecución.

## Configuración de Swagger

### Archivo de configuración
`src/infrastructure/config/swagger.config.ts`

### Características implementadas
1. **Título**: Personal Finance Manager API
2. **Descripción**: Documentación completa de la API para gestión de finanzas personales
3. **Versión**: 1.0
4. **Servidores**:
   - Desarrollo: `http://localhost:3000`
   - Producción: `https://api.pfm.example.com`
5. **Autenticación**: Configuración para JWT Bearer token
6. **Tags organizados**:
   - `debts`: Operaciones relacionadas con deudas
   - `expenses`: Operaciones relacionadas con gastos
   - `incomes`: Operaciones relacionadas con ingresos
   - `loans`: Operaciones relacionadas con préstamos

## Controladores documentados

### 1. DebtController (`/api/debts`)
**Endpoints:**
- `POST /` - Crear una nueva deuda
- `GET /` - Obtener todas las deudas
- `GET /:id` - Obtener una deuda por ID
- `POST /:id/payments` - Registrar un pago de deuda
- `DELETE /:id` - Eliminar una deuda

### 2. ExpenseController (`/api/expenses`)
**Endpoints:**
- `POST /` - Crear un nuevo gasto
- `GET /` - Obtener todos los gastos
- `GET /:id` - Obtener un gasto por ID
- `PUT /:id` - Actualizar un gasto
- `DELETE /:id` - Eliminar un gasto
- `GET /summary/monthly` - Resumen mensual de gastos
- `GET /summary/overall` - Resumen general de gastos

### 3. IncomeController (`/api/incomes`)
**Endpoints:**
- `POST /` - Crear un nuevo ingreso
- `GET /` - Obtener todos los ingresos
- `GET /:id` - Obtener un ingreso por ID
- `PUT /:id` - Actualizar un ingreso
- `DELETE /:id` - Eliminar un ingreso
- `GET /summary/monthly` - Resumen mensual de ingresos
- `GET /summary/yearly` - Resumen anual de ingresos
- `GET /summary/overall` - Resumen general de ingresos

### 4. LoanController (`/api/loans`)
**Endpoints:**
- `POST /` - Crear un nuevo préstamo
- `GET /` - Obtener todos los préstamos
- `GET /:id` - Obtener un préstamo por ID
- `POST /:id/payments` - Registrar un pago de préstamo
- `DELETE /:id` - Eliminar un préstamo
- `GET /summary/overall` - Resumen general de préstamos
- `GET /summary/overdue` - Préstamos vencidos
- `GET /summary/performance/:loanId` - Rendimiento de un préstamo

## DTOs documentados

### DTOs de creación
1. `CreateDebtDto` - Campos para crear una deuda
2. `CreateExpenseDto` - Campos para crear un gasto
3. `CreateIncomeDto` - Campos para crear un ingreso
4. `CreateLoanDto` - Campos para crear un préstamo

### DTOs de actualización
1. `UpdateExpenseDto` - Campos para actualizar un gasto
2. `UpdateIncomeDto` - Campos para actualizar un ingreso

### DTOs de pago
1. `RegisterPaymentDto` - Campos para registrar un pago de deuda
2. `RegisterLoanPaymentDto` - Campos para registrar un pago de préstamo

### DTOs de respuesta
1. `ApiResponse<T>` - Formato estándar de respuesta exitosa
2. `ErrorResponse` - Formato estándar de respuesta de error
3. `PaginatedResponse<T>` - Formato para respuestas paginadas
4. `PaginationParamsDto` - Parámetros para paginación

## Validaciones implementadas

### Decoradores de validación
- `@IsNumber()` - Validación de números
- `@IsString()` - Validación de strings
- `@IsDateString()` - Validación de fechas ISO 8601
- `@Min()` - Valor mínimo
- `@Max()` - Valor máximo
- `@MaxLength()` - Longitud máxima
- `@IsOptional()` - Campos opcionales

### Ejemplos en DTOs
Cada DTO incluye ejemplos específicos para cada campo:
```typescript
@ApiProperty({ 
  description: "Monto inicial de la deuda",
  example: 1000.5,
  minimum: 0.01,
  type: "number",
  format: "float"
})
```

## Respuestas de error documentadas

### Códigos de estado HTTP
- `400 Bad Request` - Datos de entrada inválidos
- `401 Unauthorized` - Autenticación requerida
- `403 Forbidden` - Permisos insuficientes
- `404 Not Found` - Recurso no encontrado
- `500 Internal Server Error` - Error del servidor

### Formato de error
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/debts",
  "validationErrors": {
    "amount": ["must be greater than 0"]
  }
}
```

## Cómo usar la documentación Swagger

### 1. Iniciar el servidor
```bash
cd backend
npm run start:dev
```

### 2. Acceder a la documentación
- URL: `http://localhost:3000/api/docs`
- La interfaz Swagger UI permite probar los endpoints directamente

### 3. Probar endpoints
1. Seleccionar un endpoint
2. Hacer clic en "Try it out"
3. Completar los parámetros requeridos
4. Hacer clic en "Execute"
5. Ver la respuesta en tiempo real

## Mejoras implementadas

### 1. Documentación completa
- Todos los endpoints tienen descripciones y ejemplos
- Parámetros documentados con ejemplos
- Respuestas de éxito y error documentadas

### 2. Validaciones mejoradas
- Ejemplos específicos para cada campo
- Descripciones detalladas
- Restricciones de validación claras

### 3. Organización
- Tags por categoría de recursos
- Endpoints agrupados lógicamente
- Documentación estructurada

### 4. Configuración avanzada
- Múltiples servidores (desarrollo/producción)
- Configuración para autenticación JWT
- Opciones personalizadas de Swagger UI

## Próximas mejoras sugeridas

### 1. Autenticación
- Implementar autenticación JWT
- Agregar endpoints de login/registro
- Proteger endpoints sensibles

### 2. Documentación avanzada
- Agregar más ejemplos de uso
- Incluir diagramas de secuencia
- Documentar casos de uso comunes

### 3. Testing
- Generar clientes SDK automáticamente
- Validar documentación con pruebas
- Integrar con CI/CD

## Notas técnicas

### Dependencias
- `@nestjs/swagger`: ^7.4.2
- `swagger-ui-express`: ^5.0.1
- `class-validator`: ^0.14.1
- `class-transformer`: ^0.5.1

### Configuración
La configuración de Swagger se inicializa en `src/main.ts`:
```typescript
setupSwagger(app);
```

### Personalización
La configuración permite personalizar:
- Título y descripción
- Servidores
- Autenticación
- Tags
- Opciones de UI