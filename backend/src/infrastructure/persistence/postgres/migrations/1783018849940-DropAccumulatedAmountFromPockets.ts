import { MigrationInterface, QueryRunner } from "typeorm";

export class DropAccumulatedAmountFromPockets1783018849940 implements MigrationInterface {
    name = 'DropAccumulatedAmountFromPockets1783018849940'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pockets" DROP COLUMN "accumulatedAmount"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pockets" ADD "accumulatedAmount" numeric(12,2) NOT NULL DEFAULT '0'`);
    }

}
