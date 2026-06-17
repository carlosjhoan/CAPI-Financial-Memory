import {
  IsNumber,
  IsString,
  IsDateString,
  Min,
  MaxLength,
  IsOptional,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

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
  @MaxLength(255, { message: "Reason cannot be longer than 255 characters" })
  reason?: string;

  @ApiPropertyOptional({
    description: "Fecha del ingreso (ISO 8601)",
    example: "2024-01-15",
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}
