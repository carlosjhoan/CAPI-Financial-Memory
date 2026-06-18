import {
  IsString,
  IsNumber,
  IsIn,
  Min,
  MinLength,
  MaxLength,
  IsOptional,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdatePocketDto {
  @ApiPropertyOptional({
    description: "Nombre del bolsillo",
    example: "Efectivo libre",
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: "Name must be at least 1 character long" })
  @MaxLength(100, { message: "Name cannot be longer than 100 characters" })
  name?: string;

  @ApiPropertyOptional({
    description: "Tipo de bolsillo: 'goal' (con meta) o 'deposit' (sin meta)",
    example: "goal",
  })
  @IsOptional()
  @IsString()
  @IsIn(["goal", "deposit"], { message: "Type must be 'goal' or 'deposit'" })
  type?: string;

  @ApiPropertyOptional({
    description: "Meta/objetivo de ahorro (no aplica si type='deposit')",
    example: 5000000,
    minimum: 0.01,
    type: "number",
    format: "float",
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01, { message: "Goal must be greater than 0" })
  goal?: number;

  @ApiPropertyOptional({
    description: "Motivación del bolsillo",
    example: "Para ahorrar para un viaje",
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, {
    message: "Motivation cannot be longer than 100 characters",
  })
  motivation?: string;

  @ApiPropertyOptional({
    description: "Valor acumulado actual",
    example: 2000000,
    minimum: 0,
    type: "number",
    format: "float",
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: "Accumulated amount cannot be negative" })
  accumulatedAmount?: number;
}
