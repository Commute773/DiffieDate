// app/hooks/useMatches.ts

import type { LoaderDataType } from "~/routes/loader.server";
import type { LocalCrypto } from "./useLocalCrypto";
import { useEffect, useState } from "react";
import type { User } from "~/utils/db.types";

import { computeMatches } from "~/math/matches";

export const useMatches = (
  localCryptos: LocalCrypto[] | null,
  loaderData: LoaderDataType
) => {
  const [matches, setMatches] = useState<{ category: string; user: User }[]>(
    []
  );

  useEffect(() => {
    if (!localCryptos || localCryptos.length === 0) {
      return;
    }
    Promise.all(
      localCryptos.map((localCrypto) =>
        computeMatches(
          localCrypto.myUserId,
          loaderData.garbledLikes,
          loaderData.users
        ).then((users) =>
          users.map((user) => ({ category: localCrypto.category, user }))
        )
      )
    ).then((arrays) => {
      setMatches(arrays.flat());
    });
  }, [localCryptos, loaderData]);

  return matches;
};
