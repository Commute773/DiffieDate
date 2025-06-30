import { DBServer } from "~/utils/db.server";
import type { User, GarbledLike } from "~/utils/db.types";

/**
 * Loader returns all users and all garbledLikes (pending and responded)
 * so the frontend can display users, pending likes, and compute matches.
 */
export const loader = async (): Promise<LoaderDataType> => {
  const users = DBServer.listObjectsInCollection<User>("users");
  const garbledLikes =
    DBServer.listObjectsInCollection<GarbledLike>("garbledLikes");
  return {
    users,
    garbledLikes,
  };
};

export type LoaderDataType = {
  users: User[];
  garbledLikes: GarbledLike[];
};
