import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePocketTransfersTable1780000000000 implements MigrationInterface {
  name = "CreatePocketTransfersTable1780000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "pocket_transfers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "sourcePocketId" uuid NOT NULL,
                "targetPocketId" uuid NOT NULL,
                "amount" numeric(10,2) NOT NULL,
                "reason" character varying NOT NULL,
                "date" date NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_6fc0cd95219041035ec685a5a07" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_1acecd47f9c60d60b7fd755d281'
                ) THEN
                    ALTER TABLE "pocket_transfers" ADD CONSTRAINT "FK_1acecd47f9c60d60b7fd755d281"
                        FOREIGN KEY ("sourcePocketId") REFERENCES "pockets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_a73926fc6ae7463b4615c27b65d'
                ) THEN
                    ALTER TABLE "pocket_transfers" ADD CONSTRAINT "FK_a73926fc6ae7463b4615c27b65d"
                        FOREIGN KEY ("targetPocketId") REFERENCES "pockets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
                END IF;
            END $$;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "pocket_transfers"`);
  }
}
