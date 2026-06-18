import { Loan } from "../entities/loan.entity";
import { LoanRepository } from "../repositories/loan.repository";
import { CreateLoanUseCase } from "../../application/loan/create-loan.use-case";
import { RegisterLoanPaymentUseCase } from "../../application/loan/register-loan-payment.use-case";
import { LoanQueryDto } from "../../infrastructure/web/dto/loan-query.dto";

export class LoanService {
  constructor(
    private readonly loanRepository: LoanRepository,
    private readonly createLoanUseCase: CreateLoanUseCase,
    private readonly registerLoanPaymentUseCase: RegisterLoanPaymentUseCase,
  ) {}

  async createLoan(
    userId: string,
    initialAmount: number,
    interestRate: number,
    installment: number,
    debtor: string,
    date: Date,
  ): Promise<Loan> {
    return await this.createLoanUseCase.execute(
      userId,
      initialAmount,
      interestRate,
      installment,
      debtor,
      date,
    );
  }

  async registerPayment(
    userId: string,
    loanId: string,
    amount: number,
  ): Promise<Loan> {
    return await this.registerLoanPaymentUseCase.execute(
      userId,
      loanId,
      amount,
    );
  }

  async getAllLoans(userId: string): Promise<Loan[]> {
    return await this.loanRepository.findAll(userId);
  }

  async getAllLoansPaginated(
    userId: string,
    query: LoanQueryDto,
  ): Promise<{ data: Loan[]; total: number }> {
    return await this.loanRepository.findAllPaginated(query, userId);
  }

  async getLoanById(userId: string, id: string): Promise<Loan> {
    const loan = await this.loanRepository.findById(id, userId);

    if (!loan) {
      throw new Error("Loan not found");
    }

    return loan;
  }

  async updateLoan(
    userId: string,
    id: string,
    updates: {
      interestRate?: number;
      installment?: number;
      debtor?: string;
    },
  ): Promise<Loan> {
    const loan = await this.getLoanById(userId, id);

    if (updates.interestRate !== undefined) {
      if (updates.interestRate < 0) {
        throw new Error("Interest rate cannot be negative");
      }
      if (updates.interestRate > 100) {
        throw new Error("Interest rate cannot exceed 100%");
      }
      loan.interestRate = updates.interestRate;
      // Recalcular el monto total cuando cambia la tasa de interés
      loan.remainingAmount = loan.calculateTotalAmount() - loan.paidAmount;
    }

    if (updates.installment !== undefined) {
      if (updates.installment <= 0) {
        throw new Error("Installment must be greater than 0");
      }
      loan.installment = updates.installment;
    }

    if (updates.debtor !== undefined) {
      if (!updates.debtor || updates.debtor.trim().length === 0) {
        throw new Error("Debtor cannot be empty");
      }
      if (updates.debtor.length > 255) {
        throw new Error("Debtor name cannot be longer than 255 characters");
      }
      loan.debtor = updates.debtor;
    }

    loan.updatedAt = new Date();
    return await this.loanRepository.update(loan);
  }

  async deleteLoan(userId: string, id: string): Promise<void> {
    const loan = await this.loanRepository.findById(id, userId);

    if (!loan) {
      throw new Error("Loan not found");
    }

    if (!loan.isFullyPaid()) {
      throw new Error("Cannot delete loan that is not fully paid");
    }

    await this.loanRepository.delete(id, userId);
  }

  async getLoansSummary(
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<{
    totalLoans: number;
    totalAmountLent: number;
    totalInterest: number;
    totalExpectedReturn: number;
    totalReceived: number;
    totalPending: number;
    fullyPaidCount: number;
    activeLoansCount: number;
  }> {
    let loans = await this.getAllLoans(userId);

    // Filter by date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate + "T00:00:00.000Z");
      const end = new Date(endDate + "T23:59:59.999Z");
      loans = loans.filter((loan) => {
        const loanDate = new Date(loan.date);
        return loanDate >= start && loanDate <= end;
      });
    }

    const totalLoans = loans.length;
    const totalAmountLent = loans.reduce(
      (sum, loan) => sum + loan.initialAmount,
      0,
    );
    const totalExpectedReturn = loans.reduce(
      (sum, loan) => sum + loan.calculateTotalAmount(),
      0,
    );
    const totalInterest = totalExpectedReturn - totalAmountLent;
    const totalReceived = loans.reduce((sum, loan) => sum + loan.paidAmount, 0);
    const totalPending = loans.reduce(
      (sum, loan) => sum + loan.remainingAmount,
      0,
    );
    const fullyPaidCount = loans.filter((loan) => loan.isFullyPaid()).length;
    const activeLoansCount = totalLoans - fullyPaidCount;

    return {
      totalLoans,
      totalAmountLent,
      totalInterest,
      totalExpectedReturn,
      totalReceived,
      totalPending,
      fullyPaidCount,
      activeLoansCount,
    };
  }

