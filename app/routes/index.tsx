import { RegisterForm } from "./components/RegisterForm";
import { CATEGORIES } from "~/utils/constants";
import { useIndexPage } from "./useIndexPage";
import { NukeLocalStorage } from "./components/NukeLS";

export { loader } from "./loader.server";

export default function Index() {
  const {
    localCryptos,
    register,
    myIds,
    registered,
    groupedUsers,
    alreadyLiked,
    handleSendLike,
    pendingForMe,
    handleRespondToLike,
    matches,
  } = useIndexPage();

  if (!localCryptos || Object.keys(localCryptos).length === 0 || !registered) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-neutral-900">
        <div className="bg-white dark:bg-neutral-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
          <RegisterForm register={register} />
          <NukeLocalStorage />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-neutral-900 py-12 px-4 flex flex-col items-center">
      <section className="mb-10 w-full max-w-2xl">
        <h1 className="text-4xl font-bold mb-2 tracking-tight text-center text-gray-900 dark:text-gray-100">
          Garble Date
        </h1>
        <p className="text-center text-lg text-gray-500 dark:text-gray-400 mb-4">
          Users:{" "}
          <span className="font-semibold">
            {Object.keys(groupedUsers).length}
          </span>
        </p>
      </section>

      <section className="w-full max-w-2xl mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Other Users
        </h2>
        <ul className="space-y-4">
          {Object.entries(groupedUsers).map(([base, users]) => (
            <li
              key={base}
              className="bg-white dark:bg-neutral-800 rounded-2xl shadow p-5"
            >
              <div className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                {base}
              </div>
              <div className="flex flex-wrap gap-3">
                {CATEGORIES.map((cat) => {
                  const user = users.find((u) => u.category === cat);
                  if (!user) return null;
                  const myId = myIds[cat];
                  if (!myId || user.id === myId) return null;
                  if (alreadyLiked(myId, user.id)) return null;
                  //if pendingForMe, skip
                  if (
                    pendingForMe.some(
                      (l) => l.like.from === user.id && l.myCategory === cat
                    )
                  )
                    return null;
                  //if matched, skip
                  if (
                    matches.some(
                      (m) => m.user.id === user.id && m.category === cat
                    )
                  )
                    return null;
                  const localCrypto = localCryptos[cat];
                  return (
                    <div key={cat} className="flex flex-col">
                      <button
                        title={`Like ${cat}`}
                        onClick={async () =>
                          handleSendLike(myId, user, localCrypto, true)
                        }
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow transition whitespace-nowrap"
                      >
                        {cat}
                      </button>
                      <button
                        title={`Don't ${cat}`}
                        onClick={async () =>
                          handleSendLike(myId, user, localCrypto, false)
                        }
                        className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-gray-800 dark:text-gray-200 rounded-xl text-sm font-semibold shadow transition mt-1 whitespace-nowrap"
                      >
                        Don't {cat}
                      </button>
                    </div>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {pendingForMe.length > 0 && (
        <section className="w-full max-w-2xl mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Pending Likes for You
          </h2>
          <ul className="space-y-4">
            {pendingForMe.map(({ like: l, myCategory, username }) => {
              const label = username;
              return (
                <li
                  key={l.id}
                  className="bg-white dark:bg-neutral-800 rounded-2xl shadow p-5 flex items-center justify-between"
                >
                  <div className="font-medium text-gray-700 dark:text-gray-200">
                    {label}: {myCategory}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleRespondToLike(l, myCategory, true)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold shadow transition"
                    >
                      Like back
                    </button>
                    <button
                      onClick={() => handleRespondToLike(l, myCategory, false)}
                      className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-gray-800 dark:text-gray-200 rounded-xl font-semibold shadow transition"
                    >
                      Ignore
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="w-full max-w-2xl">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Your Matches
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {matches.map(({ category, user }) => (
            <li
              key={user.id + category}
              className="bg-white dark:bg-neutral-800 rounded-2xl shadow p-4 flex flex-col items-center"
            >
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {user.username}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {category}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
