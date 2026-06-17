import { IsNumber, IsDateString, IsString, Min, MaxLength, MinLength, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterDepositDto {
  @ApiProperty({ description: "Monto del depósito", example: 50000 })
  @IsNumber()
  @Min(0.01, { message: "Amount must be greater than 0" })
  amount: number;

  @ApiProperty({
    description: "Fecha del depósito (ISO 8601)",
    example: "2024-01-15",
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: "Nueva meta (opcional) - solo para pockets tipo goal",
    example: 100000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  newGoal?: number;

  @ApiProperty({
    description: "Razón/descripción del depósito (opcional)",
    example: "Depósito de nómina enero",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  reason?: string;
}
