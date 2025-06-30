import type { CollectionObject } from "./db";

// Each user has a public key and a selfToken
export type User = CollectionObject & {
  publicKey: string; // compressed hex
  selfToken: string; // compressed hex, see makeSelfToken()
  username: string | null; // optional user handle
};

// Each like is a single (token, cipher, iv) tuple
export type Like = CollectionObject & {
  token: string; // L_{A→B} (compressed hex, see makeLikeToken)
  cipher: string; // AES-GCM encrypted payload (hex)
  iv: string; // AES-GCM IV (hex)
};

// Inbox items delivered to users upon match
export type InboxItem = {
  token: string; // the matching token
  cipher: string; // the payload (from peer)
  iv: string; // the IV for AES-GCM
};

export type LikeObject = CollectionObject & {
  ciphers: { cipher: string; iv: string }[]; // list of ciphers for this token
};
