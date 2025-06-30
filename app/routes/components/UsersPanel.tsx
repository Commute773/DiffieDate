import type { User } from "~/utils/db.types";

export function UsersPanel({
  users,
  currentId,
}: {
  users: User[];
  currentId: string;
}) {
  return (
    <section className="mb-6 p-4 rounded-xl shadow bg-white">
      <h2 className="text-lg font-semibold mb-2">All Users</h2>
      <ul className="list-disc pl-4">
        {users.map((u) => (
          <li key={u.id}>
            <span className={u.id === currentId ? "font-bold" : ""}>
              {u.id === currentId ? "You" : u.username || u.id}
            </span>
            <br />
            <small className="break-all text-xs text-gray-500">
              <b>Pub:</b> {u.publicKey}
              <br />
              <b>SelfToken:</b> {u.selfToken}
            </small>
          </li>
        ))}
      </ul>
    </section>
  );
}
