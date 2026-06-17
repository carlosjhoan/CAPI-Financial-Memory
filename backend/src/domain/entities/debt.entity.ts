import { ApiProperty } from "@nestjs/swagger";

export class Debt {
  @ApiProperty({
    description: "ID único de la deuda (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({ description: "ID del usuario propietario (UUID)" })
  userId: string;

  @ApiProperty({ description: "Monto inicial de la deuda", example: 1000.5 })
  initialAmount: number;

  @ApiProperty({ description: "Nombre del prestamista", example: "Banco XYZ" })
  lender: string;

  @ApiProperty({ description: "Número de meses para pagar", example: 12 })
  months: number;

  @ApiProperty({ description: "Monto de cada cuota", example: 100.5 })
  installAmount: number;

  @ApiProperty({ description: "Número de pagos realizados", example: 3 })
  payments: number;

  @ApiProperty({ description: "Monto final total a pagar", example: 1206.0 })
  finalAmount: number;

  @ApiProperty({ description: "Monto total pagado", example: 301.5 })
  paidAmount: number;

  @ApiProperty({ description: "Monto restante por pagar", example: 904.5 })
  remainingAmount: number;

  @ApiProperty({
    description: "Motivo de la deuda",
    example: "Para pagar estudios",
    maxLength: 100,
  })
  reason: string;

  @ApiProperty({
    description: "Fecha de la deuda",
    example: "2024-01-15T00:00:00.000Z",
  })
  date: Date;

  @ApiProperty({
    description:
      "Fecha del último pago registrado",
    example: "2024-06-15T00:00:00.000Z",
    required: false,
  })
  lastPaymentDate?: Date;

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
    lender: string,
    months: number,
    installAmount: number,
    finalAmount: number,
    date: Date,
    reason?: string,
    id?: string,
    userId?: string,
  ) {
    this.id = id!;
    this.userId = userId!;
    this.reason = reason ?? 'Me endeudé y no sé ni para qué';
    this.initialAmount = initialAmount;
    this.lender = lender;
    this.months = months;
    this.installAmount = installAmount;
    this.payments = 0;
    this.finalAmount = finalAmount;
    this.paidAmount = 0;
    this.remainingAmount = finalAmount;
    this.date = date;
    this.reason = reason || 'Me endeudé y no sé ni para qué';
    this.lastPaymentDate = undefined;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  registerPayment(amount: number, paymentDate?: Date): void {
    if (this.paidAmount + amount > this.finalAmount) {
      throw new Error("Payment amount exceeds total debt amount");
    }

    this.paidAmount += amount;
    this.remainingAmount = this.finalAmount - this.paidAmount;
    this.payments += 1;
    this.lastPaymentDate = paymentDate || new Date();
    this.updatedAt = new Date();
  }

  isFullyPaid(): boolean {
    return this.remainingAmount <= 0;
  }
}
