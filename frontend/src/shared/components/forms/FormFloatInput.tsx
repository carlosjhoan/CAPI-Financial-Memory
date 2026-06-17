import { useController, type Control, type FieldValues, type Path } from 'react-hook-form';
import FloatInput from '../FloatInput';
import type { FloatInputProps } from '../FloatInput';

export interface FormFloatInputProps<T extends FieldValues> extends Omit<FloatInputProps, 'value' | 'onChange' | 'onBlur' | 'error'> {
  name: Path<T>;
  control: Control<T>;
}

function FormFloatInput<T extends FieldValues>({
  name,
  control,
  ...props
}: FormFloatInputProps<T>) {
  const {
    field: { value, onChange, onBlur },
    fieldState: { error },
  } = useController({ name, control });

  return (
    <FloatInput
      value={value as string | number | readonly string[] | undefined}
      onChange={onChange}
      onBlur={onBlur}
      error={error?.message}
      {...props}
    />
  );
}

export default FormFloatInput;
