// ...existing code...
const fs = require('fs').promises;
const path = require('path');

async function main() {
    const projectRoot = path.join(__dirname, '..');
    const srcFiles = [
        path.join(projectRoot, 'vorlage.png'),
        // add more files or folders as needed, e.g. path.join(projectRoot, 'images', 'logo.png')
    ];
    const outDir = path.join(projectRoot, 'dist', 'server');

    await fs.mkdir(outDir, { recursive: true });

    for (const src of srcFiles) {
        try {
            const base = path.basename(src);
            const dest = path.join(outDir, base);
            await fs.copyFile(src, dest);
            console.log(`Copied ${src} -> ${dest}`);
        } catch (err) {
            console.warn(`Skipping ${src}: ${err.message}`);
        }
    }
}

main().catch(err => { console.error(err); process.exit(1); });