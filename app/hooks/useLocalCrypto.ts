import { useEffect, useState } from "react";
import { DBClient } from "~/utils/db.client";
import { secp256k1 } from "@noble/curves/secp256k1";
import { sha256 } from "@noble/hashes/sha2";
import { CATEGORIES, type Category } from "~/utils/constants";

// --- Types ---
export type LocalCrypto = {
  id: string; // e.g. "date" or "friend"
  baseUsername: string;
  category: string; // "date" | "friend"
  myUserId: string;
  privateKey: string; // hex
  publicKey: string; // hex
};
export type PublicCrypto = { publicKey: string };

// --- Utility functions ---
function toHex(uint8: Uint8Array): string {
  return Array.from(uint8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
function fromHex(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error("Invalid hex string");
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2)
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  return bytes;
}
function generateKeyPair() {
  const privateKeyBytes = secp256k1.utils.randomPrivateKey();
  const publicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, true);
  return {
    privateKey: toHex(privateKeyBytes),
    publicKey: toHex(publicKeyBytes),
  };
}
function computeUserId(
  baseUsername: string,
  category: string,
  publicKeyHex: string
): string {
  const pubKeyBytes = fromHex(publicKeyHex);
  const idBytes = sha256(pubKeyBytes);
  return `${Array.from(idBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}:${baseUsername}:${category}`;
}

// --- LocalCrypto management (multi-category, each as its own object) ---
export function generateAllLocalCryptos(
  baseUsername: string
): Record<Category, LocalCrypto> {
  const result: Record<string, LocalCrypto> = {};
  for (const category of CATEGORIES) {
    const { privateKey, publicKey } = generateKeyPair();
    const myUserId = computeUserId(baseUsername, category, publicKey);
    result[category] = {
      id: category, // "date" or "friend"
      baseUsername,
      category,
      myUserId,
      privateKey,
      publicKey,
    };
  }
  return result;
}

// Returns { [category]: LocalCrypto }
export const useLocalCrypto = () => {
  const [localCryptos, setLocalCryptos] = useState<Record<
    Category,
    LocalCrypto
  > | null>(null);
  useEffect(() => {
    const out: Record<string, LocalCrypto> = {};
    for (const category of CATEGORIES) {
      const obj = DBClient.getCollectionObject<LocalCrypto>(
        "localCryptos",
        category
      );
      if (obj) out[category] = obj;
    }
    setLocalCryptos(out);
  }, []);
  return localCryptos;
};

// Store each LocalCrypto object in its own entry
export const saveLocalCryptos = (cryptos: Record<Category, LocalCrypto>) => {
  for (const category of CATEGORIES) {
    const crypto = cryptos[category];
    if (crypto) {
      DBClient.updateCollectionObject("localCryptos", category, crypto);
    }
  }
};

export const getPublicCrypto = (crypto: LocalCrypto): PublicCrypto => ({
  publicKey: crypto.publicKey,
});
