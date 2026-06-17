import { ApiProperty } from "@nestjs/swagger";

export class ErrorResponse {
  @ApiProperty({ description: "Código de estado HTTP", example: 400 })
  statusCode: number;

  @ApiProperty({ description: "Tipo de error", example: "Bad Request" })
  error: string;

  @ApiProperty({
    description: "Mensaje de error",
    example: "Validation failed",
  })
  message: string;

  @ApiProperty({
    description: "Timestamp del error",
    example: "2024-01-15T10:30:00.000Z",
  })
  timestamp: string;

  @ApiProperty({
    description: "Ruta donde ocurrió el error",
    example: "/api/debts",
    required: false,
  })
  path?: string;

  @ApiProperty({
    description: "Errores de validación",
    example: { amount: ["must be greater than 0"] },
    required: false,
  })
  validationErrors?: Record<string, string[]>;

  constructor(
    statusCode: number,
    error: string,
    message: string,
    path?: string,
    validationErrors?: Record<string, string[]>,
  ) {
    this.statusCode = statusCode;
    this.error = error;
    this.message = message;
    this.timestamp = new Date().toISOString();
    this.path = path;
    this.validationErrors = validationErrors;
  }

  static badRequest(
    message: string,
    validationErrors?: Record<string, string[]>,
    path?: string,
  ): ErrorResponse {
    return new ErrorResponse(
      400,
      "Bad Request",
      message,
      path,
      validationErrors,
    );
  }

  static notFound(message: string, path?: string): ErrorResponse {
    return new ErrorResponse(404, "Not Found", message, path);
  }

  static internalServerError(message: string, path?: string): ErrorResponse {
    return new ErrorResponse(500, "Internal Server Error", message, path);
  }

  static unauthorized(message: string, path?: string): ErrorResponse {
    return new ErrorResponse(401, "Unauthorized", message, path);
  }

  static forbidden(message: string, path?: string): ErrorResponse {
    return new ErrorResponse(403, "Forbidden", message, path);
  }
}
