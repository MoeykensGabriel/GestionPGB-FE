// Genera los iconos PNG de la PWA sin dependencias externas (solo zlib nativo).
// Diseño: fondo oscuro (marca) + grilla 2x2 de teselas (amarillo/verde, como los
// estados de stock). Re-ejecutar con:  node scripts/generate-icons.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
mkdirSync(OUT, { recursive: true })

// ── PNG encoder (RGBA) ──────────────────────────────────────────────
const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0)
  const t = Buffer.from(type, 'ascii')
  const body = Buffer.concat([t, data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}
function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0 // filtro none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

// ── Drawing helpers (sobre buffer RGBA, opaco) ──────────────────────
function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by) }
function fillRoundRect(buf, W, x, y, w, h, rad, color) {
  const x0 = Math.floor(x), y0 = Math.floor(y)
  const x1 = Math.ceil(x + w), y1 = Math.ceil(y + h)
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      if (xx < 0 || yy < 0 || xx >= W || yy >= W) continue
      const cx = xx + 0.5, cy = yy + 0.5
      if (cx < x || cx > x + w || cy < y || cy > y + h) continue
      let inside = true
      if (cx < x + rad && cy < y + rad) inside = dist(cx, cy, x + rad, y + rad) <= rad
      else if (cx > x + w - rad && cy < y + rad) inside = dist(cx, cy, x + w - rad, y + rad) <= rad
      else if (cx < x + rad && cy > y + h - rad) inside = dist(cx, cy, x + rad, y + h - rad) <= rad
      else if (cx > x + w - rad && cy > y + h - rad) inside = dist(cx, cy, x + w - rad, y + h - rad) <= rad
      if (!inside) continue
      const i = (yy * W + xx) * 4
      buf[i] = color[0]; buf[i + 1] = color[1]; buf[i + 2] = color[2]; buf[i + 3] = color[3]
    }
  }
}

// ── Icon composition ────────────────────────────────────────────────
const BG = [12, 19, 34, 255]   // #0c1322
const Y = [250, 204, 21, 255]  // #facc15 (acento)
const G = [74, 225, 118, 255]  // #4ae176 (stock OK)

function makeIcon(size, { fullBleed }) {
  const SS = 4
  const W = size * SS
  const buf = Buffer.alloc(W * W * 4) // transparente por defecto
  if (fullBleed) fillRoundRect(buf, W, 0, 0, W, W, 0, BG)
  else fillRoundRect(buf, W, 0, 0, W, W, W * 0.22, BG)
  // En maskable (fullBleed) el contenido va mas chico para entrar en la zona segura.
  const contentScale = fullBleed ? 0.56 : 0.64
  const cs = W * contentScale
  const ox = (W - cs) / 2, oy = (W - cs) / 2
  const gap = cs * 0.10
  const tile = (cs - gap) / 2
  const r = tile * 0.24
  const cols = [Y, Y, G, Y] // tl, tr, bl, br
  let i = 0
  for (let ry = 0; ry < 2; ry++)
    for (let rx = 0; rx < 2; rx++) {
      const tx = ox + rx * (tile + gap), ty = oy + ry * (tile + gap)
      fillRoundRect(buf, W, tx, ty, tile, tile, r, cols[i++])
    }
  // Downsample SSxSS -> AA
  const out = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r2 = 0, g2 = 0, b2 = 0, a2 = 0
      for (let dy = 0; dy < SS; dy++)
        for (let dx = 0; dx < SS; dx++) {
          const si = ((y * SS + dy) * W + (x * SS + dx)) * 4
          r2 += buf[si]; g2 += buf[si + 1]; b2 += buf[si + 2]; a2 += buf[si + 3]
        }
      const n = SS * SS, oi = (y * size + x) * 4
      out[oi] = Math.round(r2 / n); out[oi + 1] = Math.round(g2 / n)
      out[oi + 2] = Math.round(b2 / n); out[oi + 3] = Math.round(a2 / n)
    }
  }
  return encodePng(size, size, out)
}

const targets = [
  ['icon-192.png', 192, { fullBleed: false }],
  ['icon-512.png', 512, { fullBleed: false }],
  ['icon-maskable-512.png', 512, { fullBleed: true }],
  ['apple-touch-icon.png', 180, { fullBleed: true }],
]
for (const [name, size, opts] of targets) {
  writeFileSync(join(OUT, name), makeIcon(size, opts))
  console.log('generado', name, `${size}x${size}`)
}
