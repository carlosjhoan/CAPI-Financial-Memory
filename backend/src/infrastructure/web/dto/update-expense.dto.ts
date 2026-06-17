import {
  IsNumber,
  IsString,
  IsDateString,
  Min,
  MaxLength,
  IsOptional,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

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
  @MaxLength(255, { message: "Reason cannot be longer than 255 characters" })
  reason?: string;

  @ApiPropertyOptional({
    description: "Fecha del gasto (ISO 8601)",
    example: "2024-01-15",
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}
