import {
  IsArray,
  IsUUID,
  IsNumber,
  IsString,
  Min,
  MinLength,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  IsOptional,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class DistributionItemDto {
  @ApiProperty({
    description: "ID del bolsillo de destino (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
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
}

export class DistributionItemWithGoalDto extends DistributionItemDto {
  @ApiPropertyOptional({
    description:
      "Nuevo goal para el bolsillo de destino (si es tipo goal y el monto excede el restante)",
    example: 1500.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  newGoal?: number;
}

export class DeleteWithTransferDto {
  @ApiProperty({
    description: "Distribuciones de fondos",
    type: [DistributionItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @Type(() => DistributionItemDto)
  distributions: DistributionItemDto[];

  @ApiProperty({
    description: "Razón de la eliminación/transferencia",
    example: "Cierre de bolsillo",
  })
  @IsString()
  @MinLength(1, { message: "Reason is required" })
  reason: string;
}
