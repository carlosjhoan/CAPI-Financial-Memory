import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { DatabaseModule } from "../../config/database.module";
import { DebtModule } from "./debt.module";
import { ExpenseModule } from "./expense.module";
import { IncomeModule } from "./income.module";
import { LoanModule } from "./loan.module";
import { PocketModule } from "./pocket.module";
import { AuthModule } from "../../../application/auth/auth.module";
import { envValidationSchema } from "../../config/env.validation";
import { GlobalExceptionFilter } from "../filters/global-exception.filter";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    DatabaseModule,
    AuthModule,
    DebtModule,
    ExpenseModule,
    IncomeModule,
    LoanModule,
    PocketModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
