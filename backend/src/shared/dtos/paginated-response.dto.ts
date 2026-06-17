import { ApiProperty } from "@nestjs/swagger";

export class PaginatedResponse<T> {
  @ApiProperty({ description: "Array de datos paginados" })
  data: T[];

  @ApiProperty({ description: "Total de elementos", example: 100 })
  total: number;

  @ApiProperty({ description: "Página actual", example: 1 })
  page: number;

  @ApiProperty({ description: "Límite por página", example: 10 })
  limit: number;

  @ApiProperty({ description: "Total de páginas", example: 10 })
  totalPages: number;

  @ApiProperty({ description: "Indica si hay página siguiente", example: true })
  hasNext: boolean;

  @ApiProperty({ description: "Indica si hay página anterior", example: false })
  hasPrevious: boolean;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
    this.hasNext = page < this.totalPages;
    this.hasPrevious = page > 1;
  }
}
