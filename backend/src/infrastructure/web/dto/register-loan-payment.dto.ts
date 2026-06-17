import { IsNumber, IsDateString, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterLoanPaymentDto {
  @ApiProperty({ description: "Monto del pago del préstamo", example: 450.25 })
  @IsNumber()
  @Min(0.01, { message: "Amount must be greater than 0" })
  amount: number;

  @ApiProperty({
    description: "Fecha del pago (ISO 8601)",
    example: "2024-01-15",
  })
  @IsDateString()
  date: string;
}
