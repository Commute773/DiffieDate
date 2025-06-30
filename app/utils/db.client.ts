import { DB } from "./db";

/**
 * Client-side DB (localStorage-backed).
 * Used mainly for testing, local demo, or offline apps.
 * Schema:
 *   - users: { [id]: { id, publicKey, selfToken, username } }
 *   - likes: { [token]: { token, ciphers: [{ cipher, iv }] } }
 */

export const DBClient = new DB(
  (data: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("db", data);
    } else {
      console.error("Local storage is not available in this environment.");
    }
  },
  () => {
    if (typeof window !== "undefined") {
      const data = window.localStorage.getItem("db");
      return data ? data : "{}";
    } else {
      console.error("Local storage is not available in this environment.");
      return "{}";
    }
  }
);
