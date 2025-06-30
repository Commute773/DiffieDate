import { DBServer } from "~/utils/db.server";
import type { RegisterPayload } from "./register";
import type { User } from "~/utils/db.types";

/**
 * Register a new user in the system.
 * Stores user ID, username, their public crypto info, and category.
 */
export const serverRegister = async (
  payloads: RegisterPayload
): Promise<void> => {
  for (let payload of payloads) {
    const { id, username, publicCrypto, category } = payload;
    const user: User = {
      id,
      username,
      publicCrypto,
      category,
    };
    DBServer.updateCollectionObject("users", id, user);
  }
};
