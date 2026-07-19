// Hermes provides btoa at runtime, but React Native's TS globals omit it.
declare function btoa(data: string): string;

const CHUNK_SIZE = 8192;

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const parts: string[] = [];

  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + CHUNK_SIZE);
    parts.push(String.fromCharCode(...chunk));
  }

  return btoa(parts.join(''));
}
