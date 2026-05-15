import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorMediaFilesForMultipleVideos1747308000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create videos table
        await queryRunner.query(`
            CREATE TABLE "videos" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "mediaFileId" uuid NOT NULL REFERENCES "media_files"("id") ON DELETE CASCADE,
                "youtubeVideoId" varchar NOT NULL,
                "videoDescription" text,
                "date" timestamptz,
                "createdAt" timestamptz NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_videos_mediaFileId_youtubeVideoId" UNIQUE ("mediaFileId", "youtubeVideoId")
            )
        `);

        await queryRunner.query(`CREATE INDEX "IDX_videos_mediaFileId" ON "videos"("mediaFileId")`);
        await queryRunner.query(`CREATE INDEX "IDX_videos_youtubeVideoId" ON "videos"("youtubeVideoId")`);

        // Migrate existing youtubeVideoId data to videos table
        // For each mediafile with a youtubeVideoId, create a video entry with date calculated from year
        await queryRunner.query(`
            INSERT INTO "videos" ("mediaFileId", "youtubeVideoId", "date", "createdAt")
            SELECT 
                id,
                "youtubeVideoId",
                CASE 
                    WHEN "year" IS NOT NULL THEN make_date("year", 1, 1)::timestamptz
                    ELSE NULL
                END,
                "createdAt"
            FROM "media_files"
            WHERE "youtubeVideoId" IS NOT NULL
        `);

        // Replace year column with date column in media_files
        // First, add the new date column
        await queryRunner.query(`ALTER TABLE "media_files" ADD COLUMN "date" timestamptz`);

        // Populate date from year (January 1 of each year)
        await queryRunner.query(`
            UPDATE "media_files"
            SET "date" = make_date("year", 1, 1)::timestamptz
            WHERE "year" IS NOT NULL
        `);

        // Drop the youtubeVideoId UNIQUE constraint
        await queryRunner.query(`ALTER TABLE "media_files" DROP CONSTRAINT IF EXISTS "UQ_media_files_youtubeVideoId"`);

        // Drop the youtubeVideoId column
        await queryRunner.query(`ALTER TABLE "media_files" DROP COLUMN "youtubeVideoId"`);

        // Drop the year column
        await queryRunner.query(`ALTER TABLE "media_files" DROP COLUMN "year"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Recreate year column
        await queryRunner.query(`ALTER TABLE "media_files" ADD COLUMN "year" int`);

        // Recreate youtubeVideoId column with UNIQUE constraint
        await queryRunner.query(`ALTER TABLE "media_files" ADD COLUMN "youtubeVideoId" varchar`);
        await queryRunner.query(`ALTER TABLE "media_files" ADD CONSTRAINT "UQ_media_files_youtubeVideoId" UNIQUE ("youtubeVideoId")`);

        // Restore youtubeVideoId and year from videos table
        // Use the first video entry for each mediafile
        await queryRunner.query(`
            UPDATE "media_files" mf
            SET 
                "youtubeVideoId" = v."youtubeVideoId",
                "year" = EXTRACT(YEAR FROM v."date")::int
            FROM (
                SELECT DISTINCT ON ("mediaFileId") "mediaFileId", "youtubeVideoId", "date"
                FROM "videos"
                ORDER BY "mediaFileId", "createdAt"
            ) v
            WHERE mf.id = v."mediaFileId"
        `);

        // Drop date column from media_files
        await queryRunner.query(`ALTER TABLE "media_files" DROP COLUMN "date"`);

        // Drop videos table
        await queryRunner.query(`DROP TABLE IF EXISTS "videos"`);
    }
}
