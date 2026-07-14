export type UuidMode = 'crypto.randomUUID' | 'crypto.getRandomValues' | 'math-random';

let fallbackCounter = 0;

function formatUuid(bytes: Uint8Array): string {
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function getUuidMode(): UuidMode {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return 'crypto.randomUUID';
  }

  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    return 'crypto.getRandomValues';
  }

  return 'math-random';
}

export function createSaveUuid(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    try {
      return globalThis.crypto.randomUUID();
    } catch {
      // Some iOS/LAN insecure contexts expose crypto but reject randomUUID.
    }
  }

  const bytes = new Uint8Array(16);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    try {
      globalThis.crypto.getRandomValues(bytes);
      return formatUuid(bytes);
    } catch {
      // Continue to the non-cryptographic compatibility path below.
    }
  }

  fallbackCounter = (fallbackCounter + 1) & 0xffff;
  const time = Date.now();
  for (let index = 0; index < bytes.length; index += 1) {
    const timeByte = (time / 2 ** ((index % 6) * 8)) & 0xff;
    const counterByte = (fallbackCounter >> ((index % 2) * 8)) & 0xff;
    bytes[index] = Math.floor(Math.random() * 256) ^ timeByte ^ counterByte;
  }

  return formatUuid(bytes);
}
