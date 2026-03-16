/**
 * webm-to-ogg.ts
 *
 * Converte áudio WebM/Opus → OGG/Opus em TypeScript puro, sem ffmpeg.
 *
 * Por que funciona: Chrome grava audio/webm;codecs=opus — os frames de áudio
 * já são Opus puro. OGG/Opus usa os mesmos frames. A conversão é apenas um
 * remuxing de container (EBML → OggS). Nenhuma transcodificação de áudio.
 */

// ─── EBML helpers ────────────────────────────────────────────────────────────

function readVInt(buf: Buffer, offset: number): { value: number; length: number } {
  const b = buf[offset]
  if (b === undefined) throw new Error('EBML: unexpected end of buffer')
  let width = 1
  let mask = 0x80
  while (!(b & mask)) {
    width++
    mask >>= 1
    if (width > 8) throw new Error('EBML: vint too wide')
  }
  let value = b & (mask - 1)
  for (let i = 1; i < width; i++) value = (value * 256) + buf[offset + i]
  return { value, length: width }
}

function readElementID(buf: Buffer, offset: number): { id: number; length: number } {
  const b = buf[offset]
  if (b === undefined) throw new Error('EBML: unexpected end of buffer')
  let width = 1
  let mask = 0x80
  while (!(b & mask)) {
    width++
    mask >>= 1
    if (width > 4) throw new Error('EBML: element id too wide')
  }
  let id = b
  for (let i = 1; i < width; i++) id = (id * 256) + buf[offset + i]
  return { id, length: width }
}

interface EbmlElement {
  id: number
  dataOffset: number
  dataSize: number
}

function findElement(buf: Buffer, start: number, end: number, targetId: number): EbmlElement | null {
  let pos = start
  const limit = Math.min(end, buf.length)
  while (pos < limit - 2) {
    try {
      const { id, length: idLen } = readElementID(buf, pos)
      const sizePos = pos + idLen
      if (sizePos >= buf.length) break
      const { value: dataSize, length: sizeLen } = readVInt(buf, sizePos)
      const dataOffset = sizePos + sizeLen
      if (id === targetId) return { id, dataOffset, dataSize }
      pos = dataOffset + dataSize
    } catch {
      break
    }
  }
  return null
}

function* iterateElements(buf: Buffer, start: number, end: number): Generator<EbmlElement> {
  let pos = start
  const limit = Math.min(end, buf.length)
  while (pos < limit - 2) {
    try {
      const { id, length: idLen } = readElementID(buf, pos)
      const sizePos = pos + idLen
      if (sizePos >= buf.length) break
      const { value: dataSize, length: sizeLen } = readVInt(buf, sizePos)
      const dataOffset = sizePos + sizeLen
      yield { id, dataOffset, dataSize }
      pos = dataOffset + dataSize
    } catch {
      break
    }
  }
}

// ─── OGG helpers ─────────────────────────────────────────────────────────────

// CRC32 com polinômio OGG: 0x04c11db7 (não-refletido)
const OGG_CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let crc = i << 24
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x80000000) ? ((crc << 1) ^ 0x04c11db7) : (crc << 1)
    }
    t[i] = crc >>> 0
  }
  return t
})()

function oggCrc32(buf: Buffer): number {
  let crc = 0
  for (let i = 0; i < buf.length; i++) {
    crc = (((crc << 8) >>> 0) ^ OGG_CRC_TABLE[((crc >>> 24) ^ buf[i]) & 0xFF]) >>> 0
  }
  return crc
}

function buildOggPage(
  payload: Buffer,
  serialNo: number,
  pageSeq: number,
  granule: bigint,
  headerType: number
): Buffer {
  // Divide payload em segmentos de até 255 bytes
  const segLens: number[] = []
  for (let i = 0; i < payload.length; i += 255) {
    segLens.push(Math.min(255, payload.length - i))
  }
  // Payload vazio precisa de pelo menos um segmento de tamanho 0
  if (segLens.length === 0) segLens.push(0)

  const header = Buffer.alloc(27 + segLens.length)
  header.write('OggS', 0, 'ascii')
  header[4] = 0              // stream_structure_version
  header[5] = headerType
  header.writeBigInt64LE(granule, 6)
  header.writeUInt32LE(serialNo >>> 0, 14)
  header.writeUInt32LE(pageSeq >>> 0, 18)
  header.writeUInt32LE(0, 22) // CRC placeholder
  header[26] = segLens.length
  for (let i = 0; i < segLens.length; i++) header[27 + i] = segLens[i]

  const page = Buffer.concat([header, payload])
  page.writeUInt32LE(oggCrc32(page), 22)
  return page
}

function buildOpusTags(): Buffer {
  const magic = Buffer.from('OpusTags', 'ascii')
  const vendor = Buffer.from('ArtemisChat', 'utf8')
  const vLen = Buffer.allocUnsafe(4)
  vLen.writeUInt32LE(vendor.length, 0)
  const commentCount = Buffer.alloc(4) // 0 comments
  return Buffer.concat([magic, vLen, vendor, commentCount])
}

// ─── SimpleBlock Opus packet extraction ──────────────────────────────────────

function extractOpusFromBlock(blockData: Buffer): Buffer | null {
  if (blockData.length < 4) return null
  try {
    // Track number: VINT
    const { length: trackLen } = readVInt(blockData, 0)
    // timecode: int16 BE (2 bytes)
    // flags: 1 byte
    // payload starts at trackLen + 3
    const payloadStart = trackLen + 3
    if (payloadStart >= blockData.length) return null
    return blockData.subarray(payloadStart)
  } catch {
    return null
  }
}

// ─── Opus TOC parsing ─────────────────────────────────────────────────────────

