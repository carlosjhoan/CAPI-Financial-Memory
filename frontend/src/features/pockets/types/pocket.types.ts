export interface TransferDto {
  sourcePocketId: string;
  targetPocketId: string;
  amount: number;
  reason: string;
  date: string;
}

// NUEVO: TransferMovement con direction
export interface TransferMovement {
  id: string;
  sourcePocketId: string;
  targetPocketId: string;
  amount: number;
  reason: string;
  date: string;
  createdAt: string;
  direction: 'incoming' | 'outgoing';
}

export interface IncomeForPocket {
  id: string;
  amount: number;
  date: string;
  reason?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  pocketId: string;
  amount: number;
  date: string;
  createdAt: string;
  reason?: string;
}

export interface Pocket {
  id: string;
  name: string;
  type: 'goal' | 'deposit';
  goal: number;
  accumulatedAmount: number;
  incomes?: IncomeForPocket[];
  expenses?: Expense[];
  transfers?: TransferMovement[];     // NUEVO
  createdAt: string;
  updatedAt: string;
  motivation: string;
}

export interface CreatePocketDto {
  name: string;
  type: 'goal' | 'deposit';
  goal: number;
  accumulatedAmount: number;
  motivation: string;
  sourceType?: 'external' | 'transfer';
  sourcePocketId?: string;
}

export interface UpdatePocketDto {
  name?: string;
  type?: 'goal' | 'deposit';
  goal?: number;
  accumulatedAmount?: number;
  motivation?: string;
}

export interface DistributionItem {
  targetPocketId: string;
  amount: number;
}

export interface DeleteWithTransferDto {
  distributions: DistributionItem[];
  reason: string;
}

export interface DistributionItemWithGoal extends DistributionItem {
  newGoal?: number;
}

export interface PocketsSummary {
  totalAccumulated: number;
  totalGoal: number;
  count: number;
  goalCount: number;
}
