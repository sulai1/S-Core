import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSyncScheduleOwnerAndMinDuration1747311000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sync_schedules" ADD COLUMN IF NOT EXISTS "ownerId" uuid`);
        await queryRunner.query(`ALTER TABLE "sync_schedules" ADD COLUMN IF NOT EXISTS "minDurationSeconds" int`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sync_schedules" DROP COLUMN IF EXISTS "minDurationSeconds"`);
        await queryRunner.query(`ALTER TABLE "sync_schedules" DROP COLUMN IF EXISTS "ownerId"`);
    }
}