/**
 * Retorna o número de amostras @ 48kHz contidas em um pacote Opus.
 * Lê o TOC byte (config + frame count code) para suportar todos os modos:
 * pacotes de 1 frame (code 0), 2 frames (code 1/2) e multi-frame CBR/VBR (code 3).
 */
function opusPacketSamples(pkt: Buffer): number {
  if (pkt.length === 0) return 960 // fallback 20ms

  const toc = pkt[0]
  const config = (toc >> 3) & 0x1F
  const code   = toc & 0x03

  // Amostras por frame @ 48kHz por configuração (RFC 6716, §3.1)
  // Índices 0-3: SILK NB, 4-7: SILK MB, 8-11: SILK WB,
  // 12-13: Hybrid SWB, 14-15: Hybrid FB,
  // 16-19: CELT NB, 20-23: CELT WB, 24-27: CELT SWB, 28-31: CELT FB
  const frameSizes = [
    480, 960, 1920, 2880,  // SILK NB  (10/20/40/60ms)
    480, 960, 1920, 2880,  // SILK MB
    480, 960, 1920, 2880,  // SILK WB
    480, 960,              // Hybrid SWB (10/20ms)
    480, 960,              // Hybrid FB  (10/20ms)
    120, 240, 480,  960,   // CELT NB   (2.5/5/10/20ms)
    120, 240, 480,  960,   // CELT WB
    120, 240, 480,  960,   // CELT SWB
    120, 240, 480,  960,   // CELT FB
  ]
  const spf = frameSizes[config] ?? 960

  switch (code) {
    case 0: return spf          // 1 frame
    case 1: return spf * 2      // 2 frames iguais
    case 2: return spf * 2      // 2 frames (tamanhos diferentes, mas duração igual)
    case 3: {
      // Multi-frame: próximo byte tem contagem nos 6 bits inferiores
      if (pkt.length < 2) return spf
      const count = pkt[1] & 0x3F
      return spf * (count || 1)
    }
    default: return spf
  }
}

// ─── Exported converter ───────────────────────────────────────────────────────

/**
 * Converte um Buffer de áudio WebM/Opus em OGG/Opus.
 * Lança Error se o WebM não contiver áudio Opus válido.
 */
export function webmToOgg(webmData: Buffer): Buffer {
  const buf = webmData

  // Localizar Segment (0x18538067)
  const segEl = findElement(buf, 0, buf.length, 0x18538067)
  if (!segEl) throw new Error('WebM: Segment not found')
  const segStart = segEl.dataOffset
  const segEnd = Math.min(segEl.dataOffset + segEl.dataSize, buf.length)

  // Localizar Tracks (0x1654AE6B) dentro do Segment
  const tracksEl = findElement(buf, segStart, segEnd, 0x1654AE6B)
  if (!tracksEl) throw new Error('WebM: Tracks not found')

  // Extrair CodecPrivate (0x63A2) → OpusHead
  let codecPrivate: Buffer | null = null
  for (const el of iterateElements(buf, tracksEl.dataOffset, tracksEl.dataOffset + tracksEl.dataSize)) {
    if (el.id === 0xAE) { // TrackEntry
      const cpEl = findElement(buf, el.dataOffset, el.dataOffset + el.dataSize, 0x63A2)
      if (cpEl) {
        codecPrivate = buf.subarray(cpEl.dataOffset, cpEl.dataOffset + cpEl.dataSize)
        break
      }
    }
  }
  if (!codecPrivate) throw new Error('WebM: CodecPrivate (OpusHead) not found')

  // Coletar pacotes Opus de todos os Clusters
  const packets: Buffer[] = []
  for (const el of iterateElements(buf, segStart, segEnd)) {
    if (el.id !== 0x1F43B675) continue // Cluster
    const clusterEnd = el.dataOffset + el.dataSize
    for (const cel of iterateElements(buf, el.dataOffset, clusterEnd)) {
      if (cel.id === 0xA3) {
        // SimpleBlock
        const pkt = extractOpusFromBlock(buf.subarray(cel.dataOffset, cel.dataOffset + cel.dataSize))
        if (pkt && pkt.length > 0) packets.push(pkt)
      } else if (cel.id === 0xA0) {
        // BlockGroup → Block (0xA1)
        const blockEl = findElement(buf, cel.dataOffset, cel.dataOffset + cel.dataSize, 0xA1)
        if (blockEl) {
          const pkt = extractOpusFromBlock(buf.subarray(blockEl.dataOffset, blockEl.dataOffset + blockEl.dataSize))
          if (pkt && pkt.length > 0) packets.push(pkt)
        }
      }
    }
  }
  if (packets.length === 0) throw new Error('WebM: nenhum pacote Opus encontrado')

  const serialNo = Math.floor(Math.random() * 0xFFFFFFFF)
  const pages: Buffer[] = []

  // Página 0: BOS + OpusHead (CodecPrivate)
  pages.push(buildOggPage(codecPrivate, serialNo, 0, 0n, 0x02))
  // Página 1: OpusTags
  pages.push(buildOggPage(buildOpusTags(), serialNo, 1, 0n, 0x00))

  // Páginas de áudio: um pacote por página
  // Granule: amostras acumuladas — lidas do TOC byte de cada pacote Opus
  // para suportar todos os tamanhos de frame e pacotes multi-frame do Chrome.
  let granule = 0n
  for (let i = 0; i < packets.length; i++) {
    granule += BigInt(opusPacketSamples(packets[i]))
    const isLast = i === packets.length - 1
    pages.push(buildOggPage(packets[i], serialNo, i + 2, granule, isLast ? 0x04 : 0x00))
  }

  return Buffer.concat(pages)
}
