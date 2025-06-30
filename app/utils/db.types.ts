import type { PublicCrypto } from "~/hooks/useLocalCrypto";
import type { Category } from "./constants";

export type CollectionObject = {
  id: string;
};

export type User = CollectionObject & {
  username: string;
  category: Category;
  publicCrypto: PublicCrypto;
};

/**
 * A single garbled like attempt (as stored in the DB).
 * All fields are base64-encoded random bytes.
 * garbledTable is a JSON-serialized array of objects:
 *   { ciphertext: base64-string, iv: base64-string }
 */
export type GarbledLike = CollectionObject & {
  from: string; // A's user id (liker)
  to: string; // B's user id (target)
  garbledTable: [string, string, string, string]; // Each is JSON.stringify({ciphertext, iv}), both as base64
  aInputLabel: string; // base64 (16 bytes)
  bInputLabel?: string; // base64 (16 bytes), set when B responds
  outputLabels: [string, string]; // [R_0, R_1], base64 (16 bytes each)
  status: "pending" | "responded";
};
