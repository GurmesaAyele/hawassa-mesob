/**
 * Standalone QR Code Generator in pure JavaScript (Zero external dependencies)
 * Generates ISO/IEC 18004 compliant QR Codes and exports as Data URI / SVG.
 */

// GF(256) Galois Field with primitive polynomial 0x11D (285)
const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);
for (let i = 0, x = 1; i < 255; i++) {
  EXP_TABLE[i] = x;
  EXP_TABLE[i + 255] = x;
  LOG_TABLE[x] = i;
  x = (x << 1) ^ (x & 128 ? 0x11d : 0);
}

function gfMul(x, y) {
  if (x === 0 || y === 0) return 0;
  return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
}

// Reed-Solomon polynomial division
function rsComputeRemainder(data, ecCount) {
  // Compute generator polynomial
  const gen = new Uint8Array(ecCount);
  gen[0] = 1;
  for (let i = 0; i < ecCount; i++) {
    const root = EXP_TABLE[i];
    for (let j = ecCount - 1; j >= 0; j--) {
      gen[j] = gfMul(gen[j], root) ^ (j > 0 ? gen[j - 1] : 0);
    }
  }

  // Remainder
  const rem = new Uint8Array(ecCount);
  for (const byte of data) {
    const factor = byte ^ rem[0];
    for (let j = 0; j < ecCount - 1; j++) {
      rem[j] = rem[j + 1] ^ gfMul(gen[ecCount - 1 - j], factor);
    }
    rem[ecCount - 1] = gfMul(gen[0], factor);
  }
  return rem;
}

// Table of QR Code Version parameters (Level M error correction)
// [version, totalCodewords, ecCodewords, ecBlocksGroup1, dataCodewordsG1, ecBlocksG2, dataCodewordsG2, [alignPos]]
const VERSION_PARAMS = [
  null,
  [1, 26, 10, 1, 16, 0, 0, []],
  [2, 44, 16, 1, 28, 0, 0, [6, 18]],
  [3, 70, 26, 1, 44, 0, 0, [6, 22]],
  [4, 100, 36, 2, 32, 0, 0, [6, 26]],
  [5, 134, 48, 2, 43, 0, 0, [6, 30]],
  [6, 172, 64, 4, 27, 0, 0, [6, 34]],
  [7, 196, 72, 4, 31, 0, 0, [6, 22, 38]],
];

// Format info bits for Level M (00) with masks 0..7 (already BCH encoded and XOR masked with 0x5412 per ISO/IEC 18004)
const FORMAT_INFO = [
  0x5412, // mask 0
  0x5125, // mask 1
  0x5e7c, // mask 2
  0x5b4b, // mask 3
  0x45f9, // mask 4
  0x40ce, // mask 5
  0x4f97, // mask 6
  0x4aa0, // mask 7
];

