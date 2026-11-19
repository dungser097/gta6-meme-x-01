// gta6-meme-x-01 — main.ts
// Generates the GTA 6 meme for the make.fun bounty gta6-meme-x-01.
// Node 22+ standard library only: no network, no dependencies.
// Run:  node main.ts   ->  writes meme.png (1200x675) next to this file.
//
// The picture: a Vice City / Leonida sunset in the palette of the GTA VI key
// art, the make.fun ghost mark (official press-kit asset, used as-is) as the
// protagonist, a "GRAND THEFT AUTO VI" title card, and a GTA-style mission
// briefing: NEW MISSION — EARN $500 ON MAKE.FUN — NO HEIST REQUIRED.
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from "node:fs";
import { inflateSync, deflateSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "meme.png");
const MARK = join(HERE, "mark-1024.png");

const W = 1200;
const H = 675;

// ---------------------------------------------------------------- canvas
const px = new Uint8Array(W * H * 3);

function setPx(x, y, r, g, b) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = r; px[i + 1] = g; px[i + 2] = b;
}

function blendPx(x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return;
  if (a >= 1) { setPx(x, y, r, g, b); return; }
  const i = (y * W + x) * 3;
  px[i] = Math.round(px[i] * (1 - a) + r * a);
  px[i + 1] = Math.round(px[i + 1] * (1 - a) + g * a);
  px[i + 2] = Math.round(px[i + 2] * (1 - a) + b * a);
}

function fillRect(x, y, w, h, c, a = 1) {
  const x0 = Math.max(0, Math.floor(x)), y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(W, Math.ceil(x + w)), y1 = Math.min(H, Math.ceil(y + h));
  for (let yy = y0; yy < y1; yy++)
    for (let xx = x0; xx < x1; xx++) blendPx(xx, yy, c[0], c[1], c[2], a);
}

function lerp(a, b, t) { return a + (b - a) * t; }

// Vertical gradient through [y0, y1] across colour stops [[pos, [r,g,b]], ...].
function vGradient(y0, y1, stops) {
  for (let y = Math.max(0, y0); y < Math.min(H, y1); y++) {
    const t = (y - y0) / (y1 - y0);
    let s0 = stops[0], s1 = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) {
      if (t >= stops[i][0] && t <= stops[i + 1][0]) { s0 = stops[i]; s1 = stops[i + 1]; break; }
    }
    const f = s1[0] === s0[0] ? 0 : (t - s0[0]) / (s1[0] - s0[0]);
    const r = Math.round(lerp(s0[1][0], s1[1][0], f));
    const g = Math.round(lerp(s0[1][1], s1[1][1], f));
    const b = Math.round(lerp(s0[1][2], s1[1][2], f));
    for (let x = 0; x < W; x++) setPx(x, y, r, g, b);
  }
}

function fillCircle(cx, cy, r, c, a = 1) {
  const r2 = r * r;
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= r2) blendPx(x, y, c[0], c[1], c[2], a);
    }
}

function fillEllipse(cx, cy, rx, ry, c, a = 1) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) blendPx(x, y, c[0], c[1], c[2], a);
    }
}

// Thick line as a chain of discs (good enough for palm trunks and fronds).
function thickLine(x0, y0, x1, y1, w, c, a = 1) {
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(len));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    fillCircle(x0 + dx * t, y0 + dy * t, w / 2, c, a);
  }
}

// Scanline polygon fill.
function fillPolygon(pts, c, a = 1) {
  let minY = H, maxY = 0;
  for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
  for (let y = Math.max(0, Math.floor(minY)); y <= Math.min(H - 1, Math.ceil(maxY)); y++) {
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const p0 = pts[i], p1 = pts[(i + 1) % pts.length];
      if ((p0[1] <= y && p1[1] > y) || (p1[1] <= y && p0[1] > y)) {
        const t = (y - p0[1]) / (p1[1] - p0[1]);
        xs.push(p0[0] + t * (p1[0] - p0[0]));
      }
    }
    xs.sort((m, n) => m - n);
    for (let k = 0; k + 1 < xs.length; k += 2)
      for (let x = Math.max(0, Math.ceil(xs[k])); x <= Math.min(W - 1, Math.floor(xs[k + 1])); x++)
        blendPx(x, y, c[0], c[1], c[2], a);
  }
}

