import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Income } from "../../../../domain/entities/income.entity";
import { IncomeRepository } from "../../../../domain/repositories/income.repository";
import { IncomeEntity } from "../entities/income.entity";

@Injectable()
export class TypeOrmIncomeRepository implements IncomeRepository {
  constructor(
    @InjectRepository(IncomeEntity)
    private readonly incomeRepository: Repository<IncomeEntity>,
  ) {}

  private toDomain(entity: IncomeEntity): Income {
    const income = new Income(
      Number(entity.amount),
      entity.reason,
      entity.date,
      entity.id,
    );

    income.createdAt = entity.createdAt;

    return income;
  }

  private toEntity(domain: Income): IncomeEntity {
    const entity = new IncomeEntity();
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

  async save(income: Income): Promise<Income> {
    const entity = this.toEntity(income);
    const savedEntity = await this.incomeRepository.save(entity);
    return this.toDomain(savedEntity);
  }

  async findById(id: string, userId?: string): Promise<Income | null> {
    const where: any = { id };
    if (userId) where.userId = userId;
    const entity = await this.incomeRepository.findOne({ where });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(userId: string): Promise<Income[]> {
    const entities = await this.incomeRepository.find({ where: { userId } });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findAllPaginated(
    skip: number,
    limit: number,
    userId?: string,
  ): Promise<{ data: Income[]; total: number }> {
    const where: any = {};
    if (userId) where.userId = userId;
    const [entities, total] = await this.incomeRepository.findAndCount({
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

  async update(income: Income): Promise<Income> {
    const entity = this.toEntity(income);
    const updatedEntity = await this.incomeRepository.save(entity);
    return this.toDomain(updatedEntity);
  }

  async delete(id: string, userId?: string): Promise<void> {
    const where: any = { id };
    if (userId) where.userId = userId;
    await this.incomeRepository.delete(where);
  }

  async findByDateRange(startDate: Date, endDate: Date, userId?: string): Promise<Income[]> {
    const query = this.incomeRepository
      .createQueryBuilder("income")
      .where("income.date >= :startDate", { startDate })
      .andWhere("income.date <= :endDate", { endDate })
      .orderBy("income.date", "DESC");
    if (userId) {
      query.andWhere("income.userId = :userId", { userId });
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
  ): Promise<{ data: Income[]; total: number }> {
    const queryBuilder = this.incomeRepository
      .createQueryBuilder("income")
      .where("income.date >= :startDate", { startDate })
      .andWhere("income.date <= :endDate", { endDate })
      .orderBy("income.date", "DESC");
    if (userId) {
      queryBuilder.andWhere("income.userId = :userId", { userId });
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

  async findByReason(reason: string): Promise<Income[]> {
    const entities = await this.incomeRepository
      .createQueryBuilder("income")
      .where("LOWER(income.reason) LIKE LOWER(:reason)", {
        reason: `%${reason}%`,
      })
      .orderBy("income.date", "DESC")
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
    byReason: Record<string, number>;
  }> {
    // Use UTC to avoid timezone issues with date boundaries
    const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)); // Last day of month

    // Obtener total y conteo
    const totalQuery = this.incomeRepository
      .createQueryBuilder("income")
      .select("SUM(income.amount)", "totalAmount")
      .addSelect("COUNT(income.id)", "count")
      .where("income.date >= :startDate", { startDate })
      .andWhere("income.date <= :endDate", { endDate });
    if (userId) {
      totalQuery.andWhere("income.userId = :userId", { userId });
    }
    const totalResult = await totalQuery.getRawOne();

    // Obtener desglose por razón
    const byReasonQuery = this.incomeRepository
      .createQueryBuilder("income")
      .select("income.reason", "reason")
      .addSelect("SUM(income.amount)", "amount")
      .where("income.date >= :startDate", { startDate })
      .andWhere("income.date <= :endDate", { endDate });
    if (userId) {
      byReasonQuery.andWhere("income.userId = :userId", { userId });
    }
    const byReasonResults = await byReasonQuery
      .groupBy("income.reason")
      .getRawMany();

    const byReason: Record<string, number> = {};
    byReasonResults.forEach((result) => {
      byReason[result.reason] = parseFloat(result.amount);
    });

    return {
      totalAmount: parseFloat(totalResult?.totalAmount || 0),
      count: parseInt(totalResult?.count || 0),
      averageAmount:
        totalResult?.count > 0
          ? parseFloat(totalResult.totalAmount) / parseInt(totalResult.count)
          : 0,
      byReason,
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
    const totalQuery = this.incomeRepository
      .createQueryBuilder("income")
      .select("SUM(income.amount)", "totalAmount")
      .addSelect("COUNT(income.id)", "count")
      .where("income.date >= :startDate", { startDate })
      .andWhere("income.date <= :endDate", { endDate });
    if (userId) {
      totalQuery.andWhere("income.userId = :userId", { userId });
    }
    const totalResult = await totalQuery.getRawOne();

    // Obtener desglose mensual
    const monthlyQuery = this.incomeRepository
      .createQueryBuilder("income")
      .select("EXTRACT(MONTH FROM income.date)", "month")
      .addSelect("SUM(income.amount)", "amount")
      .where("income.date >= :startDate", { startDate })
      .andWhere("income.date <= :endDate", { endDate });
    if (userId) {
      monthlyQuery.andWhere("income.userId = :userId", { userId });
    }
    const monthlyResults = await monthlyQuery
      .groupBy("EXTRACT(MONTH FROM income.date)")
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
