import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="128" fill="#10b981" />
  <g transform="translate(100, 50) scale(13)" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 28a5 5 0 0 1-5-5v-1.5a2.5 2.5 0 0 1 5 0V23"/><path d="M17 13v3a4 4 0 0 1-8 0v-3"/><path d="M12 3a5 5 0 0 1 5 5v5H7V8a5 5 0 0 1 5-5z"/>
  </g>
  <text x="256" y="450" font-family="system-ui, sans-serif" font-size="64" font-weight="900" fill="#ffffff" text-anchor="middle">DStoma</text>
</svg>
`;

const svgAlt = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="128" fill="#10b981" />
  <g transform="translate(100, 50) scale(13)" stroke="#ffffff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="m14 18 2 4M10 18l-2 4M18 12c0 3.3-2.7 6-6 6s-6-2.7-6-6M12 2c3.3 0 6 2.7 6 6v4H6V8c0-3.3 2.7-6 6-6Z"/>
  </g>
  <text x="256" y="440" font-family="system-ui, sans-serif" font-size="64" font-weight="900" fill="#ffffff" text-anchor="middle">DStoma</text>
</svg>
`;

const svgLucide = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="128" fill="#10b981" />
  <g transform="translate(100, 60) scale(13)" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10 22v-3.5a2.5 2.5 0 0 1 5 0V22"/><path d="M18 12v3a4 4 0 0 1-8 0v-3"/><path d="M12 2a5 5 0 0 1 5 5v5H7V7a5 5 0 0 1 5-5Z"/>
  </g>
  <text x="256" y="440" font-family="system-ui, sans-serif" font-size="64" font-weight="900" fill="#ffffff" text-anchor="middle">DStoma</text>
</svg>
`;

async function main() {
  const buf = Buffer.from(svgLucide);
  await sharp(buf).resize(192, 192).png().toFile(path.join(__dirname, 'public/icon-192.png'));
  await sharp(buf).resize(512, 512).png().toFile(path.join(__dirname, 'public/icon-512.png'));
  console.log("Icons generated successfully");
}

main().catch(err => {
    console.error("Error building icons:", err);
    process.exit(1);
});
