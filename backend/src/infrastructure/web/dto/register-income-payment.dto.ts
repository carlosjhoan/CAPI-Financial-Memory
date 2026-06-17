import { IsNumber, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterIncomePaymentDto {
  @ApiProperty({
    description: "Monto adicional del ingreso",
    example: 500.0,
  })
  @IsNumber()
  @Min(0.01, { message: "Amount must be greater than 0" })
  amount: number;
}
