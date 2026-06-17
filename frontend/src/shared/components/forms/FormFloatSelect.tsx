import { useController, type Control, type FieldValues, type Path } from 'react-hook-form';
import FloatSelect from '../FloatSelect';
import type { FloatSelectProps } from '../FloatSelect';

export interface FormFloatSelectProps<T extends FieldValues> extends Omit<FloatSelectProps, 'value' | 'onChange' | 'onBlur' | 'error'> {
  name: Path<T>;
  control: Control<T>;
}

function FormFloatSelect<T extends FieldValues>({
  name,
  control,
  ...props
}: FormFloatSelectProps<T>) {
  const {
    field: { value, onChange, onBlur },
    fieldState: { error },
  } = useController({ name, control });

  return (
    <FloatSelect
      value={value as string | undefined}
      onChange={onChange}
      onBlur={onBlur}
      error={error?.message}
      {...props}
    />
  );
}

export default FormFloatSelect;
