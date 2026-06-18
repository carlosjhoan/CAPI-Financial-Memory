import {
  IsNumber,
  IsString,
  Min,
  MaxLength,
  IsOptional,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateDebtDto {
  @ApiPropertyOptional({
    description: "Monto inicial de la deuda",
    example: 1000.5,
    minimum: 0.01,
    type: "number",
    format: "float",
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01, { message: "Initial amount must be greater than 0" })
  initialAmount?: number;

  @ApiPropertyOptional({
    description: "Nombre del prestamista o entidad que otorgó la deuda",
    example: "Banco XYZ",
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message: "Lender name cannot be longer than 255 characters",
  })
  lender?: string;

  @ApiPropertyOptional({
    description: "Número de meses para pagar la deuda",
    example: 12,
    minimum: 1,
    type: "integer",
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: "Months must be at least 1" })
  months?: number;

  @ApiPropertyOptional({
    description: "Monto de cada cuota mensual",
    example: 100.5,
    minimum: 0.01,
    type: "number",
    format: "float",
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01, { message: "Installment amount must be greater than 0" })
  installAmount?: number;

  @ApiPropertyOptional({
    description: "Monto final total a pagar (incluye intereses si aplica)",
    example: 1206.0,
    minimum: 0.01,
    type: "number",
    format: "float",
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01, { message: "Final amount must be greater than 0" })
  finalAmount?: number;

  @ApiPropertyOptional({
    description: "Motivo de la deuda",
    example: "Para pagar estudios",
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: "Reason cannot be longer than 100 characters" })
  reason?: string;
}
