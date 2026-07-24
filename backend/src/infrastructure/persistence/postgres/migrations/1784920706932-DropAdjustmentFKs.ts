import { MigrationInterface, QueryRunner } from "typeorm";

export class DropAdjustmentFKs1784920706932 implements MigrationInterface {
    name = 'DropAdjustmentFKs1784920706932'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "incomes" DROP CONSTRAINT "FK_9f8446f60ed95dd6b1c83bab544"`);
        await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT "FK_85cf38370165d8086b50e0ccebb"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expenses" ADD CONSTRAINT "FK_85cf38370165d8086b50e0ccebb" FOREIGN KEY ("adjustedRecordId") REFERENCES "expenses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incomes" ADD CONSTRAINT "FK_9f8446f60ed95dd6b1c83bab544" FOREIGN KEY ("adjustedRecordId") REFERENCES "incomes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
}
