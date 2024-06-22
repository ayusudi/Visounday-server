const axios = require('axios');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
async function downloadImage(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data, 'binary');
}

async function createCollage(imageUrls, name, collageWidth = 800, collageHeight = 400) {
  const canvas = createCanvas(collageWidth, collageHeight);
  const ctx = canvas.getContext('2d');

  // Set background color to navy
  ctx.fillStyle = '#090C30';
  ctx.fillRect(0, 0, collageWidth, collageHeight);

  const images = await Promise.all(imageUrls.map(async (url) => {
    const imgData = await downloadImage(url);
    return { data: imgData, image: await loadImage(imgData) };
  }));

  const layout = { cols: 4, rows: 2 };
  const imageWidth = 200;
  const imageHeight = 200;
  images.forEach(({ image }, index) => {
    const row = Math.floor(index / layout.cols);
    const col = index % layout.cols;
    const offsetX = (collageWidth - layout.cols * imageWidth) / 2;
    const offsetY = (collageHeight - layout.rows * imageHeight) / 2;

    // Calculate cropping dimensions to fit within 200x200 square
    let cropX = 0;
    let cropY = 0;
    let cropWidth = image.width;
    let cropHeight = image.height;

    const aspectRatio = image.width / image.height;

    if (aspectRatio > 1) {
      // Landscape image
      cropWidth = Math.min(image.width, image.height * aspectRatio);
      cropX = (image.width - cropWidth) / 2;
    } else {
      // Portrait or square image
      cropHeight = Math.min(image.height, image.width / aspectRatio);
      cropY = (image.height - cropHeight) / 2;
    }

    ctx.drawImage(
      image,
      cropX, cropY, cropWidth, cropHeight, // Source image rectangle (cropped)
      col * imageWidth + offsetX, row * imageHeight + offsetY, imageWidth, imageHeight // Destination canvas rectangle
    );
  });

  const out = fs.createWriteStream(`${name}.png`);
  const stream = canvas.createPNGStream();
  stream.pipe(out);
  return `${name}.png`
}

module.exports = createCollage