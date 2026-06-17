# Feature: Gestión de Ingresos (Incomes)

Esta feature implementa la gestión completa de ingresos financieros en la aplicación de Personal Finance Manager.

## Estructura

```
incomes/
├── components/           # Componentes específicos de incomes
│   ├── IncomeCard.tsx      # Tarjeta individual de ingreso
│   ├── IncomeForm.tsx      # Formulario para crear/editar
│   ├── IncomeList.tsx      # Lista con filtros y paginación
│   ├── IncomeFilters.tsx   # Componente de filtros
│   └── DeleteIncomeModal.tsx # Modal de confirmación
├── hooks/               # Hooks personalizados
│   ├── useIncomes.ts       # Hook para CRUD con React Query
│   ├── useIncomeForm.ts    # Hook para formulario con React Hook Form + Zod
│   └── useIncomeFilters.ts # Hook para filtros con debouncing
├── pages/               # Páginas de la feature
│   ├── IncomesPage.tsx     # Página principal de listado
│   └── IncomeDetailPage.tsx # Página de detalle
├── services/            # Servicios API
│   └── incomes.service.ts  # Servicio con axios
├── types/               # Tipos TypeScript
│   └── income.types.ts     # Interfaces y tipos
├── index.ts            # Barril para exports
└── README.md           # Documentación
```

## Funcionalidades

### 1. Listado de Ingresos
- ✅ Listar todos los ingresos ordenados por fecha
- ✅ Filtrado por rango de fechas con debouncing (300ms)
- ✅ Vista de tarjetas responsive
- ✅ Estados de loading, error y empty state
- ✅ Total acumulado de ingresos

### 2. Creación de Ingresos
- ✅ Formulario con validación Zod
- ✅ Campos: monto, motivo, fecha
- ✅ Validación en tiempo real
- ✅ Manejo de errores del servidor
- ✅ Notificaciones de éxito/error

### 3. Edición de Ingresos
- ✅ Edición de ingresos existentes
- ✅ Mantiene datos originales
- ✅ Validación consistente
- ✅ Actualización optimista

### 4. Eliminación de Ingresos
- ✅ Modal de confirmación
- ✅ Información detallada del ingreso a eliminar
- ✅ Prevención de eliminación accidental
- ✅ Actualización de listado

### 5. Detalle de Ingreso
- ✅ Vista detallada de un ingreso específico
- ✅ Información completa con metadatos
- ✅ Acciones de edición y eliminación
- ✅ Navegación de regreso

## Integración Técnica

### React Query
- ✅ Gestión de estado del servidor
- ✅ Cache automática
- ✅ Reintentos automáticos
- ✅ Invalidación de cache
- ✅ Optimistic updates

### React Hook Form + Zod
- ✅ Validación de formularios
- ✅ Rendimiento optimizado
- ✅ Validación del servidor
- ✅ Mensajes de error amigables

### Tailwind CSS
- ✅ Diseño responsive
- ✅ Dark mode completo
- ✅ Componentes reutilizables
- ✅ Estilos consistentes

### TypeScript
- ✅ Tipado completo
- ✅ Interfaces bien definidas
- ✅ Seguridad de tipos
- ✅ Autocompletado inteligente

## API Integration

### Endpoints Consumidos
- `GET /incomes` - Listar ingresos (con filtros opcionales)
- `GET /incomes/:id` - Obtener ingreso por ID
- `POST /incomes` - Crear nuevo ingreso
- `PUT /incomes/:id` - Actualizar ingreso
- `DELETE /incomes/:id` - Eliminar ingreso
- `GET /incomes/summary/monthly` - Resumen mensual
- `GET /incomes/summary/yearly` - Resumen anual
- `GET /incomes/summary/overall` - Resumen general

### Manejo de Errores
- ✅ Errores de red
- ✅ Errores del servidor (400, 404, 500)
- ✅ Timeout (10 segundos)
- ✅ Mensajes amigables al usuario

## Componentes Compartidos

La feature utiliza componentes compartidos de `/shared/components/`:
- `Button` - Botones con variantes y estados
- `Input` - Inputs con validación
- `Card` - Tarjetas contenedoras
- `Modal` - Modales/diálogos
- `Table` - Tablas con paginación
- `FormField` - Campos de formulario
- `Select` - Componentes de selección
- `DatePicker` - Selector de fechas
- `CurrencyInput` - Input para montos monetarios
- `Toast` - Sistema de notificaciones

## Hooks Compartidos

La feature utiliza hooks compartidos de `/core/hooks/`:
- `useLocalStorage` - Persistencia en localStorage
- `useDebounce` - Debouncing para filtros
- `useToast` - Sistema de notificaciones

## Configuración

### Variables de Entorno
```env
VITE_API_URL=http://localhost:3000/api
```

### Tailwind Config
```javascript
// tailwind.config.js
darkMode: 'class',
colors: {
  primary: { /* ... */ },
  secondary: { /* ... */ },
}
```

## Uso

### Importación
```typescript
import { 
  IncomesPage,
  IncomeDetailPage,
  useIncomes,
  useCreateIncome,
  // ... otros exports
} from '../features/incomes';
```

### Ejemplo de Uso
```typescript
// En un componente
const { data: incomes, isLoading } = useIncomes(filters);
const createMutation = useCreateIncome();

const handleCreate = async (data) => {
  await createMutation.mutateAsync(data);
};
```

## Mejores Prácticas Implementadas

1. **Separación de Responsabilidades**: Cada archivo tiene una única responsabilidad
2. **Reutilización**: Componentes y hooks compartidos
3. **Performance**: Lazy loading, debouncing, memoización
4. **UX**: Loading states, error boundaries, empty states
5. **Accesibilidad**: ARIA labels, keyboard navigation
6. **Testing**: Estructura preparada para testing
7. **Mantenibilidad**: Código limpio y documentado

## Próximas Mejoras

1. **Exportación a CSV/PDF**
2. **Gráficos de tendencias**
3. **Categorización de ingresos**
4. **Importación desde archivos**
5. **Recordatorios recurrentes**
6. **Integración con bancos**