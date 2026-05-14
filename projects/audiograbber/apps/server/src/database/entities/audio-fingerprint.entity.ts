import { EntitySchema } from "typeorm";

export type AudioFingerprint = {
    id: string;
    mediaFileId: string;
    // Stored as text for now; Phase 6 will migrate this column to pgvector type
    fingerprintData: string | null;
    acoustIdRecordingId: string | null;
    acoustIdScore: number | null;
    enrichedAt: Date | null;
};

export const AudioFingerprintEntity = new EntitySchema<AudioFingerprint>({
    name: "AudioFingerprint",
    tableName: "audio_fingerprints",
    columns: {
        id: { type: "uuid", primary: true, generated: "uuid" },
        mediaFileId: { type: "uuid", unique: true },
        fingerprintData: { type: "text", nullable: true },
        acoustIdRecordingId: { type: "varchar", nullable: true },
        acoustIdScore: { type: "float", nullable: true },
        enrichedAt: { type: "timestamp", nullable: true },
    },
    relations: {
        mediaFileId: {
            type: "one-to-one",
            target: "MediaFile",
            joinColumn: { name: "mediaFileId" },
        },
    },
});
