import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRefreshTokensTable1779568178855 implements MigrationInterface {
    name = 'AddRefreshTokensTable1779568178855'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "tokenHash" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_610102b60fea1455310ccd299d" ON "refresh_tokens" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_c25bc63d248ca90e8dcc1d92d0" ON "refresh_tokens" ("tokenHash") `);
        await queryRunner.query(`CREATE TABLE "income_allocations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "incomeId" uuid NOT NULL, "pocketId" uuid NOT NULL, "amount" numeric(10,2) NOT NULL, CONSTRAINT "PK_3791cb864c22521743b9f33fd84" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "login_attempts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "ip" character varying, "success" boolean NOT NULL, "timestamp" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_070e613c8f768b1a70742705c5b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0aedff58b23995504f9dc99f75" ON "login_attempts" ("email") `);
        await queryRunner.query(`ALTER TABLE "incomes" ALTER COLUMN "userId" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "pockets" ALTER COLUMN "userId" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "loans" ALTER COLUMN "userId" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "expenses" ALTER COLUMN "userId" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "debts" ALTER COLUMN "userId" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "income_allocations" ADD CONSTRAINT "FK_286fadb7736cf8f7dee3e9cde9b" FOREIGN KEY ("incomeId") REFERENCES "incomes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "income_allocations" ADD CONSTRAINT "FK_5aa6c76478682446d0e54115558" FOREIGN KEY ("pocketId") REFERENCES "pockets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "income_allocations" DROP CONSTRAINT "FK_5aa6c76478682446d0e54115558"`);
        await queryRunner.query(`ALTER TABLE "income_allocations" DROP CONSTRAINT "FK_286fadb7736cf8f7dee3e9cde9b"`);
        await queryRunner.query(`ALTER TABLE "debts" ALTER COLUMN "userId" SET DEFAULT '00000000-0000-0000-0000-000000000000'`);
        await queryRunner.query(`ALTER TABLE "expenses" ALTER COLUMN "userId" SET DEFAULT '00000000-0000-0000-0000-000000000000'`);
        await queryRunner.query(`ALTER TABLE "loans" ALTER COLUMN "userId" SET DEFAULT '00000000-0000-0000-0000-000000000000'`);
        await queryRunner.query(`ALTER TABLE "pockets" ALTER COLUMN "userId" SET DEFAULT '00000000-0000-0000-0000-000000000000'`);
        await queryRunner.query(`ALTER TABLE "incomes" ALTER COLUMN "userId" SET DEFAULT '00000000-0000-0000-0000-000000000000'`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0aedff58b23995504f9dc99f75"`);
        await queryRunner.query(`DROP TABLE "login_attempts"`);
        await queryRunner.query(`DROP TABLE "income_allocations"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c25bc63d248ca90e8dcc1d92d0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_610102b60fea1455310ccd299d"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    }

}
