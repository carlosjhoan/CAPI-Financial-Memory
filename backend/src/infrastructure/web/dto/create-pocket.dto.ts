import {
  IsString,
  IsNumber,
  IsIn,
  Min,
  MinLength,
  MaxLength,
  IsOptional,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export type SourceType = "external" | "transfer";

export class CreatePocketDto {
  @ApiProperty({
    description: "Nombre del bolsillo",
    example: "Efectivo libre",
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1, { message: "Name must be at least 1 character long" })
  @MaxLength(100, { message: "Name cannot be longer than 100 characters" })
  name: string;

  @ApiProperty({
    description: "Tipo de bolsillo: 'goal' (con meta) o 'deposit' (sin meta)",
    example: "goal",
  })
  @IsString()
  @IsIn(["goal", "deposit"], { message: "Type must be 'goal' or 'deposit'" })
  type: string;

  @ApiProperty({
    description:
      "Meta/objetivo de ahorro (requerido si type='goal', 0 si type='deposit')",
    example: 5000000,
    minimum: 0,
    type: "number",
    format: "float",
    required: false,
  })
  @IsOptional()
  @Min(0, { message: "Goal cannot be negative" })
  goal?: number;

  @ApiPropertyOptional({
    description:
      "Motivación del bolsillo (opcional, valor por defecto si no se envía)",
    example: "Para ahorrar para un viaje",
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: "Motivation is required" })
  @MaxLength(100, {
    message: "Motivation cannot be longer than 100 characters",
  })
  motivation?: string;

  @ApiProperty({
    description: "Valor acumulado actual",
    example: 2000000,
    minimum: 0,
    type: "number",
    format: "float",
  })
  @IsNumber()
  @Min(0, { message: "Accumulated amount cannot be negative" })
  accumulatedAmount: number;

  @ApiPropertyOptional({
    description:
      "Origen del monto inicial: 'external' (dinero nuevo) o 'transfer' (viene de otro bolsillo). Solo aplica en creación.",
    example: "external",
    enum: ["external", "transfer"],
  })
  @IsOptional()
  @IsIn(["external", "transfer"], {
    message: "Source type must be 'external' or 'transfer'",
  })
  sourceType?: SourceType;

  @ApiPropertyOptional({
    description:
      "ID del bolsillo de origen cuando sourceType='transfer' (reservado para uso futuro).",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsOptional()
  @IsString()
  sourcePocketId?: string;
}
