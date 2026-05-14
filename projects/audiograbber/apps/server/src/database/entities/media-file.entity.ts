import { EntitySchema } from "typeorm";

export type Visibility = "owner" | "groups" | "public";

export type MediaFile = {
    id: string;
    youtubeVideoId: string;
    filePath: string;
    mimeType: string;
    durationSecs: number | null;
    ownerId: string | null;
    visibility: Visibility;
    allowedGroups: string | null;
    title: string | null;
    artist: string | null;
    album: string | null;
    videoTags: string | null;
    year: number | null;
    createdAt: Date;
};

export const MediaFileEntity = new EntitySchema<MediaFile>({
    name: "MediaFile",
    tableName: "media_files",
    columns: {
        id: { type: "uuid", primary: true, generated: "uuid" },
        youtubeVideoId: { type: "varchar", unique: true },
        filePath: { type: "text" },
        mimeType: { type: "varchar" },
        durationSecs: { type: "float", nullable: true },
        ownerId: { type: "uuid", nullable: true },
        visibility: { type: "varchar", default: "owner" },
        allowedGroups: { type: "text", nullable: true },
        title: { type: "text", nullable: true },
        artist: { type: "text", nullable: true },
        album: { type: "text", nullable: true },
        videoTags: { type: "text", nullable: true },
        year: { type: "int", nullable: true },
        createdAt: { type: "timestamp", createDate: true },
    },
});