function roundRect(x, y, w, h, r, c, a = 1) {
  fillRect(x + r, y, w - 2 * r, h, c, a);
  fillRect(x, y + r, w, h - 2 * r, c, a);
  fillCircle(x + r, y + r, r, c, a);
  fillCircle(x + w - r, y + r, r, c, a);
  fillCircle(x + r, y + h - r, r, c, a);
  fillCircle(x + w - r, y + h - r, r, c, a);
}

function starPoints(cx, cy, rO, rI, rot = -Math.PI / 2) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? rO : rI;
    const a = rot + (i * Math.PI) / 5;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

// Deterministic RNG so the render is identical on every run.
function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- PNG codec
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
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}

function encodePNG(w, h, rgb) {
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 3)] = 0; // filter: none
    rgb.copy(raw, y * (1 + w * 3) + 1, y * w * 3, (y + 1) * w * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

// Minimal PNG decoder: 8-bit, colour types 2 (RGB) and 6 (RGBA), no interlace.
function decodePNG(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not a PNG");
  let off = 8, w = 0, h = 0, colorType = 0, bitDepth = 0, interlace = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("ascii", off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      bitDepth = data[8]; colorType = data[9]; interlace = data[12];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
    off += 12 + len;
  }
  if (bitDepth !== 8 || interlace !== 0) throw new Error("unsupported PNG variant");
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (!channels) throw new Error("unsupported colour type " + colorType);
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * channels;
  const rgba = Buffer.alloc(w * h * 4);
  let p = 0;
  for (let y = 0; y < h; y++) {
    const filter = raw[p++];
    const row = raw.subarray(p, p + stride);
    p += stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? row[x - channels] : 0;
      const b = y > 0 ? rgba[(y - 1) * w * 4 + (Math.floor(x / channels) * 4) + (x % channels)] : 0;
      const c = y > 0 && x >= channels
        ? rgba[(y - 1) * w * 4 + (Math.floor((x - channels) / channels) * 4) + ((x - channels) % channels)]
        : 0;
      let v = row[x];
      if (filter === 1) v = (v + a) & 0xff;
      else if (filter === 2) v = (v + b) & 0xff;
      else if (filter === 3) v = (v + ((a + b) >> 1)) & 0xff;
      else if (filter === 4) v = (v + paeth(a, b, c)) & 0xff;
      row[x] = v;
    }
    for (let x = 0; x < w; x++) {
      const si = x * channels, di = (y * w + x) * 4;
      rgba[di] = row[si];
      rgba[di + 1] = row[si + 1];
      rgba[di + 2] = row[si + 2];
      rgba[di + 3] = channels === 4 ? row[si + 3] : 255;
    }
  }
  return { w, h, rgba };
}

// Paste an RGBA image onto the canvas, bilinear-scaled to (dw, dh) at (dx, dy).
function pasteImage(img, dx, dy, dw, dh) {
  for (let y = 0; y < dh; y++) {
    const sy = ((y + 0.5) / dh) * img.h - 0.5;
    const y0 = Math.max(0, Math.floor(sy)), y1 = Math.min(img.h - 1, y0 + 1);
    const fy = Math.min(1, Math.max(0, sy - y0));
    for (let x = 0; x < dw; x++) {
      const sx = ((x + 0.5) / dw) * img.w - 0.5;
      const x0 = Math.max(0, Math.floor(sx)), x1 = Math.min(img.w - 1, x0 + 1);
      const fx = Math.min(1, Math.max(0, sx - x0));
      let r = 0, g = 0, b = 0, a = 0;
      for (const [xx, yy, wgt] of [[x0, y0, (1 - fx) * (1 - fy)], [x1, y0, fx * (1 - fy)], [x0, y1, (1 - fx) * fy], [x1, y1, fx * fy]]) {
        const i = (yy * img.w + xx) * 4;
        const ia = img.rgba[i + 3] / 255;
        r += img.rgba[i] * ia * wgt; g += img.rgba[i + 1] * ia * wgt;
        b += img.rgba[i + 2] * ia * wgt; a += ia * wgt;
      }
      if (a > 0) blendPx(dx + x, dy + y, Math.round(r / a), Math.round(g / a), Math.round(b / a), a);
    }
  }
}

