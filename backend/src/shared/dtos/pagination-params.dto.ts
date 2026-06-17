import { IsNumber, IsOptional, Min, Max } from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class PaginationParamsDto {
  @ApiPropertyOptional({
    description: "Número de página",
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Límite de elementos por página",
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: "Término de búsqueda",
    example: "supermercado",
  })
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: "Campo para ordenar", example: "date" })
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({
    description: "Orden de clasificación",
    enum: ["ASC", "DESC"],
    example: "DESC",
    default: "DESC",
  })
  @IsOptional()
  sortOrder?: "ASC" | "DESC" = "DESC";
}
