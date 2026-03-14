import { Jimp, intToRGBA } from 'jimp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to calculate color distance
function getColorDistance(r1, g1, b1, r2, g2, b2) {
    return Math.sqrt(
        Math.pow(r1 - r2, 2) +
        Math.pow(g1 - g2, 2) +
        Math.pow(b1 - b2, 2)
    );
}

async function processSprite(inputPath, outputPath, reportPath) {
    try {
        console.log(`🚀 Processing: ${inputPath}`);
        if (!fs.existsSync(inputPath)) {
            console.error(`❌ Input file not found: ${inputPath}`);
            return;
        }

        const image = await Jimp.read(inputPath);
        const originalWidth = image.bitmap.width;
        const originalHeight = image.bitmap.height;

        // Target Reference Colors
        const REF_MAGENTA = { r: 255, g: 0, b: 255 };
        const THRESHOLD_MAGENTA = 100; // Fairly generous for AI output
        
        // Probe background color at 0,0
        const bgHex = image.getPixelColor(0, 0);
        const REF_GREEN = intToRGBA(bgHex);
        const THRESHOLD_GREEN = 80;

        console.log(`Detected Background (0,0): R:${REF_GREEN.r} G:${REF_GREEN.g} B:${REF_GREEN.b}`);

        let minX = image.bitmap.width, minY = image.bitmap.height, maxX = 0, maxY = 0;
        let found = false;

        console.log("Scanning for Magenta marker box...");
        // 1. Scan for Magenta box with threshold
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
            const r = image.bitmap.data[idx + 0];
            const g = image.bitmap.data[idx + 1];
            const b = image.bitmap.data[idx + 2];
            
            const dist = getColorDistance(r, g, b, REF_MAGENTA.r, REF_MAGENTA.g, REF_MAGENTA.b);
            
            if (dist < THRESHOLD_MAGENTA) {
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
                found = true;
            }
        });

        // 2. Crop Logic
        if (found) {
            // We find the box, then we crop INSIDE it.
            // Assuming the box is 1-2 pixels thick, we add a small buffer.
            const cropX = minX + 2;
            const cropY = minY + 2;
            const cropW = maxX - minX - 3;
            const cropH = maxY - minY - 3;
            console.log(`✅ Magenta-ish box found at (${minX},${minY}) to (${maxX},${maxY})`);
            image.crop({ x: cropX, y: cropY, w: cropW, h: cropH });
        } else {
            console.warn("⚠️ No magenta box found. Cleaning background only based on (0,0).");
        }

        // 3. Make Background and Marker Transparent
        let transparentCount = 0;
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
            const r = image.bitmap.data[idx + 0];
            const g = image.bitmap.data[idx + 1];
            const b = image.bitmap.data[idx + 2];

            const distGreen = getColorDistance(r, g, b, REF_GREEN.r, REF_GREEN.g, REF_GREEN.b);
            const distMagenta = getColorDistance(r, g, b, REF_MAGENTA.r, REF_MAGENTA.g, REF_MAGENTA.b);

            if (distGreen < THRESHOLD_GREEN || distMagenta < THRESHOLD_MAGENTA) {
                image.bitmap.data[idx + 3] = 0; // Alpha to 0
                transparentCount++;
            }
        });
        console.log(`Made ${transparentCount} pixels transparent.`);

        // 4. Resize to 48x48 (Nearest Neighbor)
        // We use a simple 48x48 resize. Jimp's default resize handles this.
        image.resize({ w: 48, h: 48 });
        
        await image.write(outputPath);
        console.log(`✅ Saved processed sprite to: ${outputPath}`);

        // 5. Generate HTML Report
        const inputRel = path.relative(path.dirname(reportPath), inputPath);
        const outputRel = path.relative(path.dirname(reportPath), outputPath);

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Sprite Processing Report</title>
    <style>
        body { background: #121212; color: #e0e0e0; font-family: 'Segoe UI', sans-serif; padding: 40px; }
        .container { display: flex; gap: 30px; flex-wrap: wrap; }
        .box { border: 1px solid #333; padding: 20px; background: #1e1e1e; border-radius: 8px; }
        .img-wrap { 
            display: inline-block;
            background-image: linear-gradient(45deg, #2a2a2a 25%, transparent 25%), linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a2a 75%), linear-gradient(-45deg, transparent 75%, #2a2a2a 75%);
            background-size: 20px 20px;
            background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
            border: 1px solid #000;
        }
        .pixelated { image-rendering: pixelated; }
        img { display: block; }
        .stats { margin-top: 20px; font-family: monospace; color: #00ffcc; }
    </style>
</head>
<body>
    <h1>Sprite Processing Report (Adaptive)</h1>
    <div class="container">
        <div class="box">
            <h2>Original (${originalWidth}x${originalHeight})</h2>
            <img src="${inputRel}" style="max-width: 600px;">
        </div>
        <div class="box">
            <h2>Result (48x48)</h2>
            <div class="img-wrap">
                <img src="${outputRel}" width="48" height="48">
            </div>
        </div>
        <div class="box">
            <h2>Stretched (256x256)</h2>
            <div class="img-wrap">
                <img class="pixelated" src="${outputRel}" width="256" height="256">
            </div>
        </div>
    </div>
    <div class="stats">
        Status: ${found ? '✅ BOX DETECTED' : '⚠️ NO BOX'}<br>
        BG Probe (0,0): R:${REF_GREEN.r} G:${REF_GREEN.g} B:${REF_GREEN.b}<br>
        Pixels Cleaned: ${transparentCount}
    </div>
</body>
</html>`;

        fs.writeFileSync(reportPath, html);
        console.log(`✅ Visual report generated: ${reportPath}`);

    } catch (err) {
        console.error(`❌ Processing Failed: ${err.message}`);
    }
}

// CLI Interface
const inputArg = process.argv[2] || path.join(__dirname, '..', 'res', 'gemini enemy.png');
const outputArg = path.join(__dirname, '..', 'res', 'gemini_processed.png');
const reportArg = path.join(__dirname, '..', 'test_sprite.html');

processSprite(inputArg, outputArg, reportArg);
