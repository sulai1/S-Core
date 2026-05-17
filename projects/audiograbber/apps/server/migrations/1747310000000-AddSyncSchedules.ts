import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSyncSchedules1747310000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "sync_schedules" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "channelId" varchar NOT NULL,
                "interval" varchar NOT NULL,
                "maxResults" int,
                "maxDurationSeconds" int,
                "enabled" boolean NOT NULL DEFAULT true,
                "lastRunAt" timestamptz,
                "nextRunAt" timestamptz NOT NULL,
                "createdAt" timestamptz NOT NULL DEFAULT now(),
                "updatedAt" timestamptz NOT NULL DEFAULT now()
            )
        `);

        await queryRunner.query(`CREATE INDEX "IDX_sync_schedules_channelId" ON "sync_schedules"("channelId")`);
        await queryRunner.query(`CREATE INDEX "IDX_sync_schedules_enabled_nextRunAt" ON "sync_schedules"("enabled", "nextRunAt")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sync_schedules_enabled_nextRunAt"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sync_schedules_channelId"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "sync_schedules"`);
    }
}