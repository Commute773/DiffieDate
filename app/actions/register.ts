import { useCallback } from "react";
import { useSubmit } from "react-router";
import type { PublicCrypto } from "~/hooks/useLocalCrypto";
import type { Category } from "~/utils/constants";

export type RegisterPayload = {
  id: string;
  username: string;
  publicCrypto: PublicCrypto;
  category: Category;
}[];

/**
 * useRegister() returns a callback that registers the given user with their public crypto.
 */
export const useRegister = () => {
  const submit = useSubmit();

  return useCallback(
    async (registrations: RegisterPayload) => {
      const formData = new FormData();
      formData.append(
        "payload",
        JSON.stringify(registrations as RegisterPayload)
      );
      formData.append("action", "register");
      await submit(formData, { method: "post", action: "/" });
    },
    [submit]
  );
};
