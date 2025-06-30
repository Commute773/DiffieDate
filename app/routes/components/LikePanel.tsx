import { useState } from "react";
import type { SubmitFunction } from "react-router";
import { handleLikeSubmit } from "~/math/likeSubmit";
import type { User } from "~/utils/db.types";

export function LikePanel({
  users,
  id,
  priv,
  pub,
  selfToken,
  cat,
  submit,
}: {
  users: User[];
  id: string;
  priv: string;
  pub: string;
  selfToken: string;
  cat: string;
  submit: SubmitFunction;
}) {
  const [pending, setPending] = useState<string | null>(null);

  return (
    <section className="mb-6 p-4 rounded-xl shadow bg-white">
      <h2 className="text-lg font-semibold mb-2">Like Users</h2>
      <div className="flex flex-wrap gap-4">
        {users
          .filter((u) => u.id !== id)
          .map((u) => (
            <div key={u.id} className="flex items-center gap-2">
              <span>{u.username || u.id}</span>
              <button
                className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                disabled={pending === u.id}
                onClick={async () => {
                  console.log(`Liking user ${u.id} (${u.username || u.id})`);
                  setPending(u.id);
                  await handleLikeSubmit(submit, priv, id, u, cat);
                  setPending(null);
                }}
              >
                {pending === u.id ? "Liking..." : "Like"}
              </button>
            </div>
          ))}
      </div>
    </section>
  );
}
