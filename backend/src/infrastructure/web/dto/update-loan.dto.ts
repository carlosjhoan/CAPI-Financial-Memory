import {
  IsNumber,
  IsString,
  Min,
  Max,
  MaxLength,
  IsOptional,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateLoanDto {
  @ApiPropertyOptional({
    description: "Tasa de interés porcentual",
    example: 7.5,
    minimum: 0,
    maximum: 100,
    type: "number",
    format: "float",
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: "Interest rate cannot be negative" })
  @Max(100, { message: "Interest rate cannot exceed 100%" })
  interestRate?: number;

  @ApiPropertyOptional({
    description: "Monto de cada cuota",
    example: 500.0,
    minimum: 0.01,
    type: "number",
    format: "float",
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01, { message: "Installment must be greater than 0" })
  installment?: number;

  @ApiPropertyOptional({
    description: "Nombre del deudor",
    example: "Juan Pérez",
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message: "Debtor name cannot be longer than 255 characters",
  })
  debtor?: string;
}
