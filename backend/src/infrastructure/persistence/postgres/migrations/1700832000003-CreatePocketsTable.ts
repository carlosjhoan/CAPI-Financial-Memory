import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreatePocketsTable1700832000003 implements MigrationInterface {
  name = "CreatePocketsTable1700832000003";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "pockets",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "name",
            type: "varchar",
            length: "255",
          },
          {
            name: "goal",
            type: "decimal",
            precision: 12,
            scale: 2,
          },
          {
            name: "accumulatedAmount",
            type: "decimal",
            precision: 12,
            scale: 2,
          },
          {
            name: "motivation",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "type",
            type: "varchar",
            length: "10",
            default: "'goal'",
          },
          {
            name: "initialAmount",
            type: "decimal",
            precision: 12,
            scale: 2,
            default: 0,
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
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("pockets");
  }
}
