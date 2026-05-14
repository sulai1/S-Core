import { EntitySchema } from "typeorm";

export type DbJobState = "queued" | "running" | "success" | "failed";
export type DbJobKind = "download" | "sync";

export type DbJob = {
    id: string;
    kind: DbJobKind;
    state: DbJobState;
    progress: number;
    ownerId: string | null;
    mediaFileId: string | null;
    externalJobId: string | null;
    error: string | null;
    createdAt: Date;
    updatedAt: Date;
};

export const JobEntity = new EntitySchema<DbJob>({
    name: "Job",
    tableName: "jobs",
    columns: {
        id: { type: "uuid", primary: true, generated: "uuid" },
        kind: { type: "varchar" },
        state: { type: "varchar", default: "queued" },
        progress: { type: "int", default: 0 },
        ownerId: { type: "uuid", nullable: true },
        mediaFileId: { type: "uuid", nullable: true },
        externalJobId: { type: "varchar", nullable: true },
        error: { type: "text", nullable: true },
        createdAt: { type: "timestamp", createDate: true },
        updatedAt: { type: "timestamp", updateDate: true },
    },
});