export function encodeQrSvg(text) {
  const bytes = Buffer.from(text, "utf8");

  // Find lowest version that fits
  let selected = null;
  for (let v = 1; v <= 7; v++) {
    const p = VERSION_PARAMS[v];
    const totalData = p[3] * p[4] + p[5] * p[6];
    // 4 bits mode + 8 bits char count + data bytes
    const requiredBits = 4 + 8 + bytes.length * 8;
    if (requiredBits <= totalData * 8) {
      selected = p;
      break;
    }
  }

  if (!selected) {
    throw new Error(`Data too long for compact QR generator (${bytes.length} bytes)`);
  }

  const [version, totalCodewords, ecTotal, g1Blocks, g1Data, g2Blocks, g2Data, alignPos] = selected;
  const totalDataBytes = g1Blocks * g1Data + g2Blocks * g2Data;

  // Build bitstream
  const bits = [];
  function pushBits(val, len) {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >>> i) & 1);
    }
  }

  // Byte mode indicator: 0100
  pushBits(0b0100, 4);
  // Character count (8 bits for v1-9)
  pushBits(bytes.length, 8);
  // Data bytes
  for (const b of bytes) {
    pushBits(b, 8);
  }
  // Terminator: up to 4 zero bits
  const maxDataBits = totalDataBytes * 8;
  const termLen = Math.min(4, maxDataBits - bits.length);
  pushBits(0, termLen);
  // Pad to byte boundary
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }
  // Convert to bytes
  const dataBytes = new Uint8Array(totalDataBytes);
  let byteIdx = 0;
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
    dataBytes[byteIdx++] = b;
  }
  // Pad bytes alternating 0xEC, 0x11
  let padToggle = 0;
  while (byteIdx < totalDataBytes) {
    dataBytes[byteIdx++] = padToggle === 0 ? 0xec : 0x11;
    padToggle ^= 1;
  }

  // Block splitting and Reed-Solomon computation
  const ecPerBlock = Math.floor(ecTotal / (g1Blocks + g2Blocks));
  const dataBlocks = [];
  const ecBlocks = [];

  let offset = 0;
  for (let i = 0; i < g1Blocks; i++) {
    const block = dataBytes.slice(offset, offset + g1Data);
    dataBlocks.push(block);
    ecBlocks.push(rsComputeRemainder(block, ecPerBlock));
    offset += g1Data;
  }
  for (let i = 0; i < g2Blocks; i++) {
    const block = dataBytes.slice(offset, offset + g2Data);
    dataBlocks.push(block);
    ecBlocks.push(rsComputeRemainder(block, ecPerBlock));
    offset += g2Data;
  }

  // Interleave data codewords
  const finalCodewords = [];
  const maxBlockLen = Math.max(g1Data, g2Data);
  for (let i = 0; i < maxBlockLen; i++) {
    for (const b of dataBlocks) {
      if (i < b.length) finalCodewords.push(b[i]);
    }
  }
  // Interleave EC codewords
  for (let i = 0; i < ecPerBlock; i++) {
    for (const b of ecBlocks) {
      if (i < b.length) finalCodewords.push(b[i]);
    }
  }

  // Construct matrix
  const size = version * 4 + 17;
  const matrix = Array.from({ length: size }, () => new Int8Array(size).fill(-1));
  const isFunction = Array.from({ length: size }, () => new Uint8Array(size));

  function setFunc(r, c, val) {
    matrix[r][c] = val;
    isFunction[r][c] = 1;
  }

  // Finder pattern helper
  function drawFinder(row, col) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const mr = row + r;
        const mc = col + c;
        if (mr >= 0 && mr < size && mc >= 0 && mc < size) {
          const isBlack =
            (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
            (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4);
          setFunc(mr, mc, isBlack ? 1 : 0);
        }
      }
    }
  }

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (!isFunction[6][i]) setFunc(6, i, i % 2 === 0 ? 1 : 0);
    if (!isFunction[i][6]) setFunc(i, 6, i % 2 === 0 ? 1 : 0);
  }

  // Alignment patterns
  for (const r of alignPos) {
    for (const c of alignPos) {
      if (isFunction[r][c]) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const isBlack = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          setFunc(r + dr, c + dc, isBlack ? 1 : 0);
        }
      }
    }
  }

  // Dark module
  setFunc(4 * version + 9, 8, 1);

  // Reserve format info areas
  for (let i = 0; i <= 8; i++) {
    if (!isFunction[8][i]) setFunc(8, i, 0);
    if (!isFunction[i][8]) setFunc(i, 8, 0);
  }
  for (let i = size - 8; i < size; i++) {
    if (!isFunction[8][i]) setFunc(8, i, 0);
    if (!isFunction[i][8]) setFunc(i, 8, 0);
  }

  // Place data bits with Zig-Zag scan
  const allDataBits = [];
  for (const byte of finalCodewords) {
    for (let i = 7; i >= 0; i--) {
      allDataBits.push((byte >>> i) & 1);
    }
  }

  let bitIdx = 0;
  let upward = true;
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Skip vertical timing line
    const rows = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const r of rows) {
      for (const c of [right, right - 1]) {
        if (!isFunction[r][c]) {
          const bit = bitIdx < allDataBits.length ? allDataBits[bitIdx++] : 0;
          matrix[r][c] = bit;
        }
      }
    }
    upward = !upward;
  }

  // Apply Mask 0: (row + col) % 2 === 0
  const mask = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isFunction[r][c]) {
        if ((r + c) % 2 === 0) {
          matrix[r][c] ^= 1;
        }
      }
    }
  }

  // Write format info (Mask 0, Level M)
  const fmt = FORMAT_INFO[mask];
  const fmtBits = [];
  for (let i = 14; i >= 0; i--) fmtBits.push((fmt >>> i) & 1);

  // Top-left format info
  const tlCoords = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = tlCoords[i];
    matrix[r][c] = fmtBits[i];
  }

  // Split format info around edges
  for (let i = 0; i < 7; i++) {
    matrix[size - 1 - i][8] = fmtBits[i];
  }
  for (let i = 0; i < 8; i++) {
    matrix[8][size - 8 + i] = fmtBits[7 + i];
  }

  // Render SVG
  const border = 4;
  const totalDim = size + border * 2;
  let pathD = "";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 1) {
        pathD += `M${c + border},${r + border}h1v1h-1z `;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalDim} ${totalDim}" shape-rendering="crispEdges"><path fill="#ffffff" d="M0,0h${totalDim}v${totalDim}h-${totalDim}z"/><path fill="#000000" d="${pathD.trim()}"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function generateVipTicketQrCode(ticketCode) {
  if (!ticketCode || typeof ticketCode !== "string") {
    throw new Error("Ticket code is required to generate QR code.");
  }
  return encodeQrSvg(ticketCode.trim());
}

