import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { IncomeController } from "../controllers/income.controller";
import { IncomeService } from "../../../domain/services/income.service";
import { TypeOrmIncomeRepository } from "../../persistence/postgres/repository/typeorm-income.repository";
import { IncomeEntity } from "../../persistence/postgres/entities/income.entity";
import { CreateIncomeUseCase } from "../../../application/income/create-income.use-case";
import { RegisterIncomePaymentUseCase } from "../../../application/income/register-income-payment.use-case";
import { GetAllIncomesUseCase } from "../../../application/income/get-all-incomes.use-case";
import { GetAllIncomesPaginatedUseCase } from "../../../application/income/get-all-incomes-paginated.use-case";
import { GetIncomeByIdUseCase } from "../../../application/income/get-income-by-id.use-case";
import { UpdateIncomeUseCase } from "../../../application/income/update-income.use-case";
import { DeleteIncomeUseCase } from "../../../application/income/delete-income.use-case";
import { GetIncomesSummaryUseCase } from "../../../application/income/get-incomes-summary.use-case";
import { GetMonthlySummaryUseCase } from "../../../application/income/get-monthly-summary.use-case";
import { GetYearlySummaryUseCase } from "../../../application/income/get-yearly-summary.use-case";
import { GetIncomesByDateRangePaginatedUseCase } from "../../../application/income/get-incomes-by-date-range-paginated.use-case";
import { GetIncomesByDateRangeUseCase } from "../../../application/income/get-incomes-by-date-range.use-case";

@Module({
  imports: [
    TypeOrmModule.forFeature([IncomeEntity]),
  ],
  controllers: [IncomeController],
  providers: [
    {
      provide: "IncomeRepository",
      useClass: TypeOrmIncomeRepository,
    },
    {
      provide: CreateIncomeUseCase,
      useFactory: (incomeRepository: TypeOrmIncomeRepository, dataSource: DataSource) => {
        return new CreateIncomeUseCase(incomeRepository, dataSource);
      },
      inject: ["IncomeRepository", DataSource],
    },
    {
      provide: RegisterIncomePaymentUseCase,
      useFactory: (incomeRepository: TypeOrmIncomeRepository) => {
        return new RegisterIncomePaymentUseCase(incomeRepository);
      },
      inject: ["IncomeRepository"],
    },
    {
      provide: GetAllIncomesUseCase,
      useFactory: (incomeService: IncomeService) => {
        return new GetAllIncomesUseCase(incomeService);
      },
      inject: [IncomeService],
    },
    {
      provide: GetAllIncomesPaginatedUseCase,
      useFactory: (incomeService: IncomeService) => {
        return new GetAllIncomesPaginatedUseCase(incomeService);
      },
      inject: [IncomeService],
    },
    {
      provide: GetIncomeByIdUseCase,
      useFactory: (incomeService: IncomeService) => {
        return new GetIncomeByIdUseCase(incomeService);
      },
      inject: [IncomeService],
    },
    {
      provide: UpdateIncomeUseCase,
      useFactory: (incomeService: IncomeService) => {
        return new UpdateIncomeUseCase(incomeService);
      },
      inject: [IncomeService],
    },
    {
      provide: DeleteIncomeUseCase,
      useFactory: (incomeService: IncomeService) => {
        return new DeleteIncomeUseCase(incomeService);
      },
      inject: [IncomeService],
    },
    {
      provide: GetIncomesSummaryUseCase,
      useFactory: (incomeService: IncomeService) => {
        return new GetIncomesSummaryUseCase(incomeService);
      },
      inject: [IncomeService],
    },
    {
      provide: GetMonthlySummaryUseCase,
      useFactory: (incomeService: IncomeService) => {
        return new GetMonthlySummaryUseCase(incomeService);
      },
      inject: [IncomeService],
    },
    {
      provide: GetYearlySummaryUseCase,
      useFactory: (incomeService: IncomeService) => {
        return new GetYearlySummaryUseCase(incomeService);
      },
      inject: [IncomeService],
    },
    {
      provide: GetIncomesByDateRangePaginatedUseCase,
      useFactory: (incomeService: IncomeService) => {
        return new GetIncomesByDateRangePaginatedUseCase(incomeService);
      },
      inject: [IncomeService],
    },
    {
      provide: GetIncomesByDateRangeUseCase,
      useFactory: (incomeService: IncomeService) => {
        return new GetIncomesByDateRangeUseCase(incomeService);
      },
      inject: [IncomeService],
    },
    {
      provide: IncomeService,
      useFactory: (
        incomeRepository: TypeOrmIncomeRepository,
        createIncomeUseCase: CreateIncomeUseCase,
        registerIncomePaymentUseCase: RegisterIncomePaymentUseCase,
      ) => {
        return new IncomeService(
          incomeRepository,
          createIncomeUseCase,
          registerIncomePaymentUseCase,
        );
      },
      inject: [
        "IncomeRepository",
        CreateIncomeUseCase,
        RegisterIncomePaymentUseCase,
      ],
    },
    IncomeController,
  ],
})
export class IncomeModule {}