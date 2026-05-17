import { EntitySchema } from "typeorm";

export type SyncScheduleInterval = "daily" | "weekly";

export type SyncSchedule = {
    id: string;
    channelId: string;
    ownerId: string | null;
    interval: SyncScheduleInterval;
    maxResults: number | null;
    minDurationSeconds: number | null;
    maxDurationSeconds: number | null;
    enabled: boolean;
    lastRunAt: Date | null;
    nextRunAt: Date;
    createdAt: Date;
    updatedAt: Date;
};

export const SyncScheduleEntity = new EntitySchema<SyncSchedule>({
    name: "SyncSchedule",
    tableName: "sync_schedules",
    columns: {
        id: { type: "uuid", primary: true, generated: "uuid" },
        channelId: { type: "varchar" },
        ownerId: { type: "uuid", nullable: true },
        interval: { type: "varchar" },
        maxResults: { type: "int", nullable: true },
        minDurationSeconds: { type: "int", nullable: true },
        maxDurationSeconds: { type: "int", nullable: true },
        enabled: { type: "boolean", default: true },
        lastRunAt: { type: "timestamptz", nullable: true },
        nextRunAt: { type: "timestamptz" },
        createdAt: { type: "timestamp", createDate: true },
        updatedAt: { type: "timestamp", updateDate: true },
    },
    indices: [
        {
            name: "IDX_sync_schedules_channelId",
            columns: ["channelId"],
        },
        {
            name: "IDX_sync_schedules_enabled_nextRunAt",
            columns: ["enabled", "nextRunAt"],
        },
    ],
});