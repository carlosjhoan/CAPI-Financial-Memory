import { Income } from "../entities/income.entity";
import { IncomeRepository } from "../repositories/income.repository";
import { CreateIncomeUseCase } from "../../application/income/create-income.use-case";
import { RegisterIncomePaymentUseCase } from "../../application/income/register-income-payment.use-case";
import { AllocationDto } from "../../infrastructure/web/dto/allocation.dto";

export class IncomeService {
  constructor(
    private readonly incomeRepository: IncomeRepository,
    private readonly createIncomeUseCase: CreateIncomeUseCase,
    private readonly registerIncomePaymentUseCase: RegisterIncomePaymentUseCase,
  ) {}

  async createIncome(
    userId: string,
    amount: number,
    reason: string,
    date: Date,
    allocations: AllocationDto[],
  ): Promise<Income> {
    return await this.createIncomeUseCase.execute(
      userId,
      amount,
      reason,
      date,
      allocations,
    );
  }

  async registerPayment(
    userId: string,
    incomeId: string,
    amount: number,
  ): Promise<Income> {
    return await this.registerIncomePaymentUseCase.execute(
      userId,
      incomeId,
      amount,
    );
  }

  async getAllIncomes(userId: string): Promise<Income[]> {
    return await this.incomeRepository.findAll(userId);
  }

  async getAllIncomesPaginated(
    userId: string,
    skip: number,
    limit: number,
  ): Promise<{ data: Income[]; total: number }> {
    return await this.incomeRepository.findAllPaginated(skip, limit, userId);
  }

  async getIncomeById(userId: string, id: string): Promise<Income> {
    const income = await this.incomeRepository.findById(id, userId);

    if (!income) {
      throw new Error("Income not found");
    }

    return income;
  }

  async updateIncome(
    userId: string,
    id: string,
    updates: {
      amount?: number;
      reason?: string;
      date?: Date;
    },
  ): Promise<Income> {
    const income = await this.getIncomeById(userId, id);

    if (updates.amount !== undefined) {
      if (updates.amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }
      income.amount = updates.amount;
    }

    if (updates.reason !== undefined) {
      if (!updates.reason || updates.reason.trim().length === 0) {
        throw new Error("Reason cannot be empty");
      }
      if (updates.reason.length > 255) {
        throw new Error("Reason cannot be longer than 255 characters");
      }
      income.reason = updates.reason;
    }

    if (updates.date !== undefined) {
      income.date = updates.date;
    }

    income.update(income.amount, income.reason, income.date);
    return await this.incomeRepository.update(income);
  }

  async deleteIncome(userId: string, id: string): Promise<void> {
    const income = await this.incomeRepository.findById(id, userId);

    if (!income) {
      throw new Error("Income not found");
    }

    await this.incomeRepository.delete(id, userId);
  }

  async getIncomesByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Income[]> {
    return await this.incomeRepository.findByDateRange(
      startDate,
      endDate,
      userId,
    );
  }

  async getIncomesByDateRangePaginated(
    userId: string,
    startDate: Date,
    endDate: Date,
    skip: number,
    limit: number,
  ): Promise<{ data: Income[]; total: number }> {
    return await this.incomeRepository.findByDateRangePaginated(
      startDate,
      endDate,
      skip,
      limit,
      userId,
    );
  }

  async getIncomesSummary(
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<{
    totalIncomes: number;
    totalAmount: number;
    averageAmount: number;
    highestIncome: Income | null;
    recentIncomes: Income[];
  }> {
    let incomes = await this.getAllIncomes(userId);

    // Filter by date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate + "T00:00:00.000Z");
      const end = new Date(endDate + "T23:59:59.999Z");
      incomes = incomes.filter((income) => {
        const incomeDate = new Date(income.date);
        return incomeDate >= start && incomeDate <= end;
      });
    }

    if (incomes.length === 0) {
      return {
        totalIncomes: 0,
        totalAmount: 0,
        averageAmount: 0,
        highestIncome: null,
        recentIncomes: [],
      };
    }

    // ✅ NORMALIZAR: Convertir string a Date ANTES del sort
    const totalIncomes = incomes.length;
    const totalAmount = incomes.reduce(
      (sum, income) => sum + Number(income.amount),
      0,
    );
    const averageAmount = totalAmount / totalIncomes;

    // Encontrar el ingreso más alto
    const highestIncome = incomes.reduce((max, income) =>
      Number(income.amount) > Number(max.amount) ? income : max,
    );

    // Helper para convertir date a Date instance
    const toDate = (date: Date | string): Date =>
      date instanceof Date ? date : new Date(date);

    // Obtener los 5 ingresos más recientes
    const recentIncomes = [...incomes]
      .sort((a, b) => toDate(b.date).getTime() - toDate(a.date).getTime())
      .slice(0, 5);

    return {
      totalIncomes,
      totalAmount,
      averageAmount,
      highestIncome,
      recentIncomes,
    };
  }

  async getMonthlySummary(
    userId: string,
    year: number,
    month: number,
  ): Promise<{
    month: string;
    totalAmount: number;
    incomeCount: number;
    dailyBreakdown: Record<string, number>;
    byReason: Record<string, number>;
  }> {
    const incomes = await this.getAllIncomes(userId);

    const monthIncomes = incomes.filter((income) => {
      const incomeDate = new Date(income.date);
      // Use UTC methods to avoid timezone shifts (DATE columns are UTC-midnight)
      return (
        incomeDate.getUTCFullYear() === year &&
        incomeDate.getUTCMonth() === month
      );
    });

    const totalAmount = monthIncomes.reduce(
      (sum, income) => sum + Number(income.amount),
      0,
    );

    // Agrupar por día
    const dailyBreakdown: Record<string, number> = {};
    // Agrupar por razón
    const byReason: Record<string, number> = {};

    monthIncomes.forEach((income) => {
      const day = new Date(income.date)
        .getUTCDate()
        .toString()
        .padStart(2, "0");
      dailyBreakdown[day] = (dailyBreakdown[day] || 0) + Number(income.amount);

      byReason[income.reason] =
        (byReason[income.reason] || 0) + Number(income.amount);
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

    return {
      month: `${monthNames[month]} ${year}`,
      totalAmount,
      incomeCount: monthIncomes.length,
      dailyBreakdown,
      byReason,
    };
  }

  async getYearlySummary(
    userId: string,
    year: number,
  ): Promise<{
    year: number;
    totalAmount: number;
    monthlyBreakdown: Record<string, number>;
    averageMonthly: number;
  }> {
    const incomes = await this.getAllIncomes(userId);

    const yearIncomes = incomes.filter((income) => {
      const incomeDate = new Date(income.date);
      // Use UTC method to avoid timezone shift (DATE columns are UTC-midnight)
      return incomeDate.getUTCFullYear() === year;
    });

    const totalAmount = yearIncomes.reduce(
      (sum, income) => sum + Number(income.amount),
      0,
    );

    // Agrupar por mes
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

    // Inicializar todos los meses con 0
    monthNames.forEach((month) => {
      monthlyBreakdown[month] = 0;
    });

    yearIncomes.forEach((income) => {
      const monthIndex = new Date(income.date).getUTCMonth();
      const monthName = monthNames[monthIndex];
      monthlyBreakdown[monthName] += Number(income.amount);
    });

    const monthsWithData = Object.values(monthlyBreakdown).filter(
      (amount) => amount > 0,
    ).length;
    const averageMonthly =
      monthsWithData > 0 ? totalAmount / monthsWithData : 0;

    return {
      year,
      totalAmount,
      monthlyBreakdown,
      averageMonthly,
    };
  }
}
