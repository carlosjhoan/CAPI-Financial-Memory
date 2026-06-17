import { apiClient } from './client';
import type { ApiResponse } from '../types/api.types';

// ==========================================
// HELPERS
// ==========================================

/**
 * Build query string desde un objeto de filtros
 * Filttra valores undefined/null
 */
function buildParams(filters?: Record<string, unknown>): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Resultado genérico para endpoints paginados
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ==========================================
// API SERVICE FACTORY
// ==========================================

/**
 * Crea un servicio API genérico para una entidad.
 * Genera automáticamente los métodos CRUD estándares.
 *
 * @param entityPath - Ruta de la entidad (ej: 'incomes', 'debts')
 * @returns Objeto con métodos CRUD: getAll, getAllPaginated, getById, create, update, delete
 *
 * @example
 * const incomesApi = createApiService<Income, CreateIncomeDto, UpdateIncomeDto, IncomeFilters>('incomes');
 * const incomes = await incomesApi.getAll({ year: 2026 });
 * const income = await incomesApi.getById('123');
 * const newIncome = await incomesApi.create({ amount: 100, reason: 'Salary' });
 */
export function createApiService<
  TEntity,
  TCreateDto = Record<string, unknown>,
  TUpdateDto = Record<string, unknown>,
  TFilters = Record<string, unknown>,
>(entityPath: string) {
  return {
    // ==========================================
    // READ OPERATIONS
    // ==========================================

    /**
     * GET /{entityPath} — Obtener todos los registros
     */
    getAll(filters?: TFilters): Promise<TEntity[]> {
      const queryString = buildParams(filters as Record<string, unknown>);
      return apiClient
        .get<ApiResponse<TEntity[]>>(`/${entityPath}${queryString}`)
        .then((r) => r.data.data);
    },

    /**
     * GET /{entityPath} — Obtener todos con paginación
     */
    getAllPaginated(
      filters?: TFilters,
      page = 1,
      limit = 6
    ): Promise<PaginatedResult<TEntity>> {
      const queryString = buildParams({
        ...(filters as Record<string, unknown>),
        page,
        limit,
      });
      return apiClient
        .get<
          ApiResponse<
            TEntity[],
            { total: number; page: number; limit: number; totalPages: number }
          >
        >(`/${entityPath}${queryString}`)
        .then((r) => ({
          data: r.data.data,
          meta: r.data.meta!,
        }));
    },

    /**
     * GET /{entityPath}/:id — Obtener por ID
     */
    getById(id: string): Promise<TEntity> {
      return apiClient
        .get<ApiResponse<TEntity>>(`/${entityPath}/${id}`)
        .then((r) => r.data.data);
    },

    // ==========================================
    // WRITE OPERATIONS
    // ==========================================

    /**
     * POST /{entityPath} — Crear nuevo registro
     */
    create(data: TCreateDto): Promise<TEntity> {
      return apiClient
        .post<ApiResponse<TEntity>>(`/${entityPath}`, data)
        .then((r) => r.data.data);
    },

    /**
     * PUT /{entityPath}/:id — Actualizar registro
     */
    update(id: string, data: Partial<TUpdateDto>): Promise<TEntity> {
      return apiClient
        .put<ApiResponse<TEntity>>(`/${entityPath}/${id}`, data)
        .then((r) => r.data.data);
    },

    /**
     * DELETE /{entityPath}/:id — Eliminar registro
     */
    delete(id: string): Promise<void> {
      return apiClient
        .delete(`/${entityPath}/${id}`)
        .then(() => undefined);
    },
  };
}

// ==========================================
// CUSTOM REQUEST HELPER
// ==========================================

/**
 * Helper para hacer requests personalizados que no fittean en el CRUD genérico.
 * Permite especificar método HTTP y cuerpo.
 *
 * @example
 * // Para registerPayment en debts
 * const debt = await customRequest<Debt>('POST', '/debts/123/payments', { amount: 500 });
 */
export async function customRequest<
  TResponse,
  TBody = Record<string, unknown>,
>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  body?: TBody,
  queryParams?: Record<string, unknown>
): Promise<TResponse> {
  const queryString = queryParams ? buildParams(queryParams) : '';

  const config = {
    method,
    url: `${url}${queryString}`,
    ...(body ? { data: body } : {}),
  };

  return apiClient(config).then((r) => r.data.data);
}