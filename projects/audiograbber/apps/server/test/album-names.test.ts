import { describe, expect, test } from "vitest";
import { uniqueAlbumNames } from "../src/server/albumNames.js";

describe("uniqueAlbumNames", () => {
    test("deduplicates album names case-insensitively", () => {
        expect(uniqueAlbumNames(["Auryn", " auryn ", "DEVIANT SANGOMA"])).toEqual([
            "Auryn",
            "DEVIANT SANGOMA",
        ]);
    });

    test("keeps album names with punctuation intact", () => {
        expect(uniqueAlbumNames(["Deviant Sangoma compiled by sG4rY & Mutaro"])).toEqual([
            "Deviant Sangoma compiled by sG4rY & Mutaro",
        ]);
    });
});