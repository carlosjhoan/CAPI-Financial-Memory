import { MigrationInterface, QueryRunner } from "typeorm";

export class ConvertInitialAmountToIncome1779568178857
  implements MigrationInterface
{
  name = "ConvertInitialAmountToIncome1779568178857";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // For each pocket with initialAmount > 0, create an income record
    // if one doesn't already exist, then zero out initialAmount.
    //
    // We use raw SQL + PL/pgSQL to bypass entity listeners / cascade logic
    // that would double-increment accumulatedAmount (old pockets already
    // include the initial amount in their accumulatedAmount).
    await queryRunner.query(`
      DO $$
      DECLARE
        pocket RECORD;
        income_id UUID;
        existing_count INTEGER;
      BEGIN
        FOR pocket IN SELECT * FROM "pockets" WHERE "initialAmount" > 0
        LOOP
          -- Check if this pocket already has an income with "Monto inicial" reason
          SELECT COUNT(*) INTO existing_count
          FROM "incomes" i
          JOIN "income_allocations" ia ON ia."incomeId" = i."id"
          WHERE ia."pocketId" = pocket."id"
            AND i."reason" LIKE 'Monto inicial de bolsillo %';

          IF existing_count = 0 THEN
            income_id := gen_random_uuid();

            INSERT INTO "incomes" ("id", "amount", "reason", "date", "userId", "createdAt")
            VALUES (
              income_id,
              pocket."initialAmount",
              CONCAT('Monto inicial de bolsillo ', pocket."name"),
              pocket."createdAt"::date,
              pocket."userId",
              NOW()
            );

            INSERT INTO "income_allocations" ("id", "incomeId", "pocketId", "amount")
            VALUES (gen_random_uuid(), income_id, pocket."id", pocket."initialAmount");
          END IF;

          -- Zero out initialAmount (whether we created the income or it already existed)
          UPDATE "pockets" SET "initialAmount" = 0 WHERE "id" = pocket."id";
        END LOOP;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Irreversible — incomes created here are legitimate records.
    // Rolling back would require deleting incomes by reason pattern,
    // which is too destructive for a down migration.
  }
}
