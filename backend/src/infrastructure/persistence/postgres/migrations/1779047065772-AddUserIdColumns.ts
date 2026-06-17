import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddUserIdColumns1779047065772 implements MigrationInterface {
  name = "AddUserIdColumns1779047065772";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add userId column to all entity tables
    // Using uuid type to match the auth user id format
    // Default is a nil UUID for backfilling existing data

    await queryRunner.addColumn(
      "pockets",
      new TableColumn({
        name: "userId",
        type: "uuid",
        isNullable: false,
        default: "'00000000-0000-0000-0000-000000000000'::uuid",
      }),
    );

    await queryRunner.addColumn(
      "debts",
      new TableColumn({
        name: "userId",
        type: "uuid",
        isNullable: false,
        default: "'00000000-0000-0000-0000-000000000000'::uuid",
      }),
    );

    await queryRunner.addColumn(
      "expenses",
      new TableColumn({
        name: "userId",
        type: "uuid",
        isNullable: false,
        default: "'00000000-0000-0000-0000-000000000000'::uuid",
      }),
    );

    await queryRunner.addColumn(
      "incomes",
      new TableColumn({
        name: "userId",
        type: "uuid",
        isNullable: false,
        default: "'00000000-0000-0000-0000-000000000000'::uuid",
      }),
    );

    await queryRunner.addColumn(
      "loans",
      new TableColumn({
        name: "userId",
        type: "uuid",
        isNullable: false,
        default: "'00000000-0000-0000-0000-000000000000'::uuid",
      }),
    );

    // Note: After backfilling real userId values, run:
    // ALTER TABLE "pockets" ALTER COLUMN "userId" DROP DEFAULT;
    // (repeat for all tables)
    // Then add FK constraint:
    // ALTER TABLE "pockets" ADD CONSTRAINT "FK_pockets_userId" FOREIGN KEY ("userId") REFERENCES "users"("id");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("loans", "userId");
    await queryRunner.dropColumn("incomes", "userId");
    await queryRunner.dropColumn("expenses", "userId");
    await queryRunner.dropColumn("debts", "userId");
    await queryRunner.dropColumn("pockets", "userId");
  }
}