  async getLoansByDebtor(userId: string, debtor: string): Promise<Loan[]> {
    const loans = await this.getAllLoans(userId);
    return loans.filter((loan) =>
      loan.debtor.toLowerCase().includes(debtor.toLowerCase()),
    );
  }

  async getOverdueLoans(userId: string): Promise<Loan[]> {
    const loans = await this.getAllLoans(userId);
    const today = new Date();

    return loans.filter((loan) => {
      if (loan.isFullyPaid()) {
        return false;
      }

      // Calcular cuántas cuotas deberían haberse pagado
      const monthsSinceLoan = this.monthsBetween(loan.date, today);
      const expectedPayments = Math.floor(monthsSinceLoan);
      const expectedAmountPaid = expectedPayments * loan.installment;

      return loan.paidAmount < expectedAmountPaid;
    });
  }

  async getLoanPerformance(
    userId: string,
    loanId: string,
  ): Promise<{
    loan: Loan;
    monthsSinceStart: number;
    expectedPayments: number;
    actualPayments: number;
    paymentRatio: number;
    isOnTrack: boolean;
    monthsBehind: number;
    expectedCompletionDate: Date;
  }> {
    const loan = await this.getLoanById(userId, loanId);
    const today = new Date();

    const monthsSinceStart = this.monthsBetween(loan.date, today);
    const expectedPayments = Math.floor(monthsSinceStart);
    const actualPayments = Math.floor(loan.paidAmount / loan.installment);
    const paymentRatio =
      expectedPayments > 0 ? actualPayments / expectedPayments : 1;
    const isOnTrack = paymentRatio >= 0.9; // 90% o más de los pagos esperados
    const monthsBehind = Math.max(0, expectedPayments - actualPayments);

    // Calcular fecha de finalización esperada
    const remainingPayments = Math.ceil(
      loan.remainingAmount / loan.installment,
    );
    const expectedCompletionDate = new Date(loan.date);
    expectedCompletionDate.setMonth(
      expectedCompletionDate.getMonth() + (actualPayments + remainingPayments),
    );

    return {
      loan,
      monthsSinceStart,
      expectedPayments,
      actualPayments,
      paymentRatio,
      isOnTrack,
      monthsBehind,
      expectedCompletionDate,
    };
  }

  private monthsBetween(date1: Date, date2: Date): number {
    const years = date2.getFullYear() - date1.getFullYear();
    const months = date2.getMonth() - date1.getMonth();
    return years * 12 + months;
  }

  async calculateOptimalPaymentPlan(
    userId: string,
    loanId: string,
    targetMonths?: number,
  ): Promise<{
    currentPlan: {
      monthlyPayment: number;
      totalMonths: number;
      totalInterest: number;
    };
    suggestedPlan: {
      monthlyPayment: number;
      totalMonths: number;
      totalInterest: number;
      interestSaved: number;
      timeSavedMonths: number;
    };
  }> {
    const loan = await this.getLoanById(userId, loanId);

    const totalAmount = loan.calculateTotalAmount();
    const remainingAmount = loan.remainingAmount;

    // Plan actual
    const currentMonthly = loan.installment;
    const currentRemainingMonths = Math.ceil(remainingAmount / currentMonthly);
    const currentTotalInterest =
      remainingAmount -
      loan.initialAmount * (1 - loan.paidAmount / totalAmount);

    // Plan sugerido (aumentar pago en 20% o pagar en X meses)
    let suggestedMonthly: number;
    let suggestedMonths: number;

    if (targetMonths) {
      suggestedMonthly = remainingAmount / targetMonths;
      suggestedMonths = targetMonths;
    } else {
      // Aumentar pago en 20%
      suggestedMonthly = currentMonthly * 1.2;
      suggestedMonths = Math.ceil(remainingAmount / suggestedMonthly);
    }

    const suggestedTotalInterest =
      remainingAmount * (loan.interestRate / 100) * (suggestedMonths / 12);
    const interestSaved = currentTotalInterest - suggestedTotalInterest;
    const timeSavedMonths = currentRemainingMonths - suggestedMonths;

    return {
      currentPlan: {
        monthlyPayment: currentMonthly,
        totalMonths: currentRemainingMonths,
        totalInterest: currentTotalInterest,
      },
      suggestedPlan: {
        monthlyPayment: suggestedMonthly,
        totalMonths: suggestedMonths,
        totalInterest: suggestedTotalInterest,
        interestSaved,
        timeSavedMonths,
      },
    };
  }

