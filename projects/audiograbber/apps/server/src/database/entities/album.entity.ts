import { EntitySchema } from "typeorm";

export type Album = {
    id: string;
    name: string;
    normalizedName: string;
    createdAt: Date;
};

export const AlbumEntity = new EntitySchema<Album>({
    name: "Album",
    tableName: "albums",
    columns: {
        id: { type: "uuid", primary: true, generated: "uuid" },
        name: { type: "text" },
        normalizedName: { type: "text", unique: true },
        createdAt: { type: "timestamp", createDate: true },
    },
});