import { Jimp, intToRGBA } from 'jimp';
import path from 'path';

const magentaThreshold = 100;
const magentaTarget = { r: 255, g: 0, b: 255 };

function isMagentaish(r, g, b) {
  return Math.abs(r - magentaTarget.r) <= magentaThreshold && 
         Math.abs(g - magentaTarget.g) <= magentaThreshold && 
         Math.abs(b - magentaTarget.b) <= magentaThreshold;
}

async function verify(fileName) {
  const filePath = path.join(process.cwd(), 'res', fileName);
  try {
    const image = await Jimp.read(filePath);
    const w = image.bitmap.width;
    const h = image.bitmap.height;
    
    console.log(`Verifying ${fileName} (${w}x${h})...`);
    
    let magentaAtBorder = 0;
    
    // Check top and bottom rows
    for (let x = 0; x < w; x++) {
      const t = intToRGBA(image.getPixelColor(x, 0));
      const b = intToRGBA(image.getPixelColor(x, h - 1));
      if (isMagentaish(t.r, t.g, t.b)) magentaAtBorder++;
      if (isMagentaish(b.r, b.g, b.b)) magentaAtBorder++;
    }
    
    // Check left and right columns
    for (let y = 0; y < h; y++) {
      const l = intToRGBA(image.getPixelColor(0, y));
      const r = intToRGBA(image.getPixelColor(w - 1, y));
      if (isMagentaish(l.r, l.g, l.b)) magentaAtBorder++;
      if (isMagentaish(r.r, r.g, r.b)) magentaAtBorder++;
    }
    
    if (magentaAtBorder > 0) {
      console.log(`FAILED: Found ${magentaAtBorder} magenta-ish pixels at the border.`);
    } else {
      console.log(`SUCCESS: No magenta-ish pixels found at the border.`);
    }
  } catch (err) {
    console.error(`Error verifying ${fileName}:`, err.message);
  }
}

const file = process.argv[2];
if (file) {
  verify(file);
} else {
  console.log("Usage: node scripts/verify-crop.js <filename>");
}
