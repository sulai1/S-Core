import express from "express";
import { type Application, type Handler } from "@s-tek/api";

export function createBodyParser(_app: Application): () => Handler<any, any> {
    return () => express.json();
}
