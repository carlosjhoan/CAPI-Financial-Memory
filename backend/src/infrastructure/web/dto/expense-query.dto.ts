import {
  IsOptional,
  IsDateString,
  IsString,
  IsInt,
  Min,
  Max,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class ExpenseQueryDto {
  @ApiPropertyOptional({
    description: "Start date for filtering (ISO 8601: YYYY-MM-DD)",
    example: "2024-01-01",
    type: String,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: "End date for filtering (ISO 8601: YYYY-MM-DD)",
    example: "2024-12-31",
    type: String,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: "Year for filtering or summary",
    example: "2024",
  })
  @IsOptional()
  @IsString()
  year?: string;

  @ApiPropertyOptional({
    description: "Month for filtering or summary (1-12)",
    example: "4",
  })
  @IsOptional()
  @IsString()
  month?: string;

  @ApiPropertyOptional({
    description: "Page number (default: 1)",
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: "Items per page (default: 6, max: 100)",
    example: 6,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
