import { DBServer } from "~/utils/db.server";
import type { User, InboxItem, LikeObject } from "~/utils/db.types";

/**
 * Loads:
 *   - users: all users (for discovery and selection)
 *   - inbox: all mutual matches (tokens with two ciphers)
 */
export const loader = async () => {
  // Users list
  const users = Object.values(DBServer.collections?.users || {}) as User[];

  // Find all mutual matches (tokens with two ciphers)
  const inbox: InboxItem[] = [];
  const likes = DBServer.collections?.likes || {};
  for (const token in likes) {
    const entry = likes[token] as LikeObject;
    if (entry.ciphers.length === 2) {
      // Deliver both ciphers for this token to all users (client can filter)
      for (const { cipher, iv } of entry.ciphers) {
        inbox.push({ token, cipher, iv });
      }
    }
  }

  return { users, inbox };
};

export type LoaderDataType = {
  users: User[];
  inbox: InboxItem[];
};
