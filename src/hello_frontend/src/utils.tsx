export function uint8ArrayToHex(uint8Array: Uint8Array): string {
  return Array.from(uint8Array)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}


export function hexToUint8Array(hex: string): Uint8Array {
  const cleanHex = hex.replace(/\s/g, '').replace(/^0x/i, '');
  const paddedHex = cleanHex.length % 2 ? '0' + cleanHex : cleanHex;
  const uint8Array = new Uint8Array(paddedHex.length / 2);
  for (let i = 0; i < paddedHex.length; i += 2) {
    uint8Array[i / 2] = parseInt(paddedHex.substr(i, 2), 16);
  }
  return uint8Array;
}