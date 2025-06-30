import type { SubmitFunction } from "react-router";
import {
  makeLikeToken,
  matchKey,
  aesEncrypt,
  buildPaddedPayload,
} from "./crypto";

/**
 * handleLikeSubmit – one-shot like post
 */
export const handleLikeSubmit = async (
  submit: SubmitFunction,
  myPriv: string,
  myId: string,
  targetUser: { id: string; publicKey: string },
  cat: string
) => {
  // Derive deterministic like-token
  const token = makeLikeToken(targetUser.publicKey, myPriv);

  // Shared key is just HKDF(token)
  const key = matchKey(token);

  // Encrypt padded payload (constant length)
  const { iv, ciphertext } = await aesEncrypt(
    buildPaddedPayload({ from: myId, category: cat }),
    key
  );

  // Ship to server
  const formData = new FormData();
  formData.append("formKey", "submitLike");
  formData.append("token", token);
  formData.append("cipher", ciphertext);
  formData.append("iv", iv);
  submit(formData, { method: "post", action: "/" });
};
