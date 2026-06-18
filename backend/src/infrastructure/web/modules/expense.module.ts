import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { ExpenseController } from "../controllers/expense.controller";
import { ExpenseService } from "../../../domain/services/expense.service";
import { TypeOrmExpenseRepository } from "../../persistence/postgres/repository/typeorm-expense.repository";
import { ExpenseEntity } from "../../persistence/postgres/entities/expense.entity";
import { CreateExpenseUseCase } from "../../../application/expense/create-expense.use-case";
import { RegisterExpensePaymentUseCase } from "../../../application/expense/register-expense-payment.use-case";
import { GetAllExpensesPaginatedUseCase } from "../../../application/expense/get-all-expenses-paginated.use-case";
import { GetExpensesByDateRangePaginatedUseCase } from "../../../application/expense/get-expenses-by-date-range-paginated.use-case";
import { GetExpenseByIdUseCase } from "../../../application/expense/get-expense-by-id.use-case";
import { UpdateExpenseUseCase } from "../../../application/expense/update-expense.use-case";
import { DeleteExpenseUseCase } from "../../../application/expense/delete-expense.use-case";
import { GetExpensesSummaryUseCase } from "../../../application/expense/get-expenses-summary.use-case";
import { GetMonthlySummaryUseCase } from "../../../application/expense/get-monthly-summary.use-case";
import { GetYearlySummaryUseCase } from "../../../application/expense/get-yearly-summary.use-case";
import { PocketRepository } from "../../../domain/repositories/pocket.repository";
import { PocketModule } from "./pocket.module";

@Module({
  imports: [TypeOrmModule.forFeature([ExpenseEntity]), PocketModule],
  controllers: [ExpenseController],
  providers: [
    {
      provide: "ExpenseRepository",
      useClass: TypeOrmExpenseRepository,
    },
    {
      provide: CreateExpenseUseCase,
      useFactory: (
        expenseRepository: TypeOrmExpenseRepository,
        dataSource: DataSource,
        pocketRepository: PocketRepository,
      ) => {
        return new CreateExpenseUseCase(
          expenseRepository,
          dataSource,
          pocketRepository,
        );
      },
      inject: ["ExpenseRepository", DataSource, "PocketRepository"],
    },
    {
      provide: RegisterExpensePaymentUseCase,
      useFactory: (expenseRepository: TypeOrmExpenseRepository) => {
        return new RegisterExpensePaymentUseCase(expenseRepository);
      },
      inject: ["ExpenseRepository"],
    },
    {
      provide: GetAllExpensesPaginatedUseCase,
      useFactory: (expenseService: ExpenseService) => {
        return new GetAllExpensesPaginatedUseCase(expenseService);
      },
      inject: [ExpenseService],
    },
    {
      provide: GetExpensesByDateRangePaginatedUseCase,
      useFactory: (expenseService: ExpenseService) => {
        return new GetExpensesByDateRangePaginatedUseCase(expenseService);
      },
      inject: [ExpenseService],
    },
    {
      provide: GetExpenseByIdUseCase,
      useFactory: (expenseService: ExpenseService) => {
        return new GetExpenseByIdUseCase(expenseService);
      },
      inject: [ExpenseService],
    },
    {
      provide: UpdateExpenseUseCase,
      useFactory: (expenseService: ExpenseService) => {
        return new UpdateExpenseUseCase(expenseService);
      },
      inject: [ExpenseService],
    },
    {
      provide: DeleteExpenseUseCase,
      useFactory: (expenseService: ExpenseService) => {
        return new DeleteExpenseUseCase(expenseService);
      },
      inject: [ExpenseService],
    },
    {
      provide: GetExpensesSummaryUseCase,
      useFactory: (expenseService: ExpenseService) => {
        return new GetExpensesSummaryUseCase(expenseService);
      },
      inject: [ExpenseService],
    },
    {
      provide: GetMonthlySummaryUseCase,
      useFactory: (expenseService: ExpenseService) => {
        return new GetMonthlySummaryUseCase(expenseService);
      },
      inject: [ExpenseService],
    },
    {
      provide: GetYearlySummaryUseCase,
      useFactory: (expenseService: ExpenseService) => {
        return new GetYearlySummaryUseCase(expenseService);
      },
      inject: [ExpenseService],
    },
    {
      provide: ExpenseService,
      useFactory: (
        expenseRepository: TypeOrmExpenseRepository,
        createExpenseUseCase: CreateExpenseUseCase,
        registerExpensePaymentUseCase: RegisterExpensePaymentUseCase,
      ) => {
        return new ExpenseService(
          expenseRepository,
          createExpenseUseCase,
          registerExpensePaymentUseCase,
        );
      },
      inject: [
        "ExpenseRepository",
        CreateExpenseUseCase,
        RegisterExpensePaymentUseCase,
      ],
    },
  ],
})
export class ExpenseModule {}
