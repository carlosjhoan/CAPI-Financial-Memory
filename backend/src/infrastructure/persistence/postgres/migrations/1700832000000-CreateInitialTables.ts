import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from "typeorm";

export class CreateInitialTables1700832000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "debts",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "initialAmount",
            type: "decimal",
            precision: 10,
            scale: 2,
          },
          {
            name: "lender",
            type: "varchar",
            length: "255",
          },
          {
            name: "months",
            type: "integer",
          },
          {
            name: "installAmount",
            type: "decimal",
            precision: 10,
            scale: 2,
          },
          {
            name: "payments",
            type: "integer",
            default: 0,
          },
          {
            name: "finalAmount",
            type: "decimal",
            precision: 10,
            scale: 2,
          },
          {
            name: "paidAmount",
            type: "decimal",
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: "remainingAmount",
            type: "decimal",
            precision: 10,
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
          {
            name: "updatedAt",
            type: "timestamp",
            default: "now()",
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: "expenses",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "amount",
            type: "decimal",
            precision: 10,
            scale: 2,
          },
          {
            name: "reason",
            type: "varchar",
            length: "255",
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

    await queryRunner.createTable(
      new Table({
        name: "incomes",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "amount",
            type: "decimal",
            precision: 10,
            scale: 2,
          },
          {
            name: "reason",
            type: "varchar",
            length: "255",
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

    await queryRunner.createTable(
      new Table({
        name: "loans",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "initialAmount",
            type: "decimal",
            precision: 10,
            scale: 2,
          },
          {
            name: "interestRate",
            type: "decimal",
            precision: 5,
            scale: 2,
          },
          {
            name: "installment",
            type: "decimal",
            precision: 10,
            scale: 2,
          },
          {
            name: "paidAmount",
            type: "decimal",
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: "remainingAmount",
            type: "decimal",
            precision: 10,
            scale: 2,
          },
          {
            name: "debtor",
            type: "varchar",
            length: "255",
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
    await queryRunner.dropTable("loans");
    await queryRunner.dropTable("incomes");
    await queryRunner.dropTable("expenses");
    await queryRunner.dropTable("debts");
  }
}
