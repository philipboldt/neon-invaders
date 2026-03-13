import { Jimp } from 'jimp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function processSprite(inputPath, outputPath, reportPath) {
    try {
        console.log(`Processing: ${inputPath}`);
        if (!fs.existsSync(inputPath)) {
            console.error(`❌ Input file not found: ${inputPath}`);
            return;
        }

        const image = await Jimp.read(inputPath);
        const originalWidth = image.bitmap.width;
        const originalHeight = image.bitmap.height;

        // Target colors (RGBA)
        const MAGENTA = 0xFF00FFFF;
        const GREEN = 0x00FF00FF;

        let minX = image.bitmap.width, minY = image.bitmap.height, maxX = 0, maxY = 0;
        let found = false;

        console.log("Scanning for Magenta box...");
        // 1. Scan for Magenta box
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
            const color = image.getPixelColor(x, y);
            if (color === MAGENTA) {
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
                found = true;
            }
        });

        // 2. Crop Logic
        if (found) {
            const cropX = minX + 1;
            const cropY = minY + 1;
            const cropW = maxX - minX - 1;
            const cropH = maxY - minY - 1;
            console.log(`✅ Magenta box found at (${minX},${minY}) size ${maxX-minX}x${maxY-minY}`);
            image.crop({ x: cropX, y: cropY, w: cropW, h: cropH });
        } else {
            console.warn("⚠️ No magenta box found. Cleaning background only.");
        }

        // 3. Make Chroma Keys Transparent (Magenta and Green)
        let transparentCount = 0;
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
            const color = image.getPixelColor(x, y);
            if (color === MAGENTA || color === GREEN) {
                image.setPixelColor(0x00000000, x, y);
                transparentCount++;
            }
        });
        console.log(`Made ${transparentCount} pixels transparent.`);

        // 4. Resize to 48x48 (Nearest Neighbor)
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
        body { background: #121212; color: #e0e0e0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; line-height: 1.6; }
        .container { display: flex; gap: 30px; flex-wrap: wrap; align-items: flex-start; }
        .box { border: 1px solid #333; padding: 20px; background: #1e1e1e; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); transition: transform 0.2s; }
        .box:hover { transform: translateY(-5px); border-color: #00ffcc; }
        h1 { color: #00ffcc; margin-bottom: 30px; border-bottom: 2px solid #00ffcc; display: inline-block; padding-bottom: 10px; }
        h2 { margin-top: 0; color: #ff00ff; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 1px; }
        .img-wrap { 
            display: inline-block;
            background: 
                linear-gradient(45deg, #2a2a2a 25%, transparent 25%), 
                linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), 
                linear-gradient(45deg, transparent 75%, #2a2a2a 75%), 
                linear-gradient(-45deg, transparent 75%, #2a2a2a 75%);
            background-size: 20px 20px;
            background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
            border: 1px solid #000;
        }
        .pixelated { image-rendering: pixelated; image-rendering: crisp-edges; }
        .original-container img { max-width: 500px; height: auto; display: block; }
        .stats { margin-top: 30px; padding: 15px; background: #252525; border-left: 4px solid #00ffcc; font-family: monospace; }
    </style>
</head>
<body>
    <h1>Sprite Processing Report</h1>
    
    <div class="container">
        <div class="box original-container">
            <h2>Raw Input (${originalWidth}x${originalHeight})</h2>
            <img src="${inputRel}" alt="Original">
        </div>
        
        <div class="box">
            <h2>Result (48x48)</h2>
            <div class="img-wrap">
                <img src="${outputRel}" width="48" height="48" alt="Result 1:1">
            </div>
        </div>
        
        <div class="box">
            <h2>Stretched (256x256)</h2>
            <div class="img-wrap">
                <img class="pixelated" src="${outputRel}" width="256" height="256" alt="Result Stretched">
            </div>
        </div>
    </div>

    <div class="stats">
        Status: ${found ? '✅ MAGENTA BOX DETECTED' : '⚠️ NO MARKER BOX FOUND'}<br>
        Input: ${path.basename(inputPath)}<br>
        Output: ${path.basename(outputPath)}<br>
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
