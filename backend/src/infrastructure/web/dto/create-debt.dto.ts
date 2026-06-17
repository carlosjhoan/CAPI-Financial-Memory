import {
  IsNumber,
  IsString,
  IsDateString,
  Min,
  MinLength,
  MaxLength,
  IsOptional,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateDebtDto {
  @ApiProperty({
    description: "Monto inicial de la deuda",
    example: 1000.5,
    minimum: 0.01,
    type: "number",
    format: "float",
  })
  @IsNumber()
  @Min(0.01, { message: "Initial amount must be greater than 0" })
  initialAmount: number;

  @ApiProperty({
    description: "Nombre del prestamista o entidad que otorgó la deuda",
    example: "Banco XYZ",
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255, {
    message: "Lender name cannot be longer than 255 characters",
  })
  lender: string;

  @ApiProperty({
    description: "Número de meses para pagar la deuda",
    example: 12,
    minimum: 1,
    type: "integer",
  })
  @IsNumber()
  @Min(1, { message: "Months must be at least 1" })
  months: number;

  @ApiProperty({
    description: "Monto de cada cuota mensual",
    example: 100.5,
    minimum: 0.01,
    type: "number",
    format: "float",
  })
  @IsNumber()
  @Min(0.01, { message: "Installment amount must be greater than 0" })
  installAmount: number;

  @ApiProperty({
    description: "Monto final total a pagar (incluye intereses si aplica)",
    example: 1206.0,
    minimum: 0.01,
    type: "number",
    format: "float",
  })
  @IsNumber()
  @Min(0.01, { message: "Final amount must be greater than 0" })
  finalAmount: number;

  @ApiPropertyOptional({
    description: "Motivo de la deuda (opcional, valor por defecto si no se envía)",
    example: "Para pagar estudios",
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: "Reason is required" })
  @MaxLength(100, { message: "Reason cannot be longer than 100 characters" })
  reason?: string;

  @ApiProperty({
    description:
      "Fecha en que se contrajo la deuda (formato ISO 8601: YYYY-MM-DD)",
    example: "2024-01-15",
    pattern: "^\\d{4}-\\d{2}-\\d{2}$",
  })
  @IsDateString()
  date: string;
}
