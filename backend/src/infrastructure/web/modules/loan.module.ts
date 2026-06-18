import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LoanController } from "../controllers/loan.controller";
import { LoanService } from "../../../domain/services/loan.service";
import { TypeOrmLoanRepository } from "../../persistence/postgres/repository/typeorm-loan.repository";
import { LoanEntity } from "../../persistence/postgres/entities/loan.entity";
import { CreateLoanUseCase } from "../../../application/loan/create-loan.use-case";
import { RegisterLoanPaymentUseCase } from "../../../application/loan/register-loan-payment.use-case";
import { GetAllLoansUseCase } from "../../../application/loan/get-all-loans.use-case";
import { GetAllLoansPaginatedUseCase } from "../../../application/loan/get-all-loans-paginated.use-case";
import { GetLoanByIdUseCase } from "../../../application/loan/get-loan-by-id.use-case";
import { UpdateLoanUseCase } from "../../../application/loan/update-loan.use-case";
import { DeleteLoanUseCase } from "../../../application/loan/delete-loan.use-case";
import { GetLoansSummaryUseCase } from "../../../application/loan/get-loans-summary.use-case";
import { GetMonthlySummaryUseCase } from "../../../application/loan/get-monthly-summary.use-case";
import { GetYearlySummaryUseCase } from "../../../application/loan/get-yearly-summary.use-case";
import { GetOverdueLoansUseCase } from "../../../application/loan/get-overdue-loans.use-case";
import { GetLoanPerformanceUseCase } from "../../../application/loan/get-loan-performance.use-case";

@Module({
  imports: [TypeOrmModule.forFeature([LoanEntity])],
  controllers: [LoanController],
  providers: [
    {
      provide: "LoanRepository",
      useClass: TypeOrmLoanRepository,
    },
    {
      provide: CreateLoanUseCase,
      useFactory: (loanRepository: TypeOrmLoanRepository) => {
        return new CreateLoanUseCase(loanRepository);
      },
      inject: ["LoanRepository"],
    },
    {
      provide: RegisterLoanPaymentUseCase,
      useFactory: (loanRepository: TypeOrmLoanRepository) => {
        return new RegisterLoanPaymentUseCase(loanRepository);
      },
      inject: ["LoanRepository"],
    },
    {
      provide: GetAllLoansUseCase,
      useFactory: (loanService: LoanService) => {
        return new GetAllLoansUseCase(loanService);
      },
      inject: [LoanService],
    },
    {
      provide: GetAllLoansPaginatedUseCase,
      useFactory: (loanService: LoanService) => {
        return new GetAllLoansPaginatedUseCase(loanService);
      },
      inject: [LoanService],
    },
    {
      provide: GetLoanByIdUseCase,
      useFactory: (loanService: LoanService) => {
        return new GetLoanByIdUseCase(loanService);
      },
      inject: [LoanService],
    },
    {
      provide: UpdateLoanUseCase,
      useFactory: (loanService: LoanService) => {
        return new UpdateLoanUseCase(loanService);
      },
      inject: [LoanService],
    },
    {
      provide: DeleteLoanUseCase,
      useFactory: (loanService: LoanService) => {
        return new DeleteLoanUseCase(loanService);
      },
      inject: [LoanService],
    },
    {
      provide: GetLoansSummaryUseCase,
      useFactory: (loanService: LoanService) => {
        return new GetLoansSummaryUseCase(loanService);
      },
      inject: [LoanService],
    },
    {
      provide: GetMonthlySummaryUseCase,
      useFactory: (loanService: LoanService) => {
        return new GetMonthlySummaryUseCase(loanService);
      },
      inject: [LoanService],
    },
    {
      provide: GetYearlySummaryUseCase,
      useFactory: (loanService: LoanService) => {
        return new GetYearlySummaryUseCase(loanService);
      },
      inject: [LoanService],
    },
    {
      provide: GetOverdueLoansUseCase,
      useFactory: (loanService: LoanService) => {
        return new GetOverdueLoansUseCase(loanService);
      },
      inject: [LoanService],
    },
    {
      provide: GetLoanPerformanceUseCase,
      useFactory: (loanService: LoanService) => {
        return new GetLoanPerformanceUseCase(loanService);
      },
      inject: [LoanService],
    },
    {
      provide: LoanService,
      useFactory: (
        loanRepository: TypeOrmLoanRepository,
        createLoanUseCase: CreateLoanUseCase,
        registerLoanPaymentUseCase: RegisterLoanPaymentUseCase,
      ) => {
        return new LoanService(
          loanRepository,
          createLoanUseCase,
          registerLoanPaymentUseCase,
        );
      },
      inject: ["LoanRepository", CreateLoanUseCase, RegisterLoanPaymentUseCase],
    },
  ],
})
export class LoanModule {}
