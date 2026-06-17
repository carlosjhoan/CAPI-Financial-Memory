import {
  IsNumber,
  IsString,
  IsDateString,
  Min,
  MaxLength,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { AllocationDto } from "./allocation.dto";
import { SumEqualsTotal } from "../../common/validators/sum-allocations.validator";

export class CreateIncomeDto {
  @ApiProperty({ description: "Monto del ingreso", example: 2500.0 })
  @IsNumber()
  @Min(0.01, { message: "Amount must be greater than 0" })
  amount: number;

  @ApiProperty({
    description: "Razón o descripción del ingreso",
    example: "Salario mensual",
  })
  @IsString()
  @MaxLength(255, { message: "Reason cannot be longer than 255 characters" })
  reason: string;

  @ApiProperty({
    description: "Fecha del ingreso (ISO 8601)",
    example: "2024-01-15",
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: "Desglose de asignaciones",
    type: [AllocationDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AllocationDto)
  @SumEqualsTotal({ message: "The sum of allocations must be equal to the total amount." })
  allocations: AllocationDto[];
}
