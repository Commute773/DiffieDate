import { describe, it, expect } from "vitest";
import {
  makeGarbledAND,
  evalGarbledAND,
  decodeOutputLabel,
} from "./math/crypto";
import { encodeBase64, decodeBase64 } from "./utils/b64";
import type { User, GarbledLike } from "./utils/db.types";
import type { LikeInitPayload } from "./actions/like";
import { generateGarbledLikePayload as _generateGarbledLikePayload } from "./math/garbled";

import { secp256k1 } from "@noble/curves/secp256k1";
import { bytesToHex, hexToBytes } from "@noble/curves/utils";
import { CATEGORIES } from "./utils/constants";

// Deterministic test keys (32 bytes, hex)
const alicePriv =
  "44a86f4f00e3adfe0b4dfffcf3f45fdc6eb8a765c1b8c7dbb93a3b268d9731cd";
const bobPriv =
  "79f9c6350e8d9c5c902ce905e595d6d2d7ed6f63b4b2f16d77e7f6fe7456c9f8";
function getPubKey(priv: string) {
  return bytesToHex(secp256k1.getPublicKey(priv, true));
}
const alice: User = {
  id: "alice",
  username: "Alice",
  category: CATEGORIES[0],
  publicCrypto: { publicKey: getPubKey(alicePriv) },
};
const bob: User = {
  id: "bob",
  username: "Bob",
  category: CATEGORIES[0],
  publicCrypto: { publicKey: getPubKey(bobPriv) },
};

// Augmented generateGarbledLikePayload that returns A/B labels as well for test
async function testGenerateGarbledLikePayload(
  myUserId: string,
  toUser: User,
  likeBit: 0 | 1,
  localCrypto: { privateKey: string }
) {
  // Use your real implementation to get the circuit and its internal labels.
  // Copy-paste of app/math/garbled.ts but keeping A0/A1, B0/B1 for test.
  const { makeGarbledAND } = await import("./math/crypto");
  const { encodeBase64 } = await import("./utils/b64");
  const { secp256k1 } = await import("@noble/curves/secp256k1");
  const { hkdf } = await import("@noble/hashes/hkdf");
  const { sha256 } = await import("@noble/hashes/sha2");

  function derivePairSecret(myPrivKeyHex: string, otherPubKeyHex: string) {
    const priv = hexToBytes(myPrivKeyHex);
    const pub =
      secp256k1.ProjectivePoint.fromHex(otherPubKeyHex).toRawBytes(true);
    const shared = secp256k1.getSharedSecret(priv, pub, true);
    return shared.slice(1, 33);
  }
  function deriveLabel(secret: Uint8Array, info: string) {
    return hkdf(sha256, secret, undefined, new TextEncoder().encode(info), 16);
  }
  const pairSecret = derivePairSecret(
    localCrypto.privateKey,
    toUser.publicCrypto.publicKey
  );
  const R0 = deriveLabel(pairSecret, "R0");
  const R1 = deriveLabel(pairSecret, "R1");
  const circuit = await makeGarbledAND({ R0, R1 });
  const aInputLabel = likeBit ? circuit.A1 : circuit.A0;
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
    payload: {
      type: "init",
      id,
      from: myUserId,
      to: toUser.id,
      garbledTable,
      aInputLabel: encodeBase64(aInputLabel),
      outputLabels,
      v: 1,
    } as LikeInitPayload,
    circuit, // <--- expose so tests can use the real B0/B1
  };
}

// GarbledLike record generator
async function fullLikeRecord(
  from: User,
  to: User,
  fromBit: 0 | 1,
  toBit: 0 | 1,
  fromPriv: string,
  _toPriv: string
): Promise<GarbledLike> {
  // 1. A initiates like with her private key, get internal circuit for B labels
  const { payload, circuit } = await testGenerateGarbledLikePayload(
    from.id,
    to,
    fromBit,
    { privateKey: fromPriv }
  );

  // 2. B chooses B0/B1 from Alice's circuit
  const bInputLabel = encodeBase64(toBit ? circuit.B1 : circuit.B0);

  // Compose GarbledLike with both input labels
  const gLike: GarbledLike = {
    id: payload.id,
    from: from.id,
    to: to.id,
    garbledTable: payload.garbledTable,
    aInputLabel: payload.aInputLabel,
    bInputLabel,
    outputLabels: payload.outputLabels,
    status: "responded",
  };
  return gLike;
}

// Extract and check if this like is a mutual match using actual circuit code
async function isMutualMatch(gLike: GarbledLike): Promise<boolean> {
  const aInputLabel = decodeBase64(gLike.aInputLabel);
  const bInputLabel = decodeBase64(gLike.bInputLabel!);
  const parseRow = (row: string) => {
    const obj = JSON.parse(row);
    return {
      ciphertext: decodeBase64(obj.ciphertext),
      iv: decodeBase64(obj.iv),
    };
  };
  const garbledTable = gLike.garbledTable.map(parseRow) as any;
  const [R0, R1] = gLike.outputLabels.map(decodeBase64) as [
    Uint8Array,
    Uint8Array
  ];
  const resultLabel = await evalGarbledAND(
    garbledTable,
    aInputLabel,
    bInputLabel
  );
  if (!resultLabel) return false;
  return decodeOutputLabel(R0, R1, resultLabel) === 1;
}

describe("Garble Date mutual like protocol (real garbled circuit)", () => {
  it("matches only if both like each other", async () => {
    const likeRec = await fullLikeRecord(alice, bob, 1, 1, alicePriv, bobPriv);
    expect(await isMutualMatch(likeRec)).toBe(true);
  });

  it("does not match if Alice likes and Bob does not like back", async () => {
    const likeRec = await fullLikeRecord(alice, bob, 1, 0, alicePriv, bobPriv);
    expect(await isMutualMatch(likeRec)).toBe(false);
  });

  it("does not match if Alice not-likes and Bob likes", async () => {
    const likeRec = await fullLikeRecord(alice, bob, 0, 1, alicePriv, bobPriv);
    expect(await isMutualMatch(likeRec)).toBe(false);
  });

  it("stores both like and not-like as equivalent structure except aInputLabel", async () => {
    const { payload: like } = await testGenerateGarbledLikePayload(
      alice.id,
      bob,
      1,
      { privateKey: alicePriv }
    );
    const { payload: notLike } = await testGenerateGarbledLikePayload(
      alice.id,
      bob,
      0,
      { privateKey: alicePriv }
    );
    expect(like.from).toBe(notLike.from);
    expect(like.to).toBe(notLike.to);
    expect(like.outputLabels).toEqual(notLike.outputLabels);
    expect(like.aInputLabel).not.toBe(notLike.aInputLabel);
  });
});
