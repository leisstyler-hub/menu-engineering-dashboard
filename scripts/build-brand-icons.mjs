// Rebuild raster app icons from the approved clean SVG, using the project's browser runtime.
import { chromium } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  // One approved lockup for both web and OS launch surfaces. Do not rearrange its words.
  const logo = await readFile(resolve(root, "public/brand/compass-one-culinary.svg"), "utf8");
  const artwork = logo.replace(/^<svg\b[^>]*>/, "").replace(/<\/svg>\s*$/, "").trim();
  const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Compass One Culinary">
  <rect width="512" height="512" fill="#151719"/>
  <g transform="translate(46 186.7) scale(.42)">${artwork}</g>
</svg>\n`;
  await writeFile(resolve(root, "public/brand/compass-one-culinary-icon.svg"), icon);
  for (const [size, filename] of [[180, "apple-touch-icon.png"], [192, "android-chrome-192x192.png"], [512, "android-chrome-512x512.png"]]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>body{margin:0}svg{display:block;width:100vw;height:100vh}</style>${icon}`);
    await page.screenshot({ path: resolve(root, "public", filename) });
  }
  // At favicon sizes the gold 'one' circle is more legible than the full lockup.
  const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#151719"/><circle cx="32" cy="32" r="29" fill="#b99b55"/><text x="31" y="42" fill="white" font-family="Arial,Helvetica,sans-serif" font-size="31" text-anchor="middle" letter-spacing="-1">one</text></svg>`;
  const pngs = [];
  for (const size of [16, 32, 48]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>body{margin:0}svg{display:block;width:100vw;height:100vh}</style>${favicon}`);
    const png = await page.screenshot();
    pngs.push({ size, png });
    if (size !== 48) await writeFile(resolve(root, `public/favicon-${size}x${size}.png`), png);
  }
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach(({ size, png }, index) => {
    const entry = 6 + index * 16;
    header[entry] = header[entry + 1] = size;
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  await writeFile(resolve(root, "public/favicon.ico"), Buffer.concat([header, ...pngs.map(({ png }) => png)]));
  console.log("Built Apple, Android/PWA and favicon assets from the clean Compass One Culinary artwork.");
} finally {
  await browser.close();
}
