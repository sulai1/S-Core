import { EntitySchema } from "typeorm";

export type User = {
    id: string;
    keycloakSub: string;
    youtubeApiKey: string | null;
    createdAt: Date;
};

export const UserEntity = new EntitySchema<User>({
    name: "User",
    tableName: "users",
    columns: {
        id: { type: "uuid", primary: true, generated: "uuid" },
        keycloakSub: { type: "varchar", unique: true },
        youtubeApiKey: { type: "text", nullable: true },
        createdAt: { type: "timestamp", createDate: true },
    },
});
