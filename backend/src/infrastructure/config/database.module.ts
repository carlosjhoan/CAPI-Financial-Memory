import { Global, Module } from "@nestjs/common";
import { TypeOrmModule, getDataSourceToken } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      username: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "secret",
      database: process.env.DB_NAME || "pfm_db",
      autoLoadEntities: true,
      // synchronize is intentionally omitted — rely solely on migrations
      logging: process.env.NODE_ENV === "development",
      timezone: "Z",
    } as any),
  ],
  providers: [
    {
      provide: DataSource,
      useExisting: getDataSourceToken(),
    },
  ],
  exports: [DataSource],
})
export class DatabaseModule {}
