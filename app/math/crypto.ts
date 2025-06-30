import { randomBytes } from "@noble/curves/utils";

export type WireLabel = Uint8Array; // 16 bytes for AES-128
export type GarbledRow = {
  ciphertext: Uint8Array;
  iv: Uint8Array;
};
export type GarbledTable = [GarbledRow, GarbledRow, GarbledRow, GarbledRow];

export type GarbledCircuit = {
  A0: WireLabel;
  A1: WireLabel;
  B0: WireLabel;
  B1: WireLabel;
  R0: WireLabel;
  R1: WireLabel;
  table: GarbledTable;
};

// ---------------------------------------------------------------------------
// Random helpers
// ---------------------------------------------------------------------------

export function randomLabel(): WireLabel {
  return randomBytes(16);
}

/**
 * AES-GCM encrypt (browser + node, always with 12-byte IV).
 */
export async function aesGcmEncrypt(
  key: Uint8Array,
  plaintext: Uint8Array,
  iv: Uint8Array
): Promise<Uint8Array> {
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    "raw",
    key,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  const ciphertext = await globalThis.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    plaintext
  );
  return new Uint8Array(ciphertext);
}

/**
 * AES-GCM decrypt (browser + node, always with 12-byte IV).
 */
export async function aesGcmDecrypt(
  key: Uint8Array,
  ciphertext: Uint8Array,
  iv: Uint8Array
): Promise<Uint8Array> {
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    "raw",
    key,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
  const plaintext = await globalThis.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    ciphertext
  );
  return new Uint8Array(plaintext);
}

// ---------------------------------------------------------------------------
//   ***  MODIFIED  ***
//   makeGarbledAND now takes optional fixed wire-labels for *every* wire.
// ---------------------------------------------------------------------------
export async function makeGarbledAND(opts?: {
  A0?: WireLabel;
  A1?: WireLabel;
  B0?: WireLabel;
  B1?: WireLabel;
  R0?: WireLabel;
  R1?: WireLabel;
}): Promise<GarbledCircuit> {
  const A0 = opts?.A0 ?? randomLabel();
  const A1 = opts?.A1 ?? randomLabel();
  const B0 = opts?.B0 ?? randomLabel();
  const B1 = opts?.B1 ?? randomLabel();
  const R0 = opts?.R0 ?? randomLabel();
  const R1 = opts?.R1 ?? randomLabel();

  // Four input pairs in canonical order: (A0,B0) (A0,B1) (A1,B0) (A1,B1)
  const table: GarbledTable = [null!, null!, null!, null!];

  for (let i = 0; i < 4; ++i) {
    const a = (i >> 1) & 1;
    const b = i & 1;
    const labelA = a ? A1 : A0;
    const labelB = b ? B1 : B0;
    const key = deriveKey(labelA, labelB);
    const iv = randomBytes(12);
    const out = a & b ? R1 : R0;
    const ciphertext = await aesGcmEncrypt(key, out, iv);
    table[i] = { ciphertext, iv };
  }

  // Shuffle table for privacy
  for (let i = table.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [table[i], table[j]] = [table[j], table[i]];
  }

  return { A0, A1, B0, B1, R0, R1, table };
}

// ---------------------------------------------------------------------------
// Everything below is unchanged
// ---------------------------------------------------------------------------

// *** Demo-only XOR.  Replace with HKDF in production. ***
function deriveKey(a: WireLabel, b: WireLabel): Uint8Array {
  return a.map((byte, i) => byte ^ b[i]);
}

export async function evalGarbledAND(
  table: GarbledTable,
  aLabel: WireLabel,
  bLabel: WireLabel
): Promise<WireLabel | null> {
  const key = deriveKey(aLabel, bLabel);
  for (const { ciphertext, iv } of table) {
    try {
      const out = await aesGcmDecrypt(key, ciphertext, iv);
      if (out.length === 16) return out;
    } catch {
      /* decryption failed – try next row */
    }
  }
  return null;
}

export function decodeOutputLabel(
  R0: WireLabel,
  R1: WireLabel,
  res: WireLabel
): 0 | 1 | null {
  if (res.length !== 16) return null;
  if (res.every((b, i) => b === R0[i])) return 0;
  if (res.every((b, i) => b === R1[i])) return 1;
  return null;
}
