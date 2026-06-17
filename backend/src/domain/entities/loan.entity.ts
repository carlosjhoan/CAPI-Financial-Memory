import { ApiProperty } from "@nestjs/swagger";

export class Loan {
  @ApiProperty({
    description: "ID único del préstamo (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({ description: "ID del usuario propietario (UUID)" })
  userId: string;

  @ApiProperty({ description: "Monto inicial del préstamo", example: 5000.0 })
  initialAmount: number;

  @ApiProperty({ description: "Tasa de interés porcentual", example: 5.5 })
  interestRate: number;

  @ApiProperty({ description: "Monto de cada cuota", example: 450.25 })
  installment: number;

  @ApiProperty({ description: "Monto total pagado", example: 1350.75 })
  paidAmount: number;

  @ApiProperty({ description: "Monto restante por pagar", example: 3924.5 })
  remainingAmount: number;

  @ApiProperty({ description: "Nombre del deudor", example: "Juan Pérez" })
  debtor: string;

  @ApiProperty({
    description: "Fecha del préstamo",
    example: "2024-01-15T00:00:00.000Z",
  })
  date: Date;

  @ApiProperty({
    description: "Fecha de creación",
    example: "2024-01-15T10:30:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Fecha de última actualización",
    example: "2024-01-15T10:30:00.000Z",
  })
  updatedAt: Date;

  constructor(
    initialAmount: number,
    interestRate: number,
    installment: number,
    debtor: string,
    date: Date,
    id?: string,
    userId?: string,
  ) {
    this.id = id!;
    this.userId = userId!;
    this.initialAmount = initialAmount;
    this.interestRate = interestRate;
    this.installment = installment;
    this.debtor = debtor;
    this.date = date;
    this.paidAmount = 0;
    this.remainingAmount = initialAmount * (1 + interestRate / 100);
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  registerPayment(amount: number): void {
    if (this.paidAmount + amount > this.calculateTotalAmount()) {
      throw new Error("Payment amount exceeds total loan amount");
    }

    this.paidAmount += amount;
    this.remainingAmount = this.calculateTotalAmount() - this.paidAmount;
    this.updatedAt = new Date();
  }

  calculateTotalAmount(): number {
    return this.initialAmount * (1 + this.interestRate / 100);
  }

  isFullyPaid(): boolean {
    return this.remainingAmount <= 0;
  }
}
