import { matchKey, aesDecrypt, parsePaddedPayload } from "~/math/crypto";
import { useEffect, useState } from "react";
import type { InboxItem, User } from "~/utils/db.types";

// Helper: decrypt or return null on failure
async function tryDecrypt(item: InboxItem) {
  try {
    const key = matchKey(item.token); // hkdf(token)
    const pt = await aesDecrypt(item.cipher, key, item.iv);
    const msg = parsePaddedPayload(pt); // Handles version, padding, nonce
    return msg;
  } catch {
    return null;
  }
}

export function MatchPanel({
  inbox,
  users,
  me,
}: {
  inbox: InboxItem[];
  users: User[];
  me: string;
}) {
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const out: any[] = [];
      for (const item of inbox) {
        const m = await tryDecrypt(item);
        if (m) out.push(m);
      }
      if (active) setMatches(out);
    })();
    return () => {
      active = false;
    };
  }, [inbox]);

  // Helper to get username by ID
  function getUsername(id: string): string {
    const user = users.find((u) => u.id === id);
    return user?.username || id.slice(0, 8);
  }

  // Only show matches where the other person isn't me
  const filtered = matches.filter((m) => m.from !== me);

  return (
    <section>
      {filtered.length ? (
        <ul className="flex flex-col gap-2">
          {filtered.map((m, i) => (
            <li
              key={i}
              className="p-3 rounded bg-green-100 dark:bg-green-900/50 border border-green-300 dark:border-green-800"
            >
              <span className="font-semibold">{getUsername(m.from)}</span>
              <span className="ml-2 italic text-sm text-gray-700 dark:text-gray-200">
                {m.category}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <span className="text-gray-400">No matches yet.</span>
      )}
    </section>
  );
}
