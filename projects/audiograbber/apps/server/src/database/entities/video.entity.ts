import { EntitySchema } from "typeorm";

export type Video = {
    id: string;
    mediaFileId: string;
    youtubeVideoId: string;
    videoDescription: string | null;
    date: Date | null;
    channelId: string | null;
    createdAt: Date;
};

export const VideoEntity = new EntitySchema<Video>({
    name: "Video",
    tableName: "videos",
    columns: {
        id: { type: "uuid", primary: true, generated: "uuid" },
        mediaFileId: { type: "uuid" },
        youtubeVideoId: { type: "varchar" },
        videoDescription: { type: "text", nullable: true },
        date: { type: "timestamptz", nullable: true },
        channelId: { type: "varchar", nullable: true },
        createdAt: { type: "timestamp", createDate: true },
    },
    indices: [
        {
            name: "IDX_videos_mediaFileId",
            columns: ["mediaFileId"],
        },
        {
            name: "IDX_videos_youtubeVideoId",
            columns: ["youtubeVideoId"],
        },
        {
            name: "IDX_videos_channelId",
            columns: ["channelId"],
        },
    ],
    uniques: [
        {
            name: "UQ_videos_mediaFileId_youtubeVideoId",
            columns: ["mediaFileId", "youtubeVideoId"],
        },
    ],
    relations: {
        // mediaFile can be added here when needed
    },
});
