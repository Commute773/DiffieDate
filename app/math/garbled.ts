import { makeGarbledAND, type WireLabel } from "./crypto";
import { encodeBase64 } from "~/utils/b64";
import { secp256k1 } from "@noble/curves/secp256k1";
import { hkdf } from "@noble/hashes/hkdf";
import { sha256 } from "@noble/hashes/sha2";
import { hexToBytes } from "@noble/curves/utils";
import type { LikePayload } from "~/actions/like";
import type { User } from "~/utils/db.types";

// ────────────────────────────────────────────────────────────────────────────
//  ECDH helper – **exported** so UI can re-use it.
// ────────────────────────────────────────────────────────────────────────────
export function derivePairSecret(
  myPrivKeyHex: string,
  otherPubKeyHex: string
): Uint8Array {
  const priv = hexToBytes(myPrivKeyHex);
  const pub = secp256k1.Point.fromHex(otherPubKeyHex).toBytes(true);
  const shared = secp256k1.getSharedSecret(priv, pub, true);
  // noble adds 0x04 at [0] – strip it
  return shared.slice(1, 33);
}

/**
 * HKDF-SHA-256 helper – also **exported**.
 */
export function deriveLabel(secret: Uint8Array, tag: string): WireLabel {
  return hkdf(sha256, secret, undefined, new TextEncoder().encode(tag), 16);
}

// ────────────────────────────────────────────────────────────────────────────
//                 generateGarbledLikePayload  ***MODIFIED***
//   – deterministically derives B0 / B1 as well as R0 / R1
// ────────────────────────────────────────────────────────────────────────────
export async function generateGarbledLikePayload(
  myUserId: string,
  toUser: User,
  likeBit: 0 | 1 = 1,
  localCrypto?: { privateKey: string }
): Promise<LikePayload> {
  if (!localCrypto?.privateKey || !toUser.publicCrypto?.publicKey) {
    throw new Error("Need both own private key and peer public key");
  }

  // 1. Pairwise secret
  const secret = derivePairSecret(
    localCrypto.privateKey,
    toUser.publicCrypto.publicKey
  );

  // 2. Deterministic wire labels for this pair
  const R0 = deriveLabel(secret, "R0");
  const R1 = deriveLabel(secret, "R1");
  const B0 = deriveLabel(secret, "B0");
  const B1 = deriveLabel(secret, "B1");

  // 3. Garbled circuit with *fixed* labels
  const circuit = await makeGarbledAND({ R0, R1, B0, B1 });

  // 4. Alice’s input
  const aInputLabel = likeBit ? circuit.A1 : circuit.A0;

  // 5. Encode
  const encodeRow = (row: { ciphertext: Uint8Array; iv: Uint8Array }) =>
    JSON.stringify({
      ciphertext: encodeBase64(row.ciphertext),
      iv: encodeBase64(row.iv),
    });

  const garbledTable = circuit.table.map(encodeRow) as [
    string,
    string,
    string,
    string
  ];
  const outputLabels = [encodeBase64(R0), encodeBase64(R1)] as [string, string];

  const id = `${myUserId}_${toUser.id}_${Date.now()}`;

  return {
    type: "init",
    id,
    from: myUserId,
    to: toUser.id,
    garbledTable,
    aInputLabel: encodeBase64(aInputLabel),
    outputLabels,
    v: 1,
  } as LikePayload;
}
