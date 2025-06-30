import fs from "fs";
import { DB } from "./db";
import type { GarbledLike } from "./db.types";

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

// User-related helpers (unchanged)

// --- GarbledLike helpers ---

/**
 * Store a new GarbledLike record.
 */
export function addGarbledLike(like: GarbledLike) {
  DBServer.updateCollectionObject<GarbledLike>("garbledLikes", like.id, like);
}

/**
 * List all pending GarbledLike records where user is the "to" (i.e., likes that need a response).
 */
export function listPendingLikesFor(userId: string): GarbledLike[] {
  return DBServer.listObjectsInCollection<GarbledLike>("garbledLikes").filter(
    (like) => like.to === userId && like.status === "pending"
  );
}

/**
 * Get all GarbledLike records where user is "from" (i.e., likes this user sent).
 */
export function listLikesFromUser(userId: string): GarbledLike[] {
  return DBServer.listObjectsInCollection<GarbledLike>("garbledLikes").filter(
    (like) => like.from === userId
  );
}

/**
 * Get GarbledLike by id.
 */
export function getGarbledLike(likeId: string): GarbledLike | undefined {
  return DBServer.getCollectionObject<GarbledLike>("garbledLikes", likeId);
}

/**
 * Update B's input label and status for a GarbledLike (when B responds).
 */
export function setGarbledLikeBInputLabel(likeId: string, bInputLabel: string) {
  const like = getGarbledLike(likeId);
  if (like) {
    like.bInputLabel = bInputLabel;
    like.status = "responded";
    DBServer.updateCollectionObject<GarbledLike>("garbledLikes", likeId, like);
  }
}

/**
 * Get all GarbledLike records where both input labels are present (i.e., mutual evaluation can happen)
 */
export function listEvaluatedLikesFor(userId: string): GarbledLike[] {
  return DBServer.listObjectsInCollection<GarbledLike>("garbledLikes").filter(
    (like) =>
      (like.from === userId || like.to === userId) &&
      like.status === "responded" &&
      like.bInputLabel
  );
}
