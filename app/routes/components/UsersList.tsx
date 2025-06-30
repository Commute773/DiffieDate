import { LikeButton } from "./LikeButton";
import type { User } from "~/utils/db.types";

export function UsersList({
  users,
  currentId,
  likedUsers,
  onLikeUser,
}: {
  users: User[];
  currentId: string;
  likedUsers: Set<string>;
  onLikeUser: (u: User) => Promise<void>;
}) {
  return (
    <section className="mb-6">
      <h2 className="text-lg font-semibold mb-2">People</h2>
      <div className="flex flex-col gap-3">
        {users
          .filter((u) => u.id !== currentId)
          .map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800"
            >
              <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-lg font-bold select-none">
                {u.username?.[0]?.toUpperCase() ?? "?"}
              </div>
              <span className="flex-1 font-medium truncate">
                {u.username || u.id.slice(0, 8)}
              </span>
              <LikeButton
                alreadyLiked={likedUsers.has(u.id)}
                onLike={() => onLikeUser(u)}
              />
            </div>
          ))}
      </div>
    </section>
  );
}
