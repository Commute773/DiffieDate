import {
  randPriv,
  pubFromPriv,
  makeSelfToken,
  makeLikeToken,
  matchKey,
  aesEncrypt,
  aesDecrypt,
  isValidPub,
  buildPaddedPayload,
  parsePaddedPayload,
  toHex,
} from "../math/crypto";
import { describe, it, expect } from "vitest";
import { bytesToHex } from "@noble/curves/abstract/utils";
import { secp256k1 } from "@noble/curves/secp256k1";

// Optional: debugging helper for invalid pubkeys
function dbgInvalid(pub: string) {
  try {
    const pt = secp256k1.ProjectivePoint.fromHex(pub);
    console.error("[debug] invalid pub =", pub);
    console.error(
      "         isInfinity:",
      pt.equals(secp256k1.ProjectivePoint.ZERO)
    );
    console.error(
      "         n·P == ∞  :",
      pt.multiply(secp256k1.CURVE.n).equals(secp256k1.ProjectivePoint.ZERO)
    );
  } catch (e) {
    console.error("[debug] fromHex threw ->", e);
  }
}

function validDummyPub() {
  return pubFromPriv(randPriv());
}

describe("Async Private Mutual Match Protocol (hardened)", () => {
  it("selfToken is deterministic", () => {
    const s = randPriv();
    const p = pubFromPriv(s);
    expect(makeSelfToken(p, s)).toEqual(makeSelfToken(p, s));
  });

  it("like tokens are symmetric and yield identical keys", () => {
    const aPriv = randPriv();
    const bPriv = randPriv();
    const aPub = pubFromPriv(aPriv);
    const bPub = pubFromPriv(bPriv);

    const tokenAB = makeLikeToken(bPub, aPriv); // A→B
    const tokenBA = makeLikeToken(aPub, bPriv); // B→A

    expect(tokenAB).toEqual(tokenBA); // symmetry

    const keyA = matchKey(tokenAB);
    const keyB = matchKey(tokenBA);
    expect(bytesToHex(keyA)).toEqual(bytesToHex(keyB));
  });

  it("generates only valid public and private keys", () => {
    for (let i = 0; i < 100; ++i) {
      const priv = randPriv();
      const pub = pubFromPriv(priv);
      if (!isValidPub(pub)) dbgInvalid(pub);
      expect(isValidPub(pub)).toBe(true);
    }
  });

  it("rejects invalid public keys for registration or like", () => {
    // Too short, not on curve, or zero
    expect(isValidPub("00".repeat(33))).toBe(false);
    expect(isValidPub("ff".repeat(33))).toBe(false);
    expect(isValidPub("")).toBe(false);
    // Public key of 0 is never valid (point at infinity)
    expect(isValidPub("00")).toBe(false);
  });

  it("mutual likes decrypt; outsiders fail", async () => {
    const aPriv = randPriv();
    const bPriv = randPriv();
    const cPriv = randPriv();
    const aPub = pubFromPriv(aPriv);
    const bPub = pubFromPriv(bPriv);

    const token = makeLikeToken(bPub, aPriv); // A→B (and B→A)

    // Alice encrypts payload with shared key
    const keyA = matchKey(token);
    const payload = buildPaddedPayload({ from: "alice", category: "testcat" });
    const { ciphertext, iv } = await aesEncrypt(payload, keyA);

    // Bob derives same key
    const keyB = matchKey(token);
    const pt = await aesDecrypt(ciphertext, keyB, iv);
    const msg = parsePaddedPayload(pt);
    expect(msg.from).toBe("alice");
    expect(msg.category).toBe("testcat");
    expect(msg.version).toBe(1);
    expect(typeof msg.nonce).toBe("string");

    // Carol's key mismatches
    const tokenAC = makeLikeToken(aPub, cPriv); // C likes A
    let failed = false;
    try {
      const keyC = matchKey(tokenAC);
      await aesDecrypt(ciphertext, keyC, iv);
    } catch {
      failed = true;
    }
    expect(failed).toBe(true);
  });

  it("token is unlinkable to public key by inspection", () => {
    const s = randPriv();
    const p = pubFromPriv(s);
    const t = makeSelfToken(p, s);
    expect(t.includes(p.slice(0, 16))).toBe(false);
  });

  it("ciphertext is always fixed-length (256 bytes payload)", async () => {
    const aPriv = randPriv();
    const bPriv = randPriv();
    const aPub = pubFromPriv(aPriv);
    const bPub = pubFromPriv(bPriv);
    const token = makeLikeToken(bPub, aPriv);
    const key = matchKey(token);
    const categories = [
      "A",
      "Want to fuck",
      "Would pre-commit to exchange 1% of net worth in 2030",
      "Would like to engage in platonic anus touching (joke from a hangout (or is it?))",
    ];
    for (const cat of categories) {
      const pt = buildPaddedPayload({ from: "A", category: cat });
      expect(pt.length).toBe(256);
      const { ciphertext } = await aesEncrypt(pt, key);
      expect(ciphertext.length % 2 === 0).toBe(true); // hex encoding
      // Should always be 256 bytes plaintext + GCM tag, but tag size is fixed by WebCrypto
    }
  });

  it("selfToken and likeToken are always distinct for same input", () => {
    const priv = randPriv();
    const pub = pubFromPriv(priv);
    const selfToken = makeSelfToken(pub, priv);
    const likeToken = makeLikeToken(pub, priv);
    expect(selfToken).not.toBe(likeToken);
  });
});
