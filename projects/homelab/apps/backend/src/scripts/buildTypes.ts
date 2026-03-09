/* eslint-disable no-console */

import { argv } from "process";
import path from "path";
import { createApiBuilder } from "@s-tek/api";
import { mkdirSync } from "fs";
const defaults = {
    "loki": {
        source: "./src/api/loki/loki.yaml",
        outDir: "./src/api/loki"
    },
    "nginx-proxy-manager": {
        source: "https://raw.githubusercontent.com/NginxProxyManager/nginx-proxy-manager/refs/heads/develop/backend/schema/swagger.json",
        outDir: "./src/api/node-proxy-manager"
    }
};

async function main() {
    const b = createApiBuilder();
    // Check if source is a URL or local file
    if (argv.length >= 4) {
        const outDir = path.resolve(argv[3] ?? "../api/node-proxy-manager");
        mkdirSync(outDir, { recursive: true });
        console.log(`Generating OpenAPI types to ${outDir}`);
        let source = argv[2];
        if (!/^https?:\/\//i.test(source)) {
            source = path.resolve(process.cwd(), source);
        }
        await b.build(source, outDir);
    } else {
        for (const def of Object.values(defaults)) {
            const outDir = path.resolve(process.cwd(), def.outDir);
            mkdirSync(outDir, { recursive: true });
            let source = def.source;
            if (!/^https?:\/\//i.test(source)) {
                source = path.resolve(process.cwd(), source);
            }

            console.log(`Generating OpenAPI types to ${outDir}`);
            mkdirSync(outDir, { recursive: true });
            await b.build(source, outDir);
        }
    }
}

if (require.main === module) {
    main().then(() => {
        console.log("OpenAPI types generated successfully.");
    }).catch(err => {
        console.error("Error generating OpenAPI types:", err);
        process.exit(1);
    });
}
