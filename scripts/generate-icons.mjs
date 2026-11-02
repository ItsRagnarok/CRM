import sharp from "sharp";
import { writeFile } from "node:fs/promises";

const source = process.argv[2];
if (!source) throw new Error("Pass the original 1536×1024 ElectroField logo JPEG.");
// Clip the existing symbol, excluding the Field wordmark. Preserve its exact pixels.
const mask = Buffer.from('<svg width="1536" height="1024"><polygon fill="white" points="603,269 863,388 863,660 608,819 346,688 346,399"/></svg>');
const clipped = await sharp(source).ensureAlpha().composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
const logo = await sharp(clipped).extract({ left: 340, top: 260, width: 530, height: 568 }).resize(448, 448, { fit: "contain", background: "#000" }).png().toBuffer();
const png = await sharp({ create: { width: 512, height: 512, channels: 4, background: "#000" } }).composite([{ input: logo, left: 32, top: 32 }]).png().toBuffer();
for (const [name, size] of [["src/app/icon.png", 512], ["public/icon-512.png", 512], ["public/icon-192.png", 192], ["src/app/apple-icon.png", 180], ["public/favicon-32.png", 32], ["public/favicon-48.png", 48]]) await sharp(png).resize(size, size).png().toFile(name);
const sizes = [16, 32, 48];
const buffers = await Promise.all(sizes.map((size) => sharp(png).resize(size, size).png().toBuffer()));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
buffers.forEach((buffer, i) => { const p = 6 + 16 * i; header[p] = sizes[i]; header[p + 1] = sizes[i]; header.writeUInt16LE(1, p + 4); header.writeUInt16LE(32, p + 6); header.writeUInt32LE(buffer.length, p + 8); header.writeUInt32LE(offset, p + 12); offset += buffer.length; });
await writeFile("src/app/favicon.ico", Buffer.concat([header, ...buffers]));
console.log("Generated favicon ICO 16/32/48, PNG 32/48/192/512 and Apple icon.");
