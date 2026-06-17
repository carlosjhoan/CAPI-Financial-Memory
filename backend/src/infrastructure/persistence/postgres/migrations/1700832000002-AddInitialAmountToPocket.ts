import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddInitialAmountToPocket1700832000002
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const pocketsTable = await queryRunner.getTable("pockets");
    if (pocketsTable) {
      const initialAmountColumn = pocketsTable.findColumnByName("initialAmount");
      if (!initialAmountColumn) {
        await queryRunner.addColumn(
          "pockets",
          new TableColumn({
            name: "initialAmount",
            type: "decimal",
            precision: 12,
            scale: 2,
            default: 0,
          }),
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const pocketsTable = await queryRunner.getTable("pockets");
    if (pocketsTable) {
      const initialAmountColumn = pocketsTable.findColumnByName("initialAmount");
      if (initialAmountColumn) {
        await queryRunner.dropColumn("pockets", "initialAmount");
      }
    }
  }
}
