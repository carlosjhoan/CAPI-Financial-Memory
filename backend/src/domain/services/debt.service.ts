import { Debt } from "../entities/debt.entity";
import { DebtRepository } from "../repositories/debt.repository";
import { CreateDebtUseCase } from "../../application/debt/create-debt.use-case";
import { RegisterPaymentUseCase } from "../../application/debt/register-payment.use-case";
import { DebtQueryDto } from "../../infrastructure/web/dto/debt-query.dto";

export class DebtService {
  constructor(
    private readonly debtRepository: DebtRepository,
    private readonly createDebtUseCase: CreateDebtUseCase,
    private readonly registerPaymentUseCase: RegisterPaymentUseCase,
  ) {}

  async createDebt(
    userId: string,
    initialAmount: number,
    lender: string,
    months: number,
    installAmount: number,
    finalAmount: number,
    date: Date,
    reason: string,
  ): Promise<Debt> {
    return await this.createDebtUseCase.execute(
      userId,
      initialAmount,
      lender,
      months,
      installAmount,
      finalAmount,
      date,
      reason,
    );
  }

  async registerPayment(
    userId: string,
    debtId: string,
    amount: number,
    date?: Date,
  ): Promise<Debt> {
    return await this.registerPaymentUseCase.execute(userId, debtId, amount, date);
  }

  async getAllDebts(userId: string): Promise<Debt[]> {
    return await this.debtRepository.findAll(userId);
  }

  async getAllDebtsPaginated(
    userId: string,
    query: DebtQueryDto,
  ): Promise<{ data: Debt[]; total: number }> {
    return await this.debtRepository.findAllPaginated(query, userId);
  }

  async getDebtById(userId: string, id: string): Promise<Debt> {
    const debt = await this.debtRepository.findById(id, userId);

    if (!debt) {
      throw new Error("Debt not found");
    }

    return debt;
  }

  async updateDebt(
    userId: string,
    id: string,
    updates: {
      lender?: string;
      months?: number;
      installAmount?: number;
      finalAmount?: number;
      initialAmount?: number;
      reason?: string;
    },
  ): Promise<Debt> {
    const debt = await this.getDebtById(userId, id);

    if (updates.initialAmount !== undefined) {
      if (updates.initialAmount <= 0) {
        throw new Error("Initial amount must be greater than 0");
      }
      debt.initialAmount = updates.initialAmount;
    }

    if (updates.lender !== undefined) {
      if (!updates.lender || updates.lender.trim().length === 0) {
        throw new Error("Lender cannot be empty");
      }
      debt.lender = updates.lender;
    }

    if (updates.months !== undefined) {
      if (updates.months <= 0) {
        throw new Error("Months must be greater than 0");
      }
      debt.months = updates.months;
    }

    if (updates.installAmount !== undefined) {
      if (updates.installAmount <= 0) {
        throw new Error("Installment amount must be greater than 0");
      }
      debt.installAmount = updates.installAmount;
    }

    if (updates.finalAmount !== undefined) {
      if (updates.finalAmount <= 0) {
        throw new Error("Final amount must be greater than 0");
      }
      if (updates.finalAmount < debt.paidAmount) {
        throw new Error("Final amount cannot be less than paid amount");
      }
      debt.finalAmount = updates.finalAmount;
      debt.remainingAmount = debt.finalAmount - debt.paidAmount;
    }

    if (updates.reason !== undefined) {
      if (!updates.reason || updates.reason.trim().length === 0) {
        throw new Error("Reason cannot be empty");
      }
      debt.reason = updates.reason;
    }

    debt.updatedAt = new Date();
    return await this.debtRepository.update(debt);
  }

  async deleteDebt(userId: string, id: string): Promise<void> {
    const debt = await this.debtRepository.findById(id, userId);

    if (!debt) {
      throw new Error("Debt not found");
    }

    await this.debtRepository.delete(id, userId);
  }

