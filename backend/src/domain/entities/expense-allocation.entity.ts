import { ApiProperty } from "@nestjs/swagger";

export class ExpenseAllocation {
  @ApiProperty({ description: "ID único de la asignación (UUID)" })
  id: string;

  @ApiProperty({ description: "ID del gasto" })
  expenseId: string;

  @ApiProperty({ description: "ID del bolsillo" })
  pocketId: string;

  @ApiProperty({ description: "Monto asignado", example: 100.00 })
  amount: number;

  constructor(expenseId: string, pocketId: string, amount: number, id?: string) {
    this.id = id!;
    this.expenseId = expenseId;
    this.pocketId = pocketId;
    this.amount = amount;
  }
}
