import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Income } from "../../../../domain/entities/income.entity";
import { IncomeRepository } from "../../../../domain/repositories/income.repository";
import { IncomeEntity } from "../entities/income.entity";

@Injectable()
export class TypeOrmIncomeRepository implements IncomeRepository {
  constructor(
    @InjectRepository(IncomeEntity)
    private readonly incomeRepository: Repository<IncomeEntity>,
  ) {}

  private toDomain(entity: IncomeEntity, adjustments: IncomeEntity[] = []): Income {
    const income = new Income(
      Number(entity.amount),
      entity.reason,
      entity.date,
      entity.id,
    );

    income.createdAt = entity.createdAt;
    income.isAdjustment = entity.isAdjustment;
    income.adjustedRecordId = entity.adjustedRecordId;

    if (entity.allocations) {
      income.allocations = entity.allocations.map((alloc) => ({
        pocketId: alloc.pocketId,
        pocketName: alloc.pocket?.name ?? "Bolsillo eliminado",
        amount: Number(alloc.amount),
      }));
    }

    income.adjustments = adjustments.map((adj) => {
      const adjIncome = new Income(
        Number(adj.amount),
        adj.reason,
        adj.date,
        adj.id,
      );
      adjIncome.isAdjustment = true;
      adjIncome.adjustedRecordId = adj.adjustedRecordId;
      adjIncome.createdAt = adj.createdAt;
      return adjIncome;
    });

    const adjustmentsSum = income.adjustments.reduce(
      (sum, adj) => sum + adj.amount,
      0,
    );
    income.netAmount = Number(entity.amount) + adjustmentsSum;

    return income;
  }

  private async loadAdjustmentsMap(ids: string[]): Promise<Map<string, IncomeEntity[]>> {
    if (ids.length === 0) return new Map();
    const adjustments = await this.incomeRepository.find({
      where: { adjustedRecordId: In(ids) },
    });
    const map = new Map<string, IncomeEntity[]>();
    for (const adj of adjustments) {
      const key = adj.adjustedRecordId!;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(adj);
    }
    return map;
  }

  private toEntity(domain: Income): IncomeEntity {
    const entity = new IncomeEntity();
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
    const entity = await this.incomeRepository.findOne({
      where,
      relations: ["allocations", "allocations.pocket"],
    });
    if (!entity) return null;
    const adjustments = await this.incomeRepository.find({
      where: { adjustedRecordId: id },
    });
    return this.toDomain(entity, adjustments);
  }

  async findAll(userId: string): Promise<Income[]> {
    const entities = await this.incomeRepository.find({
      where: { userId, isAdjustment: false },
      order: { date: "DESC", createdAt: "DESC" },
      relations: ["allocations", "allocations.pocket"],
    });
    const ids = entities.map((e) => e.id);
    const adjMap = await this.loadAdjustmentsMap(ids);
    return entities.map((entity) => this.toDomain(entity, adjMap.get(entity.id) || []));
  }

  async findAllPaginated(
    skip: number,
    limit: number,
    userId?: string,
  ): Promise<{ data: Income[]; total: number }> {
    const where: any = { isAdjustment: false };
    if (userId) where.userId = userId;
    const [entities, total] = await this.incomeRepository.findAndCount({
      where,
      order: { date: "DESC", createdAt: "DESC" },
      skip,
      take: limit,
      relations: ["allocations", "allocations.pocket"],
    });

    const ids = entities.map((e) => e.id);
    const adjMap = await this.loadAdjustmentsMap(ids);

    return {
      data: entities.map((entity) => this.toDomain(entity, adjMap.get(entity.id) || [])),
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

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    userId?: string,
  ): Promise<Income[]> {
    const query = this.incomeRepository
      .createQueryBuilder("income")
      .leftJoinAndSelect("income.allocations", "allocations")
      .leftJoinAndSelect("allocations.pocket", "pocket")
      .where("income.isAdjustment = :isAdj", { isAdj: false })
      .andWhere("income.date >= :startDate", { startDate })
      .andWhere("income.date <= :endDate", { endDate })
      .orderBy("income.date", "DESC")
      .addOrderBy("income.createdAt", "DESC");
    if (userId) {
      query.andWhere("income.userId = :userId", { userId });
    }
    const entities = await query.getMany();
    const ids = entities.map((e) => e.id);
    const adjMap = await this.loadAdjustmentsMap(ids);
    return entities.map((entity) => this.toDomain(entity, adjMap.get(entity.id) || []));
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
      .leftJoinAndSelect("income.allocations", "allocations")
      .leftJoinAndSelect("allocations.pocket", "pocket")
      .where("income.isAdjustment = :isAdj", { isAdj: false })
      .andWhere("income.date >= :startDate", { startDate })
      .andWhere("income.date <= :endDate", { endDate })
      .orderBy("income.date", "DESC")
      .addOrderBy("income.createdAt", "DESC");
    if (userId) {
      queryBuilder.andWhere("income.userId = :userId", { userId });
    }

    const [entities, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const ids = entities.map((e) => e.id);
    const adjMap = await this.loadAdjustmentsMap(ids);

    return {
      data: entities.map((entity) => this.toDomain(entity, adjMap.get(entity.id) || [])),
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
      .addOrderBy("income.createdAt", "DESC")
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
    const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

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

  async getYearlySummary(
    year: number,
    userId?: string,
  ): Promise<{
    totalAmount: number;
    count: number;
    monthlyBreakdown: Record<string, number>;
  }> {
    const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

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
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    monthNames.forEach((month) => {
      monthlyBreakdown[month] = 0;
    });

    monthlyResults.forEach((result) => {
      const monthIndex = parseInt(result.month) - 1;
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
