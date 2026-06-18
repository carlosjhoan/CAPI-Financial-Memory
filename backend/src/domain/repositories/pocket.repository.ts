import { Pocket } from "../entities/pocket.entity";
import { Deposit } from "../entities/deposit.entity";
import { Expense } from "../entities/expense.entity";
import { PocketTransfer } from "../entities/pocket-transfer.entity";

export interface PocketRepository {
  save(pocket: Pocket): Promise<Pocket>;
  findById(id: string, userId?: string): Promise<Pocket | null>;
  findAll(userId: string): Promise<Pocket[]>;
  update(pocket: Pocket): Promise<Pocket>;
  delete(id: string, userId?: string): Promise<void>;
  getSummary(
    userId: string,
  ): Promise<{ totalAccumulated: number; totalGoal: number; count: number }>;
  findDepositsByPocketId(
    pocketId: string,
    options?: { offset?: number; limit?: number },
  ): Promise<Deposit[]>;
  findExpensesByPocketId(pocketId: string): Promise<Expense[]>;
  saveDeposit(deposit: Deposit): Promise<Deposit>;
  saveTransfer(transfer: PocketTransfer): Promise<PocketTransfer>;
  findTransfersByPocketId(pocketId: string): Promise<PocketTransfer[]>;
  findHistoryByPocketId(
    pocketId: string,
    options: { page: number; limit: number },
  ): Promise<{ items: any[]; total: number }>;
}
