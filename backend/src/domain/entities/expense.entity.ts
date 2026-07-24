import { ApiProperty } from "@nestjs/swagger";

export interface ExpenseAllocationInfo {
  pocketId: string;
  pocketName: string;
  amount: number;
}

export class Expense {
  @ApiProperty({
    description: "ID único del gasto (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({ description: "ID del usuario propietario (UUID)" })
  userId: string;

  @ApiProperty({ description: "Monto del gasto", example: 150.75 })
  amount: number;

  @ApiProperty({
    description: "Razón o descripción del gasto",
    example: "Compra de supermercado",
  })
  reason: string;

  @ApiProperty({
    description: "Fecha del gasto",
    example: "2024-01-15T00:00:00.000Z",
  })
  date: Date;

  @ApiProperty({
    description: "Fecha de creación",
    example: "2024-01-15T10:30:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Indica si este registro es un ajuste de otro",
    example: false,
  })
  isAdjustment: boolean = false;

  @ApiProperty({
    description: "ID del registro original al que ajusta (solo si isAdjustment=true)",
    example: null,
  })
  adjustedRecordId: string | null = null;

  @ApiProperty({
    description: "Lista de ajustes aplicados a este registro",
    type: [Expense],
  })
  adjustments: Expense[] = [];

  @ApiProperty({
    description: "Monto neto (original + suma de ajustes)",
    example: 150.75,
  })
  netAmount: number;

  allocations?: ExpenseAllocationInfo[];

  constructor(
    amount: number,
    reason: string,
    date: Date,
    id?: string,
    userId?: string,
  ) {
    this.id = id!;
    this.userId = userId!;
    this.amount = amount;
    this.reason = reason;
    this.date = date;
    this.createdAt = new Date();
    this.netAmount = amount;
  }

  update(amount: number, reason: string, date: Date): void {
    this.amount = amount;
    this.reason = reason;
    this.date = date;
  }
}
