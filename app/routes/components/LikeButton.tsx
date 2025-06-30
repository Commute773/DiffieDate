import { useState } from "react";

export function LikeButton({
  onLike,
  alreadyLiked,
}: {
  onLike: () => Promise<void>;
  alreadyLiked: boolean;
}) {
  const [pending, setPending] = useState(false);

  return (
    <button
      disabled={pending || alreadyLiked}
      className={`px-3 py-1 rounded transition
        ${
          alreadyLiked
            ? "bg-green-500 cursor-default"
            : "bg-blue-600 hover:bg-blue-700"
        } 
        text-white font-medium min-w-[70px]`}
      onClick={async () => {
        setPending(true);
        try {
          await onLike();
        } finally {
          setPending(false);
        }
      }}
    >
      {alreadyLiked ? "Liked!" : pending ? "Liking..." : "Like"}
    </button>
  );
}
