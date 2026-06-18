import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateUsersTable1700000000000 implements MigrationInterface {
  name = "CreateUsersTable1700000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type idempotently (dev DBs already have it from synchronize)
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."users_provider_enum" AS ENUM('local', 'google');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.createTable(
      new Table({
        name: "users",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "email",
            type: "varchar",
            isUnique: true,
          },
          {
            name: "password",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "name",
            type: "varchar",
          },
          {
            name: "provider",
            type: "users_provider_enum",
            default: "'local'",
          },
          {
            name: "googleId",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "isActive",
            type: "boolean",
            default: true,
          },
          {
            name: "createdAt",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "updatedAt",
            type: "timestamp",
            default: "now()",
          },
        ],
      }),
      true, // ifNotExist — safe for dev DBs that already have the table
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("users");
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."users_provider_enum"`,
    );
  }
}
