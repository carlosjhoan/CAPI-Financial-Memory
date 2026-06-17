import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddDepositReason1779047065771 implements MigrationInterface {
    name = 'AddDepositReason1779047065771'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const depositsTable = await queryRunner.getTable("deposits");
        if (depositsTable) {
            const reasonColumn = depositsTable.findColumnByName("reason");
            if (!reasonColumn) {
                await queryRunner.addColumn(
                    "deposits",
                    new TableColumn({
                        name: "reason",
                        type: "varchar",
                        length: "200",
                        isNullable: true,
                    }),
                );
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const depositsTable = await queryRunner.getTable("deposits");
        if (depositsTable) {
            const reasonColumn = depositsTable.findColumnByName("reason");
            if (reasonColumn) {
                await queryRunner.dropColumn("deposits", "reason");
            }
        }
    }

}
