import {
  IsNumber,
  IsString,
  IsDateString,
  Min,
  Max,
  MaxLength,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateLoanDto {
  @ApiProperty({ description: "Monto inicial del préstamo", example: 5000.0 })
  @IsNumber()
  @Min(0.01, { message: "Initial amount must be greater than 0" })
  initialAmount: number;

  @ApiProperty({ description: "Tasa de interés porcentual", example: 5.5 })
  @IsNumber()
  @Min(0, { message: "Interest rate cannot be negative" })
  @Max(100, { message: "Interest rate cannot exceed 100%" })
  interestRate: number;

  @ApiProperty({ description: "Monto de cada cuota", example: 450.25 })
  @IsNumber()
  @Min(0.01, { message: "Installment must be greater than 0" })
  installment: number;

  @ApiProperty({ description: "Nombre del deudor", example: "Juan Pérez" })
  @IsString()
  @MaxLength(255, {
    message: "Debtor name cannot be longer than 255 characters",
  })
  debtor: string;

  @ApiProperty({
    description: "Fecha del préstamo (ISO 8601)",
    example: "2024-01-15",
  })
  @IsDateString()
  date: string;
}
