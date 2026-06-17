import {
  IsOptional,
  IsDateString,
  IsString,
  IsInt,
  Min,
  Max,
  IsIn,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class DebtQueryDto {
  @ApiPropertyOptional({
    description: "Fecha de inicio para filtrar (formato ISO 8601: YYYY-MM-DD)",
    example: "2024-01-01",
    type: String,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: "Fecha de fin para filtrar (formato ISO 8601: YYYY-MM-DD)",
    example: "2024-12-31",
    type: String,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: "Año para filtrar o resumen",
    example: "2024",
  })
  @IsOptional()
  @IsString()
  year?: string;

  @ApiPropertyOptional({
    description: "Mes para filtrar (1-12)",
    example: "4",
  })
  @IsOptional()
  @IsString()
  month?: string;

  @ApiPropertyOptional({
    description: "Número de página (default: 1)",
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: "Elementos por página (default: 6, máximo: 100)",
    example: 6,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    description: "Filtrar por nombre del prestamista",
    example: "Banco",
  })
  @IsOptional()
  @IsString()
  lender?: string;

  @ApiPropertyOptional({
    description: "Filtrar por estado: active (paidAmount < finalAmount) | paid (paidAmount >= finalAmount)",
    enum: ["active", "paid"],
  })
  @IsOptional()
  @IsIn(["active", "paid"])
  status?: "active" | "paid";
}
