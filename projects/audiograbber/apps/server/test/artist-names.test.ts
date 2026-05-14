import { describe, expect, test } from "vitest";
import { splitArtistNames } from "../src/server/artistNames.js";

describe("splitArtistNames", () => {
    test("splits comma and ampersand separated artists", () => {
        expect(splitArtistNames("Jhesha, Cocodrilo & Another Artist")).toEqual([
            "Jhesha",
            "Cocodrilo",
            "Another Artist",
        ]);
    });

    test("keeps a single artist intact", () => {
        expect(splitArtistNames("Simon Garfunkel")).toEqual(["Simon Garfunkel"]);
    });
});