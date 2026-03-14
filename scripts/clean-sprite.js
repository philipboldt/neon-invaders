import { Jimp, intToRGBA } from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Process command line arguments
const args = process.argv.slice(2);
const bigThresholdIndex = args.indexOf('--bigthreshold');
let cleaningThreshold = 30; // For background transparency removal
let useGreenHeuristic = false;

if (bigThresholdIndex !== -1) {
  args.splice(bigThresholdIndex, 1);
  cleaningThreshold = 130; // Balanced threshold
  useGreenHeuristic = true;
  console.log('Using big threshold (130) and Green-Screen heuristic for background cleaning.');
}

// Get the filename from command line arguments, default to 'player sprite.png'
const fileName = args[0] || 'player sprite.png';
const imagePath = path.isAbsolute(fileName) ? fileName : path.join(__dirname, '..', 'res', fileName);

// Identification thresholds
const magentaThreshold = 120; // For detecting the outer AI magenta border
const magentaTarget = { r: 255, g: 0, b: 255 };

function isColorMatch(r, g, b, target, tol) {
  return Math.abs(r - target.r) <= tol && 
         Math.abs(g - target.g) <= tol && 
         Math.abs(b - target.b) <= tol;
}

function isMagentaish(r, g, b) {
  return isColorMatch(r, g, b, magentaTarget, magentaThreshold);
}

async function cleanSprite() {
  try {
    console.log(`Loading image from: ${imagePath}`);
    let image = await Jimp.read(imagePath);
    
    // STEP 1: Find outer bounds of the magenta border
    let outerMinX = image.bitmap.width, outerMaxX = -1, outerMinY = image.bitmap.height, outerMaxY = -1;
    let foundOuter = false;

    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      if (isMagentaish(this.bitmap.data[idx], this.bitmap.data[idx + 1], this.bitmap.data[idx + 2])) {
        if (x < outerMinX) outerMinX = x;
        if (x > outerMaxX) outerMaxX = x;
        if (y < outerMinY) outerMinY = y;
        if (y > outerMaxY) outerMaxY = y;
        foundOuter = true;
      }
    });

    if (foundOuter) {
      console.log(`Outer bounds: minX:${outerMinX}, minY:${outerMinY}, maxX:${outerMaxX}, maxY:${outerMaxY}`);
      
      // STEP 2: Use a fixed empirical border thickness to bypass all noise
      const empiricalThickness = 40; 
      
      const innerMinX = outerMinX + empiricalThickness;
      const innerMaxX = outerMaxX - empiricalThickness;
      const innerMinY = outerMinY + empiricalThickness;
      const innerMaxY = outerMaxY - empiricalThickness;

      const cropW = innerMaxX - innerMinX + 1;
      const cropH = innerMaxY - innerMinY + 1;

      console.log(`Cropping to empirical interior: x:${innerMinX}, y:${innerMinY}, w:${cropW}, h:${cropH}`);
      image = image.crop({ x: innerMinX, y: innerMinY, w: cropW, h: cropH });
      
      // STEP 3: Verification
      let cropFailed = false;
      const newW = image.bitmap.width;
      const newH = image.bitmap.height;

      for (let x = 0; x < newW; x++) {
        const topC = intToRGBA(image.getPixelColor(x, 0));
        const botC = intToRGBA(image.getPixelColor(x, newH - 1));
        if (isMagentaish(topC.r, topC.g, topC.b) || isMagentaish(botC.r, botC.g, botC.b)) {
          cropFailed = true; break;
        }
      }
      if (!cropFailed) {
        for (let y = 0; y < newH; y++) {
          const leftC = intToRGBA(image.getPixelColor(0, y));
          const rightC = intToRGBA(image.getPixelColor(newW - 1, y));
          if (isMagentaish(leftC.r, leftC.g, leftC.b) || isMagentaish(rightC.r, rightC.g, rightC.b)) {
            cropFailed = true; break;
          }
        }
      }

      if (cropFailed) console.warn("WARNING: Verification Failed! Magenta pixels found on borders.");
      else console.log("Verification Passed.");

      // STEP 4: Detect true background color by sampling the top-left area
      const colorCounts = {};
      const sampleSize = 20;
      
      for (let x = 0; x < Math.min(newW, sampleSize); x++) {
          for (let y = 0; y < Math.min(newH, sampleSize); y++) {
              const c = intToRGBA(image.getPixelColor(x, y));
              const key = `${Math.round(c.r/5)*5},${Math.round(c.g/5)*5},${Math.round(c.b/5)*5}`;
              if (!colorCounts[key]) colorCounts[key] = { count: 0, r: c.r, g: c.g, b: c.b };
              colorCounts[key].count++;
          }
      }

      let maxCount = 0;
      let bgRGBA = { r: 0, g: 0, b: 0 };
      for (const key in colorCounts) {
          if (colorCounts[key].count > maxCount) {
              maxCount = colorCounts[key].count;
              bgRGBA = { r: colorCounts[key].r, g: colorCounts[key].g, b: colorCounts[key].b };
          }
      }

      console.log(`Detected background color to remove (sampled): R:${bgRGBA.r}, G:${bgRGBA.g}, B:${bgRGBA.b}`);

      let bgCount = 0;

      // STEP 5: Apply transparency
      image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];

        // Option 1: Match the detected color within threshold
        const isColorMatchResult = isColorMatch(r, g, b, bgRGBA, cleaningThreshold);
        
        // Option 2: Heuristic Green Screen (Green is much larger than Red and Blue)
        const isGreenHeuristic = useGreenHeuristic && (g > r + 100 && g > b + 100);

        if (isColorMatchResult || isGreenHeuristic) {
          this.bitmap.data[idx + 3] = 0;
          bgCount++;
        }
      });

      console.log(`Made ${bgCount} background pixels transparent.`);
      
      // STEP 6: Resize to 48x48
      console.log('Resizing sprite to 48x48...');
      image = image.resize({ w: 48, h: 48 });

      // Save
      const ext = path.extname(imagePath);
      const base = path.join(path.dirname(imagePath), path.basename(imagePath, ext));
      const outputPath = `${base}_cleaned${ext}`;

      await image.write(outputPath);
      console.log(`Successfully saved cleaned sprite to: ${outputPath}`);
    } else {
      console.log('No magenta border detected.');
    }

  } catch (err) {
    console.error('Error processing sprite:', err);
  }
}

cleanSprite();
