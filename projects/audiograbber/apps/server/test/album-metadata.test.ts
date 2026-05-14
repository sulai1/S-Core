import { describe, expect, test } from "vitest";
import { parseAlbumMetadata } from "../src/server/albumMetadata.js";

describe("parseAlbumMetadata", () => {
    test("extracts album release fields and style tags", () => {
        const description = [
            "Artist: Various Artists",
            "Title: Deviant Sangoma compiled by sG4rY & Mutaro",
            "Label: Sangoma Records",
            "Catalogue: TSANGEP118",
            "Genre: Psy Trance",
            "Style: #psytrance #sangomesque",
            "Format: Digital Release",
            "Date: April 30, 2026",
        ].join("\n");

        expect(parseAlbumMetadata(description)).toEqual({
            title: "Deviant Sangoma compiled by sG4rY & Mutaro",
            label: "Sangoma Records",
            catalogue: "TSANGEP118",
            genre: "Psy Trance",
            style: "#psytrance #sangomesque",
            format: "Digital Release",
            releaseDate: new Date("2026-04-30T00:00:00.000Z"),
            tags: ["Psy Trance", "psytrance", "sangomesque"],
        });
    });

    test("defaults release date from youtube upload date when missing", () => {
        const description = [
            "Title: Oraculum",
            "Label: Sangoma Records",
            "Genre: Psy Trance",
        ].join("\n");

        expect(parseAlbumMetadata(description, "20260430")).toEqual({
            title: "Oraculum",
            label: "Sangoma Records",
            catalogue: undefined,
            genre: "Psy Trance",
            style: undefined,
            format: undefined,
            releaseDate: new Date("2026-04-30T00:00:00.000Z"),
            tags: ["Psy Trance"],
        });
    });
});