  async getDebtsSummary(
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<{
    totalDebts: number;
    totalAmount: number;
    totalPaid: number;
    totalRemaining: number;
    fullyPaidCount: number;
    activeDebtsCount: number;
  }> {
    let debts = await this.getAllDebts(userId);

    // Filter by date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate + "T00:00:00.000Z");
      const end = new Date(endDate + "T23:59:59.999Z");
      debts = debts.filter((debt) => {
        const debtDate = new Date(debt.date);
        return debtDate >= start && debtDate <= end;
      });
    }

    const totalDebts = debts.length;
    const totalAmount = debts.reduce((sum, debt) => sum + debt.finalAmount, 0);
    const totalPaid = debts.reduce((sum, debt) => sum + debt.paidAmount, 0);
    const totalRemaining = debts.reduce(
      (sum, debt) => sum + debt.remainingAmount,
      0,
    );
    const fullyPaidCount = debts.filter((debt) => debt.isFullyPaid()).length;
    const activeDebtsCount = totalDebts - fullyPaidCount;

    return {
      totalDebts,
      totalAmount,
      totalPaid,
      totalRemaining,
      fullyPaidCount,
      activeDebtsCount,
    };
  }

  async getDebtsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Debt[]> {
    return await this.debtRepository.findByDateRange(startDate, endDate, userId);
  }

  async getMonthlySummary(
    userId: string,
    year: number,
    month: number,
  ): Promise<{
    month: string;
    totalAmount: number;
    totalRemaining: number;
    debtCount: number;
    fullyPaidCount: number;
    activeCount: number;
    byLender: Record<string, number>;
    byDay: Record<string, number>;
  }> {
    const debts = await this.getAllDebts(userId);

    const monthDebts = debts.filter((debt) => {
      const debtDate = new Date(debt.date);
      return (
        debtDate.getUTCFullYear() === year && debtDate.getUTCMonth() === month
      );
    });

    const totalAmount = monthDebts.reduce(
      (sum, debt) => sum + Number(debt.finalAmount),
      0,
    );
    const totalRemaining = monthDebts.reduce(
      (sum, debt) => sum + Number(debt.remainingAmount),
      0,
    );

    const byLender: Record<string, number> = {};
    const byDay: Record<string, number> = {};

    monthDebts.forEach((debt) => {
      const day = new Date(debt.date).getUTCDate().toString().padStart(2, "0");
      byDay[day] = (byDay[day] || 0) + Number(debt.finalAmount);
      byLender[debt.lender] =
        (byLender[debt.lender] || 0) + Number(debt.finalAmount);
    });

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const fullyPaidCount = monthDebts.filter((d) => d.isFullyPaid()).length;

    return {
      month: `${monthNames[month]} ${year}`,
      totalAmount,
      totalRemaining,
      debtCount: monthDebts.length,
      fullyPaidCount,
      activeCount: monthDebts.length - fullyPaidCount,
      byLender,
      byDay,
    };
  }

  async getYearlySummary(userId: string, year: number): Promise<{
    year: number;
    totalAmount: number;
    totalRemaining: number;
    count: number;
    fullyPaidCount: number;
    activeCount: number;
    monthlyBreakdown: Record<string, number>;
    averageMonthly: number;
  }> {
    const debts = await this.getAllDebts(userId);

    const yearDebts = debts.filter((debt) => {
      const debtDate = new Date(debt.date);
      return debtDate.getUTCFullYear() === year;
    });

    const totalAmount = yearDebts.reduce(
      (sum, debt) => sum + Number(debt.finalAmount),
      0,
    );
    const totalRemaining = yearDebts.reduce(
      (sum, debt) => sum + Number(debt.remainingAmount),
      0,
    );

    const monthlyBreakdown: Record<string, number> = {};
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    monthNames.forEach((month) => {
      monthlyBreakdown[month] = 0;
    });

    yearDebts.forEach((debt) => {
      const monthIndex = new Date(debt.date).getUTCMonth();
      const monthName = monthNames[monthIndex];
      monthlyBreakdown[monthName] += Number(debt.finalAmount);
    });

    const fullyPaidCount = yearDebts.filter((d) => d.isFullyPaid()).length;
    const monthsWithData = Object.values(monthlyBreakdown).filter(
      (amount) => amount > 0,
    ).length;
    const averageMonthly =
      monthsWithData > 0 ? totalAmount / monthsWithData : 0;

    return {
      year,
      totalAmount,
      totalRemaining,
      count: yearDebts.length,
      fullyPaidCount,
      activeCount: yearDebts.length - fullyPaidCount,
      monthlyBreakdown,
      averageMonthly,
    };
  }
}
