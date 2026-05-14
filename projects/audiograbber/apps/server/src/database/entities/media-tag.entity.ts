import { EntitySchema } from "typeorm";

export type MediaTag = {
    id: string;
    mediaFileId: string;
    tagId: string;
    createdAt: Date;
};

export const MediaTagEntity = new EntitySchema<MediaTag>({
    name: "MediaTag",
    tableName: "media_tags",
    columns: {
        id: { type: "uuid", primary: true, generated: "uuid" },
        mediaFileId: { type: "uuid" },
        tagId: { type: "uuid" },
        createdAt: { type: "timestamp", createDate: true },
    },
    indices: [
        { columns: ["mediaFileId"] },
        { columns: ["tagId"] },
        { columns: ["mediaFileId", "tagId"], unique: true },
    ],
});
