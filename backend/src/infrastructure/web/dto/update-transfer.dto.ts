import { IsNumber, IsOptional, IsString, Min, MinLength, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateTransferDto {
  @ApiProperty({
    description: "Nuevo monto a transferir",
    example: 500.0,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01, { message: "Amount must be greater than 0" })
  amount: number;

  @ApiProperty({
    description: "Nuevo motivo de la transferencia",
    example: "Ajuste de presupuesto mensual",
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @MinLength(3, { message: "Reason must be at least 3 characters long" })
  @MaxLength(200, { message: "Reason cannot be longer than 200 characters" })
  reason: string;

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
