import { Loan } from "../../../../domain/entities/loan.entity";
import { LoanRepository } from "../../../../domain/repositories/loan.repository";
import { LoanQueryDto } from "../../../web/dto/loan-query.dto";

export class InMemoryLoanRepository implements LoanRepository {
  private loans: Map<string, Loan> = new Map();

  async save(loan: Loan): Promise<Loan> {
    this.loans.set(loan.id, loan);
    return loan;
  }

  async findById(id: string): Promise<Loan | null> {
    return this.loans.get(id) || null;
  }

  async findAll(): Promise<Loan[]> {
    return Array.from(this.loans.values());
  }

  async findAllPaginated(
    query: LoanQueryDto,
  ): Promise<{ data: Loan[]; total: number }> {
    let loans = Array.from(this.loans.values());

    // Apply debtor filter
    if (query.debtor) {
      const debtorLower = query.debtor.toLowerCase();
      loans = loans.filter((loan) =>
        loan.debtor.toLowerCase().includes(debtorLower),
      );
    }

    // Apply status filter
    if (query.status === "active") {
      loans = loans.filter((loan) => !loan.isFullyPaid());
    } else if (query.status === "paid") {
      loans = loans.filter((loan) => loan.isFullyPaid());
    }

    // Apply date filters
    if (query.startDate) {
      const startDate = new Date(query.startDate + "T00:00:00.000Z");
      loans = loans.filter((loan) => loan.date >= startDate);
    }
    if (query.endDate) {
      const endDate = new Date(query.endDate + "T23:59:59.999Z");
      loans = loans.filter((loan) => loan.date <= endDate);
    }

    // Sort by date descending
    loans.sort((a, b) => b.date.getTime() - a.date.getTime());

    const total = loans.length;
    const page = query?.page || 1;
    const limit = query?.limit || 6;
    const skip = (page - 1) * limit;

    return {
      data: loans.slice(skip, skip + limit),
      total,
    };
  }

  async findByDebtor(debtor: string): Promise<Loan[]> {
    const debtorLower = debtor.toLowerCase();
    return Array.from(this.loans.values()).filter((loan) =>
      loan.debtor.toLowerCase().includes(debtorLower),
    );
  }

  async findActiveLoans(): Promise<Loan[]> {
    return Array.from(this.loans.values()).filter(
      (loan) => !loan.isFullyPaid(),
    );
  }

  async findFullyPaidLoans(): Promise<Loan[]> {
    return Array.from(this.loans.values()).filter((loan) => loan.isFullyPaid());
  }

  async getLoansSummary(): Promise<{
    totalLoans: number;
    totalAmountLent: number;
    totalInterest: number;
    totalExpectedReturn: number;
    totalReceived: number;
    totalPending: number;
    fullyPaidCount: number;
    activeLoansCount: number;
  }> {
    const loans = await this.findAll();

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
    const activeLoansCount = loans.filter((loan) => !loan.isFullyPaid()).length;
    const fullyPaidCount = totalLoans - activeLoansCount;

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

  async getOverdueLoans(): Promise<Loan[]> {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    return Array.from(this.loans.values()).filter((loan) => {
      if (loan.isFullyPaid()) return false;
      return loan.date <= sixMonthsAgo;
    });
  }

  async getLoansByDateRange(startDate: Date, endDate: Date): Promise<Loan[]> {
    return Array.from(this.loans.values()).filter(
      (loan) => loan.date >= startDate && loan.date <= endDate,
    );
  }

  async update(loan: Loan): Promise<Loan> {
    if (!this.loans.has(loan.id)) {
      throw new Error("Loan not found");
    }
    this.loans.set(loan.id, loan);
    return loan;
  }

  async delete(id: string): Promise<void> {
    this.loans.delete(id);
  }
}
