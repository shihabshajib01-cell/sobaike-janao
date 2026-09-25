const textDecoder = new TextDecoder("ascii");

const readU32LE = (bytes, offset) =>
  (bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)) >>> 0;

const writeU32LE = (bytes, offset, value) => {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
  bytes[offset + 3] = (value >>> 24) & 0xff;
};

const fourCC = (bytes, offset) => textDecoder.decode(bytes.subarray(offset, offset + 4));

const parseVp8Dimensions = (payload) => {
  if (payload.length < 10) throw new Error("INVALID_WEBP_VP8");
  if (payload[3] !== 0x9d || payload[4] !== 0x01 || payload[5] !== 0x2a) {
    throw new Error("INVALID_WEBP_VP8_FRAME");
  }
  const width = (payload[6] | (payload[7] << 8)) & 0x3fff;
  const height = (payload[8] | (payload[9] << 8)) & 0x3fff;
  return { width, height };
};

const parseVp8lDimensions = (payload) => {
  if (payload.length < 5 || payload[0] !== 0x2f) throw new Error("INVALID_WEBP_VP8L");
  const width = 1 + (payload[1] | ((payload[2] & 0x3f) << 8));
  const height =
    1 +
    (((payload[2] & 0xc0) >> 6) |
      (payload[3] << 2) |
      ((payload[4] & 0x0f) << 10));
  return { width, height };
};

const parseVp8xDimensions = (payload) => {
  if (payload.length !== 10) throw new Error("INVALID_WEBP_VP8X");
  const width = 1 + payload[4] + (payload[5] << 8) + (payload[6] << 16);
  const height = 1 + payload[7] + (payload[8] << 8) + (payload[9] << 16);
  return { width, height };
};

const buildChunk = (type, payload) => {
  const padded = payload.length + (payload.length % 2);
  const out = new Uint8Array(8 + padded);
  for (let i = 0; i < 4; i += 1) out[i] = type.charCodeAt(i);
  writeU32LE(out, 4, payload.length);
  out.set(payload, 8);
  return out;
};

export function sanitizeEvidenceWebP(input, options = {}) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const maxDimension = Number(options.maxDimension || 4096);
  const maxPixels = Number(options.maxPixels || 16_777_216);

  if (bytes.length < 20 || fourCC(bytes, 0) !== "RIFF" || fourCC(bytes, 8) !== "WEBP") {
    throw new Error("INVALID_WEBP_CONTAINER");
  }

  const declaredSize = readU32LE(bytes, 4);
  if (declaredSize + 8 !== bytes.length) throw new Error("INVALID_WEBP_RIFF_SIZE");

  const kept = [];
  const removed = [];
  let cursor = 12;
  let bitstreamType = null;
  let dimensions = null;
  let vp8xDimensions = null;

  while (cursor < bytes.length) {
    if (cursor + 8 > bytes.length) throw new Error("INVALID_WEBP_CHUNK_HEADER");
    const type = fourCC(bytes, cursor);
    const size = readU32LE(bytes, cursor + 4);
    const start = cursor + 8;
    const end = start + size;
    const next = end + (size % 2);

    if (end > bytes.length || next > bytes.length) throw new Error("INVALID_WEBP_CHUNK_SIZE");
    const payload = bytes.slice(start, end);

    if (type === "ANIM" || type === "ANMF") {
      throw new Error("ANIMATED_WEBP_NOT_ALLOWED");
    }

    if (type === "EXIF" || type === "XMP " || type === "ICCP") {
      removed.push(type.trim());
    } else if (type === "VP8X") {
      const copy = payload.slice();
      vp8xDimensions = parseVp8xDimensions(copy);
      // Keep only the alpha feature flag. Strip ICCP, EXIF, XMP, animation,
      // fragments and all reserved flags so metadata cannot be advertised.
      copy[0] &= 0x10;
      copy[1] = 0;
      copy[2] = 0;
      copy[3] = 0;
      kept.push(buildChunk(type, copy));
    } else if (type === "ALPH") {
      kept.push(buildChunk(type, payload));
    } else if (type === "VP8 " || type === "VP8L") {
      if (bitstreamType) throw new Error("MULTIPLE_WEBP_BITSTREAMS_NOT_ALLOWED");
      bitstreamType = type;
      dimensions = type === "VP8 " ? parseVp8Dimensions(payload) : parseVp8lDimensions(payload);
      kept.push(buildChunk(type, payload));
    } else {
      // Unknown RIFF chunks can carry arbitrary metadata. They are intentionally
      // discarded; only chunks needed to reconstruct a static image survive.
      removed.push(type.trim() || "UNKNOWN");
    }

    cursor = next;
  }

  if (!bitstreamType || !dimensions) throw new Error("WEBP_IMAGE_BITSTREAM_MISSING");
  if (vp8xDimensions &&
      (vp8xDimensions.width !== dimensions.width || vp8xDimensions.height !== dimensions.height)) {
    throw new Error("WEBP_DIMENSION_MISMATCH");
  }

  const { width, height } = dimensions;
  if (
    width < 1 || height < 1 ||
    width > maxDimension || height > maxDimension ||
    width * height > maxPixels
  ) {
    throw new Error("WEBP_DIMENSIONS_OUT_OF_RANGE");
  }

  const bodyLength = 4 + kept.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(8 + bodyLength);
  out.set([0x52, 0x49, 0x46, 0x46], 0); // RIFF
  writeU32LE(out, 4, bodyLength);
  out.set([0x57, 0x45, 0x42, 0x50], 8); // WEBP
  let offset = 12;
  for (const chunk of kept) {
    out.set(chunk, offset);
    offset += chunk.length;
  }

  return {
    bytes: out,
    width,
    height,
    removedChunks: removed,
    bitstreamType: bitstreamType.trim(),
  };
}
