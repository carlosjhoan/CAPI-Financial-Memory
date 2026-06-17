import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ApiResponse<T> {
  @ApiProperty({ description: "Código de estado HTTP", example: 200 })
  statusCode: number;

  @ApiProperty({ description: "Datos de la respuesta" })
  data: T;

  @ApiProperty({ description: "Mensaje descriptivo", example: "Success" })
  message: string;

  @ApiProperty({
    description: "Timestamp de la respuesta",
    example: "2024-01-15T10:30:00.000Z",
  })
  timestamp: string;

  @ApiPropertyOptional({
    description: "Metadatos de paginación",
    example: { total: 100, page: 1, limit: 6, totalPages: 17 },
  })
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  constructor(statusCode: number, data: T, message: string) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data: T, message = "Success"): ApiResponse<T> {
    return new ApiResponse(200, data, message);
  }

  static created<T>(
    data: T,
    message = "Resource created successfully",
  ): ApiResponse<T> {
    return new ApiResponse(201, data, message);
  }

  static error(
    statusCode: number,
    message: string,
    error?: string,
  ): ApiResponse<null> {
    const response = new ApiResponse<null>(statusCode, null, message);
    (response as any).error = error || "Error";
    return response;
  }
}
