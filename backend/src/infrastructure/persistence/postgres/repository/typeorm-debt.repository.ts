import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { Debt } from "../../../../domain/entities/debt.entity";
import { DebtRepository } from "../../../../domain/repositories/debt.repository";
import { DebtQueryDto } from "../../../web/dto/debt-query.dto";
import { DebtEntity } from "../entities/debt.entity";

@Injectable()
export class TypeOrmDebtRepository implements DebtRepository {
  constructor(
    @InjectRepository(DebtEntity)
    private readonly debtRepository: Repository<DebtEntity>,
  ) {}

  private toDomain(entity: DebtEntity): Debt {
    const debt = new Debt(
      Number(entity.initialAmount),
      entity.lender,
      entity.months,
      Number(entity.installAmount),
      Number(entity.finalAmount),
      entity.date,
      entity.reason,
      entity.id, // Pasar el ID al constructor
    );

    debt.payments = entity.payments;
    debt.paidAmount = Number(entity.paidAmount);
    debt.remainingAmount = Number(entity.remainingAmount);
    debt.lastPaymentDate = entity.lastPaymentDate || undefined;
    debt.createdAt = entity.createdAt;
    debt.updatedAt = entity.updatedAt;

    return debt;
  }

  private toEntity(domain: Debt): DebtEntity {
    const entity = new DebtEntity();
    // Solo asignar el ID si existe (para updates), si es undefined TypeORM generará uno nuevo
    if (domain.id) {
      entity.id = domain.id;
    }
    entity.initialAmount = domain.initialAmount;
    entity.lender = domain.lender;
    entity.months = domain.months;
    entity.installAmount = domain.installAmount;
    entity.reason = domain.reason;
    entity.payments = domain.payments;
    entity.finalAmount = domain.finalAmount;
    entity.paidAmount = domain.paidAmount;
    entity.remainingAmount = domain.remainingAmount;
    entity.date = domain.date;
    if (domain.lastPaymentDate) {
      entity.lastPaymentDate = domain.lastPaymentDate;
    }
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;

    return entity;
  }

  async save(debt: Debt): Promise<Debt> {
    const entity = this.toEntity(debt);
    const savedEntity = await this.debtRepository.save(entity);
    return this.toDomain(savedEntity);
  }

  async findById(id: string, userId?: string): Promise<Debt | null> {
    const where: any = { id };
    if (userId) where.userId = userId;
    const entity = await this.debtRepository.findOne({ where });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(userId: string): Promise<Debt[]> {
    const entities = await this.debtRepository.find({
      where: { userId },
      order: { date: "DESC" },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findAllPaginated(
    query: DebtQueryDto,
    userId?: string,
  ): Promise<{ data: Debt[]; total: number }> {
    const queryBuilder = this.debtRepository
      .createQueryBuilder("debt")
      .orderBy("debt.date", "DESC");

    if (userId) {
      queryBuilder.andWhere("debt.userId = :userId", { userId });
    }

    if (query.lender) {
      queryBuilder.andWhere("LOWER(debt.lender) LIKE LOWER(:lender)", {
        lender: `%${query.lender}%`,
      });
    }

    // Apply date filters if present in query
    if (query.startDate) {
      queryBuilder.andWhere("debt.date >= :startDate", {
        startDate: new Date(query.startDate + "T00:00:00.000Z"),
      });
    }
    if (query.endDate) {
      queryBuilder.andWhere("debt.date <= :endDate", {
        endDate: new Date(query.endDate + "T23:59:59.999Z"),
      });
    }

    // Apply status filter if present
    if (query.status === 'active') {
      queryBuilder.andWhere('debt.paidAmount < debt.finalAmount');
    } else if (query.status === 'paid') {
      queryBuilder.andWhere('debt.paidAmount >= debt.finalAmount');
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

  async findByDateRange(startDate: Date, endDate: Date, userId?: string): Promise<Debt[]> {
    const where: any = {
      date: Between(startDate, endDate),
    };
    if (userId) where.userId = userId;
    const entities = await this.debtRepository.find({
      where,
      order: { date: "DESC" },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async getMonthlySummary(
    year: number,
    month: number,
    userId?: string,
  ): Promise<{
    totalAmount: number;
    count: number;
    byLender: Record<string, number>;
  }> {
    const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

    // Get total and count
    const totalQuery = this.debtRepository
      .createQueryBuilder("debt")
      .select("SUM(debt.finalAmount)", "totalAmount")
      .addSelect("COUNT(debt.id)", "count")
      .where("debt.date >= :startDate", { startDate })
      .andWhere("debt.date <= :endDate", { endDate });
    if (userId) {
      totalQuery.andWhere("debt.userId = :userId", { userId });
    }
    const totalResult = await totalQuery.getRawOne();

    // Get breakdown by lender
    const byLenderQuery = this.debtRepository
      .createQueryBuilder("debt")
      .select("debt.lender", "lender")
      .addSelect("SUM(debt.finalAmount)", "amount")
      .where("debt.date >= :startDate", { startDate })
      .andWhere("debt.date <= :endDate", { endDate });
    if (userId) {
      byLenderQuery.andWhere("debt.userId = :userId", { userId });
    }
    const byLenderResults = await byLenderQuery
      .groupBy("debt.lender")
      .getRawMany();

    const byLender: Record<string, number> = {};
    byLenderResults.forEach((result) => {
      byLender[result.lender] = parseFloat(result.amount);
    });

    return {
      totalAmount: parseFloat(totalResult?.totalAmount || 0),
      count: parseInt(totalResult?.count || 0),
      byLender,
    };
  }

  async getYearlySummary(year: number, userId?: string): Promise<{
    monthlyBreakdown: { month: number; total: number; count: number }[];
  }> {
    const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    const monthlyQuery = this.debtRepository
      .createQueryBuilder("debt")
      .select("EXTRACT(MONTH FROM debt.date)", "month")
      .addSelect("SUM(debt.finalAmount)", "total")
      .addSelect("COUNT(debt.id)", "count")
      .where("debt.date >= :startDate", { startDate })
      .andWhere("debt.date <= :endDate", { endDate });
    if (userId) {
      monthlyQuery.andWhere("debt.userId = :userId", { userId });
    }
    const monthlyResults = await monthlyQuery
      .groupBy("EXTRACT(MONTH FROM debt.date)")
      .orderBy("EXTRACT(MONTH FROM debt.date)", "ASC")
      .getRawMany();

    const monthlyBreakdown = monthlyResults.map((result) => ({
      month: parseInt(result.month),
      total: parseFloat(result.total || 0),
      count: parseInt(result.count || 0),
    }));

    return { monthlyBreakdown };
  }

  async update(debt: Debt): Promise<Debt> {
    const entity = this.toEntity(debt);
    const updatedEntity = await this.debtRepository.save(entity);
    return this.toDomain(updatedEntity);
  }

  async delete(id: string, userId?: string): Promise<void> {
    const where: any = { id };
    if (userId) where.userId = userId;
    await this.debtRepository.delete(where);
  }
}
