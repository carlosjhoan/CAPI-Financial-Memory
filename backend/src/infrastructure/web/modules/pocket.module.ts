import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { PocketController } from "../controllers/pocket.controller";
import { PocketService } from "../../../domain/services/pocket.service";
import { TypeOrmPocketRepository } from "../../persistence/postgres/repository/typeorm-pocket.repository";
import { PocketEntity } from "../../persistence/postgres/entities/pocket.entity";
import { ExpenseAllocationEntity } from "../../persistence/postgres/entities/expense-allocation.entity";
import { IncomeAllocationEntity } from "../../persistence/postgres/entities/income-allocation.entity";
import { IncomeEntity } from "../../persistence/postgres/entities/income.entity";
import { PocketTransferEntity } from "../../persistence/postgres/entities/pocket-transfer.entity";
import { CreatePocketUseCase } from "../../../application/pocket/create-pocket.use-case";
import { GetAllPocketsUseCase } from "../../../application/pocket/get-all-pockets.use-case";
import { GetPocketsSummaryUseCase } from "../../../application/pocket/get-pockets-summary.use-case";
import { UpdatePocketUseCase } from "../../../application/pocket/update-pocket.use-case";
import { DeletePocketUseCase } from "../../../application/pocket/delete-pocket.use-case";
import { TransferBetweenPocketsUseCase } from "../../../application/pocket/transfer-between-pockets.use-case";
import { DeleteWithTransferUseCase } from "../../../application/pocket/delete-with-transfer.use-case";
@Module({
  imports: [
    TypeOrmModule.forFeature([
      PocketEntity,
      ExpenseAllocationEntity,
      PocketTransferEntity,
      IncomeAllocationEntity,
      IncomeEntity,
    ]),
  ],
  controllers: [PocketController],
  exports: ["PocketRepository", PocketService],
  providers: [
    {
      provide: "PocketRepository",
      useClass: TypeOrmPocketRepository,
    },
    {
      provide: CreatePocketUseCase,
      useFactory: (pocketRepository: TypeOrmPocketRepository) => {
        return new CreatePocketUseCase(pocketRepository);
      },
      inject: ["PocketRepository"],
    },
    {
      provide: GetAllPocketsUseCase,
      useFactory: (pocketService: PocketService) => {
        return new GetAllPocketsUseCase(pocketService);
      },
      inject: [PocketService],
    },
    {
      provide: GetPocketsSummaryUseCase,
      useFactory: (pocketService: PocketService) => {
        return new GetPocketsSummaryUseCase(pocketService);
      },
      inject: [PocketService],
    },
    {
      provide: UpdatePocketUseCase,
      useFactory: (pocketService: PocketService) => {
        return new UpdatePocketUseCase(pocketService);
      },
      inject: [PocketService],
    },
    {
      provide: DeletePocketUseCase,
      useFactory: (pocketService: PocketService) => {
        return new DeletePocketUseCase(pocketService);
      },
      inject: [PocketService],
    },
    {
      provide: TransferBetweenPocketsUseCase,
      useFactory: (
        pocketRepository: TypeOrmPocketRepository,
        dataSource: DataSource,
      ) => {
        return new TransferBetweenPocketsUseCase(pocketRepository, dataSource);
      },
      inject: ["PocketRepository", DataSource],
    },
    {
      provide: DeleteWithTransferUseCase,
      useFactory: (
        pocketRepository: TypeOrmPocketRepository,
        dataSource: DataSource,
      ) => {
        return new DeleteWithTransferUseCase(pocketRepository, dataSource);
      },
      inject: ["PocketRepository", DataSource],
    },
    {
      provide: PocketService,
      useFactory: (
        pocketRepository: TypeOrmPocketRepository,
        createPocketUseCase: CreatePocketUseCase,
      ) => {
        return new PocketService(
          pocketRepository,
          createPocketUseCase,
        );
      },
      inject: ["PocketRepository", CreatePocketUseCase],
    },
  ],
})
export class PocketModule {}
