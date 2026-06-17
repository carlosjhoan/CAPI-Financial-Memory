import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, LessThanOrEqual } from "typeorm";
import { Loan } from "../../../../domain/entities/loan.entity";
import { LoanRepository } from "../../../../domain/repositories/loan.repository";
import { LoanEntity } from "../entities/loan.entity";
import { LoanQueryDto } from "../../../web/dto/loan-query.dto";

@Injectable()
export class TypeOrmLoanRepository implements LoanRepository {
  constructor(
    @InjectRepository(LoanEntity)
    private readonly loanRepository: Repository<LoanEntity>,
  ) {}

  private toDomain(entity: LoanEntity): Loan {
    const loan = new Loan(
      Number(entity.initialAmount),
      Number(entity.interestRate),
      Number(entity.installment),
      entity.debtor,
      entity.date,
      entity.id,
    );

    loan.paidAmount = Number(entity.paidAmount);
    loan.remainingAmount = Number(entity.remainingAmount);
    loan.createdAt = entity.createdAt;
    loan.updatedAt = entity.updatedAt;

    return loan;
  }

  private toEntity(domain: Loan): LoanEntity {
    const entity = new LoanEntity();
    // Solo asignar el ID si existe (para updates), si es undefined TypeORM generará uno nuevo
    if (domain.id) {
      entity.id = domain.id;
    }
    entity.initialAmount = domain.initialAmount;
    entity.interestRate = domain.interestRate;
    entity.installment = domain.installment;
    entity.paidAmount = domain.paidAmount;
    entity.remainingAmount = domain.remainingAmount;
    entity.debtor = domain.debtor;
    entity.date = domain.date;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;

    return entity;
  }

  async save(loan: Loan): Promise<Loan> {
    const entity = this.toEntity(loan);
    const savedEntity = await this.loanRepository.save(entity);
    return this.toDomain(savedEntity);
  }

  async findById(id: string, userId?: string): Promise<Loan | null> {
    const where: any = { id };
    if (userId) where.userId = userId;
    const entity = await this.loanRepository.findOne({ where });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(userId: string): Promise<Loan[]> {
    const entities = await this.loanRepository.find({ where: { userId } });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findAllPaginated(
    query: LoanQueryDto,
    userId?: string,
  ): Promise<{ data: Loan[]; total: number }> {
    const queryBuilder = this.loanRepository
      .createQueryBuilder("loan")
      .orderBy("loan.date", "DESC");

    if (userId) {
      queryBuilder.andWhere("loan.userId = :userId", { userId });
    }

    if (query.debtor) {
      queryBuilder.andWhere("LOWER(loan.debtor) LIKE LOWER(:debtor)", {
        debtor: `%${query.debtor}%`,
      });
    }

    if (query.status === "active") {
      queryBuilder.andWhere("loan.remainingAmount > 0");
    } else if (query.status === "paid") {
      queryBuilder.andWhere("loan.remainingAmount <= 0");
    }

    // Apply date filters if present in query
    if (query.startDate) {
      queryBuilder.andWhere("loan.date >= :startDate", {
        startDate: new Date(query.startDate + "T00:00:00.000Z"),
      });
    }
    if (query.endDate) {
      queryBuilder.andWhere("loan.date <= :endDate", {
        endDate: new Date(query.endDate + "T23:59:59.999Z"),
      });
    }

    const page = query?.page || 1;
    const limit = query?.limit || 6;
    const skip = (page - 1) * limit;

    const [entities, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: entities.map((entity) => this.toDomain(entity)),
      total,
    };
  }

  async update(loan: Loan): Promise<Loan> {
    const entity = this.toEntity(loan);
    const updatedEntity = await this.loanRepository.save(entity);
    return this.toDomain(updatedEntity);
  }

  async delete(id: string, userId?: string): Promise<void> {
    const where: any = { id };
    if (userId) where.userId = userId;
    await this.loanRepository.delete(where);
  }

  async findByDebtor(debtor: string, userId?: string): Promise<Loan[]> {
    const query = this.loanRepository
      .createQueryBuilder("loan")
      .where("LOWER(loan.debtor) LIKE LOWER(:debtor)", {
        debtor: `%${debtor}%`,
      })
      .orderBy("loan.date", "DESC");
    if (userId) {
      query.andWhere("loan.userId = :userId", { userId });
    }
    const entities = await query.getMany();
    return entities.map((entity) => this.toDomain(entity));
  }

  async findActiveLoans(userId?: string): Promise<Loan[]> {
    const query = this.loanRepository
      .createQueryBuilder("loan")
      .where("loan.remainingAmount > 0")
      .orderBy("loan.date", "DESC");
    if (userId) {
      query.andWhere("loan.userId = :userId", { userId });
    }
    const entities = await query.getMany();
    return entities.map((entity) => this.toDomain(entity));
  }

  async findFullyPaidLoans(userId?: string): Promise<Loan[]> {
    const query = this.loanRepository
      .createQueryBuilder("loan")
      .where("loan.remainingAmount <= 0")
      .orderBy("loan.updatedAt", "DESC");
    if (userId) {
      query.andWhere("loan.userId = :userId", { userId });
    }
    const entities = await query.getMany();
    return entities.map((entity) => this.toDomain(entity));
  }

  async getLoansSummary(userId?: string): Promise<{
    totalLoans: number;
    totalAmountLent: number;
    totalInterest: number;
    totalExpectedReturn: number;
    totalReceived: number;
    totalPending: number;
    activeLoansCount: number;
    fullyPaidCount: number;
  }> {
    const loans = await this.findAll(userId!);

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
      activeLoansCount,
      fullyPaidCount,
    };
  }

  async getOverdueLoans(userId?: string): Promise<Loan[]> {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    const query = this.loanRepository
      .createQueryBuilder("loan")
      .where("loan.remainingAmount > 0")
      .andWhere("loan.date <= :sixMonthsAgo", { sixMonthsAgo })
      .orderBy("loan.date", "ASC");
    if (userId) {
      query.andWhere("loan.userId = :userId", { userId });
    }
    const entities = await query.getMany();
    return entities.map((entity) => this.toDomain(entity));
  }

  async getLoansByDateRange(startDate: Date, endDate: Date, userId?: string): Promise<Loan[]> {
    const where: any = {
      date: Between(startDate, endDate),
    };
    if (userId) where.userId = userId;
    const entities = await this.loanRepository.find({
      where,
      order: {
        date: "DESC",
      },
    });

    return entities.map((entity) => this.toDomain(entity));
  }

  async getLoansByInterestRateRange(
    minRate: number,
    maxRate: number,
  ): Promise<Loan[]> {
    const entities = await this.loanRepository
      .createQueryBuilder("loan")
      .where("loan.interestRate >= :minRate", { minRate })
      .andWhere("loan.interestRate <= :maxRate", { maxRate })
      .orderBy("loan.interestRate", "DESC")
      .getMany();

    return entities.map((entity) => this.toDomain(entity));
  }
}
