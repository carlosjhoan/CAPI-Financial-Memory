import {
  IsNumber,
  IsString,
  IsDateString,
  Min,
  MinLength,
  MaxLength,
  IsOptional,
  ValidateNested,
  IsArray,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { AllocationDto } from "./allocation.dto";

export class UpdateExpenseDto {
  @ApiPropertyOptional({ description: "Monto del gasto", example: 150.75 })
  @IsOptional()
  @IsNumber()
  @Min(0.01, { message: "Amount must be greater than 0" })
  amount?: number;

  @ApiPropertyOptional({
    description: "Razón o descripción del gasto",
    example: "Compra de supermercado",
  })
  @IsOptional()
  @IsString()
  @MinLength(20, { message: "Reason must be at least 20 characters long" })
  @MaxLength(100, { message: "Reason cannot be longer than 100 characters" })
  reason?: string;

  @ApiPropertyOptional({
    description: "Fecha del gasto (ISO 8601)",
    example: "2024-01-15",
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    description: "Asignaciones a bolsillos",
    type: [AllocationDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AllocationDto)
  allocations?: AllocationDto[];
}
