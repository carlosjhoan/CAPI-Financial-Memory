import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

@ValidatorConstraint({ name: 'sumEqualsTotal', async: false })
export class SumEqualsTotalConstraint implements ValidatorConstraintInterface {
  validate(allocations: any[], args: ValidationArguments) {
    if (!allocations || !Array.isArray(allocations)) return false;
    const object = args.object as any;
    const totalAmount = object.amount;
    const sumAllocations = allocations.reduce((sum, alloc) => sum + (alloc.amount || 0), 0);
    return Number(sumAllocations.toFixed(2)) === Number(totalAmount.toFixed(2));
  }

  defaultMessage(args: ValidationArguments) {
    return 'The sum of allocations must be equal to the total amount.';
  }
}

export function SumEqualsTotal(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: SumEqualsTotalConstraint,
    });
  };
}
