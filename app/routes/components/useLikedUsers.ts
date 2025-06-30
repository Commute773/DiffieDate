import { useState, useEffect } from "react";

export function useLikedUsers() {
  const [likedUsers, setLikedUsers] = useState<Set<string>>(() => {
    const raw =
      typeof window !== "undefined" ? localStorage.getItem("likedUsers") : null;
    return raw ? new Set(JSON.parse(raw)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem("likedUsers", JSON.stringify(Array.from(likedUsers)));
  }, [likedUsers]);

  return [likedUsers, setLikedUsers] as const;
}
