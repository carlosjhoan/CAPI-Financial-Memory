import {
  IsNumber,
  IsString,
  IsDateString,
  Min,
  MinLength,
  MaxLength,
  IsOptional,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateExpenseAdjustmentDto {
  @ApiProperty({ description: "Nuevo monto (el delta se calcula contra el original)", example: 200 })
  @IsNumber()
  @Min(0.01, { message: "Amount must be greater than 0" })
  amount: number;

  @ApiProperty({ description: "Razón del ajuste", example: "Corrección de gasto" })
  @IsString()
  @MinLength(5, { message: "Reason must be at least 5 characters long" })
  @MaxLength(255, { message: "Reason cannot be longer than 255 characters" })
  reason: string;

  @ApiProperty({ description: "Fecha del ajuste (ISO 8601)", example: "2024-01-20", required: false })
  @IsOptional()
  @IsDateString()
  date?: string;
}
