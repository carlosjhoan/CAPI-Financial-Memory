import { Pocket } from "../../domain/entities/pocket.entity";
import { Deposit } from "../../domain/entities/deposit.entity";
import { PocketRepository } from "../../domain/repositories/pocket.repository";

export class RegisterDepositUseCase {
  constructor(private readonly pocketRepository: PocketRepository) {}

  async execute(
    userId: string,
    pocketId: string,
    amount: number,
    date: Date,
    newGoal?: number,
    reason?: string,
  ): Promise<{ pocket: Pocket; deposit: Deposit }> {
    if (amount <= 0) {
      throw new Error("Deposit amount must be greater than 0");
    }

    const pocket = await this.pocketRepository.findById(pocketId, userId);

    if (!pocket) {
      throw new Error("Pocket not found");
    }

    // Validación para goal pocket
    if (pocket.type === "goal" && pocket.goal > 0) {
      const remaining = pocket.goal - pocket.accumulatedAmount;

      // Si amount es mayor que lo faltante Y no se provee newGoal, rechazar
      if (amount > remaining && !newGoal) {
        throw new Error(`DEPOSIT_EXCEEDS_GOAL:${remaining}:${amount}`);
      }

      // Si amount es mayor y newGoal viene, actualizar meta primero
      if (amount > remaining && newGoal && newGoal > pocket.goal) {
        pocket.goal = newGoal;
      } else if (amount > remaining && newGoal) {
        throw new Error("newGoal debe ser mayor al goal actual");
      }

      // Si no excede, usar lo faltante directo
      if (amount > remaining) {
        amount = remaining;
      }
    }

    pocket.registerDeposit(amount);

    const deposit = new Deposit(pocketId, amount, date, reason);

    const updatedPocket = await this.pocketRepository.update(pocket);
    const savedDeposit = await this.pocketRepository.saveDeposit(deposit);

    return { pocket: updatedPocket, deposit: savedDeposit };
  }
}
