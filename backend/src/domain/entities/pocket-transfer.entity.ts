import { ApiProperty } from "@nestjs/swagger";

export class PocketTransfer {
  @ApiProperty({ description: "ID único de la transferencia (UUID)" })
  id: string;

  @ApiProperty({ description: "ID del bolsillo de origen (null si el bolsillo fue eliminado)" })
  sourcePocketId: string | null;

  @ApiProperty({ description: "ID del bolsillo de destino (null si el bolsillo fue eliminado)" })
  targetPocketId: string | null;

  @ApiProperty({ description: "Monto transferido", example: 50.0 })
  amount: number;

  @ApiProperty({
    description: "Razón de la transferencia",
    example: "Ajuste de presupuesto",
  })
  reason: string;

  @ApiProperty({ description: "Fecha de la transferencia" })
  date: Date;

  @ApiProperty({ description: "Fecha de creación" })
  createdAt: Date;

  constructor(
    sourcePocketId: string | null,
    targetPocketId: string | null,
    amount: number,
    reason: string,
    date: Date,
    id?: string,
  ) {
    this.id = id!;
    this.sourcePocketId = sourcePocketId;
    this.targetPocketId = targetPocketId;
    this.amount = amount;
    this.reason = reason;
    this.date = date;
    this.createdAt = new Date();
  }
}
