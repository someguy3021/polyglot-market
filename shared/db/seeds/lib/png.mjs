// Минимальный PNG-энкодер без зависимостей: truecolor RGB, фильтр 0 на строку.
// Достаточно для демонстрационных картинок товаров (градиенты, без текста).
import { deflateSync } from "node:zlib";

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = ~0;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** PNG из пиксельного буфера RGB (row-major, по 3 байта на пиксель). */
export function encodePng(width, height, rgb) {
  if (rgb.length !== width * height * 3) throw new Error("png: буфер не совпадает с размером");
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 3);
    raw[rowStart] = 0; // filter: none
    rgb.copy(raw, rowStart + 1, y * width * 3, (y + 1) * width * 3);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// Детерминированный ГПСЧ (mulberry32)
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Демонстрационная картинка: диагональный градиент двух цветов + полосы/круг по seed. */
export function productImage(seed, width, height) {
  const rand = rng(seed);
  const hue1 = Math.floor(rand() * 360);
  const hue2 = (hue1 + 40 + Math.floor(rand() * 200)) % 360;
  const [r1, g1, b1] = hslToRgb(hue1 / 360, 0.55, 0.5);
  const [r2, g2, b2] = hslToRgb(hue2 / 360, 0.55, 0.35);
  const stripes = rand() > 0.5;
  const circleR = 0.25 + rand() * 0.2;
  const rgb = Buffer.alloc(width * height * 3);
  const cx = width * (0.35 + rand() * 0.3);
  const cy = height * (0.35 + rand() * 0.3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const t = (x / width + y / height) / 2;
      let r = r1 + (r2 - r1) * t;
      let g = g1 + (g2 - g1) * t;
      let b = b1 + (b2 - b1) * t;
      if (stripes && (x + y) % 32 < 4) {
        r *= 0.85;
        g *= 0.85;
        b *= 0.85;
      }
      const d = Math.hypot(x - cx, y - cy);
      if (d < circleR * Math.min(width, height)) {
        r = 255 - r * 0.3;
        g = 255 - g * 0.3;
        b = 255 - b * 0.3;
      }
      const i = (y * width + x) * 3;
      rgb[i] = Math.round(r);
      rgb[i + 1] = Math.round(g);
      rgb[i + 2] = Math.round(b);
    }
  }
  return encodePng(width, height, rgb);
}

function hslToRgb(h, s, l) {
  const f = (n) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    return (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255;
  };
  return [f(0), f(8), f(4)];
}
