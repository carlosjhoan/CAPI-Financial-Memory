# Feature: Gestión de Bolsillos (Pockets)

Esta feature implementa la gestión de **Bolsillos** — dinero que el usuario tiene guardado en distintos lugares como parte de su patrimonio total. Ejemplos: Efectivo libre, Nequi, Cuenta de ahorros, Alcancía, etc.

Cada bolsillo se compone de: **nombre**, **objetivo** (meta de ahorro), **valor acumulado**.

## Estructura

```
pockets/
├── components/            # Componentes específicos de bolsillos
│   ├── PocketCard.tsx       # Tarjeta individual con progress bar
│   ├── PocketForm.tsx       # Formulario para crear/editar
│   ├── PocketList.tsx       # Grid de tarjetas
│   └── DeletePocketModal.tsx # Modal de confirmación
├── hooks/                # Hooks personalizados
│   ├── usePockets.ts        # Hook para CRUD con React Query
│   └── usePocketForm.ts     # Hook para formulario con React Hook Form + Zod
├── pages/                # Páginas de la feature
│   └── PocketsPage.tsx      # Página principal de listado
├── services/             # Servicios API
│   └── index.ts             # Re-export desde core/api
├── types/                # Tipos TypeScript
│   └── pocket.types.ts      # Interfaces y tipos
├── index.ts             # Barril para exports
├── README.md            # Documentación
```

## Funcionalidades

### 1. Listado de Bolsillos
- ✅ Listar todos los bolsillos en grid responsive (1-3 columnas)
- ✅ Progress bar visual (acumulado vs objetivo)
- ✅ Badge "Meta alcanzada" cuando accumulated >= goal
- ✅ Estados de loading, error y empty state
- ✅ Total acumulado en el Dashboard

### 2. Creación de Bolsillos
- ✅ Formulario con validación Zod
- ✅ Campos: nombre, objetivo, valor acumulado
- ✅ Validación en tiempo real
- ✅ Manejo de errores del servidor
- ✅ Notificaciones de éxito/error

### 3. Edición de Bolsillos
- ✅ Edición de bolsillos existentes
- ✅ Mantiene datos originales
- ✅ Validación consistente
- ✅ Actualización optimista

### 4. Eliminación de Bolsillos
- ✅ Modal de confirmación
- ✅ Información detallada del bolsillo a eliminar
- ✅ Prevención de eliminación accidental
- ✅ Actualización de listado

## Integración Técnica

### React Query
- ✅ Gestión de estado del servidor
- ✅ Cache automática con staleTime: 30s listas, 5min summaries
- ✅ Invalidación de cache en mutaciones

### React Hook Form + Zod
- ✅ Validación: name 1-100 chars, goal > 0, accumulatedAmount >= 0
- ✅ Mensajes de error en español

### Tailwind CSS
- ✅ Diseño responsive
- ✅ Dark mode completo
- ✅ Color accent: teal/cyan

## API Integration

### Endpoints Consumidos
- `GET /pockets` - Listar todos los bolsillos
- `GET /pockets/:id` - Obtener bolsillo por ID
- `POST /pockets` - Crear nuevo bolsillo
- `PUT /pockets/:id` - Actualizar bolsillo
- `DELETE /pockets/:id` - Eliminar bolsillo
- `GET /pockets/summary` - Resumen total (acumulado, objetivos, cantidad)

## Componentes Compartidos

La feature utiliza componentes compartidos de `/shared/components/`:
- `Button` - Botones con variantes y estados
- `Input` - Inputs con validación
- `Modal` - Modales/diálogos
- `FormField` - Campos de formulario
- `CurrencyInput` - Input para montos monetarios
- `Toast` - Sistema de notificaciones

## Backend

### Domain Entity
```
Pocket { id, name, goal, accumulatedAmount, createdAt, updatedAt }
```

### Validaciones
- `name`: requerido, 1-100 caracteres
- `goal`: mayor a 0
- `accumulatedAmount`: mayor o igual a 0

### Endpoints (Swagger: `/api/docs`, tag "pockets")
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /pockets | Crear bolsillo |
| GET | /pockets | Listar todos |
| GET | /pockets/summary | Resumen global |
| GET | /pockets/:id | Detalle |
| PUT | /pockets/:id | Actualizar |
| DELETE | /pockets/:id | Eliminar |

### Arquitectura
- Hexagonal (Domain / Application / Infrastructure)
- TypeORM con PostgreSQL
- String token + useFactory DI
