import { MigrationInterface, QueryRunner } from "typeorm";

export class NullifyPocketRefs1782939216480 implements MigrationInterface {
    name = 'NullifyPocketRefs1782939216480'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pockets" DROP COLUMN "initialAmount"`);
        await queryRunner.query(`ALTER TABLE "pocket_transfers" DROP CONSTRAINT "FK_1acecd47f9c60d60b7fd755d281"`);
        await queryRunner.query(`ALTER TABLE "pocket_transfers" DROP CONSTRAINT "FK_a73926fc6ae7463b4615c27b65d"`);
        await queryRunner.query(`ALTER TABLE "pocket_transfers" ALTER COLUMN "sourcePocketId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "pocket_transfers" ALTER COLUMN "targetPocketId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "income_allocations" DROP CONSTRAINT "FK_5aa6c76478682446d0e54115558"`);
        await queryRunner.query(`ALTER TABLE "income_allocations" ALTER COLUMN "pocketId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "pocket_transfers" ADD CONSTRAINT "FK_1acecd47f9c60d60b7fd755d281" FOREIGN KEY ("sourcePocketId") REFERENCES "pockets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pocket_transfers" ADD CONSTRAINT "FK_a73926fc6ae7463b4615c27b65d" FOREIGN KEY ("targetPocketId") REFERENCES "pockets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "income_allocations" ADD CONSTRAINT "FK_5aa6c76478682446d0e54115558" FOREIGN KEY ("pocketId") REFERENCES "pockets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "income_allocations" DROP CONSTRAINT "FK_5aa6c76478682446d0e54115558"`);
        await queryRunner.query(`ALTER TABLE "pocket_transfers" DROP CONSTRAINT "FK_a73926fc6ae7463b4615c27b65d"`);
        await queryRunner.query(`ALTER TABLE "pocket_transfers" DROP CONSTRAINT "FK_1acecd47f9c60d60b7fd755d281"`);
        await queryRunner.query(`ALTER TABLE "income_allocations" ALTER COLUMN "pocketId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "income_allocations" ADD CONSTRAINT "FK_5aa6c76478682446d0e54115558" FOREIGN KEY ("pocketId") REFERENCES "pockets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pocket_transfers" ALTER COLUMN "targetPocketId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "pocket_transfers" ALTER COLUMN "sourcePocketId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "pocket_transfers" ADD CONSTRAINT "FK_a73926fc6ae7463b4615c27b65d" FOREIGN KEY ("targetPocketId") REFERENCES "pockets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pocket_transfers" ADD CONSTRAINT "FK_1acecd47f9c60d60b7fd755d281" FOREIGN KEY ("sourcePocketId") REFERENCES "pockets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pockets" ADD "initialAmount" numeric(12,2) NOT NULL DEFAULT '0'`);
    }

}
