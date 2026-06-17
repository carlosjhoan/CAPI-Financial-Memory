import { useForm, type UseFormReturn, type FieldValues, type DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export interface UseBaseFormOptions<T extends FieldValues> {
  schema: z.ZodType<T>;
  defaultValues: DefaultValues<T>;
  isEditMode?: boolean;
  updateSchema?: z.ZodType<T>;
}

/**
 * Base form hook that centralizes the useForm + zodResolver setup.
 *
 * Handles:
 * - Schema switching between create / update modes
 * - Default values injection
 * - Type-safe form return
 *
 * Each feature hook composes this and adds toCreateDto/toUpdateDto + field arrays.
 *
 * @example
 * ```ts
 * const form = useBaseForm({
 *   schema: expenseSchema,
 *   defaultValues: { amount: 0, reason: '', date: today },
 *   isEditMode,
 *   updateSchema: expenseUpdateSchema,
 * });
 *
 * return { ...form, toCreateDto, toUpdateDto };
 * ```
 */
export function useBaseForm<T extends FieldValues>({
  schema,
  defaultValues,
  isEditMode = false,
  updateSchema,
}: UseBaseFormOptions<T>): UseFormReturn<T> {
  const activeSchema = isEditMode && updateSchema ? updateSchema : schema;

  return useForm<T>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(activeSchema as any),
    defaultValues,
    mode: 'onChange',
  });
}

export default useBaseForm;
