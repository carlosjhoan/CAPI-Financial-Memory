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
  IsObject,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { AllocationDto } from "./allocation.dto";

export class UpdateIncomeDto {
  @ApiPropertyOptional({ description: "Monto del ingreso", example: 2500.0 })
  @IsOptional()
  @IsNumber()
  @Min(0.01, { message: "Amount must be greater than 0" })
  amount?: number;

  @ApiPropertyOptional({
    description: "Razón o descripción del ingreso",
    example: "Salario mensual",
  })
  @IsOptional()
  @IsString()
  @MinLength(20, { message: "Reason must be at least 20 characters long" })
  @MaxLength(100, { message: "Reason cannot be longer than 100 characters" })
  reason?: string;

  @ApiPropertyOptional({
    description: "Fecha del ingreso (ISO 8601)",
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

  @ApiPropertyOptional({
    description:
      "Nuevas metas para bolsillos tipo goal (pocketId → nuevoGoal), se usa cuando la edición supera la meta restante",
    example: { "pocket-uuid": 15000 },
  })
  @IsOptional()
  @IsObject()
  goals?: Record<string, number>;
}
