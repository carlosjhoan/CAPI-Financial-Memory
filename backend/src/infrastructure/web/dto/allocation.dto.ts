import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsNotEmpty, IsUUID, Min } from "class-validator";

export class AllocationDto {
  @ApiProperty({ description: "ID del bolsillo" })
  @IsUUID()
  @IsNotEmpty()
  pocketId: string;

  @ApiProperty({ description: "Monto asignado" })
  @IsNumber()
  @Min(0.01)
  amount: number;
}
