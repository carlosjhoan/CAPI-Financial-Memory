import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Expense } from "../../../../domain/entities/expense.entity";
import { ExpenseRepository } from "../../../../domain/repositories/expense.repository";
import { ExpenseEntity } from "../entities/expense.entity";

@Injectable()
export class TypeOrmExpenseRepository implements ExpenseRepository {
  constructor(
    @InjectRepository(ExpenseEntity)
    private readonly expenseRepository: Repository<ExpenseEntity>,
  ) {}

  private toDomain(entity: ExpenseEntity): Expense {
    const expense = new Expense(
      Number(entity.amount),
      entity.reason,
      entity.date,
      entity.id,
    );

    expense.createdAt = entity.createdAt;

    return expense;
  }

  private toEntity(domain: Expense): ExpenseEntity {
    const entity = new ExpenseEntity();
    // Solo asignar el ID si existe (para updates), si es undefined TypeORM generará uno nuevo
    if (domain.id) {
      entity.id = domain.id;
    }
    entity.amount = domain.amount;
    entity.reason = domain.reason;
    entity.date = domain.date;
    entity.createdAt = domain.createdAt;

    return entity;
  }

  async save(expense: Expense): Promise<Expense> {
    const entity = this.toEntity(expense);
    const savedEntity = await this.expenseRepository.save(entity);
    return this.toDomain(savedEntity);
  }

  async findById(id: string, userId?: string): Promise<Expense | null> {
    const where: any = { id };
    if (userId) where.userId = userId;
    const entity = await this.expenseRepository.findOne({ where });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(userId: string): Promise<Expense[]> {
    const entities = await this.expenseRepository.find({ where: { userId } });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findAllPaginated(
    skip: number,
    limit: number,
    userId?: string,
  ): Promise<{ data: Expense[]; total: number }> {
    const where: any = {};
    if (userId) where.userId = userId;
    const [entities, total] = await this.expenseRepository.findAndCount({
      where,
      order: { date: "DESC" },
      skip,
      take: limit,
    });

    return {
      data: entities.map((entity) => this.toDomain(entity)),
      total,
    };
  }

  async findByDateRange(startDate: Date, endDate: Date, userId?: string): Promise<Expense[]> {
    const query = this.expenseRepository
      .createQueryBuilder("expense")
      .where("expense.date >= :startDate", { startDate })
      .andWhere("expense.date <= :endDate", { endDate })
      .orderBy("expense.date", "DESC");
    if (userId) {
      query.andWhere("expense.userId = :userId", { userId });
    }
    const entities = await query.getMany();
    return entities.map((entity) => this.toDomain(entity));
  }

  async findByDateRangePaginated(
    startDate: Date,
    endDate: Date,
    skip: number,
    limit: number,
    userId?: string,
  ): Promise<{ data: Expense[]; total: number }> {
    const queryBuilder = this.expenseRepository
      .createQueryBuilder("expense")
      .where("expense.date >= :startDate", { startDate })
      .andWhere("expense.date <= :endDate", { endDate })
      .orderBy("expense.date", "DESC");
    if (userId) {
      queryBuilder.andWhere("expense.userId = :userId", { userId });
    }

    const [entities, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: entities.map((entity) => this.toDomain(entity)),
      total,
    };
  }

  async update(expense: Expense): Promise<Expense> {
    const entity = this.toEntity(expense);
    const updatedEntity = await this.expenseRepository.save(entity);
    return this.toDomain(updatedEntity);
  }

  async delete(id: string, userId?: string): Promise<void> {
    const where: any = { id };
    if (userId) where.userId = userId;
    await this.expenseRepository.delete(where);
  }

  async findByReason(reason: string): Promise<Expense[]> {
    const entities = await this.expenseRepository
      .createQueryBuilder("expense")
      .where("LOWER(expense.reason) LIKE LOWER(:reason)", {
        reason: `%${reason}%`,
      })
      .orderBy("expense.date", "DESC")
      .getMany();

    return entities.map((entity) => this.toDomain(entity));
  }

  async getMonthlySummary(
    year: number,
    month: number,
    userId?: string,
  ): Promise<{
    totalAmount: number;
    count: number;
    averageAmount: number;
  }> {
    // Use UTC to avoid timezone issues with date boundaries
    const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)); // Last day of month

    const query = this.expenseRepository
      .createQueryBuilder("expense")
      .select("SUM(expense.amount)", "totalAmount")
      .addSelect("COUNT(expense.id)", "count")
      .where("expense.date >= :startDate", { startDate })
      .andWhere("expense.date <= :endDate", { endDate });
    if (userId) {
      query.andWhere("expense.userId = :userId", { userId });
    }
    const result = await query.getRawOne();

    return {
      totalAmount: parseFloat(result?.totalAmount || 0),
      count: parseInt(result?.count || 0),
      averageAmount:
        result?.count > 0
          ? parseFloat(result.totalAmount) / parseInt(result.count)
          : 0,
    };
  }

  async getYearlySummary(year: number, userId?: string): Promise<{
    totalAmount: number;
    count: number;
    monthlyBreakdown: Record<string, number>;
  }> {
    // Use UTC to avoid timezone issues with date boundaries
    const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    // Obtener total y conteo anual
    const totalQuery = this.expenseRepository
      .createQueryBuilder("expense")
      .select("SUM(expense.amount)", "totalAmount")
      .addSelect("COUNT(expense.id)", "count")
      .where("expense.date >= :startDate", { startDate })
      .andWhere("expense.date <= :endDate", { endDate });
    if (userId) {
      totalQuery.andWhere("expense.userId = :userId", { userId });
    }
    const totalResult = await totalQuery.getRawOne();

    // Obtener desglose mensual
    const monthlyQuery = this.expenseRepository
      .createQueryBuilder("expense")
      .select("EXTRACT(MONTH FROM expense.date)", "month")
      .addSelect("SUM(expense.amount)", "amount")
      .where("expense.date >= :startDate", { startDate })
      .andWhere("expense.date <= :endDate", { endDate });
    if (userId) {
      monthlyQuery.andWhere("expense.userId = :userId", { userId });
    }
    const monthlyResults = await monthlyQuery
      .groupBy("EXTRACT(MONTH FROM expense.date)")
      .getRawMany();

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

    // Asignar valores reales
    monthlyResults.forEach((result) => {
      const monthIndex = parseInt(result.month) - 1; // Los meses en SQL son 1-indexed
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyBreakdown[monthNames[monthIndex]] = parseFloat(result.amount);
      }
    });

    return {
      totalAmount: parseFloat(totalResult?.totalAmount || 0),
      count: parseInt(totalResult?.count || 0),
      monthlyBreakdown,
    };
  }
}
