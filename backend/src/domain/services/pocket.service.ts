import { Pocket } from "../entities/pocket.entity";
import { Deposit } from "../entities/deposit.entity";
import { Expense } from "../entities/expense.entity";
import { PocketTransfer } from "../entities/pocket-transfer.entity";
import { PocketRepository } from "../repositories/pocket.repository";
import { CreatePocketUseCase } from "../../application/pocket/create-pocket.use-case";
import { RegisterDepositUseCase } from "../../application/pocket/register-deposit.use-case";

export class PocketService {
  constructor(
    private readonly pocketRepository: PocketRepository,
    private readonly createPocketUseCase: CreatePocketUseCase,
    private readonly registerDepositUseCase: RegisterDepositUseCase,
  ) {}

  async createPocket(
    userId: string,
    name: string,
    type: "goal" | "deposit",
    goal: number,
    accumulatedAmount: number,
    motivation: string,
    initialAmount?: number,
  ): Promise<Pocket> {
    return await this.createPocketUseCase.execute(
      userId,
      name,
      type,
      goal,
      accumulatedAmount,
      motivation,
      initialAmount,
    );
  }

  async getAllPockets(userId: string): Promise<Pocket[]> {
    return await this.pocketRepository.findAll(userId);
  }

  async getPocketById(userId: string, id: string): Promise<Pocket> {
    const pocket = await this.pocketRepository.findById(id, userId);

    if (!pocket) {
      throw new Error("Pocket not found");
    }

    return pocket;
  }

  async getPocketWithDeposits(
    userId: string,
    id: string,
  ): Promise<{ pocket: Pocket; deposits: Deposit[]; expenses: Expense[] }> {
    const pocket = await this.getPocketById(userId, id);
    const deposits = await this.pocketRepository.findDepositsByPocketId(id);
    const expenses = await this.pocketRepository.findExpensesByPocketId(id);
    return { pocket, deposits, expenses };
  }

  async updatePocket(
    userId: string,
    id: string,
    updates: {
      name?: string;
      type?: "goal" | "deposit";
      goal?: number;
      accumulatedAmount?: number;
      motivation?: string;
    },
  ): Promise<Pocket> {
    const pocket = await this.getPocketById(userId, id);

    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length === 0) {
        throw new Error("Name cannot be empty");
      }
      pocket.name = updates.name;
    }

    if (updates.type !== undefined) {
      if (updates.type !== "goal" && updates.type !== "deposit") {
        throw new Error("Type must be 'goal' or 'deposit'");
      }
      pocket.type = updates.type;
      if (updates.type === "deposit") {
        pocket.goal = 0;
      }
    }

    if (updates.goal !== undefined) {
      if (pocket.type === "deposit") {
        throw new Error("Cannot set goal on a deposit-type pocket");
      }
      if (updates.goal <= 0) {
        throw new Error("Goal must be greater than 0");
      }
      pocket.goal = updates.goal;
    }

    if (updates.accumulatedAmount !== undefined) {
      if (updates.accumulatedAmount < 0) {
        throw new Error("Accumulated amount cannot be negative");
      }
      pocket.accumulatedAmount = updates.accumulatedAmount;
    }

    if (updates.motivation !== undefined) {
      if (!updates.motivation || updates.motivation.trim().length === 0) {
        throw new Error("Motivation cannot be empty");
      }
      pocket.motivation = updates.motivation;
    }

    pocket.updatedAt = new Date();
    return await this.pocketRepository.update(pocket);
  }

  async deletePocket(userId: string, id: string): Promise<void> {
    const pocket = await this.pocketRepository.findById(id, userId);

    if (!pocket) {
      throw new Error("Pocket not found");
    }

    if (pocket.accumulatedAmount > 0) {
      throw new Error(`CANNOT_DELETE_WITH_FUNDS:${pocket.accumulatedAmount}`);
    }

    await this.pocketRepository.delete(id, userId);
  }

  async getPocketsSummary(
    userId: string,
  ): Promise<{ totalAccumulated: number; totalGoal: number; count: number }> {
    return await this.pocketRepository.getSummary(userId);
  }

  async registerDeposit(
    userId: string,
    pocketId: string,
    amount: number,
    date: Date,
    newGoal?: number,
    reason?: string,
  ): Promise<{ pocket: Pocket; deposit: Deposit }> {
    return await this.registerDepositUseCase.execute(
      userId,
      pocketId,
      amount,
      date,
      newGoal,
      reason,
    );
  }

  async getDepositsByPocketId(
    userId: string,
    pocketId: string,
    options?: { offset?: number; limit?: number },
  ): Promise<Deposit[]> {
    // Verify pocket exists
    await this.getPocketById(userId, pocketId);
    return await this.pocketRepository.findDepositsByPocketId(
      pocketId,
      options,
    );
  }

  async getTransfersByPocketId(pocketId: string): Promise<PocketTransfer[]> {
    return await this.pocketRepository.findTransfersByPocketId(pocketId);
  }

  async getHistoryByPocketId(
    userId: string,
    pocketId: string,
    options: { page: number; limit: number },
  ): Promise<{ items: any[]; total: number }> {
    await this.getPocketById(userId, pocketId);
    return await this.pocketRepository.findHistoryByPocketId(pocketId, options);
  }
}
