import { EntitySchema } from "typeorm";
import type { Tag } from "./tag.entity.js";

export type Album = {
    id: string;
    name: string;
    normalizedName: string;
    label: string | null;
    catalogue: string | null;
    genre: string | null;
    style: string | null;
    format: string | null;
    releaseDate: Date | null;
    createdAt: Date;
    tags?: Tag[];
};

export const AlbumEntity = new EntitySchema<Album>({
    name: "Album",
    tableName: "albums",
    columns: {
        id: { type: "uuid", primary: true, generated: "uuid" },
        name: { type: "text" },
        normalizedName: { type: "text", unique: true },
        label: { type: "text", nullable: true },
        catalogue: { type: "text", nullable: true },
        genre: { type: "text", nullable: true },
        style: { type: "text", nullable: true },
        format: { type: "text", nullable: true },
        releaseDate: { type: "timestamp", nullable: true },
        createdAt: { type: "timestamp", createDate: true },
    },
    relations: {
        tags: {
            type: "many-to-many",
            target: "Tag",
            joinTable: {
                name: "album_tags",
                joinColumn: {
                    name: "albumId",
                    referencedColumnName: "id",
                },
                inverseJoinColumn: {
                    name: "tagId",
                    referencedColumnName: "id",
                },
            },
        },
    },
});