  async getLoansByDateRangePaginated(
    userId: string,
    startDate: Date,
    endDate: Date,
    query: LoanQueryDto,
  ): Promise<{ data: Loan[]; total: number }> {
    const filterQuery: LoanQueryDto = {
      ...query,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
    return await this.loanRepository.findAllPaginated(filterQuery, userId);
  }

  async getMonthlySummary(
    userId: string,
    year: number,
    month: number,
  ): Promise<{
    month: string;
    totalAmountLent: number;
    totalInterest: number;
    totalReceived: number;
    totalPending: number;
    loanCount: number;
    fullyPaidCount: number;
    activeCount: number;
    byDebtor: Record<string, number>;
    byDay: Record<string, number>;
  }> {
    const loans = await this.getAllLoans(userId);

    const monthLoans = loans.filter((loan) => {
      const loanDate = new Date(loan.date);
      return (
        loanDate.getUTCFullYear() === year && loanDate.getUTCMonth() === month
      );
    });

    const totalAmountLent = monthLoans.reduce(
      (sum, loan) => sum + loan.initialAmount,
      0,
    );
    const totalInterest = monthLoans.reduce(
      (sum, loan) => sum + loan.calculateTotalAmount() - loan.initialAmount,
      0,
    );
    const totalReceived = monthLoans.reduce(
      (sum, loan) => sum + loan.paidAmount,
      0,
    );
    const totalPending = monthLoans.reduce(
      (sum, loan) => sum + loan.remainingAmount,
      0,
    );

    const byDebtor: Record<string, number> = {};
    const byDay: Record<string, number> = {};

    monthLoans.forEach((loan) => {
      const day = new Date(loan.date).getUTCDate().toString().padStart(2, "0");
      byDay[day] = (byDay[day] || 0) + loan.initialAmount;
      byDebtor[loan.debtor] = (byDebtor[loan.debtor] || 0) + loan.initialAmount;
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

    const fullyPaidCount = monthLoans.filter((l) => l.isFullyPaid()).length;

    return {
      month: `${monthNames[month]} ${year}`,
      totalAmountLent,
      totalInterest,
      totalReceived,
      totalPending,
      loanCount: monthLoans.length,
      fullyPaidCount,
      activeCount: monthLoans.length - fullyPaidCount,
      byDebtor,
      byDay,
    };
  }

  async getYearlySummary(
    userId: string,
    year: number,
  ): Promise<{
    year: number;
    totalAmountLent: number;
    totalInterest: number;
    totalReceived: number;
    totalPending: number;
    count: number;
    fullyPaidCount: number;
    activeCount: number;
    monthlyBreakdown: Record<string, number>;
    averageMonthly: number;
  }> {
    const loans = await this.getAllLoans(userId);

    const yearLoans = loans.filter((loan) => {
      const loanDate = new Date(loan.date);
      return loanDate.getUTCFullYear() === year;
    });

    const totalAmountLent = yearLoans.reduce(
      (sum, loan) => sum + loan.initialAmount,
      0,
    );
    const totalInterest = yearLoans.reduce(
      (sum, loan) => sum + loan.calculateTotalAmount() - loan.initialAmount,
      0,
    );
    const totalReceived = yearLoans.reduce(
      (sum, loan) => sum + loan.paidAmount,
      0,
    );
    const totalPending = yearLoans.reduce(
      (sum, loan) => sum + loan.remainingAmount,
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

    yearLoans.forEach((loan) => {
      const monthIndex = new Date(loan.date).getUTCMonth();
      const monthName = monthNames[monthIndex];
      monthlyBreakdown[monthName] += loan.initialAmount;
    });

    const fullyPaidCount = yearLoans.filter((l) => l.isFullyPaid()).length;
    const monthsWithData = Object.values(monthlyBreakdown).filter(
      (amount) => amount > 0,
    ).length;
    const averageMonthly =
      monthsWithData > 0 ? totalAmountLent / monthsWithData : 0;

    return {
      year,
      totalAmountLent,
      totalInterest,
      totalReceived,
      totalPending,
      count: yearLoans.length,
      fullyPaidCount,
      activeCount: yearLoans.length - fullyPaidCount,
      monthlyBreakdown,
      averageMonthly,
    };
  }
}
