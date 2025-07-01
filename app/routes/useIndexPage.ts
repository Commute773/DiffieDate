import { useLoaderData } from "react-router";
import { useLike } from "~/actions/like";
import { useRegister } from "~/actions/register";
import { RegisterForm } from "./components/RegisterForm";
import { getPublicCrypto, useLocalCrypto } from "~/hooks/useLocalCrypto";
import { useMatches } from "~/hooks/useMatches";
import { encodeBase64 } from "~/utils/b64";
import {
  generateGarbledLikePayload,
  derivePairSecret,
  deriveLabel,
} from "~/math/garbled";
import { CATEGORIES, type Category } from "~/utils/constants";
import type { LoaderDataType } from "./loader.server";
import type { User, GarbledLike } from "~/utils/db.types";
import { useMemo } from "react";
import { usePollLoaderData } from "~/hooks/usePollLoaderData";

function findPendingLikesFor(userId: string, likes: GarbledLike[]) {
  return likes.filter((l) => l.to === userId && l.status === "pending");
}

function sortRecord<S, T extends Record<string, S>>(record: T) {
  const sorted: Record<string, S> = {};
  const keys = Object.keys(record);
  keys.sort();
  for (let key of keys) {
    sorted[key] = record[key];
  }
  return sorted as T;
}

function groupUsersByBase(users: User[]) {
  const groups: Record<string, User[]> = {};
  for (const user of users) {
    if (!groups[user.username]) groups[user.username] = [];
    groups[user.username].push(user);
  }
  return sortRecord(groups);
}

export function useIndexPage() {
  const loaderData = usePollLoaderData<LoaderDataType>(500);
  const localCryptos = useLocalCrypto();
  const like = useLike();
  const register = useRegister();

  // Collect all of my localCryptos into an array:
  const myLocalCryptos = useMemo(() => {
    return (
      localCryptos && CATEGORIES.map((cat) => localCryptos[cat]).filter(Boolean)
    );
  }, [localCryptos]);

  // Call useMatches just once with all of them:
  const matches = useMatches(myLocalCryptos, loaderData);

  // Find all of "my" ids by category
  const myIds: Record<string, string> = {};
  for (const category of CATEGORIES) {
    if (localCryptos && localCryptos[category])
      myIds[category] = localCryptos[category].myUserId;
  }

  // Am I registered? (If any one identity is missing, treat as not registered)
  const registered = CATEGORIES.every((cat) =>
    loaderData.users.some((u) => u.id === myIds[cat])
  );

  // Group users by username for UI. Exclude myself.
  const groupedUsers = groupUsersByBase(
    loaderData.users.filter((u) => !Object.values(myIds).includes(u.id))
  );

  // Who can I still like (per category, per user)
  function alreadyLiked(fromId: string, toId: string) {
    return loaderData.garbledLikes.some(
      (l) => l.from === fromId && l.to === toId
    );
  }

  // Find all pending likes for me (across both categories)

  const sortedPendingForMe = useMemo(() => {
    let pending: {
      like: GarbledLike;
      myCategory: Category;
      username: string;
    }[] = [];

    for (const category of CATEGORIES) {
      const myId = myIds[category];
      const arr = findPendingLikesFor(myId, loaderData.garbledLikes).map(
        (like) => ({
          like,
          myCategory: category,
          username: like.from.split(":")[1],
        })
      );
      pending = pending.concat(arr);
    }

    return pending.sort((a, b) => a.username.localeCompare(b.username));
  }, [myIds, loaderData.garbledLikes]);

  // Handler for responding to a pending like
  async function handleRespondToLike(
    gLike: GarbledLike,
    myCategory: Category,
    likeBack: boolean
  ) {
    if (!localCryptos) return;
    const localCrypto = localCryptos[myCategory];
    if (!localCrypto) return;
    const liker = loaderData.users.find((u) => u.id === gLike.from);
    if (!liker?.publicCrypto?.publicKey) return;

    // 1. Re-derive shared secret
    const secret = derivePairSecret(
      localCrypto.privateKey,
      liker.publicCrypto.publicKey
    );

    // 2. Choose correct deterministic label
    const chosen = deriveLabel(secret, likeBack ? "B1" : "B0");

    like({
      type: "respond",
      id: gLike.id,
      bInputLabel: encodeBase64(chosen),
    });
  }

  // Handler for sending a like
  async function handleSendLike(
    myId: string,
    user: User,
    localCrypto: any,
    isLike: boolean
  ) {
    like(
      await generateGarbledLikePayload(myId, user, isLike ? 1 : 0, localCrypto)
    );
  }

  // Expose everything needed for rendering:
  return {
    loaderData,
    localCryptos,
    like,
    register,
    myLocalCryptos,
    matches,
    myIds,
    registered,
    groupedUsers,
    alreadyLiked,
    pendingForMe: sortedPendingForMe,
    handleRespondToLike,
    handleSendLike,
  };
}
