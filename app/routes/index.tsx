import { useEffect, useState } from "react";
import type { LoaderDataType } from "./loader.server";
import { getOrCreateKeys } from "./keygen.client";
import { useLoaderData, useSubmit } from "react-router";
import { useLikedUsers } from "./components/useLikedUsers";
import { UsersList } from "./components/UsersList";
import { IdentityPanel } from "./components/IdentityPanel";
import { CategorySelector } from "./components/CategorySelector";
import { MatchPanel } from "./components/MatchPanel";
import { DebugPanel } from "./components/DebugPanel";
import { CATEGORIES } from "./components/IdentityPanel";
import { handleLikeSubmit } from "~/math/likeSubmit";
import type { User } from "~/utils/db.types";
import { HowItWorksPanel } from "./components/HowItWorksPanel";

// For collapsible panels
function AccordionSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="mb-3 rounded shadow bg-white dark:bg-gray-900">
      <button
        className="w-full text-left p-3 font-semibold border-b border-gray-200 dark:border-gray-800 flex justify-between items-center"
        onClick={() => setOpen((o) => !o)}
      >
        {title}
        <span>{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className="p-3">{children}</div>}
    </section>
  );
}

export { loader } from "./loader.server";

export default function Index() {
  const { users, inbox } = useLoaderData<LoaderDataType>();
  const submit = useSubmit();
  const [username, setUsername] = useState<string | null>(null);

  // Key and user state
  const [priv, setPriv] = useState<string | null>(null);
  const [pub, setPub] = useState<string | null>(null);
  const [selfToken, setSelfToken] = useState<string | null>(null);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    getOrCreateKeys().then(({ priv, pub, selfToken, id }) => {
      setPriv(priv);
      setPub(pub);
      setSelfToken(selfToken);
      setId(id);
    });
  }, []);

  useEffect(() => {
    if (id && !username) {
      const user = users.find((u) => u.id === id);
      if (user) setUsername(user.username || "");
    }
  }, [id, username, users]);

  // Register user if not already present
  useEffect(() => {
    if (id && pub && selfToken && !users.find((u) => u.id === id)) {
      const formData = new FormData();
      formData.append("formKey", "registerUser");
      formData.append("id", id);
      formData.append("publicKey", pub);
      formData.append("selfToken", selfToken);
      submit(formData, { method: "post", action: "/" });
    }
  }, [id, pub, selfToken, users, submit]);

  // Like state and logic
  const [cat, setCat] = useState<string>(CATEGORIES[0]);
  const [likedUsers, setLikedUsers] = useLikedUsers();

  // Main like action, no page reload
  async function handleLikeUser(u: User) {
    if (!priv || !id) return;
    await handleLikeSubmit(submit, priv, id, u, cat);
    setLikedUsers((prev) => new Set(prev).add(u.id));
  }

  if (!id || !pub || !priv || !selfToken) {
    return (
      <div className="mx-auto max-w-xl p-8 text-black">
        <h1 className="text-3xl font-bold mb-4 text-white">Diffie Date</h1>
        <p className="text-lg">Generating keys...</p>
      </div>
    );
  }

  // Optionally: show yourself at the top
  const me = users.find((u) => u.id === id);

  return (
    <div className="mx-auto max-w-xl p-4 text-black dark:text-white">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Diffie Date</h1>
      </header>
      <IdentityPanel
        username={username}
        setUsername={setUsername}
        id={id}
        pub={pub}
      />
      <CategorySelector value={cat} onChange={setCat} />
      {me && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center font-bold">
            {me.username?.[0]?.toUpperCase() ?? "Y"}
          </div>
          <span className="font-medium">You: {me.username}</span>
        </div>
      )}
      <UsersList
        users={users}
        currentId={id}
        likedUsers={likedUsers}
        onLikeUser={handleLikeUser}
      />
      <AccordionSection title="Matches">
        <MatchPanel users={users} inbox={inbox} me={id} />
      </AccordionSection>
      <AccordionSection title="Debug">
        <DebugPanel users={users} inbox={inbox} />
      </AccordionSection>
      <HowItWorksPanel />
    </div>
  );
}
