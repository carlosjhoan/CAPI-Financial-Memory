import { useController, type Control, type FieldValues, type Path } from 'react-hook-form';
import FloatCurrency from '../FloatCurrency';
import type { FloatCurrencyProps } from '../FloatCurrency';

export interface FormFloatCurrencyProps<T extends FieldValues> extends Omit<FloatCurrencyProps, 'value' | 'onChange' | 'onBlur' | 'error'> {
  name: Path<T>;
  control: Control<T>;
}

function FormFloatCurrency<T extends FieldValues>({
  name,
  control,
  ...props
}: FormFloatCurrencyProps<T>) {
  const {
    field: { value, onChange, onBlur },
    fieldState: { error },
  } = useController({ name, control });

  return (
    <FloatCurrency
      value={value as number | undefined}
      onChange={onChange}
      onBlur={onBlur}
      error={error?.message}
      {...props}
    />
  );
}

export default FormFloatCurrency;
