import { MigrationInterface, QueryRunner } from "typeorm";

export class InitAudioGrabber1747141200001 implements MigrationInterface {
    name = "InitAudioGrabber1747141200001";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id"            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
                "keycloakSub"   varchar     NOT NULL UNIQUE,
                "youtubeApiKey" text,
                "createdAt"     timestamptz NOT NULL DEFAULT now()
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "media_files" (
                "id"              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
                "youtubeVideoId"  varchar     NOT NULL UNIQUE,
                "filePath"        text        NOT NULL,
                "mimeType"        varchar     NOT NULL,
                "durationSecs"    float,
                "ownerId"         uuid        REFERENCES "users"("id") ON DELETE SET NULL,
                "visibility"      varchar     NOT NULL DEFAULT 'owner',
                "allowedGroups"   text,
                "title"           text,
                "artist"          text,
                "album"           text,
                "createdAt"       timestamptz NOT NULL DEFAULT now()
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "jobs" (
                "id"            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
                "kind"          varchar     NOT NULL,
                "state"         varchar     NOT NULL DEFAULT 'queued',
                "progress"      int         NOT NULL DEFAULT 0,
                "ownerId"       uuid,
                "mediaFileId"   uuid        REFERENCES "media_files"("id") ON DELETE SET NULL,
                "externalJobId" varchar,
                "error"         text,
                "createdAt"     timestamptz NOT NULL DEFAULT now(),
                "updatedAt"     timestamptz NOT NULL DEFAULT now()
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "audio_fingerprints" (
                "id"                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
                "mediaFileId"          uuid        NOT NULL UNIQUE REFERENCES "media_files"("id") ON DELETE CASCADE,
                "fingerprintData"      text,
                "acoustIdRecordingId"  varchar,
                "acoustIdScore"        float,
                "enrichedAt"           timestamptz
            )
        `);

        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW."updatedAt" = now();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql
        `);

        await queryRunner.query(`
            CREATE TRIGGER jobs_updated_at
            BEFORE UPDATE ON "jobs"
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER IF EXISTS jobs_updated_at ON "jobs"`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column`);
        await queryRunner.query(`DROP TABLE IF EXISTS "audio_fingerprints"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "jobs"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "media_files"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    }
}
