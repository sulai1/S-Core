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

    test("splits artists separated by vs", () => {
        expect(splitArtistNames("Astrix vs Ace Ventura")).toEqual(["Astrix", "Ace Ventura"]);
    });

    test("splits artists separated by feat or ft", () => {
        expect(splitArtistNames("Astrix feat. Ace Ventura")).toEqual(["Astrix", "Ace Ventura"]);
        expect(splitArtistNames("Astrix ft Ace Ventura")).toEqual(["Astrix", "Ace Ventura"]);
    });

    test("splits artists separated by x", () => {
        expect(splitArtistNames("Astrix x Ace Ventura")).toEqual(["Astrix", "Ace Ventura"]);
    });
});