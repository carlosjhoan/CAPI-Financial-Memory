import { ApiProperty } from "@nestjs/swagger";

export class IncomeAllocation {
  @ApiProperty({ description: "ID único de la asignación (UUID)" })
  id: string;

  @ApiProperty({ description: "ID del ingreso" })
  incomeId: string;

  @ApiProperty({ description: "ID del bolsillo" })
  pocketId: string;

  @ApiProperty({ description: "Monto asignado", example: 100.00 })
  amount: number;

  constructor(incomeId: string, pocketId: string, amount: number, id?: string) {
    this.id = id!;
    this.incomeId = incomeId;
    this.pocketId = pocketId;
    this.amount = amount;
  }
}
