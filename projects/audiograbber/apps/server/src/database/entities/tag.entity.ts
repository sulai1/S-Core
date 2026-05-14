import { EntitySchema } from "typeorm";

export type Tag = {
    id: string;
    name: string;
    normalizedName: string;
    createdAt: Date;
};

export const TagEntity = new EntitySchema<Tag>({
    name: "Tag",
    tableName: "tags",
    columns: {
        id: { type: "uuid", primary: true, generated: "uuid" },
        name: { type: "text" },
        normalizedName: { type: "text", unique: true },
        createdAt: { type: "timestamp", createDate: true },
    },
});
