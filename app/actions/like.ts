import { useCallback } from "react";
import { useSubmit } from "react-router";
import type { PublicCrypto } from "~/hooks/useLocalCrypto";
import type { User, GarbledLike } from "~/utils/db.types";

// --- Payload types for the protocol ---

// A liking B: initialization
export type LikeInitPayload = {
  type: "init";
  id: string; // unique per like session (e.g. hash of from+to+nonce)
  from: string; // A's user id
  to: string; // B's user id
  garbledTable: [string, string, string, string]; // base64
  aInputLabel: string; // base64
  outputLabels: [string, string]; // [R_0, R_1], base64
};

// B responding to a like
export type LikeRespondPayload = {
  type: "respond";
  id: string; // like session id
  bInputLabel: string; // base64
};

export type LikePayload = LikeInitPayload | LikeRespondPayload;

// --- Like Hook ---

/**
 * useLike() returns a callback for initiating or responding to likes.
 * - For "like": call with {type: 'init', ...} and all required fields.
 * - For "respond": call with {type: 'respond', ...} and all required fields.
 */
export const useLike = () => {
  const submit = useSubmit();

  return useCallback(
    (payload: LikePayload) => {
      const formData = new FormData();
      formData.append("payload", JSON.stringify(payload));
      formData.append("action", "like");
      submit(formData, { method: "post", action: "/" });
    },
    [submit]
  );
};
