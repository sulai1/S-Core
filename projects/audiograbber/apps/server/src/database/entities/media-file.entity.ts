import { EntitySchema } from "typeorm";
import type { Artist } from "./artist.entity.js";
import type { Album } from "./album.entity.js";

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
    artists?: Artist[];
    albums?: Album[];
    year: number | null;
    estimatedBpm: number | null;
    estimatedKey: string | null;
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
        year: { type: "int", nullable: true },
        estimatedBpm: { type: "float", nullable: true },
        estimatedKey: { type: "varchar", nullable: true },
        createdAt: { type: "timestamp", createDate: true },
    },
    relations: {
        artists: {
            type: "many-to-many",
            target: "Artist",
            joinTable: {
                name: "media_artists",
                joinColumn: {
                    name: "mediaFileId",
                    referencedColumnName: "id",
                },
                inverseJoinColumn: {
                    name: "artistId",
                    referencedColumnName: "id",
                },
            },
        },
        albums: {
            type: "many-to-many",
            target: "Album",
            joinTable: {
                name: "media_albums",
                joinColumn: {
                    name: "mediaFileId",
                    referencedColumnName: "id",
                },
                inverseJoinColumn: {
                    name: "albumId",
                    referencedColumnName: "id",
                },
            },
        },
    },
});
