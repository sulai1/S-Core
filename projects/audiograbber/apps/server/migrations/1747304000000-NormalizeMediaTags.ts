import { MigrationInterface, QueryRunner } from "typeorm";

export class NormalizeMediaTags1747304000000 implements MigrationInterface {
    name = "NormalizeMediaTags1747304000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "tags" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "name" text NOT NULL,
                "normalizedName" text NOT NULL UNIQUE,
                "createdAt" timestamptz NOT NULL DEFAULT now()
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "media_tags" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "mediaFileId" uuid NOT NULL REFERENCES "media_files"("id") ON DELETE CASCADE,
                "tagId" uuid NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE,
                "createdAt" timestamptz NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_media_tags_mediaFileId_tagId" UNIQUE ("mediaFileId", "tagId")
            )
        `);

        await queryRunner.query(`CREATE INDEX "IDX_media_tags_mediaFileId" ON "media_tags"("mediaFileId")`);
        await queryRunner.query(`CREATE INDEX "IDX_media_tags_tagId" ON "media_tags"("tagId")`);

        await queryRunner.query(`
            DO $$
            DECLARE
                media_row RECORD;
                tag_value text;
                normalized_tag text;
                parsed_tags jsonb;
            BEGIN
                FOR media_row IN
                    SELECT "id", "videoTags"
                    FROM "media_files"
                    WHERE "videoTags" IS NOT NULL
                LOOP
                    BEGIN
                        parsed_tags := media_row."videoTags"::jsonb;
                    EXCEPTION WHEN others THEN
                        CONTINUE;
                    END;

                    IF jsonb_typeof(parsed_tags) <> 'array' THEN
                        CONTINUE;
                    END IF;

                    FOR tag_value IN
                        SELECT jsonb_array_elements_text(parsed_tags)
                    LOOP
                        tag_value := btrim(tag_value);
                        IF tag_value = '' THEN
                            CONTINUE;
                        END IF;

                        normalized_tag := lower(regexp_replace(tag_value, '\\s+', ' ', 'g'));

                        INSERT INTO "tags" ("id", "name", "normalizedName", "createdAt")
                        VALUES (gen_random_uuid(), tag_value, normalized_tag, now())
                        ON CONFLICT ("normalizedName") DO NOTHING;

                        INSERT INTO "media_tags" ("id", "mediaFileId", "tagId", "createdAt")
                        SELECT gen_random_uuid(), media_row."id", t."id", now()
                        FROM "tags" t
                        WHERE t."normalizedName" = normalized_tag
                        ON CONFLICT ("mediaFileId", "tagId") DO NOTHING;
                    END LOOP;
                END LOOP;
            END;
            $$;
        `);

        await queryRunner.query(`ALTER TABLE "media_files" DROP COLUMN "videoTags"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "media_files" ADD COLUMN "videoTags" text`);

        await queryRunner.query(`
            UPDATE "media_files" mf
            SET "videoTags" = src.tags
            FROM (
                SELECT
                    mt."mediaFileId" AS media_file_id,
                    jsonb_agg(t."name" ORDER BY t."name")::text AS tags
                FROM "media_tags" mt
                JOIN "tags" t ON t."id" = mt."tagId"
                GROUP BY mt."mediaFileId"
            ) src
            WHERE src.media_file_id = mf."id"
        `);

        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_media_tags_tagId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_media_tags_mediaFileId"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "media_tags"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "tags"`);
    }
}
