import { DataSource } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "secret",
  database: process.env.DB_NAME || "pfm_db",
  synchronize: false,
  logging: process.env.NODE_ENV === "development",
  entities: ["src/infrastructure/persistence/postgres/entities/*.entity.ts"],
  migrations: ["src/infrastructure/persistence/postgres/migrations/*.ts"],
  subscribers: [],
});
