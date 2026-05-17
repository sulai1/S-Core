import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSyncRunMetadataToJobs1747400000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "channelId" varchar`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "scheduleId" uuid`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "videosDownloaded" int`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_jobs_scheduleId_createdAt" ON "jobs" ("scheduleId", "createdAt" DESC)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_jobs_scheduleId_createdAt"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN IF EXISTS "videosDownloaded"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN IF EXISTS "scheduleId"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN IF EXISTS "channelId"`);
    }
}
