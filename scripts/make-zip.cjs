const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function createZip() {
  const zip = new JSZip();
  const srcDir = path.join(__dirname, '../telecupole-unofficial-webos');
  const files = fs.readdirSync(srcDir);

  for (const file of files) {
    const filePath = path.join(srcDir, file);
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      const data = fs.readFileSync(filePath);
      zip.file(file, data);
    }
  }

  const publicDir = path.join(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const content = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  const outPath = path.join(publicDir, 'telecupole-unofficial-webos.zip');
  fs.writeFileSync(outPath, content);
  // Also keep legacy alias
  fs.writeFileSync(path.join(publicDir, 'telecupole-webos.zip'), content);
  console.log('Successfully generated:', outPath, content.length, 'bytes');
}

createZip().catch(console.error);
