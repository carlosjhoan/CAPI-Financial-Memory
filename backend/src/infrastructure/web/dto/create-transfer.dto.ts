import {
  IsString,
  IsNumber,
  IsUUID,
  IsDateString,
  IsOptional,
  Min,
  MinLength,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateTransferDto {
  @ApiProperty({
    description: "ID del bolsillo de origen (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID("4", { message: "sourcePocketId must be a valid UUID" })
  sourcePocketId: string;

  @ApiProperty({
    description:
      "ID del bolsillo de destino (UUID). Debe ser diferente al de origen.",
    example: "223e4567-e89b-12d3-a456-426614174001",
  })
  @IsUUID("4", { message: "targetPocketId must be a valid UUID" })
  targetPocketId: string;

  @ApiProperty({
    description: "Monto a transferir",
    example: 500.0,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01, { message: "Amount must be greater than 0" })
  amount: number;

  @ApiProperty({
    description: "Razón de la transferencia",
    example: "Ajuste de presupuesto mensual",
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @MinLength(3, { message: "Reason must be at least 3 characters long" })
  @MaxLength(200, { message: "Reason cannot be longer than 200 characters" })
  reason: string;

  @ApiProperty({
    description: "Fecha de la transferencia (ISO 8601)",
    example: "2024-01-15",
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    description:
      "Nuevo goal para el bolsillo de destino si es tipo goal y el monto excede el restante",
    example: 1500.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  newGoal?: number;
}
