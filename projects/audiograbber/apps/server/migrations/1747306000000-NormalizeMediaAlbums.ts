import { MigrationInterface, QueryRunner } from "typeorm";

export class NormalizeMediaAlbums1747306000000 implements MigrationInterface {
    name = "NormalizeMediaAlbums1747306000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "albums" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "name" text NOT NULL,
                "normalizedName" text NOT NULL UNIQUE,
                "createdAt" timestamptz NOT NULL DEFAULT now()
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "media_albums" (
                "mediaFileId" uuid NOT NULL REFERENCES "media_files"("id") ON DELETE CASCADE,
                "albumId" uuid NOT NULL REFERENCES "albums"("id") ON DELETE CASCADE,
                CONSTRAINT "UQ_media_albums_mediaFileId_albumId" UNIQUE ("mediaFileId", "albumId")
            )
        `);

        await queryRunner.query(`CREATE INDEX "IDX_media_albums_mediaFileId" ON "media_albums"("mediaFileId")`);
        await queryRunner.query(`CREATE INDEX "IDX_media_albums_albumId" ON "media_albums"("albumId")`);

        await queryRunner.query(`
            DO $$
            DECLARE
                media_row RECORD;
                album_value text;
                normalized_album text;
            BEGIN
                FOR media_row IN
                    SELECT "id", "album"
                    FROM "media_files"
                    WHERE "album" IS NOT NULL
                LOOP
                    album_value := btrim(media_row."album");
                    IF album_value = '' THEN
                        CONTINUE;
                    END IF;

                    normalized_album := lower(regexp_replace(album_value, '\\s+', ' ', 'g'));

                    INSERT INTO "albums" ("id", "name", "normalizedName", "createdAt")
                    VALUES (gen_random_uuid(), album_value, normalized_album, now())
                    ON CONFLICT ("normalizedName") DO NOTHING;

                    INSERT INTO "media_albums" ("mediaFileId", "albumId")
                    SELECT media_row."id", a."id"
                    FROM "albums" a
                    WHERE a."normalizedName" = normalized_album
                    ON CONFLICT ("mediaFileId", "albumId") DO NOTHING;
                END LOOP;
            END;
            $$;
        `);

        await queryRunner.query(`ALTER TABLE "media_files" DROP COLUMN "album"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "media_files" ADD COLUMN "album" text`);

        await queryRunner.query(`
            UPDATE "media_files" mf
            SET "album" = src.albums
            FROM (
                SELECT
                    ma."mediaFileId" AS media_file_id,
                    string_agg(a."name", ', ' ORDER BY a."name") AS albums
                FROM "media_albums" ma
                JOIN "albums" a ON a."id" = ma."albumId"
                GROUP BY ma."mediaFileId"
            ) src
            WHERE src.media_file_id = mf."id"
        `);

        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_media_albums_albumId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_media_albums_mediaFileId"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "media_albums"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "albums"`);
    }
}