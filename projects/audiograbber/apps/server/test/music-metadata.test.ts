import { describe, expect, test } from "vitest";
import { parseMusicMetadata } from "../src/server/musicMetadata.js";

describe("parseMusicMetadata", () => {
    test("extracts artist and album from direct music metadata markup", () => {
        const musicDescription = [
            '<div class="ytVideoAttributeViewModelTitle">Derm4T3Tris (Original Mix)</div>',
            '<div class="ytVideoAttributeViewModelSubtitle"><span>Delirium Tremens, Cocodrilo</span></div>',
            '<div class="ytVideoAttributeViewModelSecondarySubtitle">',
            '  <a class="ytAttributedStringLink">Auryn</a>',
            '</div>',
        ].join("\n");

        expect(parseMusicMetadata("1 Delirium Tremens & Cocodrilo_Derm4t3tris", musicDescription)).toEqual({
            songTitle: "Derm4T3Tris (Original Mix)",
            artist: "Delirium Tremens, Cocodrilo",
            album: "Auryn",
        });
    });

    test("extracts metadata from plain YouTube description tracklist format", () => {
        const realWorldDescription = [
            "Cocodrilo - Auryn IS OUT NOW‼ on Purple Hexagon Records Bandcamp and all Major Download portals.",
            "Cat. No. PUHEDGT008",
            "",
            "1.- Delirium Tremens & Cocodrilo - Derm4t3tris",
        ].join("\n");

        expect(parseMusicMetadata("1 Delirium Tremens & Cocodrilo_Derm4t3tris", realWorldDescription)).toEqual({
            songTitle: "Derm4t3tris",
            artist: "Delirium Tremens & Cocodrilo",
            album: "Auryn",
        });
    });

    test("extracts metadata from full watch-metadata music shelf html", () => {
        const watchPageHtml = [
            '<div id="description-inner" class="style-scope ytd-watch-metadata">',
            '  <yt-formatted-string id="description-placeholder" class="style-scope ytd-watch-metadata">No description has been added to this video.</yt-formatted-string>',
            '  <ytd-horizontal-card-list-renderer class="style-scope ytd-structured-description-content-renderer" has-video-attribute-view-models="">',
            '    <yt-video-attribute-view-model class="ytd-horizontal-card-list-renderer">',
            '      <div class="ytVideoAttributeViewModelMetadata" role="link">',
            '        <h1 class="ytVideoAttributeViewModelTitle">Glitchosaurus Rex (Original Mix)</h1>',
            '        <h4 class="ytVideoAttributeViewModelSubtitle"><span>Jhesha, Cocodrilo</span></h4>',
            '        <span class="ytVideoAttributeViewModelSecondarySubtitle"><span class="ytAttributedStringHost" role="text">Auryn</span></span>',
            '      </div>',
            '    </yt-video-attribute-view-model>',
            '  </ytd-horizontal-card-list-renderer>',
            '</div>',
        ].join("\n");

        expect(parseMusicMetadata("Jhesha & Cocodrilo Glitchosaurus Rexh264 q65", watchPageHtml)).toEqual({
            songTitle: "Glitchosaurus Rex (Original Mix)",
            artist: "Jhesha, Cocodrilo",
            album: "Auryn",
        });
    });

    test("extracts compact raw title format without separators", () => {
        expect(parseMusicMetadata("3 Jhesha & Cocodrilo Glitchosaurus Rexh264 q65", "")).toEqual({
            songTitle: "Glitchosaurus Rex",
            artist: "Jhesha, Cocodrilo",
        });
    });

    test("falls back to YouTube title split when description contains noisy metadata blob", () => {
        const noisyDescription = [
            'Deviant Sangoma compiled by sG4rY \\u0026 Mutaro\\nLabel: Sangoma Records',
            '\\"isCrawlable\\":true,\\"thumbnail\\":{\\"thumbnails\\":[{\\"url\\":\\"https://i.ytimg.com/vi/SmoSPyPR-uk/hqdefault.jpg\\"}]},\\"playerConfig\\":{...}',
            '\\"microformat\\":{\\"playerMicroformatRenderer\\":{\\"title\\":{\\"simpleText\\":\\"Chromarepo - Higher State (Superluminal Remix)\\"}}}',
        ].join("");

        expect(parseMusicMetadata("Chromarepo - Higher State (Superluminal Remix) SmoSPyPR-uk", noisyDescription)).toEqual({
            artist: "Chromarepo",
            songTitle: "Higher State (Superluminal Remix)",
        });
    });

    test("uses YouTube title for track metadata when description title is the release title", () => {
        const albumDescription = [
            "Title: Deviant Sangoma compiled by sG4rY & Mutaro",
            "Label: Sangoma Records",
            "",
            "01. Some Other Artist - Opening Track",
            "02. Chromarepo - Higher State",
        ].join("\n");

        expect(parseMusicMetadata("Chromarepo - Higher State SmoSPyPR-uk", albumDescription)).toEqual({
            artist: "Chromarepo",
            songTitle: "Higher State",
            album: "Deviant Sangoma compiled by sG4rY & Mutaro",
        });
    });

    test("handles en-dash separator with Various Artists compilation placeholder", () => {
        const compilationDescription = [
            "Artist: Various Artists",
            "Title: Deviant Sangoma compiled by sG4rY & Mutaro",
            "Label: Sangoma Records",
            "Catalogue: TSANGEP118",
            "Genre: Psy Trance",
        ].join("\n");

        expect(parseMusicMetadata("Daksinamurti & Drip Drop \u2013 I Sense in You", compilationDescription)).toEqual({
            artist: "Daksinamurti, Drip Drop",
            songTitle: "I Sense in You",
            album: "Deviant Sangoma compiled by sG4rY & Mutaro",
        });
    });

    test("prefers YouTube title artist over 'Various Artists' compilation placeholder in description", () => {
        const compilationDescription = [
            "Artist: Various Artists",
            "Title: Oraculum",
            "Label: Sangoma Records",
            "Catalogue: TSANGEP116",
            "Genre: Psy Trance",
        ].join("\n");

        expect(parseMusicMetadata("Yebah - Deep Waters", compilationDescription)).toEqual({
            artist: "Yebah",
            songTitle: "Deep Waters",
            album: "Oraculum",
        });
    });

    test("splits underscore title into artist and song title", () => {
        expect(parseMusicMetadata("HANUMAN _  WAVER RAVER osTouT8Pvn8", "")).toEqual({
            artist: "HANUMAN",
            songTitle: "WAVER RAVER",
        });
    });

    test("treats vs as artist separator in dashed titles", () => {
        expect(parseMusicMetadata("Astrix vs Ace Ventura - Valley of Stevie", "")).toEqual({
            artist: "Astrix, Ace Ventura",
            songTitle: "Valley of Stevie",
        });
    });

    test("treats feat and ft as artist separators in dashed titles", () => {
        expect(parseMusicMetadata("Astrix feat. Ace Ventura - Valley of Stevie", "")).toEqual({
            artist: "Astrix, Ace Ventura",
            songTitle: "Valley of Stevie",
        });

        expect(parseMusicMetadata("Astrix ft Ace Ventura - Valley of Stevie", "")).toEqual({
            artist: "Astrix, Ace Ventura",
            songTitle: "Valley of Stevie",
        });
    });

    test("treats x as artist separator in dashed titles", () => {
        expect(parseMusicMetadata("Astrix x Ace Ventura - Valley of Stevie", "")).toEqual({
            artist: "Astrix, Ace Ventura",
            songTitle: "Valley of Stevie",
        });
    });
});