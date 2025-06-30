import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { useSubmit } from "react-router";
import { handleUsernameSubmit } from "~/math/usernameSubmit";

export const CATEGORIES = [
  "Want to fuck",
  "Want to date",
  "Would like to spend more time 1:1",
  "Would play dnd with",
  "Would play a co-op video game with (splitfiction etc)",
  "Would physically fight",
  "Wants to cowork more",
  "Wants to engage in mutual hair playing",
  "Wants to engage in platonic cuddling",
  "Wants to engage in non-platonic cuddling",
  "Wants to go to karaoke with",
  "Wants to go to a bar with",
  "Would have a child with",
  "Would pre-commit to exchange 1% of net worth in 2030",
  "Would pre-commit to marry in 2035 if not married",
  "Would like to engage in platonic anus touching",
];

export function IdentityPanel({
  username,
  setUsername,
  id,
  pub,
}: {
  username: string | null;
  setUsername: Dispatch<SetStateAction<string | null>>;
  id: string;
  pub: string;
}) {
  const submit = useSubmit();
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(username || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    await handleUsernameSubmit(
      submit,
      pub,
      temp,
      id
    )({ preventDefault: () => {} } as any);
    setUsername(temp);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    setEditing(false);
  };

  return (
    <section className="mb-6 p-4 rounded-xl shadow bg-white dark:bg-gray-900 flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span className="font-semibold">Username:</span>
        {editing ? (
          <>
            <input
              className="border rounded px-2 py-1"
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
              disabled={saving}
              autoFocus
              maxLength={32}
            />
            <button
              className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white"
              disabled={saving}
              onClick={save}
            >
              {saving ? "Saving..." : saved ? "✓" : "Save"}
            </button>
            <button
              className="ml-1 px-2 py-1 rounded bg-gray-200 dark:bg-gray-700"
              disabled={saving}
              onClick={() => {
                setEditing(false);
                setTemp(username || "");
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <span className="text-lg font-medium">{username}</span>
            <button
              className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700"
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
          </>
        )}
      </div>
    </section>
  );
}
