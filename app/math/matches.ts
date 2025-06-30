import { decodeBase64 } from "~/utils/b64";
import { decodeOutputLabel, evalGarbledAND } from "./crypto";
import type { GarbledLike, User } from "~/utils/db.types";

function parseTableEntry(row: string) {
  const obj = JSON.parse(row);
  return {
    ciphertext: decodeBase64(obj.ciphertext),
    iv: decodeBase64(obj.iv),
  };
}

export const computeMatches = async (
  myUserId: string,
  garbledLikes: GarbledLike[],
  users: User[]
): Promise<User[]> => {
  if (!garbledLikes || !Array.isArray(garbledLikes)) {
    return [];
  }

  const matches: User[] = [];

  for (const like of garbledLikes as GarbledLike[]) {
    if (
      (like.from === myUserId || like.to === myUserId) &&
      like.status === "responded" &&
      like.bInputLabel &&
      like.outputLabels &&
      like.garbledTable
    ) {
      // Who is the other user?
      const otherUserId = like.from === myUserId ? like.to : like.from;

      // Get both input labels (aInputLabel, bInputLabel)
      const aInputLabel = decodeBase64(like.aInputLabel);
      const bInputLabel = decodeBase64(like.bInputLabel);

      // Parse garbled table
      const garbledTable = like.garbledTable.map(parseTableEntry) as [
        {
          ciphertext: Uint8Array<ArrayBufferLike>;
          iv: Uint8Array<ArrayBufferLike>;
        },
        {
          ciphertext: Uint8Array<ArrayBufferLike>;
          iv: Uint8Array<ArrayBufferLike>;
        },
        {
          ciphertext: Uint8Array<ArrayBufferLike>;
          iv: Uint8Array<ArrayBufferLike>;
        },
        {
          ciphertext: Uint8Array<ArrayBufferLike>;
          iv: Uint8Array<ArrayBufferLike>;
        }
      ];

      // Parse output labels
      const [r0, r1] = like.outputLabels.map(decodeBase64) as [
        Uint8Array,
        Uint8Array
      ];

      // Attempt to decrypt
      // Which input label do I control? If I'm "from", I know aInputLabel, otherwise bInputLabel
      // In both cases, try all; only one decrypt will succeed
      let resultLabel: Uint8Array | null = null;
      try {
        resultLabel = await evalGarbledAND(
          garbledTable,
          aInputLabel,
          bInputLabel
        );
      } catch {
        resultLabel = null;
      }

      // If output label matches r1, it's a match
      if (resultLabel && decodeOutputLabel(r0, r1, resultLabel) === 1) {
        const user = users.find((u) => u.id === otherUserId);
        if (user) {
          matches.push(user);
        }
      }
    }
  }

  return matches;
};
