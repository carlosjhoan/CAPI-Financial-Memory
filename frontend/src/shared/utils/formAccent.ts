/**
 * Section accent colors for form identity.
 *
 * Maps each feature section to Tailwind color classes for:
 * - Border on focus
 * - Focus ring
 * - Label text color on focus
 *
 * Usage in form components:
 * ```tsx
 * <FormFloatInput name="amount" control={control} label="Monto" accent="expense" />
 * ```
 */

export type FormAccent = 'primary' | 'expense' | 'income' | 'debt' | 'loan' | 'pocket';

export interface AccentClasses {
  border: string;       // applied to wrapper: focus-within:border-{color}-500
  ring: string;         // applied when focused: ring-{color}-500/30
  label: string;        // applied to label when focused: text-{color}-600 dark:text-{color}-400
  glowRGB: string;      // RGB triple for the pulsing glow animation
}

export const FORM_ACCENT: Record<FormAccent, AccentClasses> = {
  primary: {
    border: 'focus-within:border-primary-500 dark:focus-within:border-primary-400',
    ring: 'focus-within:ring-primary-500/30',
    label: 'text-primary-600 dark:text-primary-400',
    glowRGB: '99, 102, 241',
  },
  expense: {
    border: 'focus-within:border-orange-500 dark:focus-within:border-orange-400',
    ring: 'focus-within:ring-orange-500/30',
    label: 'text-orange-600 dark:text-orange-400',
    glowRGB: '249, 115, 22',
  },
  income: {
    border: 'focus-within:border-green-500 dark:focus-within:border-green-400',
    ring: 'focus-within:ring-green-500/30',
    label: 'text-green-600 dark:text-green-400',
    glowRGB: '34, 197, 94',
  },
  debt: {
    border: 'focus-within:border-red-500 dark:focus-within:border-red-400',
    ring: 'focus-within:ring-red-500/30',
    label: 'text-red-600 dark:text-red-400',
    glowRGB: '239, 68, 68',
  },
  loan: {
    border: 'focus-within:border-blue-500 dark:focus-within:border-blue-400',
    ring: 'focus-within:ring-blue-500/30',
    label: 'text-blue-600 dark:text-blue-400',
    glowRGB: '59, 130, 246',
  },
  pocket: {
    border: 'focus-within:border-purple-500 dark:focus-within:border-purple-400',
    ring: 'focus-within:ring-purple-500/30',
    label: 'text-purple-600 dark:text-purple-400',
    glowRGB: '168, 85, 247',
  },
};
