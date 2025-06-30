import fs from "fs";
import { DB } from "./db";

/**
 * DB schema:
 * - users: { [id]: { id, publicKey, selfToken, username } }
 * - likes: { [token]: { token, ciphers: [{ cipher, iv }] } }
 */

const dbPath = "./db.json";

export const DBServer = new DB(
  (data: string) => {
    fs.writeFileSync(dbPath, data, "utf8");
  },
  () => {
    if (!fs.existsSync(dbPath)) {
      return "{}"; // Return an empty JSON object if the file does not exist
    }
    return fs.readFileSync(dbPath, "utf8");
  }
);

// You may want to add helpers here for
// - addLike(token, cipher, iv)
// - fetchInboxForUser(userId, priv, ...)
// (Or implement these in the loader/action server files)
