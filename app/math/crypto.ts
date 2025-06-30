import {
  secp256k1,
  hashToCurve as h2c, // RFC-9380 Simplified-SWU
} from "@noble/curves/secp256k1";
import { hexToBytes } from "@noble/curves/abstract/utils";
import { sha256 } from "@noble/hashes/sha2";
import { randomBytes } from "@noble/hashes/utils";
import { hkdf } from "@noble/hashes/hkdf";

/* ------------------------------------------------------------------ */
/*  Utilities                                                         */
/* ------------------------------------------------------------------ */

export const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

/**
 * Use domain-safe randomPrivateKey from noble.
 * Always 1 <= priv < n.
 */
export function randPriv(): string {
  return toHex(secp256k1.utils.randomPrivateKey());
}

/**
 * Validates that a compressed public key is on secp256k1,
 * not infinity, not on a twist.
 *
 * NOTE: For prime-order curves, it's sufficient to check that
 * - fromHex succeeds (not malformed, not on a twist)
 * - the point is not infinity
 * Do NOT attempt order checking by multiplying by n, as coordinates may not match .ZERO.
 */
export function isValidPub(pubHex: string): boolean {
  try {
    const pt = secp256k1.ProjectivePoint.fromHex(pubHex);
    // Must not be infinity
    return !pt.equals(secp256k1.ProjectivePoint.ZERO);
  } catch {
    return false;
  }
}

export function pubFromPriv(priv: string): string {
  return toHex(secp256k1.getPublicKey(priv, true)); // compressed
}

/* ------------------------------------------------------------------ */
/*  Hash-to-curve + self-token                                        */
/* ------------------------------------------------------------------ */

const DST_SELF = "PSI-SelfToken-v2";
const DST_LIKE = "PSI-LikeToken-v2";

export function hashToCurve(pubHex: string, which: "self" | "like") {
  const DST = which === "self" ? DST_SELF : DST_LIKE;
  return h2c(hexToBytes(pubHex), { DST });
}

export function makeSelfToken(pub: string, priv: string): string {
  if (!isValidPub(pub)) throw new Error("Invalid public key for selfToken");
  return (hashToCurve(pub, "self").multiply(BigInt("0x" + priv)) as any).toHex(
    true
  );
}

/* ------------------------------------------------------------------ */
/*  Like token  L_{A→B} = P_B ^ s_A                                   */
/* ------------------------------------------------------------------ */

export function makeLikeToken(targetPub: string, myPriv: string): string {
  if (!isValidPub(targetPub)) throw new Error("Invalid target public key");
  return secp256k1.ProjectivePoint.fromHex(targetPub)
    .multiply(BigInt("0x" + myPriv))
    .toHex(true); // g^{s_A·s_B}
}

/* ------------------------------------------------------------------ */
/*  Shared key  K = HKDF(token, label)                                */
/*  (tokens are symmetric ⇒ both peers hash identical point encoding) */
/* ------------------------------------------------------------------ */

export function matchKey(token: string): Uint8Array {
  // Derive AES-GCM key from token (EC point compressed hex), 32 bytes.
  return hkdf(sha256, hexToBytes(token), "diffiedate-v1", undefined, 32);
}

/* ------------------------------------------------------------------ */
/*  AES-GCM helpers                                                   */
/* ------------------------------------------------------------------ */

export async function aesEncrypt(
  plaintext: Uint8Array,
  key: Uint8Array
): Promise<{ iv: string; ciphertext: string }> {
  const iv = randomBytes(12);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    "AES-GCM",
    false,
    ["encrypt"]
  );
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    plaintext
  );
  return { iv: toHex(iv), ciphertext: toHex(new Uint8Array(ct)) };
}

export async function aesDecrypt(
  ciphertextHex: string,
  key: Uint8Array,
  ivHex: string
): Promise<Uint8Array> {
  const iv = hexToBytes(ivHex);
  const ct = hexToBytes(ciphertextHex);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    "AES-GCM",
    false,
    ["decrypt"]
  );
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    ct
  );
  return new Uint8Array(pt);
}

/* ------------------------------------------------------------------ */
/*  Payload padding for fixed-length ciphers                          */
/* ------------------------------------------------------------------ */

/**
 * Pads a JSON payload to a constant length, e.g., 256 bytes.
 * Adds version and random nonce.
 */
export function buildPaddedPayload(
  obj: Record<string, any>,
  totalLength = 256
): Uint8Array {
  const version = 1;
  const nonce = toHex(randomBytes(6)); // 12 hex chars
  let pt = JSON.stringify({ ...obj, version, nonce });
  let buf = new Uint8Array(totalLength);
  const enc = new TextEncoder().encode(pt);
  if (enc.length > totalLength) throw new Error("Payload too large");
  buf.set(enc);
  return buf;
}

/**
 * Decodes and strips padding/nulls, parses JSON, checks version.
 * Throws on any decoding, parse, or version error.
 */
export function parsePaddedPayload(payload: Uint8Array): any {
  try {
    let str = new TextDecoder().decode(payload);
    str = str.replace(/\0+$/, "");
    let obj = JSON.parse(str);
    console.log(obj);
    if (obj.version !== 1) throw new Error("Unknown protocol version");
    return obj;
  } catch (e) {
    throw new Error("Invalid or corrupt payload");
  }
}
