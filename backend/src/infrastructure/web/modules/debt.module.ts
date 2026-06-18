import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DebtController } from "../controllers/debt.controller";
import { DebtService } from "../../../domain/services/debt.service";
import { TypeOrmDebtRepository } from "../../persistence/postgres/repository/typeorm-debt.repository";
import { DebtEntity } from "../../persistence/postgres/entities/debt.entity";
import { CreateDebtUseCase } from "../../../application/debt/create-debt.use-case";
import { RegisterPaymentUseCase } from "../../../application/debt/register-payment.use-case";
import { GetAllDebtsUseCase } from "../../../application/debt/get-all-debts.use-case";
import { GetAllDebtsPaginatedUseCase } from "../../../application/debt/get-all-debts-paginated.use-case";
import { GetDebtByIdUseCase } from "../../../application/debt/get-debt-by-id.use-case";
import { UpdateDebtUseCase } from "../../../application/debt/update-debt.use-case";
import { DeleteDebtUseCase } from "../../../application/debt/delete-debt.use-case";
import { GetDebtsSummaryUseCase } from "../../../application/debt/get-debts-summary.use-case";
import { GetMonthlySummaryUseCase } from "../../../application/debt/get-monthly-summary.use-case";
import { GetYearlySummaryUseCase } from "../../../application/debt/get-yearly-summary.use-case";

@Module({
  imports: [TypeOrmModule.forFeature([DebtEntity])],
  controllers: [DebtController],
  providers: [
    {
      provide: "DebtRepository",
      useClass: TypeOrmDebtRepository,
    },
    {
      provide: CreateDebtUseCase,
      useFactory: (debtRepository: TypeOrmDebtRepository) => {
        return new CreateDebtUseCase(debtRepository);
      },
      inject: ["DebtRepository"],
    },
    {
      provide: RegisterPaymentUseCase,
      useFactory: (debtRepository: TypeOrmDebtRepository) => {
        return new RegisterPaymentUseCase(debtRepository);
      },
      inject: ["DebtRepository"],
    },
    {
      provide: GetAllDebtsUseCase,
      useFactory: (debtService: DebtService) => {
        return new GetAllDebtsUseCase(debtService);
      },
      inject: [DebtService],
    },
    {
      provide: GetAllDebtsPaginatedUseCase,
      useFactory: (debtService: DebtService) => {
        return new GetAllDebtsPaginatedUseCase(debtService);
      },
      inject: [DebtService],
    },
    {
      provide: GetDebtByIdUseCase,
      useFactory: (debtService: DebtService) => {
        return new GetDebtByIdUseCase(debtService);
      },
      inject: [DebtService],
    },
    {
      provide: UpdateDebtUseCase,
      useFactory: (debtService: DebtService) => {
        return new UpdateDebtUseCase(debtService);
      },
      inject: [DebtService],
    },
    {
      provide: DeleteDebtUseCase,
      useFactory: (debtService: DebtService) => {
        return new DeleteDebtUseCase(debtService);
      },
      inject: [DebtService],
    },
    {
      provide: GetDebtsSummaryUseCase,
      useFactory: (debtService: DebtService) => {
        return new GetDebtsSummaryUseCase(debtService);
      },
      inject: [DebtService],
    },
    {
      provide: GetMonthlySummaryUseCase,
      useFactory: (debtService: DebtService) => {
        return new GetMonthlySummaryUseCase(debtService);
      },
      inject: [DebtService],
    },
    {
      provide: GetYearlySummaryUseCase,
      useFactory: (debtService: DebtService) => {
        return new GetYearlySummaryUseCase(debtService);
      },
      inject: [DebtService],
    },
    {
      provide: DebtService,
      useFactory: (
        debtRepository: TypeOrmDebtRepository,
        createDebtUseCase: CreateDebtUseCase,
        registerPaymentUseCase: RegisterPaymentUseCase,
      ) => {
        return new DebtService(
          debtRepository,
          createDebtUseCase,
          registerPaymentUseCase,
        );
      },
      inject: ["DebtRepository", CreateDebtUseCase, RegisterPaymentUseCase],
    },
    DebtController,
  ],
})
export class DebtModule {}
