import { ApiProperty } from "@nestjs/swagger";

export class Deposit {
  @ApiProperty({ description: "ID único del depósito (UUID)" })
  id: string;

  @ApiProperty({ description: "ID del bolsillo asociado" })
  pocketId: string;

  @ApiProperty({ description: "Monto del depósito", example: 50000 })
  amount: number;

  @ApiProperty({ description: "Fecha del depósito", example: "2024-01-15" })
  date: Date;

  @ApiProperty({
    description: "Razón/descripción del depósito",
    required: false,
  })
  reason?: string;

  @ApiProperty({ description: "Fecha de creación" })
  createdAt: Date;

  constructor(
    pocketId: string,
    amount: number,
    date: Date,
    reason?: string,
    id?: string,
  ) {
    this.id = id!;
    this.pocketId = pocketId;
    this.amount = amount;
    this.date = date;
    this.reason = reason;
    this.createdAt = new Date();
  }
}
