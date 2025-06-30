import type { User, InboxItem } from "~/utils/db.types";

export function DebugPanel({
  users,
  inbox,
}: {
  users: User[];
  inbox: InboxItem[];
}) {
  function nukeLocalStorage() {
    if (
      window.confirm(
        "This will erase ALL localStorage data for this site and reload. Are you sure?"
      )
    ) {
      localStorage.clear();
      window.location.reload();
    }
  }

  return (
    <section className="space-y-4">
      <details>
        <summary className="cursor-pointer font-semibold">
          Show Raw Data
        </summary>
        <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto mt-2">
          {JSON.stringify({ users, inbox }, null, 2)}
        </pre>
      </details>
      <button
        onClick={nukeLocalStorage}
        className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
        type="button"
      >
        Nuke LocalStorage
      </button>
    </section>
  );
}
