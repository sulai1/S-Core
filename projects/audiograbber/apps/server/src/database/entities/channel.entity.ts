import { EntitySchema } from "typeorm";

export type Channel = {
    id: string;
    description: string | null;
    joinedDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

export const ChannelEntity = new EntitySchema<Channel>({
    name: "Channel",
    tableName: "channels",
    columns: {
        id: { type: "varchar", primary: true },
        description: { type: "text", nullable: true },
        joinedDate: { type: "timestamptz", nullable: true },
        createdAt: { type: "timestamp", createDate: true },
        updatedAt: { type: "timestamp", updateDate: true },
    },
});