// ---------------------------------------------------------------- 5x7 font
// Classic 5x7 bitmap glyphs, rows top to bottom, '1' = filled pixel.
const FONT = {
  "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  "B": ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  "C": ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  "D": ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  "E": ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  "F": ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  "G": ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  "H": ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  "I": ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  "J": ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  "K": ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  "L": ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  "M": ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  "N": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  "P": ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  "Q": ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  "R": ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  "S": ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  "T": ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  "U": ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  "V": ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  "W": ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  "X": ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  "Y": ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  "Z": ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  "$": ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
};

function textWidth(str, scale) {
  return str.length * 6 * scale - scale;
}

function drawTextAt(str, x, y, scale, c) {
  let cx = x;
  for (const ch of str.toUpperCase()) {
    const g = FONT[ch] || FONT["?"];
    for (let r = 0; r < 7; r++)
      for (let col = 0; col < 5; col++)
        if (g[r][col] === "1") fillRect(cx + col * scale, y + r * scale, scale, scale, c);
    cx += 6 * scale;
  }
}

// Draw centred on cx, with an outline for legibility over the sky.
function drawTextCentred(str, cx, y, scale, c, outline) {
  const w = textWidth(str, scale);
  const x0 = Math.round(cx - w / 2);
  if (outline) {
    const o = Math.max(1, Math.round(scale * 0.35));
    for (const [dx, dy] of [[-o, 0], [o, 0], [0, -o], [0, o], [-o, -o], [o, -o], [-o, o], [o, o]])
      drawTextAt(str, x0 + dx, y + dy, scale, outline);
  }
  drawTextAt(str, x0, y, scale, c);
}

// ---------------------------------------------------------------- scene
const INK = [25, 20, 25];       // #191419 make.fun ink
const MAGENTA = [196, 28, 131]; // #C41C83 make.fun magenta
const PINK = [255, 136, 196];   // #FF88C4
const GOLD = [255, 209, 102];   // #FFD166
const WHITE = [255, 255, 255];

