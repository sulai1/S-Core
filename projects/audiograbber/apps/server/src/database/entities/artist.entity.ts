import { EntitySchema } from "typeorm";

export type Artist = {
    id: string;
    name: string;
    normalizedName: string;
    createdAt: Date;
};

export const ArtistEntity = new EntitySchema<Artist>({
    name: "Artist",
    tableName: "artists",
    columns: {
        id: { type: "uuid", primary: true, generated: "uuid" },
        name: { type: "text" },
        normalizedName: { type: "text", unique: true },
        createdAt: { type: "timestamp", createDate: true },
    },
});