import { Jimp, intToRGBA } from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagePath = path.join(__dirname, '..', 'res', 'player sprite.png');
const threshold = 10; // Tolerance for color matching

async function cleanSprite() {
  try {
    console.log(`Loading image from: ${imagePath}`);
    const image = await Jimp.read(imagePath);
    
    // Get the background color from the top-left pixel (0, 0)
    const bgColorHex = image.getPixelColor(0, 0);
    const bgRGBA = intToRGBA(bgColorHex);
    console.log(`Detected background color (top-left): R:${bgRGBA.r}, G:${bgRGBA.g}, B:${bgRGBA.b}`);

    let modifiedCount = 0;

    // Iterate over all pixels
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];

      // Check if current pixel color is within the threshold of the background color
      const isMatch = Math.abs(r - bgRGBA.r) <= threshold &&
                      Math.abs(g - bgRGBA.g) <= threshold &&
                      Math.abs(b - bgRGBA.b) <= threshold;

      if (isMatch) {
        // Set alpha to 0 (transparent)
        this.bitmap.data[idx + 3] = 0;
        modifiedCount++;
      }
    });

    console.log(`Made ${modifiedCount} pixels transparent.`);
    
    // Save the modified image, overwriting the original
    await image.write(imagePath);
    console.log('Successfully saved cleaned sprite.');

  } catch (err) {
    console.error('Error processing sprite:', err);
  }
}

cleanSprite();