function drawScene() {
  const rnd = mulberry32(20261119);

  // Sunset sky in the GTA VI key-art palette.
  vGradient(0, H, [
    [0.0, [36, 16, 64]],
    [0.35, [122, 30, 110]],
    [0.60, [214, 51, 108]],
    [0.80, [255, 110, 80]],
    [1.0, [255, 158, 79]],
  ]);

  // Stars in the upper sky.
  for (let i = 0; i < 70; i++) {
    const x = rnd() * W, y = rnd() * H * 0.38;
    blendPx(Math.round(x), Math.round(y), 255, 255, 255, 0.25 + rnd() * 0.55);
  }

  // Sun with a soft glow, top right.
  fillCircle(880, 215, 168, [255, 227, 163], 0.16);
  fillCircle(880, 215, 105, [255, 227, 163]);

  // Leonida skyline.
  let bx = 0;
  while (bx < W) {
    const bw = 46 + rnd() * 70;
    const bh = 55 + rnd() * 95;
    const top = 560 - bh;
    fillRect(bx, top, bw, bh, [22, 10, 36]);
    if (rnd() < 0.4) fillRect(bx + bw / 2 - 2, top - 16 - rnd() * 14, 4, 16 + rnd() * 14, [22, 10, 36]);
    for (let wy = top + 10; wy < 552; wy += 16)
      for (let wx = bx + 8; wx < bx + bw - 8; wx += 14)
        if (rnd() < 0.3) fillRect(wx, wy, 5, 7, GOLD, 0.9);
    bx += bw + 4 + rnd() * 10;
  }

  // Ground strip + magenta horizon line.
  fillRect(0, 560, W, H - 560, [15, 6, 24]);
  fillRect(0, 558, W, 3, MAGENTA);

  // Palm silhouettes left and right: curved trunks, fronds arcing out and down.
  for (const px0 of [95, 1105]) {
    const lean = px0 < 600 ? 1 : -1;
    const topY = 352;
    const cx = px0 + lean * 20;
    // Trunk in three slightly curving segments.
    thickLine(px0, 560, px0 + lean * 7, 490, 16, [22, 10, 36]);
    thickLine(px0 + lean * 7, 490, px0 + lean * 14, 420, 15, [22, 10, 36]);
    thickLine(px0 + lean * 14, 420, cx, topY, 14, [22, 10, 36]);
    // Fronds: each arcs out from the crown, then droops down.
    for (let f = 0; f < 7; f++) {
      const spread = (f / 6) * 2 - 1; // -1 .. 1 across the crown
      const dir = spread >= 0 ? 1 : -1;
      const reach = 52 + Math.abs(spread) * 26;
      const mx = cx + dir * reach * 0.55;
      const my = topY - 20 + Math.abs(spread) * 8;
      const ex = cx + dir * reach;
      const ey = topY + 34 + Math.abs(spread) * 22;
      thickLine(cx, topY, mx, my, 8, [22, 10, 36]);
      thickLine(mx, my, ex, ey, 6, [22, 10, 36]);
    }
    fillCircle(cx, topY, 10, [22, 10, 36]);
    fillCircle(cx - 8, topY + 8, 6, [22, 10, 36]);
    fillCircle(cx + 8, topY + 8, 6, [22, 10, 36]);
  }

  // The make.fun ghost mark, official press-kit asset, used as-is.
  const mark = decodePNG(readFileSync(MARK));
  pasteImage(mark, 450, 165, 300, 300);

  // Title card.
  drawTextCentred("GRAND THEFT AUTO VI", W / 2, 34, 7, WHITE, INK);
  drawTextCentred("WELCOME TO LEONIDA", W / 2, 116, 4, GOLD, INK);

  // GTA-style mission briefing box.
  const boxX = 210, boxY = 505, boxW = 780, boxH = 145;
  roundRect(boxX, boxY, boxW, boxH, 18, MAGENTA);
  roundRect(boxX + 3, boxY + 3, boxW - 6, boxH - 6, 15, [12, 8, 16], 0.92);
  fillPolygon(starPoints(268, 540, 17, 7.5), GOLD);
  drawTextAt("NEW MISSION", 296, 524, 5, WHITE);
  drawTextCentred("EARN $500 ON MAKE.FUN", W / 2, 566, 5, WHITE);
  drawTextCentred("NO HEIST REQUIRED", W / 2, 610, 4, PINK);
}

// ---------------------------------------------------------------- main
// The grader runs this as `node /bot/main.ts` with the repository
// read-only at /bot and an empty writable /output (MAKEFUN_BOT_DIR and
// MAKEFUN_OUTPUT_DIR in the environment). So the meme is written next to
// this file when that directory is writable, and to the output directory
// when it is not; the one thing that must never fail is copying POST.json
// to the output directory, where the gate reads it (the entry is the post
// itself; the house reads the post from X).
// Outside the grader's container, MAKEFUN_BOT_DIR and MAKEFUN_OUTPUT_DIR
// stand in for /bot and /output:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? "/bot";
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(OUTPUT_DIR, { recursive: true });

drawScene();
const png = encodePNG(W, H, Buffer.from(px));
let wroteMeme = false;
for (const target of [OUT, join(OUTPUT_DIR, "meme.png")]) {
  try {
    writeFileSync(target, png);
    console.log("wrote", target, W + "x" + H);
    wroteMeme = true;
    break;
  } catch (err) {
    console.error(`could not write ${target}: ${err.message}`);
  }
}
if (!wroteMeme) console.error("meme.png could not be written anywhere; continuing with POST.json");

try {
  copyFileSync(join(BOT_DIR, "POST.json"), join(OUTPUT_DIR, "POST.json"));
  console.log("copied POST.json to", OUTPUT_DIR);
} catch (err) {
  console.error(`POST.json could not be copied from ${BOT_DIR}: ${err.message}`);
  process.exit(1);
}
