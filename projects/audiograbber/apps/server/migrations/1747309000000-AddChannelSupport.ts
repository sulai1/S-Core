import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChannelSupport1747309000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create channels table
        await queryRunner.query(`
            CREATE TABLE "channels" (
                "id" varchar PRIMARY KEY,
                "description" text,
                "joinedDate" timestamptz,
                "createdAt" timestamptz NOT NULL DEFAULT now(),
                "updatedAt" timestamptz NOT NULL DEFAULT now()
            )
        `);

        // Add channelId column to videos table
        await queryRunner.query(`
            ALTER TABLE "videos" ADD COLUMN "channelId" varchar REFERENCES "channels"("id") ON DELETE SET NULL
        `);

        await queryRunner.query(`CREATE INDEX "IDX_videos_channelId" ON "videos"("channelId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_videos_channelId"`);
        await queryRunner.query(`ALTER TABLE "videos" DROP COLUMN IF EXISTS "channelId"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "channels"`);
    }
}
