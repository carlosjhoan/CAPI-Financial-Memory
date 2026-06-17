import { IsOptional, IsDateString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class DateRangeParamsDto {
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
}
