import { useController, type Control, type FieldValues, type Path } from 'react-hook-form';
import FloatDatePicker from '../FloatDatePicker';
import type { FloatDatePickerProps } from '../FloatDatePicker';

export interface FormFloatDatePickerProps<T extends FieldValues> extends Omit<FloatDatePickerProps, 'value' | 'onChange' | 'onBlur' | 'error'> {
  name: Path<T>;
  control: Control<T>;
}

function FormFloatDatePicker<T extends FieldValues>({
  name,
  control,
  ...props
}: FormFloatDatePickerProps<T>) {
  const {
    field: { value, onChange, onBlur },
    fieldState: { error },
  } = useController({ name, control });

  return (
    <FloatDatePicker
      value={value as string | undefined}
      onChange={onChange}
      onBlur={onBlur}
      error={error?.message}
      {...props}
    />
  );
}

export default FormFloatDatePicker;
