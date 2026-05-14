import { EntitySchema } from "typeorm";

export type AlbumTag = {
    id: string;
    albumId: string;
    tagId: string;
    createdAt: Date;
};

export const AlbumTagEntity = new EntitySchema<AlbumTag>({
    name: "AlbumTag",
    tableName: "album_tags",
    columns: {
        id: { type: "uuid", primary: true, generated: "uuid" },
        albumId: { type: "uuid" },
        tagId: { type: "uuid" },
        createdAt: { type: "timestamp", createDate: true },
    },
    indices: [
        { columns: ["albumId"] },
        { columns: ["tagId"] },
        { columns: ["albumId", "tagId"], unique: true },
    ],
});