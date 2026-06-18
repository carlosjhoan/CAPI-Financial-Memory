import { MigrationInterface, QueryRunner, Table, TableColumn } from "typeorm";

export class AddPocketTypeAndDeposits1700832000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add type column to pockets table if it exists
    const pocketsTable = await queryRunner.getTable("pockets");
    if (pocketsTable) {
      const typeColumn = pocketsTable.findColumnByName("type");
      if (!typeColumn) {
        await queryRunner.addColumn(
          "pockets",
          new TableColumn({
            name: "type",
            type: "varchar",
            length: "10",
            default: "'goal'",
          }),
        );
      }
    }

    // Create deposits table
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
          {
            name: "pocketId",
            type: "uuid",
          },
          {
            name: "amount",
            type: "decimal",
            precision: 12,
            scale: 2,
          },
          {
            name: "date",
            type: "date",
          },
          {
            name: "createdAt",
            type: "timestamp",
            default: "now()",
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("deposits");

    const pocketsTable = await queryRunner.getTable("pockets");
    if (pocketsTable) {
      const typeColumn = pocketsTable.findColumnByName("type");
      if (typeColumn) {
        await queryRunner.dropColumn("pockets", "type");
      }
    }
  }
}
