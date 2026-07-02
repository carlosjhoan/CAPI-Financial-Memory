import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPocketNamesToTransfer1783000000000 implements MigrationInterface {
    name = 'AddPocketNamesToTransfer1783000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pocket_transfers" ADD "sourcePocketName" character varying`);
        await queryRunner.query(`ALTER TABLE "pocket_transfers" ADD "targetPocketName" character varying`);
        await queryRunner.query(`UPDATE "pocket_transfers" SET "sourcePocketName" = (SELECT name FROM pockets WHERE id = "sourcePocketId") WHERE "sourcePocketId" IS NOT NULL`);
        await queryRunner.query(`UPDATE "pocket_transfers" SET "targetPocketName" = (SELECT name FROM pockets WHERE id = "targetPocketId") WHERE "targetPocketId" IS NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pocket_transfers" DROP COLUMN "targetPocketName"`);
        await queryRunner.query(`ALTER TABLE "pocket_transfers" DROP COLUMN "sourcePocketName"`);
    }
}
