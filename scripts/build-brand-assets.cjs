// Builds every web logo/icon from the official brand files in public/logos/.
// Run after the brand files change:  node scripts/build-brand-assets.cjs
//
//   public/brand/lockup.png         horizontal logo + tagline, trimmed (light backgrounds)
//   public/brand/lockup-light.png   same, dark text recoloured white (dark backgrounds)
//   public/brand/mark.png           the circular mark alone, trimmed
//   src/app/icon.png                512px site icon            (official mark)
//   src/app/apple-icon.png          180px iOS home-screen icon (mark on white)
//   src/app/favicon.ico             16/32/48px favicon
//   public/icon-192.png, icon-512.png   web-app manifest icons
//   src/app/opengraph-image.png     1200x630 link-preview image (stacked logo)
const sharp = require("sharp");
const fs = require("fs");

const SRC = {
  lockup: "public/logos/brand-logo.png",
  stacked: "public/logos/primary-logo.png",
  mark: "public/logos/logo-mark.png",
};

const trimmed = (file) => sharp(file).trim({ threshold: 10 }).toBuffer();

// The walking figure in the official mark is a transparent cut-out, so on a
// dark background it would take the background's colour. Put a white disc
// under the blue circle so the figure is white wherever the logo is shown.
async function fillFigure(png) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = info.width, y0 = info.height, x1 = 0, y1 = 0;
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 4;
      if (data[i + 3] > 200 && data[i + 2] > 140 && data[i + 2] - data[i] > 50) {
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, r = Math.min(x1 - x0, y1 - y0) / 2 - 1;
  const disc = Buffer.from(`<svg width="${info.width}" height="${info.height}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff"/></svg>`);
  return sharp({ create: { width: info.width, height: info.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: disc }, { input: png }])
    .png()
    .toBuffer();
}

// Flat artwork: an 8-bit palette keeps edges clean at a fraction of the size.
const small = (img) => img.png({ palette: true, quality: 95, effort: 10, compressionLevel: 9 }).toBuffer();

// Square canvas with the mark centred; `pad` is the fraction left empty on each side.
async function markSquare(size, pad, background = { r: 0, g: 0, b: 0, alpha: 0 }) {
  const inner = Math.round(size * (1 - pad * 2));
  const mark = await sharp(await fillFigure(await trimmed(SRC.mark))).resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  const canvas = sharp({ create: { width: size, height: size, channels: 4, background } }).composite([{ input: mark, gravity: "centre" }]);
  // Favicon sizes keep full colour depth; palette dithering shows at 16px.
  return size <= 48 ? canvas.png({ compressionLevel: 9 }).toBuffer() : small(canvas);
}

// Dark, unsaturated pixels (the wordmark and tagline) become white; the blue
// mark and its white figure are left alone. Alpha is preserved, so edges stay smooth.
async function lightVariant(png) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a === 0) continue;
    const blue = b > 140 && b - r > 50; // the mark's blue
    const light = r > 200 && g > 200 && b > 200; // the figure inside the mark
    if (!blue && !light) data[i] = data[i + 1] = data[i + 2] = 255;
  }
  return small(sharp(data, { raw: info }));
}

function ico(pngs, sizes) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = 6 + 16 * sizes.length;
  const entries = sizes.map((s, i) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(s, 0);
    e.writeUInt8(s, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(pngs[i].length, 8);
    e.writeUInt32LE(offset, 12);
    offset += pngs[i].length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...pngs]);
}

(async () => {
  fs.mkdirSync("public/brand", { recursive: true });

  const lockup = await fillFigure(await sharp(await trimmed(SRC.lockup)).resize({ width: 1400 }).png().toBuffer());
  fs.writeFileSync("public/brand/lockup.png", await small(sharp(lockup)));
  fs.writeFileSync("public/brand/lockup-light.png", await lightVariant(lockup));
  fs.writeFileSync("public/brand/mark.png", await markSquare(512, 0));

  fs.writeFileSync("src/app/icon.png", await markSquare(512, 0.02));
  fs.writeFileSync("src/app/apple-icon.png", await markSquare(180, 0.1, { r: 255, g: 255, b: 255, alpha: 1 }));
  fs.writeFileSync("public/icon-192.png", await markSquare(192, 0.02));
  fs.writeFileSync("public/icon-512.png", await markSquare(512, 0.02));

  const sizes = [16, 32, 48];
  const favs = await Promise.all(sizes.map((s) => markSquare(s, 0)));
  fs.writeFileSync("src/app/favicon.ico", ico(favs, sizes));

  const stacked = await sharp(await fillFigure(await trimmed(SRC.stacked))).resize({ height: 380 }).toBuffer();
  fs.writeFileSync(
    "src/app/opengraph-image.png",
    await sharp({ create: { width: 1200, height: 630, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
      .composite([{ input: stacked, gravity: "centre" }])
      .png({ compressionLevel: 9 })
      .toBuffer()
      .then((b) => small(sharp(b))),
  );

  for (const f of ["public/brand/lockup.png", "public/brand/lockup-light.png", "public/brand/mark.png", "src/app/icon.png", "src/app/apple-icon.png", "src/app/favicon.ico", "public/icon-192.png", "public/icon-512.png", "src/app/opengraph-image.png"]) {
    const m = f.endsWith(".ico") ? { width: "16/32/48" } : await sharp(f).metadata();
    console.log(f.padEnd(34), `${m.width}${m.height ? "x" + m.height : ""}`.padEnd(10), `${(fs.statSync(f).size / 1024).toFixed(0)} KB`);
  }
})();
