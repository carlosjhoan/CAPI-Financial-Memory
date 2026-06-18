import { ApiProperty } from "@nestjs/swagger";
import { Deposit } from "./deposit.entity";

export class Pocket {
  @ApiProperty({ description: "ID único del bolsillo (UUID)" })
  id: string;

  @ApiProperty({ description: "ID del usuario propietario (UUID)" })
  userId: string;

  @ApiProperty({
    description: "Nombre del bolsillo",
    example: "Efectivo libre",
  })
  name: string;

  @ApiProperty({
    description: "Tipo de bolsillo: 'goal' (con meta) o 'deposit' (sin meta)",
    example: "goal",
  })
  type: "goal" | "deposit";

  @ApiProperty({ description: "Meta/objetivo de ahorro", example: 5000000 })
  goal: number;

  @ApiProperty({ description: "Valor acumulado actual", example: 2000000 })
  accumulatedAmount: number;

  @ApiProperty({
    description:
      "Monto inicial al crear el bolsillo (para gráfica de evolución)",
    example: 0,
  })
  initialAmount: number;

  @ApiProperty({
    description: "Motivación para crear el bolsillo",
    example: "Para ahorrar para un viaje",
    maxLength: 100,
  })
  motivation: string;

  @ApiProperty({ description: "Fecha de creación" })
  createdAt: Date;

  @ApiProperty({ description: "Fecha de última actualización" })
  updatedAt: Date;

  @ApiProperty({ description: "Cantidad de depósitos realizados", example: 3 })
  depositCount?: number;

  @ApiProperty({
    description: "Últimos 4 depósitos del bolsillo",
    type: [Deposit],
  })
  deposits?: Deposit[];

  constructor(
    name: string,
    type: "goal" | "deposit",
    goal: number,
    accumulatedAmount: number,
    motivation?: string,
    id?: string,
    userId?: string,
  ) {
    this.id = id!;
    this.userId = userId!;
    this.name = name;
    this.type = type;
    this.goal = goal;
    this.accumulatedAmount = accumulatedAmount;
    this.motivation =
      motivation ?? "Quiero ahorrar para algo que aún no sé qué es";
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  update(
    name: string,
    type: "goal" | "deposit",
    goal: number,
    accumulatedAmount: number,
    motivation: string,
  ): void {
    this.name = name;
    this.type = type;
    this.goal = type === "deposit" ? 0 : goal;
    this.accumulatedAmount = accumulatedAmount;
    this.motivation = motivation;
    this.updatedAt = new Date();
  }

  registerDeposit(amount: number): void {
    this.accumulatedAmount += amount;
    this.updatedAt = new Date();
  }

  withdraw(amount: number): void {
    this.accumulatedAmount -= amount;
    this.updatedAt = new Date();
  }
}
