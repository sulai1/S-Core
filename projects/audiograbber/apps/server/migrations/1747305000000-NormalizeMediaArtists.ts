import { MigrationInterface, QueryRunner } from "typeorm";

export class NormalizeMediaArtists1747305000000 implements MigrationInterface {
    name = "NormalizeMediaArtists1747305000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "artists" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "name" text NOT NULL,
                "normalizedName" text NOT NULL UNIQUE,
                "createdAt" timestamptz NOT NULL DEFAULT now()
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "media_artists" (
                "mediaFileId" uuid NOT NULL REFERENCES "media_files"("id") ON DELETE CASCADE,
                "artistId" uuid NOT NULL REFERENCES "artists"("id") ON DELETE CASCADE,
                CONSTRAINT "UQ_media_artists_mediaFileId_artistId" UNIQUE ("mediaFileId", "artistId")
            )
        `);

        await queryRunner.query(`CREATE INDEX "IDX_media_artists_mediaFileId" ON "media_artists"("mediaFileId")`);
        await queryRunner.query(`CREATE INDEX "IDX_media_artists_artistId" ON "media_artists"("artistId")`);

        await queryRunner.query(`
            DO $$
            DECLARE
                media_row RECORD;
                artist_value text;
                normalized_artist text;
                artist_names text[];
            BEGIN
                FOR media_row IN
                    SELECT "id", "artist"
                    FROM "media_files"
                    WHERE "artist" IS NOT NULL
                LOOP
                    artist_names := regexp_split_to_array(media_row."artist", E'\\s*,\\s*|\\s+&\\s+');
                    IF artist_names IS NULL THEN
                        CONTINUE;
                    END IF;

                    FOREACH artist_value IN ARRAY artist_names
                    LOOP
                        artist_value := btrim(artist_value);
                        IF artist_value = '' THEN
                            CONTINUE;
                        END IF;

                        normalized_artist := lower(regexp_replace(artist_value, '\\s+', ' ', 'g'));

                        INSERT INTO "artists" ("id", "name", "normalizedName", "createdAt")
                        VALUES (gen_random_uuid(), artist_value, normalized_artist, now())
                        ON CONFLICT ("normalizedName") DO NOTHING;

                        INSERT INTO "media_artists" ("mediaFileId", "artistId")
                        SELECT media_row."id", a."id"
                        FROM "artists" a
                        WHERE a."normalizedName" = normalized_artist
                        ON CONFLICT ("mediaFileId", "artistId") DO NOTHING;
                    END LOOP;
                END LOOP;
            END;
            $$;
        `);

        await queryRunner.query(`ALTER TABLE "media_files" DROP COLUMN "artist"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "media_files" ADD COLUMN "artist" text`);

        await queryRunner.query(`
            UPDATE "media_files" mf
            SET "artist" = src.artists
            FROM (
                SELECT
                    ma."mediaFileId" AS media_file_id,
                    string_agg(a."name", ', ' ORDER BY a."name") AS artists
                FROM "media_artists" ma
                JOIN "artists" a ON a."id" = ma."artistId"
                GROUP BY ma."mediaFileId"
            ) src
            WHERE src.media_file_id = mf."id"
        `);

        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_media_artists_artistId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_media_artists_mediaFileId"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "media_artists"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "artists"`);
    }
}