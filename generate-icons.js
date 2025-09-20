const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Input icon path
const inputIcon = path.join(__dirname, 'public', 'icon.png');

// Required icon sizes
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Function to generate icons
async function generateIcons() {
  try {
    // Check if input icon exists
    if (!fs.existsSync(inputIcon)) {
      console.error('Input icon not found at:', inputIcon);
      process.exit(1);
    }

    console.log('Generating icons from:', inputIcon);
    
    // Generate each size
    for (const size of sizes) {
      const outputIcon = path.join(__dirname, 'public', `icon-${size}.png`);
      await sharp(inputIcon)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputIcon);
      
      console.log(`Generated: icon-${size}.png`);
    }
    
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();