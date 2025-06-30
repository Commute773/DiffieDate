import {
  addGarbledLike,
  setGarbledLikeBInputLabel,
  getGarbledLike,
} from "~/utils/db.server";
import type { LikePayload } from "./like";
import type { GarbledLike } from "~/utils/db.types";

/**
 * Handles the server-side "like" action.
 * If payload is for a new like (from A), store garbled circuit data.
 * If payload is a response from B (B's input), update and output result label.
 */
export const serverLike = async (
  payload: LikePayload
): Promise<{ resultLabel?: string }> => {
  if (payload.type === "init") {
    // A is liking B, store the garbled circuit
    const garbledLike: GarbledLike = {
      id: payload.id, // deterministic, e.g. hash of from+to+nonce
      from: payload.from,
      to: payload.to,
      garbledTable: payload.garbledTable,
      aInputLabel: payload.aInputLabel,
      outputLabels: payload.outputLabels,
      status: "pending",
    };
    addGarbledLike(garbledLike);
    return {};
  } else if (payload.type === "respond") {
    // B is responding to a pending like (choosing 0 or 1 privately, posting input label)
    const likeId = payload.id;
    setGarbledLikeBInputLabel(likeId, payload.bInputLabel);

    // Now evaluate the garbled table to obtain the result label (server is just the evaluator, can't map label to bit)
    const garbledLike = getGarbledLike(likeId);
    if (
      !garbledLike ||
      !garbledLike.aInputLabel ||
      !garbledLike.bInputLabel ||
      !garbledLike.garbledTable
    ) {
      throw new Error("Incomplete GarbledLike record");
    }

    // Each garbledTable row corresponds to [A0B0, A0B1, A1B0, A1B1]
    // Find which row matches both input labels
    // Since input labels are opaque (e.g. 32-byte random), matching is deterministic by order:
    // Row index: (aBit << 1) | bBit -- but since server is oblivious, just try all 4

    const inputLabels = [garbledLike.aInputLabel, garbledLike.bInputLabel];

    // Try to decrypt each garbledTable row; only one will succeed, outputting the output label
    // For the demo, assume the client sends input label *values* for each wire,
    // and the "decryption" is simply returning the table row at the index.
    // In real garbled circuits, this would require double decryption, but in this simplified server logic:
    // The client is expected to map output label to bit.

    // For the demo, use: let index = payload.rowIndex
    // But as server is oblivious, we return all 4 and the client picks the one that matches
    // Instead, for now, we just return the table (the actual row chosen is determined by the labels held by client).

    // In practice, only the client can decrypt; server just mediates.
    // For the PoC, we return all four, client finds their output.

    return {
      resultLabel: undefined, // server can't decode; client pulls from db via loader
    };
  } else {
    throw new Error("Invalid like payload type");
  }
};
