import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class RemoveDepositsTable1779568178856 implements MigrationInterface {
  name = "RemoveDepositsTable1779568178856";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("deposits");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "deposits",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          { name: "pocketId", type: "uuid" },
          { name: "amount", type: "decimal", precision: 12, scale: 2 },
          { name: "date", type: "date" },
          { name: "reason", type: "varchar", length: "200", isNullable: true },
          { name: "createdAt", type: "timestamp", default: "now()" },
        ],
      }),
      true,
    );
  }
}
