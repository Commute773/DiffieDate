import { sha256 } from "@noble/hashes/sha2";
import {
  pubFromPriv,
  randPriv,
  makeSelfToken,
  isValidPub,
} from "~/math/crypto";

export const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

// Returns { priv, pub, selfToken, id }
export async function getOrCreateKeys() {
  let priv = window.localStorage.getItem("priv");
  let pub = window.localStorage.getItem("pub");
  let selfToken = window.localStorage.getItem("selfToken");
  let isFresh = false;
  if (!priv || !pub || !selfToken) {
    priv = randPriv();
    pub = pubFromPriv(priv);
    selfToken = makeSelfToken(pub, priv);
    isFresh = true;
  } else {
    // Recompute selfToken from priv and pub in case
    pub = pubFromPriv(priv);
    if (!isValidPub(pub)) throw new Error("Stored pubkey is invalid");
    selfToken = makeSelfToken(pub, priv);
  }
  if (!isValidPub(pub)) throw new Error("Generated pubkey is invalid");
  window.localStorage.setItem("priv", priv);
  window.localStorage.setItem("pub", pub);
  window.localStorage.setItem("selfToken", selfToken);

  const id = toHex(await sha256(pub));
  return { priv, pub, selfToken, id };
}
